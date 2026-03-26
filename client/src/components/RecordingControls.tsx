import React, { useState, useEffect } from 'react';

interface RecordingControlsProps {
  isRecording: boolean;
  isUploading: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isUploading,
  onStart,
  onStop,
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setElapsed(0);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={styles.container}>
      {isRecording && (
        <div style={styles.timer}>
          <span style={styles.timerDot}>●</span>
          <span>{formatTime(elapsed)}</span>
        </div>
      )}

      {isUploading ? (
        <button disabled style={styles.uploadingBtn}>
          Uploading...
        </button>
      ) : isRecording ? (
        <button onClick={onStop} style={styles.stopBtn}>
          ⏹ Stop Recording
        </button>
      ) : (
        <button onClick={onStart} style={styles.startBtn}>
          🎙 Start Recording
        </button>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  timer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.5rem',
    fontVariantNumeric: 'tabular-nums',
    color: '#f1f5f9',
  },
  timerDot: {
    color: '#ef4444',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  startBtn: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
  },
  stopBtn: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
  },
  uploadingBtn: {
    backgroundColor: '#64748b',
    color: '#fff',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
  },
};
