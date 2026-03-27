import { useRef, useState, useCallback } from 'react';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import { getTokenOrRefresh } from '../services/tokenService';
import { detectPii, PiiEntity } from '../services/apiService';

export interface TranscriptEntry {
  id: number;
  text: string;
  speakerId: string;
  isFinal: boolean;
  timestamp: Date;
  piiEntities?: PiiEntity[];
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  interimText: string;
  interimSpeakerId: string;
  transcriptEntries: TranscriptEntry[];
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  getFullTranscript: (labelFn?: (rawId: string) => string) => string;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [interimSpeakerId, setInterimSpeakerId] = useState('');
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const transcriberRef = useRef<speechsdk.ConversationTranscriber | null>(null);
  const entryIdRef = useRef(0);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      setInterimText('');
      setInterimSpeakerId('');

      const tokenData = await getTokenOrRefresh();
      // Use fromEndpoint for Foundry-based Speech resources
      const speechConfig = speechsdk.SpeechConfig.fromEndpoint(
        new URL(tokenData.endpoint)
      );
      speechConfig.authorizationToken = tokenData.token;
      speechConfig.speechRecognitionLanguage = 'en-US';

      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
      const transcriber = new speechsdk.ConversationTranscriber(speechConfig, audioConfig);
      transcriberRef.current = transcriber;

      // Intermediate results (partial/in-progress) with speaker ID
      transcriber.transcribing = (_s, e) => {
        if (e.result.text) {
          setInterimText(e.result.text);
          setInterimSpeakerId(e.result.speakerId || '');
        }
      };

      // Final transcribed results with speaker ID
      transcriber.transcribed = async (_s, e) => {
        if (e.result.reason === speechsdk.ResultReason.RecognizedSpeech && e.result.text) {
          entryIdRef.current += 1;
          
          // Detect PII in the transcribed text
          let piiEntities: PiiEntity[] = [];
          try {
            const piiResult = await detectPii(e.result.text);
            piiEntities = piiResult.entities;
          } catch (err) {
            console.error('Failed to detect PII:', err);
            // Continue without PII detection if it fails
          }

          const entry: TranscriptEntry = {
            id: entryIdRef.current,
            text: e.result.text,
            speakerId: e.result.speakerId || 'Unknown',
            isFinal: true,
            timestamp: new Date(),
            piiEntities,
          };
          setTranscriptEntries((prev) => [...prev, entry]);
          setInterimText('');
          setInterimSpeakerId('');
        }
      };

      transcriber.canceled = (_s, e) => {
        if (e.reason === speechsdk.CancellationReason.Error) {
          setError(`Speech recognition error: ${e.errorDetails}`);
        }
        setIsListening(false);
        cleanup();
      };

      transcriber.sessionStopped = () => {
        setIsListening(false);
        cleanup();
      };

      transcriber.startTranscribingAsync(
        () => {
          setIsListening(true);
        },
        (err) => {
          setError(`Failed to start transcription: ${err}`);
          cleanup();
        }
      );

      // Refresh token every 9 minutes
      tokenRefreshTimerRef.current = setInterval(async () => {
        try {
          const newToken = await getTokenOrRefresh();
          transcriber.authorizationToken = newToken.token;
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
    const transcriber = transcriberRef.current;
    if (transcriber) {
      transcriber.stopTranscribingAsync(
        () => {
          transcriber.close();
          transcriberRef.current = null;
          setIsListening(false);
          setInterimText('');
          setInterimSpeakerId('');
          cleanup();
        },
        (err) => {
          console.error('Error stopping transcription:', err);
          transcriber.close();
          transcriberRef.current = null;
          setIsListening(false);
          cleanup();
        }
      );
    }
  }, [cleanup]);

  const getFullTranscript = useCallback((labelFn?: (rawId: string) => string) => {
    return transcriptEntries
      .map((e) => {
        const label = labelFn ? labelFn(e.speakerId) : e.speakerId;
        return `[${label}] ${e.text}`;
      })
      .join('\n');
  }, [transcriptEntries]);

  return {
    isListening,
    interimText,
    interimSpeakerId,
    transcriptEntries,
    error,
    startListening,
    stopListening,
    getFullTranscript,
  };
}
