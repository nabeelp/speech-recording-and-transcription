import { useState, useEffect, useCallback, useRef } from 'react';
import { ClientInfo, NBASuggestion, analyzeNBA } from '../services/apiService';

interface UseNBAAnalysisOptions {
  analysisInterval?: number; // milliseconds between analyses (default: 15000 = 15 seconds)
  minTranscriptLength?: number; // minimum transcript length to trigger analysis (default: 100)
}

interface UseNBAAnalysisReturn {
  suggestions: NBASuggestion[];
  isAnalyzing: boolean;
  nextAnalysisIn: number; // seconds until next scheduled analysis (0 when not recording)
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
  const [nextAnalysisIn, setNextAnalysisIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const lastAnalyzedTranscriptRef = useRef('');
  const isAnalyzingRef = useRef(false);

  // Refs so the interval callback always reads the latest values without re-registering
  const transcriptRef = useRef(transcript);
  const clientInfoRef = useRef(clientInfo);
  const dismissedIdsRef = useRef(dismissedIds);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { clientInfoRef.current = clientInfo; }, [clientInfo]);
  useEffect(() => { dismissedIdsRef.current = dismissedIds; }, [dismissedIds]);

  // Clear suggestions when recording stops
  useEffect(() => {
    if (!isRecording) {
      setSuggestions([]);
      setDismissedIds(new Set());
      lastAnalyzedTranscriptRef.current = '';
      setError(null);
      setNextAnalysisIn(0);
    }
  }, [isRecording]);

  // Fixed-interval analysis loop — decoupled from transcript renders so the
  // timer is never reset by incoming speech entries.
  useEffect(() => {
    if (!isRecording) return;

    const intervalSeconds = analysisInterval / 1000;
    let secondsLeft = intervalSeconds;
    setNextAnalysisIn(secondsLeft);

    const performAnalysis = async () => {
      const currentTranscript = transcriptRef.current;
      const currentClientInfo = clientInfoRef.current;

      if (
        isAnalyzingRef.current ||
        !currentClientInfo ||
        currentTranscript.length < minTranscriptLength ||
        currentTranscript === lastAnalyzedTranscriptRef.current
      ) {
        return;
      }

      isAnalyzingRef.current = true;
      setIsAnalyzing(true);
      setError(null);

      try {
        const result = await analyzeNBA(currentTranscript, currentClientInfo);
        lastAnalyzedTranscriptRef.current = currentTranscript;

        const newSuggestions = result.suggestions.filter(
          (s) => !dismissedIdsRef.current.has(s.id)
        );

        const sortedSuggestions = newSuggestions.sort((a, b) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return (
            priorityWeight[b.priority] - priorityWeight[a.priority] ||
            b.confidence - a.confidence
          );
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

    const ticker = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        secondsLeft = intervalSeconds;
        void performAnalysis();
      }
      setNextAnalysisIn(secondsLeft);
    }, 1000);

    return () => {
      clearInterval(ticker);
      setNextAnalysisIn(0);
    };
  }, [isRecording, analysisInterval, minTranscriptLength]);

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
    nextAnalysisIn,
    error,
    dismissSuggestion,
    acceptSuggestion,
  };
}
