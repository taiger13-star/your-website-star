import importlib.util
import io
from pathlib import Path
import tarfile
import unittest

spec = importlib.util.spec_from_file_location("backup", Path(__file__).with_name("capture-config-backup.py"))
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)

class BackupValidation(unittest.TestCase):
    def test_refuses_keys_ambiguous_paths_and_root(self):
        for path in ["/", "/etc", "../config", "/etc/../root/config", "/etc/nginx\nunsafe", "/etc/letsencrypt/live/noir/privkey.pem"]:
            with self.assertRaises(ValueError): backup.validate_paths([path])

    def test_checks_archive_members_without_extracting_or_disclosing_values(self):
        buf = io.BytesIO()
        with tarfile.open(fileobj=buf, mode="w") as t:
            data = b"PRIVATE_TEST_VALUE=do-not-report\n"
            m = tarfile.TarInfo("etc/noir.env"); m.size = len(data)
            t.addfile(m, io.BytesIO(data))
        manifest = backup.inspect_archive(buf.getvalue(), ["/etc/noir.env"])
        self.assertNotIn("PRIVATE_TEST_VALUE", str(manifest))
        with self.assertRaises(ValueError): backup.inspect_archive(buf.getvalue(), ["/etc/another.env"])

if __name__ == "__main__": unittest.main()
