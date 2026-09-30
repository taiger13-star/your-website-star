import { randomUUID } from "node:crypto";

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function config() {
  const endpoint = process.env["MINIO_ENDPOINT"];
  const publicUrl = process.env["MINIO_PUBLIC_URL"];
  const accessKeyId = process.env["MINIO_ROOT_USER"];
  const secretAccessKey = process.env["MINIO_ROOT_PASSWORD"];
  const bucket = process.env["MINIO_BUCKET"] ?? "noir-catalog";
  if (!endpoint || !publicUrl || !accessKeyId || !secretAccessKey) {
    throw new Error("MinIO environment variables are required.");
  }
  return {
    endpoint,
    publicUrl: publicUrl.replace(/\/$/, ""),
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

let initialized: Promise<void> | undefined;

function getClient() {
  const value = config();
  return new S3Client({
    endpoint: value.endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: value.accessKeyId, secretAccessKey: value.secretAccessKey },
  });
}

export function ensurePublicBucket() {
  if (!initialized) {
    initialized = (async () => {
      const client = getClient();
      const { bucket } = config();
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
      }
      await client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          }),
        }),
      );
    })();
  }
  return initialized;
}

export async function uploadPublicObject(input: {
  body: Uint8Array;
  fileName: string;
  contentType: string;
}) {
  await ensurePublicBucket();
  const client = getClient();
  const { bucket, publicUrl } = config();
  const extension = input.fileName.includes(".") ? `.${input.fileName.split(".").pop()}` : "";
  const objectKey = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
  return { objectKey, publicUrl: `${publicUrl}/${bucket}/${objectKey}` };
}

export async function removeObject(objectKey: string) {
  await ensurePublicBucket();
  const { bucket } = config();
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
}
