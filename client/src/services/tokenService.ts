interface TokenResponse {
  token: string;
  region: string;
  endpoint: string;
}

let cachedToken: { token: string; region: string; endpoint: string; expiry: number } | null = null;

export async function getTokenOrRefresh(): Promise<TokenResponse> {
  // Return cached token if still valid (refresh 1 minute before expiry)
  if (cachedToken && Date.now() < cachedToken.expiry - 60_000) {
    return { token: cachedToken.token, region: cachedToken.region, endpoint: cachedToken.endpoint };
  }

  const response = await fetch('/api/get-speech-token');
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch speech token');
  }

  const data: TokenResponse = await response.json();

  // Cache for 10 minutes (token lifetime)
  cachedToken = {
    token: data.token,
    region: data.region,
    endpoint: data.endpoint,
    expiry: Date.now() + 10 * 60 * 1000,
  };

  return data;
}
