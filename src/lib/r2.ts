import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 storage helper.
 *
 * R2 is S3-compatible, so we use the AWS S3 SDK with the R2 endpoint.
 *
 * Required env vars (set in .env / Vercel):
 *   R2_ACCOUNT_ID       — e.g. "a1b2c3d4..."
 *   R2_ACCESS_KEY_ID    — access key
 *   R2_SECRET_ACCESS_KEY — secret
 *   R2_BUCKET_NAME       — e.g. "amar-earning"
 *   R2_PUBLIC_URL        — e.g. "https://images.amar-earning.com" (public bucket URL or custom domain)
 */

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL; // e.g. https://images.amar-earning.com

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucketName
);

let client: S3Client | null = null;
function getClient(): S3Client {
  if (client) return client;
  if (!isR2Configured) {
    throw new Error("R2 not configured — missing env vars");
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    // Important: R2 does NOT support virtual-host-style addressing for some
    // account configurations, so we force path-style.
    forcePathStyle: false,
  });
  return client;
}

export type UploadResult = {
  url: string;          // public URL to the uploaded file
  key: string;          // object key in the bucket (for later deletion)
  bucket: string;
  size: number;
  contentType: string;
};

/**
 * Allowed MIME types for image uploads.
 */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload an image buffer to Cloudflare R2.
 *
 * @param file   - The file buffer/Uint8Array.
 * @param opts   - { contentType, filename (optional, used for extension) }
 * @returns UploadResult with the public URL.
 */
export async function uploadImage(
  file: Buffer | Uint8Array,
  opts: { contentType: string; filename?: string; folder?: string }
): Promise<UploadResult> {
  if (!isR2Configured) {
    throw new Error("R2 storage is not configured");
  }
  const contentType = opts.contentType;
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }
  const buffer = file instanceof Buffer ? file : Buffer.from(file);
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image too large (${buffer.byteLength} bytes, max ${MAX_IMAGE_BYTES})`);
  }

  // Build a unique object key: <folder>/<timestamp>-<random>.<ext>
  const ext = guessExtension(contentType, opts.filename);
  const folder = (opts.folder || "proofs").replace(/^\/+|\/+$/g, "");
  const stamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 10);
  const key = `${folder}/${stamp}-${rand}.${ext}`;

  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: {
        uploadedAt: new Date().toISOString(),
        source: "amar-earning",
      },
    })
  );

  const base = publicUrl || `https://${bucketName!}.${accountId!}.r2.cloudflarestorage.com`;
  const url = `${base.replace(/\/+$/, "")}/${key}`;

  return {
    url,
    key,
    bucket: bucketName!,
    size: buffer.byteLength,
    contentType,
  };
}

/**
 * Delete an object from R2 (used when a user removes an uploaded image,
 * or admin cleans up rejected submissions).
 */
export async function deleteObject(key: string): Promise<void> {
  if (!isR2Configured) return;
  const s3 = getClient();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName!,
      Key: key,
    })
  );
}

function guessExtension(contentType: string, filename?: string): string {
  // Prefer extension from filename if it looks safe
  if (filename) {
    const m = filename.toLowerCase().match(/\.([a-z0-9]{2,4})$/);
    if (m && ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(m[1])) {
      return m[1] === "jpeg" ? "jpg" : m[1];
    }
  }
  switch (contentType) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    case "image/heic": return "heic";
    case "image/heif": return "heif";
    default: return "jpg";
  }
}
