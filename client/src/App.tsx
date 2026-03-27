import { useState, useCallback } from 'react';
import { StatusIndicator } from './components/StatusIndicator';
import { RecordingControls } from './components/RecordingControls';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useSpeakerMap } from './hooks/useSpeakerMap';
import { uploadAudio } from './services/apiService';

function App() {
  const {
    isListening,
    interimText,
    interimSpeakerId,
    transcriptEntries,
    error: speechError,
    startListening,
    stopListening,
    getFullTranscript,
  } = useSpeechRecognition();

  const {
    isRecording,
    startRecording,
    stopRecording,
    error: recorderError,
  } = useAudioRecorder();

  const { getLabel, getRole, setAdvisor } = useSpeakerMap();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const error = speechError || recorderError;

  const handleStart = useCallback(async () => {
    setUploadMessage(null);
    // Start both audio recording and speech recognition in parallel
    await Promise.all([startRecording(), startListening()]);
  }, [startRecording, startListening]);

  const handleStop = useCallback(async () => {
    // Stop speech recognition
    stopListening();

    // Stop audio recording and get the blob
    try {
      const audioBlob = await stopRecording();
      const transcript = getFullTranscript(getLabel);

      // Upload audio + transcript to backend
      setIsUploading(true);
      const result = await uploadAudio(audioBlob, transcript);
      setUploadMessage(`Saved: ${result.blobName}`);
    } catch (err) {
      console.error('Error during stop/upload:', err);
      setUploadMessage('Failed to save recording.');
    } finally {
      setIsUploading(false);
    }
  }, [stopListening, stopRecording, getFullTranscript]);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎙️ Speech Recording & Transcription</h1>
        <p style={styles.subtitle}>POC — Real-time transcription with Azure Speech Service</p>
      </header>

      <div style={styles.statusBar}>
        <StatusIndicator
          isConnected={isListening}
          isRecording={isRecording}
          error={error}
        />
      </div>

      <TranscriptDisplay
        entries={transcriptEntries}
        interimText={interimText}
        interimSpeakerId={interimSpeakerId}
        getLabel={getLabel}
        getRole={getRole}
        onSetAdvisor={setAdvisor}
      />

      <div style={styles.controls}>
        <RecordingControls
          isRecording={isRecording || isListening}
          isUploading={isUploading}
          onStart={handleStart}
          onStop={handleStop}
        />
      </div>

      {uploadMessage && (
        <div style={styles.uploadMsg}>
          {uploadMessage}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    textAlign: 'center',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #334155',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '0.5rem',
  },
  uploadMsg: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#94a3b8',
    padding: '0.75rem',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
};

export default App;
