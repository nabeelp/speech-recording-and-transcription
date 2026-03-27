import React from 'react';
import { NBASuggestion } from '../services/apiService';

interface NBAPromptCardProps {
  suggestion: NBASuggestion;
  onDismiss: (id: string) => void;
  onAccept: (id: string) => void;
}

export const NBAPromptCard: React.FC<NBAPromptCardProps> = ({
  suggestion,
  onDismiss,
  onAccept,
}) => {
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const categoryIcons = {
    investment: '📈',
    protection: '🛡️',
    planning: '📋',
    account: '💼',
  };

  const categoryColors = {
    investment: '#3b82f6',
    protection: '#8b5cf6',
    planning: '#06b6d4',
    account: '#10b981',
  };

  return (
    <div
      style={{
        ...styles.card,
        borderLeft: `4px solid ${priorityColors[suggestion.priority]}`,
      }}
    >
      <div style={styles.cardHeader}>
        <div style={styles.badges}>
          <span
            style={{
              ...styles.badge,
              backgroundColor: categoryColors[suggestion.category],
            }}
          >
            {categoryIcons[suggestion.category]} {suggestion.category}
          </span>
          <span
            style={{
              ...styles.priorityBadge,
              backgroundColor: priorityColors[suggestion.priority],
            }}
          >
            {suggestion.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <h4 style={styles.action}>{suggestion.action}</h4>
      <p style={styles.reason}>{suggestion.reason}</p>

      <div style={styles.metadata}>
        <div style={styles.confidence}>
          <div style={styles.confidenceBar}>
            <div
              style={{
                ...styles.confidenceFill,
                width: `${suggestion.confidence * 100}%`,
              }}
            />
          </div>
          <span style={styles.confidenceText}>
            {(suggestion.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>

        {suggestion.triggerKeywords.length > 0 && (
          <div style={styles.keywords}>
            <span style={styles.keywordsLabel}>Detected:</span>
            {suggestion.triggerKeywords.slice(0, 3).map((keyword, idx) => (
              <span key={idx} style={styles.keyword}>
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button onClick={() => onAccept(suggestion.id)} style={styles.acceptBtn}>
          ✓ Discuss Now
        </button>
        <button onClick={() => onDismiss(suggestion.id)} style={styles.dismissBtn}>
          ✕ Dismiss
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '1rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    marginBottom: '0.75rem',
  },
  badges: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'white',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'white',
    letterSpacing: '0.05em',
  },
  action: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '0.5rem',
    lineHeight: '1.4',
  },
  reason: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  metadata: {
    marginBottom: '1rem',
  },
  confidence: {
    marginBottom: '0.75rem',
  },
  confidenceBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#0f172a',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '0.25rem',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s ease',
  },
  confidenceText: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  keywords: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    alignItems: 'center',
  },
  keywordsLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  keyword: {
    padding: '0.2rem 0.5rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    fontSize: '0.7rem',
    color: '#94a3b8',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  acceptBtn: {
    flex: 1,
    padding: '0.6rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  dismissBtn: {
    flex: 1,
    padding: '0.6rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    backgroundColor: '#475569',
    color: '#cbd5e1',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
