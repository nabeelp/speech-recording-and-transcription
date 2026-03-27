import React, { useState, useEffect } from 'react';
import { getClientInfo, getAllClients, ClientInfo } from '../services/apiService';

interface ClientInfoFormProps {
  onClientSelected: (clientInfo: ClientInfo) => void;
}

export const ClientInfoForm: React.FC<ClientInfoFormProps> = ({ onClientSelected }) => {
  const [clientName, setClientName] = useState('');
  const [allClients, setAllClients] = useState<string[]>([]);
  const [filteredClients, setFilteredClients] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all client names for autocomplete
  useEffect(() => {
    getAllClients()
      .then(setAllClients)
      .catch(err => console.error('Failed to load clients:', err));
  }, []);

  // Filter clients based on input
  useEffect(() => {
    if (clientName.length >= 2) {
      const filtered = allClients.filter(name =>
        name.toLowerCase().includes(clientName.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredClients([]);
      setShowSuggestions(false);
    }
  }, [clientName, allClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || clientName.length < 2) {
      setError('Please enter a client name (at least 2 characters)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const clientInfo = await getClientInfo(clientName);
      onClientSelected(clientInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClient = (name: string) => {
    setClientName(name);
    setShowSuggestions(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Enter Client Name</h2>
        <p style={styles.subtitle}>
          Before starting the recording, please identify the client for this conversation.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Type client name..."
              style={styles.input}
              autoFocus
              disabled={isLoading}
            />
            
            {showSuggestions && filteredClients.length > 0 && (
              <div style={styles.suggestions}>
                {filteredClients.map((name) => (
                  <div
                    key={name}
                    style={styles.suggestionItem}
                    onClick={() => handleSelectClient(name)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Lookup Client'}
          </button>
        </form>

        <div style={styles.hint}>
          <strong>Available clients:</strong> Thabo Mabaso, Naledi Khumalo, Pieter van der Merwe, Lerato Ndlovu, Mohammed Patel
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '2rem',
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f1f5f9',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    marginTop: '0.25rem',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  suggestionItem: {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    color: '#f1f5f9',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid #334155',
  },
  error: {
    padding: '0.75rem',
    backgroundColor: '#7f1d1d',
    border: '1px solid #991b1b',
    borderRadius: '8px',
    color: '#fecaca',
    fontSize: '0.9rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#475569',
    cursor: 'not-allowed',
  },
  hint: {
    marginTop: '1.5rem',
    padding: '0.75rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
};
