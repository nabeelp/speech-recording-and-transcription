import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();

function getContainerClient() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'recordings';

  if (!accountName) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME is not configured.');
  }

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
  return blobServiceClient.getContainerClient(containerName);
}

export async function uploadToBlob(
  blobName: string,
  data: Buffer,
  contentType: string,
  transcript: string
): Promise<string> {
  const containerClient = getContainerClient();

  // Ensure the container exists
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const metadata: Record<string, string> = {};
  if (transcript) {
    // Blob metadata values must be ASCII-safe; truncate long transcripts
    const truncated = transcript.substring(0, 4000);
    metadata['transcript'] = Buffer.from(truncated).toString('base64');
  }

  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: { blobContentType: contentType },
    metadata,
  });

  return blockBlobClient.url;
}
