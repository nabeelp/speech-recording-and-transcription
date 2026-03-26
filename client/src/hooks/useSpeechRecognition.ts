import { useRef, useState, useCallback } from 'react';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import { getTokenOrRefresh } from '../services/tokenService';

export interface TranscriptEntry {
  id: number;
  text: string;
  isFinal: boolean;
  timestamp: Date;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  interimText: string;
  transcriptEntries: TranscriptEntry[];
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  getFullTranscript: () => string;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recognizerRef = useRef<speechsdk.SpeechRecognizer | null>(null);
  const entryIdRef = useRef(0);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      setInterimText('');

      const tokenData = await getTokenOrRefresh();
      // Use fromEndpoint for Foundry-based Speech resources
      const speechConfig = speechsdk.SpeechConfig.fromEndpoint(
        new URL(tokenData.endpoint)
      );
      speechConfig.authorizationToken = tokenData.token;
      speechConfig.speechRecognitionLanguage = 'en-US';

      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;

      // Intermediate results (partial/in-progress)
      recognizer.recognizing = (_s, e) => {
        if (e.result.reason === speechsdk.ResultReason.RecognizingSpeech) {
          setInterimText(e.result.text);
        }
      };

      // Final recognized results
      recognizer.recognized = (_s, e) => {
        if (e.result.reason === speechsdk.ResultReason.RecognizedSpeech && e.result.text) {
          entryIdRef.current += 1;
          const entry: TranscriptEntry = {
            id: entryIdRef.current,
            text: e.result.text,
            isFinal: true,
            timestamp: new Date(),
          };
          setTranscriptEntries((prev) => [...prev, entry]);
          setInterimText('');
        } else if (e.result.reason === speechsdk.ResultReason.NoMatch) {
          // Silence or unrecognized — no action
        }
      };

      recognizer.canceled = (_s, e) => {
        if (e.reason === speechsdk.CancellationReason.Error) {
          setError(`Speech recognition error: ${e.errorDetails}`);
        }
        setIsListening(false);
        cleanup();
      };

      recognizer.sessionStopped = () => {
        setIsListening(false);
        cleanup();
      };

      recognizer.startContinuousRecognitionAsync(
        () => {
          setIsListening(true);
        },
        (err) => {
          setError(`Failed to start recognition: ${err}`);
          cleanup();
        }
      );

      // Refresh token every 9 minutes
      tokenRefreshTimerRef.current = setInterval(async () => {
        try {
          const newToken = await getTokenOrRefresh();
          recognizer.authorizationToken = newToken.token;
        } catch {
          // Token refresh failure — recognition may stop when current token expires
        }
      }, 9 * 60 * 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start speech recognition');
    }
  }, []);

  const cleanup = useCallback(() => {
    if (tokenRefreshTimerRef.current) {
      clearInterval(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognizer = recognizerRef.current;
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          recognizer.close();
          recognizerRef.current = null;
          setIsListening(false);
          setInterimText('');
          cleanup();
        },
        (err) => {
          console.error('Error stopping recognition:', err);
          recognizer.close();
          recognizerRef.current = null;
          setIsListening(false);
          cleanup();
        }
      );
    }
  }, [cleanup]);

  const getFullTranscript = useCallback(() => {
    return transcriptEntries.map((e) => e.text).join(' ');
  }, [transcriptEntries]);

  return {
    isListening,
    interimText,
    transcriptEntries,
    error,
    startListening,
    stopListening,
    getFullTranscript,
  };
}
