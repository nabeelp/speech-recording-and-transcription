import React, { useRef, useEffect } from 'react';
import { TranscriptEntry } from '../hooks/useSpeechRecognition';

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  interimText: string;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  entries,
  interimText,
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

        {entries.map((entry) => (
          <p key={entry.id} style={styles.finalText}>
            {entry.text}
          </p>
        ))}

        {interimText && (
          <p style={styles.interimText}>{interimText}</p>
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
  finalText: {
    color: '#e2e8f0',
    lineHeight: 1.7,
    marginBottom: '0.5rem',
  },
  interimText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    lineHeight: 1.7,
    marginBottom: '0.5rem',
  },
};
