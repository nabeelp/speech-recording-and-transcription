export async function uploadAudio(
  audioBlob: Blob,
  transcript: string
): Promise<{ blobName: string; blobUrl: string }> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('transcript', transcript);

  const response = await fetch('/api/upload-audio', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to upload audio');
  }

  return response.json();
}
