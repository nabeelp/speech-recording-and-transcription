export interface ClientInfo {
  name: string;
  clientId: string;
  accountValue: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  age: number;
  portfolio: {
    stocks: number;
    bonds: number;
    cash: number;
  };
  recentActivity: string[];
  goals: string[];
}

// Mock database of South African clients with financial profiles
const MOCK_CLIENTS: Record<string, ClientInfo> = {
  'thabo mabaso': {
    name: 'Thabo Mabaso',
    clientId: 'CL-001',
    accountValue: 3250000,
    riskProfile: 'moderate',
    age: 52,
    portfolio: {
      stocks: 60,
      bonds: 30,
      cash: 10,
    },
    recentActivity: [
      'Deposited R250k on March 15, 2026',
      'Withdrew R50k for home renovation on Feb 3, 2026',
    ],
    goals: [
      'Retirement at age 65',
      'University fund for daughter at UCT',
      'Purchase holiday home in Plettenberg Bay',
    ],
  },
  'naledi khumalo': {
    name: 'Naledi Khumalo',
    clientId: 'CL-002',
    accountValue: 6500000,
    riskProfile: 'aggressive',
    age: 38,
    portfolio: {
      stocks: 80,
      bonds: 15,
      cash: 5,
    },
    recentActivity: [
      'Increased retirement annuity contribution on March 1, 2026',
      'Maxed out tax-free savings account on Jan 10, 2026',
    ],
    goals: [
      'Early retirement at age 55',
      'Build R25M portfolio by age 60',
      'International travel annually',
    ],
  },
  'pieter van der merwe': {
    name: 'Pieter van der Merwe',
    clientId: 'CL-003',
    accountValue: 2400000,
    riskProfile: 'conservative',
    age: 67,
    portfolio: {
      stocks: 40,
      bonds: 50,
      cash: 10,
    },
    recentActivity: [
      'Retired on January 1, 2026',
      'Started drawing living annuity income',
    ],
    goals: [
      'Preserve wealth for retirement',
      'Estate planning for children',
      'Cover private healthcare costs',
    ],
  },
  'lerato ndlovu': {
    name: 'Lerato Ndlovu',
    clientId: 'CL-004',
    accountValue: 1450000,
    riskProfile: 'moderate',
    age: 29,
    portfolio: {
      stocks: 70,
      bonds: 20,
      cash: 10,
    },
    recentActivity: [
      'Started new job in Sandton on February 15, 2026',
      'Increased emergency fund to R100k',
    ],
    goals: [
      'Save for home deposit in Johannesburg in 3 years',
      'Max out retirement annuity contributions',
      'Build offshore investment portfolio',
    ],
  },
  'mohammed patel': {
    name: 'Mohammed Patel',
    clientId: 'CL-005',
    accountValue: 4750000,
    riskProfile: 'aggressive',
    age: 45,
    portfolio: {
      stocks: 85,
      bonds: 10,
      cash: 5,
    },
    recentActivity: [
      'Sold business for R2.5M on March 10, 2026',
      'Considering property investments in Cape Town',
    ],
    goals: [
      'Diversify after business sale',
      'Retire at age 55',
      'Fund children\'s university education',
    ],
  },
  'test client': {
    name: 'Test Client',
    clientId: 'CL-999',
    accountValue: 2500000,
    riskProfile: 'moderate',
    age: 50,
    portfolio: {
      stocks: 60,
      bonds: 30,
      cash: 10,
    },
    recentActivity: [
      'Test activity 1',
      'Test activity 2',
    ],
    goals: [
      'Test goal 1',
      'Test goal 2',
      'Test goal 3',
    ],
  },
};

/**
 * Look up a client by name (case-insensitive)
 */
export function getClientInfo(name: string): ClientInfo | null {
  const key = name.toLowerCase().trim();
  return MOCK_CLIENTS[key] || null;
}

/**
 * Get all client names for autocomplete
 */
export function getAllClientNames(): string[] {
  return Object.values(MOCK_CLIENTS).map(client => client.name);
}
