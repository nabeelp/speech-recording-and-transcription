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
  /** Set which raw speaker ID is the Advisor */
  setAdvisor: (rawSpeakerId: string) => void;
  /** The raw speaker ID currently assigned as Advisor (null if none yet) */
  advisorId: string | null;
  /** All known speakers */
  speakers: SpeakerRole[];
}

export function useSpeakerMap(): UseSpeakerMapReturn {
  const [advisorId, setAdvisorId] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerRole[]>([]);
  const clientCounterRef = useRef(0);

  const ensureSpeaker = useCallback(
    (rawId: string): SpeakerRole => {
      // Check if already tracked
      const existing = speakers.find((s) => s.rawId === rawId);
      if (existing) return existing;

      // First speaker becomes Advisor automatically
      const isFirstSpeaker = speakers.length === 0;
      let role: 'advisor' | 'client';
      let label: string;

      if (isFirstSpeaker) {
        role = 'advisor';
        label = 'Advisor';
        setAdvisorId(rawId);
      } else {
        role = 'client';
        clientCounterRef.current += 1;
        label = `Client ${clientCounterRef.current}`;
      }

      const newSpeaker: SpeakerRole = { rawId, label, role };
      setSpeakers((prev) => [...prev, newSpeaker]);
      return newSpeaker;
    },
    [speakers]
  );

  const getLabel = useCallback(
    (rawSpeakerId: string): string => {
      if (!rawSpeakerId || rawSpeakerId === 'Unknown') return 'Unknown';
      const speaker = speakers.find((s) => s.rawId === rawSpeakerId);
      if (speaker) return speaker.label;
      // Auto-register on first encounter
      return ensureSpeaker(rawSpeakerId).label;
    },
    [speakers, ensureSpeaker]
  );

  const getRole = useCallback(
    (rawSpeakerId: string): 'advisor' | 'client' | 'unknown' => {
      if (!rawSpeakerId || rawSpeakerId === 'Unknown') return 'unknown';
      const speaker = speakers.find((s) => s.rawId === rawSpeakerId);
      if (speaker) return speaker.role;
      return ensureSpeaker(rawSpeakerId).role;
    },
    [speakers, ensureSpeaker]
  );

  const setAdvisor = useCallback(
    (rawSpeakerId: string) => {
      setAdvisorId(rawSpeakerId);
      clientCounterRef.current = 0;

      setSpeakers((prev) => {
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

  return { getLabel, getRole, setAdvisor, advisorId, speakers };
}
