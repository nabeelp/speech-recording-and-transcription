import React from 'react';

interface StatusIndicatorProps {
  isConnected: boolean;
  isRecording: boolean;
  error: string | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isConnected,
  isRecording,
  error,
}) => {
  let statusColor = '#64748b'; // gray - idle
  let statusText = 'Idle';

  if (error) {
    statusColor = '#ef4444'; // red
    statusText = 'Error';
  } else if (isRecording) {
    statusColor = '#22c55e'; // green
    statusText = 'Recording';
  } else if (isConnected) {
    statusColor = '#3b82f6'; // blue
    statusText = 'Connected';
  }

  return (
    <div style={styles.container}>
      <div style={{ ...styles.dot, backgroundColor: statusColor }} />
      <span style={styles.text}>{statusText}</span>
      {error && <span style={styles.error}>{error}</span>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  text: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  error: {
    fontSize: '0.8rem',
    color: '#fca5a5',
    width: '100%',
    marginTop: '0.25rem',
  },
};
