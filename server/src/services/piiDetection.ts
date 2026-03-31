import { DefaultAzureCredential } from '@azure/identity';
import { TextAnalysisClient } from '@azure/ai-language-text';

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

let client: TextAnalysisClient | null = null;

function getClient(): TextAnalysisClient {
  if (!client) {
    const endpoint = process.env.LANGUAGE_ENDPOINT;
    if (!endpoint) {
      throw new Error('LANGUAGE_ENDPOINT environment variable is not set');
    }
    const credential = new DefaultAzureCredential();
    client = new TextAnalysisClient(endpoint, credential);
  }
  return client;
}

/**
 * Detect PII entities in the provided text using Azure AI Language service
 * @param text The text to analyze for PII
 * @returns PII detection result with entities and redacted text
 */
export async function detectPii(text: string): Promise<PiiDetectionResult> {
  if (!text || text.trim().length === 0) {
    return {
      text,
      entities: [],
      redactedText: text,
    };
  }

  try {
    const client = getClient();
    const documents = [{ id: '1', language: 'en', text }];

    // Use the synchronous single-call API — avoids the polling overhead of beginAnalyzeBatch
    const results = await client.analyze('PiiEntityRecognition', documents, {
      domainFilter: 'phi',
      stringIndexType: 'Utf16CodeUnit',
    });

    const entities: PiiEntity[] = [];
    let redactedText = text;

    for (const doc of results) {
      if (doc.error) {
        console.error(`PII detection error for document ${doc.id}:`, doc.error);
        continue;
      }

      if (doc.entities && doc.entities.length > 0) {
        // Sort entities by offset in descending order for proper replacement
        const sortedEntities = [...doc.entities].sort((a, b) => b.offset - a.offset);

        sortedEntities.forEach((entity) => {
          entities.push({
            text: entity.text,
            category: entity.category,
            offset: entity.offset,
            length: entity.length,
            confidenceScore: entity.confidenceScore,
          });

          // Replace PII in text with redaction
          redactedText =
            redactedText.substring(0, entity.offset) +
            '*'.repeat(entity.length) +
            redactedText.substring(entity.offset + entity.length);
        });

        // Reverse back to original order for return
        entities.reverse();
      }
    }

    return {
      text,
      entities,
      redactedText,
    };
  } catch (error) {
    console.error('Error detecting PII:', error);
    // Return original text if PII detection fails
    return {
      text,
      entities: [],
      redactedText: text,
    };
  }
}
