import { AzureOpenAI } from 'openai';
import { DefaultAzureCredential } from '@azure/identity';
import { ClientInfo } from './clientDatabase';

export interface NBASuggestion {
  id: string;
  action: string;
  category: 'investment' | 'protection' | 'planning' | 'account';
  confidence: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  triggerKeywords: string[];
}

interface OpenAINBASuggestion {
  action: string;
  category: 'investment' | 'protection' | 'planning' | 'account';
  confidence: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  triggerKeywords: string[];
}

/**
 * Analyze a conversation transcript using Azure OpenAI to generate
 * Next Best Action suggestions for a financial advisor
 */
export async function analyzeTranscriptForNBA(
  transcript: string,
  clientInfo: ClientInfo
): Promise<NBASuggestion[]> {
  if (!transcript || transcript.length < 50) {
    return [];
  }

  try {
    const suggestions = await generateNBAWithAzureOpenAI(transcript, clientInfo);
    
    // Add unique IDs and ensure data integrity
    return suggestions.map((suggestion, index) => ({
      ...suggestion,
      id: `nba-${Date.now()}-${index}`,
    }));
  } catch (error) {
    console.error('Failed to analyze transcript with Azure OpenAI:', error);
    // Return empty array on error - don't crash the app
    return [];
  }
}

/**
 * Use Azure OpenAI to analyze conversation and generate personalized NBA suggestions
 */
async function generateNBAWithAzureOpenAI(
  transcript: string,
  clientInfo: ClientInfo
): Promise<OpenAINBASuggestion[]> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

  if (!endpoint) {
    throw new Error('AZURE_OPENAI_ENDPOINT environment variable is required');
  }

  // Use DefaultAzureCredential for authentication (supports Entra ID)
  const credential = new DefaultAzureCredential();
  const scope = 'https://cognitiveservices.azure.com/.default';
  const tokenResponse = await credential.getToken(scope);

  const client = new AzureOpenAI({
    endpoint,
    apiKey: tokenResponse.token,
    deployment,
    apiVersion: '2024-08-01-preview',
  });

  const systemPrompt = `You are an AI assistant for South African financial advisors that analyzes client conversations in real-time and suggests Next Best Actions (NBAs).

Your role:
- Analyze the conversation transcript between an advisor and client in South Africa
- Identify discussion topics, concerns, questions, and opportunities
- Generate 2-4 specific, actionable suggestions for the advisor
- Prioritize suggestions based on urgency and client needs
- Consider the client's profile (age, risk tolerance, goals, portfolio)
- Use South African financial terminology (e.g., retirement annuities, tax-free savings accounts, living annuities)

Guidelines:
- Be specific and actionable (not generic advice)
- Focus on what the advisor should discuss NOW in this conversation
- Prioritize topics the client has shown interest in or concern about
- Consider the client's life stage and financial situation
- Suggest actions that align with the client's risk profile and goals
- Reference South African financial products and regulations where appropriate`;

  const userPrompt = `Analyze this South African client conversation and provide 2-4 Next Best Action suggestions for the financial advisor.

CLIENT PROFILE:
- Name: ${clientInfo.name}
- Age: ${clientInfo.age}
- Account Value: R${clientInfo.accountValue.toLocaleString()}
- Risk Profile: ${clientInfo.riskProfile}
- Asset Allocation: ${clientInfo.portfolio.stocks}% stocks, ${clientInfo.portfolio.bonds}% bonds, ${clientInfo.portfolio.cash}% cash
- Financial Goals:
${clientInfo.goals.map(goal => `  • ${goal}`).join('\n')}

CONVERSATION TRANSCRIPT:
${transcript}

Provide your response as a JSON array with this exact structure:
[
  {
    "action": "Brief, specific action for the advisor to take (max 80 chars)",
    "category": "investment" | "protection" | "planning" | "account",
    "confidence": 0.0 to 1.0 (how confident you are this is relevant),
    "reason": "Brief explanation why this is relevant now (max 120 chars)",
    "priority": "high" | "medium" | "low",
    "triggerKeywords": ["keyword1", "keyword2"] (words from transcript that triggered this)
  }
]

IMPORTANT: 
- Return ONLY the JSON array, no other text
- Generate 2-4 suggestions maximum
- Confidence should be 0.6-0.95 (be realistic)
- Priority "high" = urgent/time-sensitive, "medium" = important, "low" = nice to have
- TriggerKeywords should be actual words/phrases from the transcript`;

  const response = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Azure OpenAI');
  }

  try {
    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    // Handle both array and object with array property
    let suggestions: OpenAINBASuggestion[];
    if (Array.isArray(parsed)) {
      suggestions = parsed;
    } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      suggestions = parsed.suggestions;
    } else {
      throw new Error('Unexpected response format from Azure OpenAI');
    }

    // Validate and clean the suggestions
    return suggestions
      .filter(s => s.action && s.category && s.reason && s.priority)
      .map(s => ({
        action: s.action.substring(0, 80),
        category: s.category,
        confidence: Math.max(0, Math.min(1, s.confidence || 0.7)),
        reason: s.reason.substring(0, 120),
        priority: s.priority,
        triggerKeywords: s.triggerKeywords || [],
      }))
      .slice(0, 4); // Maximum 4 suggestions
  } catch (parseError) {
    console.error('Failed to parse Azure OpenAI response:', content);
    throw new Error('Invalid JSON response from Azure OpenAI');
  }
}
