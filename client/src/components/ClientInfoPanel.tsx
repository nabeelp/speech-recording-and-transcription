import React from 'react';
import { ClientInfo } from '../services/apiService';

interface ClientInfoPanelProps {
  clientInfo: ClientInfo;
  onClear?: () => void;
}

export const ClientInfoPanel: React.FC<ClientInfoPanelProps> = ({ 
  clientInfo, 
  onClear 
}) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'conservative':
        return '#10b981'; // green
      case 'moderate':
        return '#f59e0b'; // amber
      case 'aggressive':
        return '#ef4444'; // red
      default:
        return '#94a3b8';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headingRow}>
        <h2 style={styles.heading}>👤 Client Profile</h2>
        {onClear && (
          <button onClick={onClear} style={styles.clearBtn}>
            Change
          </button>
        )}
      </div>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.clientName}>{clientInfo.name}</h3>
            <span style={styles.clientId}>ID: {clientInfo.clientId}</span>
          </div>
        </div>
      
      {/* Single-column layout for sidebar */}
      <div style={styles.section}>
        <h4 style={styles.sectionHeading}>Portfolio Overview</h4>
        <div style={styles.statsGrid}>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Total Value</span>
            <strong style={styles.statValue}>
              R{clientInfo.accountValue.toLocaleString()}
            </strong>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Risk Profile</span>
            <strong 
              style={{
                ...styles.statValue,
                color: getRiskColor(clientInfo.riskProfile),
              }}
            >
              {clientInfo.riskProfile.charAt(0).toUpperCase() + clientInfo.riskProfile.slice(1)}
            </strong>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Age</span>
            <strong style={styles.statValue}>{clientInfo.age}</strong>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionHeading}>Asset Allocation</h4>
        <div style={styles.allocationBars}>
          <div style={styles.allocationRow}>
            <span style={styles.allocationLabel}>Stocks</span>
            <div style={styles.barContainer}>
              <div 
                style={{
                  ...styles.bar,
                  width: `${clientInfo.portfolio.stocks}%`,
                  backgroundColor: '#3b82f6',
                }}
              />
              <span style={styles.percentage}>{clientInfo.portfolio.stocks}%</span>
            </div>
          </div>
          <div style={styles.allocationRow}>
            <span style={styles.allocationLabel}>Bonds</span>
            <div style={styles.barContainer}>
              <div 
                style={{
                  ...styles.bar,
                  width: `${clientInfo.portfolio.bonds}%`,
                  backgroundColor: '#10b981',
                }}
              />
              <span style={styles.percentage}>{clientInfo.portfolio.bonds}%</span>
            </div>
          </div>
          <div style={styles.allocationRow}>
            <span style={styles.allocationLabel}>Cash</span>
            <div style={styles.barContainer}>
              <div 
                style={{
                  ...styles.bar,
                  width: `${clientInfo.portfolio.cash}%`,
                  backgroundColor: '#94a3b8',
                }}
              />
              <span style={styles.percentage}>{clientInfo.portfolio.cash}%</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionHeading}>Financial Goals</h4>
        <ul style={styles.goalsList}>
          {clientInfo.goals.map((goal, idx) => (
            <li key={idx} style={styles.goalItem}>
              {goal}
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionHeading}>Recent Activity</h4>
        <ul style={styles.goalsList}>
          {clientInfo.recentActivity.map((activity, idx) => (
            <li key={idx} style={styles.activityItem}>
              {activity}
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  headingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    flexShrink: 0,
  },
  heading: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#94a3b8',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  panel: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '1.25rem',
    width: '100%',
    flex: 1,
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #334155',
  },
  clientName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#f1f5f9',
    margin: 0,
  },
  clientId: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  clearBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.75rem',
    backgroundColor: '#475569',
    color: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    flexShrink: 0,
  },
  section: {
    marginBottom: '1.25rem',
  },
  sectionHeading: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '0.6rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #334155',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  statValue: {
    fontSize: '1rem',
    color: '#f1f5f9',
    fontWeight: 600,
  },
  allocationBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  allocationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  allocationLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    width: '60px',
    flexShrink: 0,
  },
  barContainer: {
    flex: 1,
    position: 'relative',
    height: '24px',
    backgroundColor: '#0f172a',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  percentage: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.75rem',
    color: '#f1f5f9',
    fontWeight: 600,
  },
  goalsList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  goalItem: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    marginBottom: '0.5rem',
    paddingLeft: '1.25rem',
    position: 'relative',
  },
  activityItem: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '0.5rem',
    paddingLeft: '1.25rem',
    position: 'relative',
  },
};

// Add CSS for the goal bullet points
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  styleSheet.insertRule(`
    li[style*="goalItem"]::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #3b82f6;
      font-weight: bold;
    }
  `, styleSheet.cssRules.length);
}
