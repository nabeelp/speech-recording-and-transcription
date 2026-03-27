import React, { useRef, useEffect } from 'react';
import { TranscriptEntry } from '../hooks/useSpeechRecognition';

const ADVISOR_COLOR = '#60a5fa'; // blue
const CLIENT_COLOR = '#34d399'; // green
const UNKNOWN_COLOR = '#94a3b8'; // grey

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  interimText: string;
  interimSpeakerId: string;
  getLabel: (rawId: string) => string;
  getRole: (rawId: string) => 'advisor' | 'client' | 'unknown';
  onSetAdvisor: (rawId: string) => void;
}

function getSpeakerColor(role: 'advisor' | 'client' | 'unknown'): string {
  if (role === 'advisor') return ADVISOR_COLOR;
  if (role === 'client') return CLIENT_COLOR;
  return UNKNOWN_COLOR;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  entries,
  interimText,
  interimSpeakerId,
  getLabel,
  getRole,
  onSetAdvisor,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, interimText]);

  const hasContent = entries.length > 0 || interimText;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Live Transcript</h2>
      <div style={styles.transcriptBox}>
        {!hasContent && (
          <p style={styles.placeholder}>
            Transcript will appear here when you start recording...
          </p>
        )}

        {entries.map((entry) => {
          const role = getRole(entry.speakerId);
          const label = getLabel(entry.speakerId);
          return (
            <div key={entry.id} style={styles.entryRow}>
              <span
                style={{
                  ...styles.speakerBadge,
                  backgroundColor: getSpeakerColor(role),
                  cursor: 'pointer',
                }}
                title={`Click to set as Advisor (raw: ${entry.speakerId})`}
                onClick={() => onSetAdvisor(entry.speakerId)}
              >
                {label}
              </span>
              <span style={styles.finalText}>{entry.text}</span>
            </div>
          );
        })}

        {interimText && (
          <div style={styles.entryRow}>
            {interimSpeakerId && (
              <span
                style={{
                  ...styles.speakerBadge,
                  backgroundColor: getSpeakerColor(getRole(interimSpeakerId)),
                  opacity: 0.6,
                }}
              >
                {getLabel(interimSpeakerId)}
              </span>
            )}
            <span style={styles.interimText}>{interimText}</span>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
  },
  heading: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  transcriptBox: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '1.25rem',
    minHeight: '300px',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  placeholder: {
    color: '#475569',
    fontStyle: 'italic',
  },
  entryRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    lineHeight: 1.7,
  },
  speakerBadge: {
    display: 'inline-block',
    padding: '0.1rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#0f172a',
    whiteSpace: 'nowrap' as const,
    marginTop: '0.2rem',
    flexShrink: 0,
  },
  finalText: {
    color: '#e2e8f0',
  },
  interimText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
};
