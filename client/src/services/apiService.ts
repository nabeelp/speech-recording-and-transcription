export interface PiiEntity {
  text: string;
  category: string;
  offset: number;
  length: number;
  confidenceScore: number;
}

export interface PiiDetectionResult {
  text: string;
  entities: PiiEntity[];
  redactedText: string;
}

export async function detectPii(text: string): Promise<PiiDetectionResult> {
  const response = await fetch('/api/detect-pii', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to detect PII');
  }

  return response.json();
}

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
