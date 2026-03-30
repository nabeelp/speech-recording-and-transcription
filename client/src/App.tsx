import { useState, useCallback, useEffect } from 'react';
import { StatusIndicator } from './components/StatusIndicator';
import { RecordingControls } from './components/RecordingControls';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { ClientInfoForm } from './components/ClientInfoForm';
import { ClientInfoPanel } from './components/ClientInfoPanel';
import { NBAPromptCard } from './components/NBAPromptCard';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useSpeakerMap } from './hooks/useSpeakerMap';
import { useNBAAnalysis } from './hooks/useNBAAnalysis';
import { uploadAudio, ClientInfo } from './services/apiService';

function App() {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  
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

  const { getLabel, getRole, setAdvisor, registerSpeaker } = useSpeakerMap();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Get raw transcript for NBA analysis
  const rawTranscript = getFullTranscript((id) => id);

  // Use NBA analysis hook
  const {
    suggestions,
    isAnalyzing,
    error: nbaError,
    dismissSuggestion,
    acceptSuggestion,
  } = useNBAAnalysis(rawTranscript, clientInfo, isRecording || isListening);

  const error = speechError || recorderError;
  const canStartRecording = clientInfo !== null;

  useEffect(() => {
    const speakerIds = new Set<string>();

    transcriptEntries.forEach((entry) => {
      speakerIds.add(entry.speakerId);
    });

    if (interimSpeakerId) {
      speakerIds.add(interimSpeakerId);
    }

    speakerIds.forEach((speakerId) => {
      registerSpeaker(speakerId);
    });
  }, [transcriptEntries, interimSpeakerId, registerSpeaker]);

  const handleClientSelected = useCallback((info: ClientInfo) => {
    setClientInfo(info);
    setUploadMessage(null);
  }, []);

  const handleClearClient = useCallback(() => {
    if (isRecording || isListening) {
      alert('Please stop recording before changing the client.');
      return;
    }
    setClientInfo(null);
    setUploadMessage(null);
  }, [isRecording, isListening]);

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
  }, [stopListening, stopRecording, getFullTranscript, getLabel]);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎙️ Speech Recording & Transcription (SA)</h1>
        <p style={styles.subtitle}>POC — Real-time transcription with Azure Speech Service + Next Best Action for South African Financial Advisors</p>
      </header>

      {/* Client Selection */}
      {!clientInfo ? (
        <ClientInfoForm onClientSelected={handleClientSelected} />
      ) : (
        <>
          {/* Status Bar */}
          <div style={styles.statusBar}>
            <StatusIndicator
              isConnected={isListening}
              isRecording={isRecording}
              error={error}
            />
          </div>

          {/* 3-Column Layout: Client Info | Transcript | NBA */}
          <div style={styles.threeColumnLayout}>
            {/* Left Column - Client Info */}
            <div style={styles.clientColumn}>
              <ClientInfoPanel clientInfo={clientInfo} onClear={handleClearClient} />
            </div>

            {/* Middle Column - Transcript */}
            <div style={styles.transcriptColumn}>
              <TranscriptDisplay
                entries={transcriptEntries}
                interimText={interimText}
                interimSpeakerId={interimSpeakerId}
                getLabel={getLabel}
                getRole={getRole}
                onSetAdvisor={setAdvisor}
              />
            </div>

            {/* Right Column - NBA Suggestions */}
            <div style={styles.nbaColumn}>
              <div style={styles.nbaHeader}>
                <h2 style={styles.nbaTitle}>💡 Next Best Actions</h2>
                {isAnalyzing && (
                  <span style={styles.analyzingBadge}>Analyzing...</span>
                )}
              </div>
              <div style={styles.nbaContent}>
              {suggestions.length > 0 ? (
                <>
                  {suggestions.map((suggestion) => (
                    <NBAPromptCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onDismiss={dismissSuggestion}
                      onAccept={acceptSuggestion}
                    />
                  ))}
                </>
              ) : (
                <div style={styles.nbaPlaceholder}>
                  <p style={styles.nbaPlaceholderText}>
                    {isRecording || isListening
                      ? '🔍 Listening to conversation...'
                      : '🎯 Start recording to get AI-powered suggestions'}
                  </p>
                </div>
              )}
              {nbaError && (
                <div style={styles.nbaError}>
                  ⚠️ Analysis error: {nbaError}
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Recording Controls */}
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
        </>
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
  threeColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '28% 44% 28%',
    gap: '0px',
    height: 'calc(100vh - 300px)',
    minHeight: '600px',
  },
  clientColumn: {
    height: '100%',
    borderRight: '1px solid #334155',
    paddingRight: '1rem',
    display: 'flex',
  },
  transcriptColumn: {
    height: '100%',
    borderRight: '1px solid #334155',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    display: 'flex',
  },
  nbaColumn: {
    height: '100%',
    paddingLeft: '1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  nbaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    flexShrink: 0,
  },
  nbaTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#94a3b8',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  nbaContent: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  analyzingBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  nbaError: {
    padding: '0.75rem',
    backgroundColor: '#7f1d1d',
    border: '1px solid #991b1b',
    borderRadius: '8px',
    color: '#fecaca',
    fontSize: '0.85rem',
  },
  nbaPlaceholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  nbaPlaceholderText: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: '1.6',
    margin: 0,
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
