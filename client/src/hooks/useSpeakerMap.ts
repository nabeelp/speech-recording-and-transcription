import { useState, useCallback, useRef } from 'react';

export interface SpeakerRole {
  rawId: string;
  label: string;
  role: 'advisor' | 'client';
}

interface UseSpeakerMapReturn {
  /** Get the display label for a raw speaker ID (e.g. "Guest-1" → "Advisor") */
  getLabel: (rawSpeakerId: string) => string;
  /** Get the role for a raw speaker ID */
  getRole: (rawSpeakerId: string) => 'advisor' | 'client' | 'unknown';
  /** Register a speaker ID when observed in the transcript */
  registerSpeaker: (rawSpeakerId: string) => void;
  /** Set which raw speaker ID is the Advisor */
  setAdvisor: (rawSpeakerId: string) => void;
  /** The raw speaker ID currently assigned as Advisor (null if none yet) */
  advisorId: string | null;
  /** All known speakers */
  speakers: SpeakerRole[];
}

export function useSpeakerMap(): UseSpeakerMapReturn {
  const [speakers, setSpeakers] = useState<SpeakerRole[]>([]);
  const clientCounterRef = useRef(0);
  const advisorId = speakers.find((s) => s.role === 'advisor')?.rawId ?? null;

  const registerSpeaker = useCallback((rawSpeakerId: string) => {
    if (!rawSpeakerId || rawSpeakerId === 'Unknown') {
      return;
    }

    setSpeakers((prev) => {
      if (prev.some((s) => s.rawId === rawSpeakerId)) {
        return prev;
      }

      if (prev.length === 0) {
        return [...prev, { rawId: rawSpeakerId, label: 'Advisor', role: 'advisor' }];
      }

      clientCounterRef.current += 1;
      return [
        ...prev,
        {
          rawId: rawSpeakerId,
          label: `Client ${clientCounterRef.current}`,
          role: 'client',
        },
      ];
    });
  }, []);

  const getLabel = useCallback(
    (rawSpeakerId: string): string => {
      if (!rawSpeakerId || rawSpeakerId === 'Unknown') return 'Unknown';
      const speaker = speakers.find((s) => s.rawId === rawSpeakerId);
      return speaker ? speaker.label : 'Unknown';
    },
    [speakers]
  );

  const getRole = useCallback(
    (rawSpeakerId: string): 'advisor' | 'client' | 'unknown' => {
      if (!rawSpeakerId || rawSpeakerId === 'Unknown') return 'unknown';
      const speaker = speakers.find((s) => s.rawId === rawSpeakerId);
      return speaker ? speaker.role : 'unknown';
    },
    [speakers]
  );

  const setAdvisor = useCallback(
    (rawSpeakerId: string) => {
      clientCounterRef.current = 0;

      setSpeakers((prev) => {
        if (!prev.some((s) => s.rawId === rawSpeakerId)) {
          return prev;
        }

        // Reassign roles: selected becomes Advisor, all others become Client N
        return prev.map((s) => {
          if (s.rawId === rawSpeakerId) {
            return { ...s, role: 'advisor' as const, label: 'Advisor' };
          }
          clientCounterRef.current += 1;
          return {
            ...s,
            role: 'client' as const,
            label: `Client ${clientCounterRef.current}`,
          };
        });
      });
    },
    []
  );

  return { getLabel, getRole, registerSpeaker, setAdvisor, advisorId, speakers };
}
