import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} = process.env;

let _client = null;
export function r2Client() {
  if (_client) return _client;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("Cloudflare R2 env vars are not configured");
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

export const R2 = {
  bucket: R2_BUCKET_NAME,
  publicUrl: (R2_PUBLIC_URL || "").replace(/\/$/, ""),
};

export async function presignPutUrl(key, contentType, expiresIn = 60 * 5) {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client(), cmd, { expiresIn });
}

export function publicUrlFor(key) {
  if (!R2_PUBLIC_URL) return "";
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}