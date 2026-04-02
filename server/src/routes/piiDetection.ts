import { Router, Request, Response } from 'express';
import { detectPii, DEFAULT_EXCLUDED_PII_CATEGORIES } from '../services/piiDetection';

export const piiDetectionRouter = Router();

interface PiiDetectionRequest {
  text: string;
  /** Override the excluded PII categories. Omit to use the server defaults. */
  excludedCategories?: string[];
}

/**
 * POST /api/detect-pii
 * Analyzes text for PII entities
 */
piiDetectionRouter.post('/detect-pii', async (req: Request, res: Response) => {
  try {
    const { text, excludedCategories } = req.body as PiiDetectionRequest;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    if (excludedCategories !== undefined && !Array.isArray(excludedCategories)) {
      res.status(400).json({ error: 'excludedCategories must be an array of strings' });
      return;
    }

    const result = await detectPii(text, { excludedCategories });
    res.json({
      ...result,
      excludedCategories: excludedCategories ?? DEFAULT_EXCLUDED_PII_CATEGORIES,
    });
  } catch (error) {
    console.error('PII detection endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to detect PII',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
