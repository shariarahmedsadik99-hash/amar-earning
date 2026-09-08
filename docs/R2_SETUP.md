# Cloudflare R2 Storage Setup (Image Uploads)

This project uses **Cloudflare R2** to store user-uploaded images (job proof screenshots, etc.).

## Why R2?
- **S3-compatible** — works with the AWS S3 SDK
- **No egress fees** — much cheaper than AWS S3 for serving images
- **Fast global CDN** via Cloudflare's network
- **Generous free tier** — 10 GB storage + 1M Class A operations/month

## Step 1: Create an R2 bucket

1. Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2 Object Storage** → **Create bucket**
3. Name it `amar-earning` (or any name you prefer)
4. Choose a location close to your users (or leave on automatic)

## Step 2: Enable public access (optional but recommended)

For images to be viewable in the browser:

1. Open the bucket → **Settings** → **Public access**
2. Either:
   - **Option A**: Enable the R2.dev subdomain (e.g. `https://pub-xxx.r2.dev`) — good for testing
   - **Option B (recommended)**: Connect a custom domain (e.g. `https://images.amar-earning.com`) — best for production

## Step 3: Generate API tokens

1. Go to **R2** → **Manage R2 API Tokens** → **Create API token**
2. Token name: `amar-earning-app`
3. Permissions: **Object Read & Write**
4. Specify bucket: select `amar-earning` (or "Apply to all buckets")
5. Click **Create API Token**

You will get:
- **Access Key ID** (starts with a long hex string)
- **Secret Access Key** (shown once — copy it immediately)
- **Endpoint URL** (e.g. `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)

Your **Account ID** is visible in the Cloudflare sidebar (right side, or in the URL).

## Step 4: Set environment variables

### Local development (`.env`):
```bash
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=amar-earning
R2_PUBLIC_URL=https://pub-xxx.r2.dev   # or https://images.your-domain.com
```

### Vercel production:
Go to **Vercel → Settings → Environment Variables** and add the same 5 variables.

## Step 5: Verify

After setting the env vars, restart the dev server and try uploading an image
on any job's "Submit Proof" page. The uploaded image URL will be stored in
the database as the `imageProof` field.

## How the code works

| File | Purpose |
|---|---|
| `src/lib/r2.ts` | R2 client (AWS S3 SDK), upload + delete helpers |
| `src/app/api/upload/route.ts` | POST endpoint for multipart file uploads |
| `src/components/shared/image-uploader.tsx` | Drag-and-drop + paste + URL-fallback UI component |

### Upload flow
1. User picks a file (drag/drop, click, or paste) in `ImageUploader`
2. Component sends `multipart/form-data` POST to `/api/upload`
3. Server validates auth, file size (max 5 MB), and content type
4. `uploadImage()` in `src/lib/r2.ts` streams the buffer to R2
5. R2 stores the object under `proofs/<timestamp>-<random>.<ext>`
6. Public URL is returned and stored as the `imageProof` string in the DB

### Allowed image types
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`
- `image/heic`
- `image/heif`

Max size: **5 MB** per image.

## Fallback

If R2 is not configured (env vars missing), the `/api/upload` endpoint returns
HTTP 503, and the `ImageUploader` component lets users paste an image URL
manually as a fallback (so the form still works).
