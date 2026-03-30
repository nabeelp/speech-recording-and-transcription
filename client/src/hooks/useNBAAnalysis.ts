import { useState, useEffect, useCallback, useRef } from 'react';
import { ClientInfo, NBASuggestion, analyzeNBA } from '../services/apiService';

interface UseNBAAnalysisOptions {
  analysisInterval?: number; // milliseconds between analyses (default: 15000 = 15 seconds)
  minTranscriptLength?: number; // minimum transcript length to trigger analysis (default: 100)
}

interface UseNBAAnalysisReturn {
  suggestions: NBASuggestion[];
  isAnalyzing: boolean;
  error: string | null;
  dismissSuggestion: (id: string) => void;
  acceptSuggestion: (id: string) => void;
}

/**
 * Hook to analyze conversation transcript and generate Next Best Action suggestions
 * using Azure OpenAI
 */
export function useNBAAnalysis(
  transcript: string,
  clientInfo: ClientInfo | null,
  isRecording: boolean,
  options: UseNBAAnalysisOptions = {}
): UseNBAAnalysisReturn {
  const {
    analysisInterval = 15000, // 15 seconds
    minTranscriptLength = 100,
  } = options;

  const [suggestions, setSuggestions] = useState<NBASuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  const lastAnalyzedTranscriptRef = useRef('');
  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnalyzingRef = useRef(false);

  // Clear suggestions when recording stops
  useEffect(() => {
    if (!isRecording) {
      setSuggestions([]);
      setDismissedIds(new Set());
      lastAnalyzedTranscriptRef.current = '';
      setError(null);
    }
  }, [isRecording]);

  // Analyze transcript periodically during recording
  useEffect(() => {
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }

    if (!isRecording || !clientInfo || transcript.length < minTranscriptLength) {
      return;
    }

    // Check if transcript has changed significantly since last analysis
    const transcriptChanged = transcript !== lastAnalyzedTranscriptRef.current;
    
    if (!transcriptChanged) {
      return;
    }

    const performAnalysis = async () => {
      // Don't analyze if already analyzing
      if (isAnalyzingRef.current) {
        return;
      }

      isAnalyzingRef.current = true;
      setIsAnalyzing(true);
      setError(null);

      try {
        const result = await analyzeNBA(transcript, clientInfo);
        lastAnalyzedTranscriptRef.current = transcript;

        // Filter out dismissed suggestions and duplicates
        const newSuggestions = result.suggestions.filter(
          (s) => !dismissedIds.has(s.id)
        );

        // Update suggestions, keeping only the top 3 by priority and confidence
        const sortedSuggestions = newSuggestions.sort((a, b) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityWeight[a.priority];
          const bPriority = priorityWeight[b.priority];

          if (aPriority === bPriority) {
            return b.confidence - a.confidence;
          }
          return bPriority - aPriority;
        });

        setSuggestions(sortedSuggestions.slice(0, 3));
      } catch (err) {
        console.error('NBA analysis failed:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        isAnalyzingRef.current = false;
        setIsAnalyzing(false);
      }
    };

    // Schedule the next analysis
    analysisTimerRef.current = setTimeout(() => {
      void performAnalysis();
    }, analysisInterval);

    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
      }
    };
  }, [
    transcript,
    clientInfo,
    isRecording,
    minTranscriptLength,
    analysisInterval,
    dismissedIds,
  ]);

  const dismissSuggestion = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const acceptSuggestion = useCallback((id: string) => {
    // Log acceptance (could send to backend for analytics)
    console.log(`Advisor accepted NBA suggestion: ${id}`);
    
    // Remove the suggestion after accepting
    dismissSuggestion(id);
  }, [dismissSuggestion]);

  return {
    suggestions,
    isAnalyzing,
    error,
    dismissSuggestion,
    acceptSuggestion,
  };
}
