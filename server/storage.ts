// server/storage.ts
// Cloudflare R2 스토리지 헬퍼 (@aws-sdk/client-s3 + presigner)

// #region Imports
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./core/env/env";
// #endregion

// #region Client factory (lazy singleton)
let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!ENV.r2Endpoint || !ENV.r2AccessKeyId || !ENV.r2SecretKey || !ENV.r2Bucket) {
    throw new Error(
      "[Storage] R2 credentials not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME in .env"
    );
  }
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: ENV.r2Endpoint,
      credentials: {
        accessKeyId: ENV.r2AccessKeyId,
        secretAccessKey: ENV.r2SecretKey,
      },
    });
  }
  return _client;
}
// #endregion

// #region Helpers
function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}
// #endregion

// #region Public API
/**
 * 파일을 R2에 업로드한다.
 * @returns { key, url } — url은 presigned GET URL (1시간 유효)
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const client = getS3Client();

  const body = typeof data === "string" ? Buffer.from(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.r2Bucket, Key: key }),
    { expiresIn: 3600 }
  );

  return { key, url };
}

/**
 * R2 파일의 presigned GET URL을 반환한다. (1시간 유효)
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const client = getS3Client();

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.r2Bucket, Key: key }),
    { expiresIn: 3600 }
  );

  return { key, url };
}

/**
 * R2 파일을 서버 내부에서 Buffer로 직접 다운로드한다.
 * presigned URL 방식의 SSRF 검증 없이 S3 SDK로 직접 접근.
 */
export async function storageGetBuffer(
  relKey: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const key = normalizeKey(relKey);
  const client = getS3Client();

  const res = await client.send(
    new GetObjectCommand({ Bucket: ENV.r2Bucket, Key: key })
  );

  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: res.ContentType ?? "application/octet-stream",
  };
}

/**
 * 클라이언트가 R2에 직접 업로드하기 위한 presigned PUT URL을 반환한다.
 */
export async function storageGetPutUrl(
  relKey: string,
  contentType?: string,
  expiresIn = 900
): Promise<{ key: string; upload_url: string }> {
  const key = normalizeKey(relKey);
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: ENV.r2Bucket,
    Key: key,
    ...(contentType ? { ContentType: contentType } : {}),
  });

  const upload_url = await getSignedUrl(client, command, { expiresIn });

  return { key, upload_url };
}

/**
 * R2 파일 삭제 (보관 불필요한 음성파일 처리 후 즉시 삭제용)
 */
export async function storageDelete(relKey: string): Promise<void> {
  const key = normalizeKey(relKey);
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: ENV.r2Bucket,
      Key: key,
    })
  );
}
// #endregion