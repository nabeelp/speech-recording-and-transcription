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

export interface ClientInfo {
  name: string;
  clientId: string;
  accountValue: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  age: number;
  portfolio: {
    stocks: number;
    bonds: number;
    cash: number;
  };
  recentActivity: string[];
  goals: string[];
}

export interface NBASuggestion {
  id: string;
  action: string;
  category: 'investment' | 'protection' | 'planning' | 'account';
  confidence: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  triggerKeywords: string[];
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

export async function getClientInfo(name: string): Promise<ClientInfo> {
  const response = await fetch(`/api/client/${encodeURIComponent(name)}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Client not found');
    }
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch client information');
  }

  return response.json();
}

export async function getAllClients(): Promise<string[]> {
  const response = await fetch('/api/clients');
  
  if (!response.ok) {
    throw new Error('Failed to fetch client list');
  }

  const data = await response.json();
  return data.clients;
}

export async function analyzeNBA(
  transcript: string,
  clientInfo: ClientInfo
): Promise<{ suggestions: NBASuggestion[] }> {
  const response = await fetch('/api/analyze-nba', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript, clientInfo }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to analyze transcript');
  }

  return response.json();
}
