import { Router } from 'express';
import { analyzeTranscriptForNBA } from '../services/nbaAnalyzer';
import { ClientInfo } from '../services/clientDatabase';

export const nbaAnalysisRouter = Router();

/**
 * POST /api/analyze-nba
 * Analyze a conversation transcript and generate Next Best Action suggestions
 */
nbaAnalysisRouter.post('/analyze-nba', async (req, res) => {
  try {
    const { transcript, clientInfo } = req.body as {
      transcript: string;
      clientInfo: ClientInfo;
    };

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    if (!clientInfo || !clientInfo.name) {
      return res.status(400).json({ error: 'Client information is required' });
    }

    if (transcript.length < 50) {
      // Not enough content yet to analyze
      return res.json({ suggestions: [] });
    }

    const suggestions = await analyzeTranscriptForNBA(transcript, clientInfo);

    res.json({ suggestions });
  } catch (error) {
    console.error('NBA analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze transcript',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
