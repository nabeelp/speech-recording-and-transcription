import { Router, Request, Response } from 'express';
import { DefaultAzureCredential } from '@azure/identity';

export const speechTokenRouter = Router();

const credential = new DefaultAzureCredential();

speechTokenRouter.get('/get-speech-token', async (_req: Request, res: Response) => {
  const speechEndpoint = process.env.SPEECH_ENDPOINT;
  const speechRegion = process.env.SPEECH_REGION;

  if (!speechEndpoint || !speechRegion) {
    res.status(400).json({
      error:
        'SPEECH_ENDPOINT and SPEECH_REGION must both be configured. Update your .env file.',
    });
    return;
  }

  try {
    // Obtain an Entra ID access token for the Cognitive Services scope
    const tokenResponse = await credential.getToken(
      'https://cognitiveservices.azure.com/.default'
    );

    res.json({ token: tokenResponse.token, region: speechRegion, endpoint: speechEndpoint });
  } catch (err) {
    console.error('Error fetching speech token:', err);
    res.status(500).json({ error: 'Failed to obtain speech token via DefaultAzureCredential.' });
  }
});
