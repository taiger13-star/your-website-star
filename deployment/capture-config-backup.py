"""Read-only SSH capture of explicitly selected configuration files. Never deploys/restores.

Run locally after the existing SSH alias and exact VPS configuration paths are known.
Actual contents are stored under ignored .local/ with owner-only access, never printed.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tarfile


def validate_paths(paths):
    if not paths or len(paths) > 20:
        raise ValueError("Select 1..20 exact configuration files")
    for value in paths:
        if not value.startswith("/") or any(c in value for c in ["\n", "\r", "\0"]) or ".." in value.split("/"):
            raise ValueError("Only absolute, unambiguous POSIX file paths are accepted")
        if value in ["/", "/etc", "/home", "/root"]:
            raise ValueError("Directories are not accepted")
        if re.search(r"(privkey|id_rsa|id_ed25519|\.key$)", value, re.I):
            raise ValueError("Do not capture private keys; retain the existing certificate lineage")


def inspect_archive(data, allowed_paths):
    allowed = {p.lstrip("/") for p in allowed_paths}
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:") as archive:
        members = archive.getmembers()
        names = {m.name.lstrip("/") for m in members}
        if names != allowed or any(not (m.isfile() or m.issym()) for m in members):
            raise ValueError("Unexpected archive members; capture refused")
        return [{"path": "/" + m.name.lstrip("/"), "symlink": m.linkname if m.issym() else None,
                 "bytes": m.size, "mode": oct(m.mode), "uid": m.uid, "gid": m.gid, "mtime": m.mtime,
                 "sha256": hashlib.sha256(archive.extractfile(m).read()).hexdigest() if m.isfile() else None} for m in members]


def private_directory(destination):
    destination.mkdir(parents=True, exist_ok=False)
    if os.name == "nt":
        user = subprocess.check_output(["whoami"], text=True).strip()
        subprocess.run(["icacls", str(destination), "/inheritance:r", "/grant:r", f"{user}:(OI)(CI)F"],
                       check=True, capture_output=True)
    else:
        destination.chmod(0o700)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ssh-alias", required=True)
    parser.add_argument("--config", action="append", required=True, help="Exact remote file; repeat for nginx/env/service config")
    parser.add_argument("--sudo-read", action="store_true", help="Use existing passwordless sudo only for read commands")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,100}", args.ssh_alias):
        parser.error("Supply a configured SSH alias; no passwords, URLs or SSH options")
    validate_paths(args.config)
    ssh = shutil.which("ssh")
    if not ssh:
        raise RuntimeError("OpenSSH client is not available")
    prefix = [ssh, "-T", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", args.ssh_alias]
    # Both commands read only. No temporary file or other write is made on the VPS.
    script = 'set -eu; for p do test -f "$p"; printf "%s\\n" "$p"; readlink -f -- "$p"; done'
    remote = ("sudo -n " if args.sudo_read else "") + "sh -c " + shlex.quote(script) + " sh " + " ".join(shlex.quote(p) for p in args.config)
    read = subprocess.run([*prefix, remote], check=True, capture_output=True)
    paths = list(dict.fromkeys(read.stdout.decode("utf-8").splitlines()))
    validate_paths(paths)
    remote = ("sudo -n " if args.sudo_read else "") + "tar -c -- " + " ".join(shlex.quote(p) for p in paths)
    capture = subprocess.run([*prefix, remote], check=True, capture_output=True)
    members = inspect_archive(capture.stdout, paths)
    root = Path(__file__).resolve().parent.parent / ".local" / "config-backups"
    destination = root / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    private_directory(destination)
    archive = destination / "configuration.tar"
    archive.write_bytes(capture.stdout)
    if os.name != "nt": archive.chmod(0o600)
    manifest = {"captured_at_utc": datetime.now(timezone.utc).isoformat(), "remote_write_commands": False,
                "members": members, "sha256": hashlib.sha256(capture.stdout).hexdigest(), "archive_bytes": len(capture.stdout)}
    (destination / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"backup_directory": str(destination), "sha256": manifest["sha256"], "member_count": len(members), "secret_contents_printed": False}))


if __name__ == "__main__":
    try: main()
    except Exception as error:
        # SSH stderr or config contents may contain credentials: do not echo them.
        raise SystemExit(f"Configuration backup not completed ({type(error).__name__}); no server changes made.")
