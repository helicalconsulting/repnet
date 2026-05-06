// Mock API service simulating backend calls
import { 
  mockDatabaseConnections, 
  mockTables, 
  mockReports, 
  mockQueryResponses,
  mockChatHistory,
  suggestions 
} from './mockData';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const AUTH_USERS_KEY = 'repnex-auth-users';
const AUTH_SESSION_KEY = 'repnex-auth-session';
const AUTH_MFA_CHALLENGES_KEY = 'repnex-auth-mfa-challenges';
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;

const ssoProviders = {
  'microsoft-entra': 'Microsoft Entra',
  okta: 'Okta',
  google: 'Google Workspace',
};

const defaultAuthUsers = [
  {
    id: 'user-demo',
    name: 'Demo User',
    company: 'Repnex Labs',
    email: 'demo@repnex.ai',
    password: 'demo@123',
    mfaEnabled: true,
    ssoProvider: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const ensureStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('Authentication storage is unavailable in this environment.');
  }
  return window.localStorage;
};

const parseJson = (rawValue, errorMessage) => {
  try {
    return JSON.parse(rawValue);
  } catch {
    throw new Error(errorMessage);
  }
};

const readStoredUsers = () => {
  const storage = ensureStorage();
  const rawUsers = storage.getItem(AUTH_USERS_KEY);

  if (!rawUsers) {
    storage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultAuthUsers));
    return [...defaultAuthUsers];
  }

  const parsedUsers = parseJson(rawUsers, 'Authentication user records are corrupted.');
  if (!Array.isArray(parsedUsers)) {
    throw new Error('Authentication user records are corrupted.');
  }

  return parsedUsers;
};

const saveUsers = (users) => {
  ensureStorage().setItem(AUTH_USERS_KEY, JSON.stringify(users));
};

const readMfaChallenges = () => {
  const rawChallenges = ensureStorage().getItem(AUTH_MFA_CHALLENGES_KEY);
  if (!rawChallenges) {
    return [];
  }

  const parsedChallenges = parseJson(rawChallenges, 'Authentication MFA challenges are corrupted.');
  if (!Array.isArray(parsedChallenges)) {
    throw new Error('Authentication MFA challenges are corrupted.');
  }

  return parsedChallenges;
};

const saveMfaChallenges = (challenges) => {
  ensureStorage().setItem(AUTH_MFA_CHALLENGES_KEY, JSON.stringify(challenges));
};

const pruneExpiredChallenges = () => {
  const now = Date.now();
  const activeChallenges = readMfaChallenges().filter((challenge) => challenge.expiresAt > now);
  saveMfaChallenges(activeChallenges);
  return activeChallenges;
};

const normalizeEmail = (email) => email.trim().toLowerCase();
const generateMfaCode = () => String(Math.floor(100000 + Math.random() * 900000));

const buildSessionUser = (user) => ({
  id: user.id,
  name: user.name,
  company: user.company,
  email: user.email,
});

const getSsoLabel = (provider) => {
  const label = ssoProviders[provider];
  if (!label) {
    throw new Error('Unsupported SSO provider.');
  }
  return label;
};

const deriveNameFromEmail = (email) => {
  const [localPart = 'Workspace User'] = email.split('@');
  const normalized = localPart.replace(/[._-]+/g, ' ').trim();
  if (!normalized) {
    return 'Workspace User';
  }
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const getMfaDeliveryForProvider = (provider) => {
  if (provider === 'microsoft-entra') {
    return 'Microsoft Authenticator';
  }
  if (provider === 'okta') {
    return 'Okta Verify';
  }
  if (provider === 'google') {
    return 'Google Authenticator';
  }
  return 'Authenticator app';
};

const createSession = (user) => {
  const sessionUser = buildSessionUser(user);
  ensureStorage().setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
};

const createMfaChallenge = ({ user, delivery, authMethod }) => {
  const challenge = {
    id: `mfa-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    code: generateMfaCode(),
    expiresAt: Date.now() + MFA_CHALLENGE_TTL_MS,
    delivery,
    authMethod,
    user: buildSessionUser(user),
  };

  const challenges = pruneExpiredChallenges();
  challenges.push(challenge);
  saveMfaChallenges(challenges);

  return {
    requiresMfa: true,
    challengeId: challenge.id,
    delivery: challenge.delivery,
    authMethod: challenge.authMethod,
    expiresAt: challenge.expiresAt,
    demoCode: challenge.code,
  };
};

export const authApi = {
  async getSession() {
    await delay(200);
    const rawSession = ensureStorage().getItem(AUTH_SESSION_KEY);
    if (!rawSession) {
      return null;
    }

    const session = parseJson(rawSession, 'Authentication session is corrupted.');
    if (!session || typeof session !== 'object' || typeof session.email !== 'string') {
      throw new Error('Authentication session is corrupted.');
    }

    return session;
  },

  async signIn({ email, password }) {
    await delay(650);

    const users = readStoredUsers();
    const normalizedEmail = normalizeEmail(email);
    const user = users.find((candidate) => candidate.email === normalizedEmail);

    if (!user) {
      throw new Error('No account found for this email.');
    }

    if (user.password !== password) {
      throw new Error('Incorrect password.');
    }

    if (user.mfaEnabled !== false) {
      return createMfaChallenge({
        user,
        delivery: 'Authenticator app',
        authMethod: 'Password',
      });
    }

    return createSession(user);
  },

  async signUp({ name, company, email, password, mfaEnabled = true }) {
    await delay(800);

    const users = readStoredUsers();
    const normalizedEmail = normalizeEmail(email);
    if (users.some((candidate) => candidate.email === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      company: company || 'Independent',
      email: normalizedEmail,
      password,
      mfaEnabled,
      ssoProvider: null,
      createdAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);

    if (newUser.mfaEnabled) {
      return createMfaChallenge({
        user: newUser,
        delivery: 'Authenticator app',
        authMethod: 'Sign up',
      });
    }

    return createSession(newUser);
  },

  async signInWithSso({ provider, email }) {
    await delay(700);
    const normalizedEmail = normalizeEmail(email);
    const providerLabel = getSsoLabel(provider);
    const users = readStoredUsers();
    let user = users.find((candidate) => candidate.email === normalizedEmail);

    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        name: deriveNameFromEmail(normalizedEmail),
        company: normalizedEmail.split('@')[1] || 'Enterprise Workspace',
        email: normalizedEmail,
        password: 'sso-managed-account',
        mfaEnabled: true,
        ssoProvider: provider,
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, user]);
    }

    return createMfaChallenge({
      user,
      delivery: getMfaDeliveryForProvider(provider),
      authMethod: providerLabel,
    });
  },

  async verifyMfa({ challengeId, code }) {
    await delay(350);

    const challenges = pruneExpiredChallenges();
    const challenge = challenges.find((entry) => entry.id === challengeId);
    if (!challenge) {
      throw new Error('MFA challenge expired. Start sign in again.');
    }

    if (challenge.code !== code.trim()) {
      throw new Error('Invalid MFA code.');
    }

    const remainingChallenges = challenges.filter((entry) => entry.id !== challengeId);
    saveMfaChallenges(remainingChallenges);

    return createSession(challenge.user);
  },

  async resendMfaCode({ challengeId }) {
    await delay(250);

    const challenges = pruneExpiredChallenges();
    const challengeIndex = challenges.findIndex((entry) => entry.id === challengeId);
    if (challengeIndex === -1) {
      throw new Error('MFA challenge expired. Start sign in again.');
    }

    const refreshedChallenge = {
      ...challenges[challengeIndex],
      code: generateMfaCode(),
      expiresAt: Date.now() + MFA_CHALLENGE_TTL_MS,
    };
    challenges[challengeIndex] = refreshedChallenge;
    saveMfaChallenges(challenges);

    return {
      challengeId: refreshedChallenge.id,
      delivery: refreshedChallenge.delivery,
      authMethod: refreshedChallenge.authMethod,
      expiresAt: refreshedChallenge.expiresAt,
      demoCode: refreshedChallenge.code,
    };
  },

  getSsoProviders() {
    return Object.entries(ssoProviders).map(([id, label]) => ({ id, label }));
  },

  async signOut() {
    await delay(200);
    ensureStorage().removeItem(AUTH_SESSION_KEY);
    return { success: true };
  },
};

// Database Connection APIs
export const databaseApi = {
  async getConnections() {
    await delay(300);
    return [...mockDatabaseConnections];
  },

  async testConnection(connectionData) {
    await delay(1500);
    // Simulate random success/failure
    const success = Math.random() > 0.2;
    return {
      success,
      message: success ? "Connection successful!" : "Connection failed: Unable to reach host",
      latency: success ? Math.floor(Math.random() * 100) + 20 : null
    };
  },

  async addConnection(connectionData) {
    await delay(800);
    const newConnection = {
      id: `conn-${Date.now()}`,
      ...connectionData,
      status: "connected",
      lastSync: "Just now",
      tables: Math.floor(Math.random() * 30) + 10,
      color: "#22c55e"
    };
    mockDatabaseConnections.push(newConnection);
    return newConnection;
  },

  async deleteConnection(id) {
    await delay(500);
    const index = mockDatabaseConnections.findIndex(c => c.id === id);
    if (index > -1) {
      mockDatabaseConnections.splice(index, 1);
    }
    return { success: true };
  },

  async getTables(connectionId) {
    await delay(400);
    return mockTables[connectionId] || [];
  },

  async syncConnection(connectionId) {
    await delay(2000);
    const conn = mockDatabaseConnections.find(c => c.id === connectionId);
    if (conn) {
      conn.lastSync = "Just now";
      conn.status = "connected";
    }
    return { success: true, tables: conn?.tables || 0 };
  }
};

// Report APIs
export const reportApi = {
  async getReports() {
    await delay(300);
    return [...mockReports];
  },

  async getReport(id) {
    await delay(200);
    return mockReports.find(r => r.id === id);
  },

  async getPinnedReports() {
    await delay(200);
    return mockReports.filter(r => r.isPinned);
  },

  async togglePin(id) {
    await delay(300);
    const report = mockReports.find(r => r.id === id);
    if (report) {
      report.isPinned = !report.isPinned;
    }
    return report;
  },

  async updateReport(id, updates) {
    await delay(400);
    const report = mockReports.find(r => r.id === id);
    if (report) {
      Object.assign(report, updates);
    }
    return report;
  },

  async deleteReport(id) {
    await delay(300);
    const index = mockReports.findIndex(r => r.id === id);
    if (index > -1) {
      mockReports.splice(index, 1);
    }
    return { success: true };
  },

  async saveReport(reportData) {
    await delay(500);
    const newReport = {
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isPinned: false,
      ...reportData
    };
    mockReports.unshift(newReport);
    return newReport;
  },

  async searchReports(query) {
    await delay(300);
    const lowerQuery = query.toLowerCase();
    return mockReports.filter(r => 
      r.title.toLowerCase().includes(lowerQuery) ||
      r.query.toLowerCase().includes(lowerQuery)
    );
  }
};

// AI Chat APIs
export const aiApi = {
  async generateReport(prompt) {
    await delay(2000);
    
    // Determine which type of report based on prompt keywords
    let responseKey = "sales";
    if (prompt.toLowerCase().includes("production") || prompt.toLowerCase().includes("loss")) {
      responseKey = "production";
    } else if (prompt.toLowerCase().includes("purchase") || prompt.toLowerCase().includes("delivery")) {
      responseKey = "purchase";
    }

    const response = mockQueryResponses[responseKey];
    
    return {
      success: true,
      tables: response.tables,
      sql: response.sql,
      data: response.data,
      insights: response.insights,
      reportId: `rep-${Date.now()}`,
      chartType: "bar",
      chartConfig: {
        xAxis: Object.keys(response.data[0])[1],
        yAxis: [Object.keys(response.data[0])[2]],
        colors: ["#2563eb", "#60a5fa"],
        showLegend: true,
        showGrid: true
      }
    };
  },

  async improvePrompt(prompt) {
    await delay(800);
    const improvements = [
      "Add a specific date range for better filtering",
      "Include comparison with previous period",
      "Add breakdown by category or region",
      "Include trend analysis over time"
    ];
    
    const params = [
      { name: "Date Range", options: ["Last 30 days", "Last 90 days", "Last 6 months", "YTD", "Custom"] },
      { name: "Group By", options: ["Category", "Region", "Customer", "Product Line"] },
      { name: "Include", options: ["Trends", "Comparisons", "Forecasts", "Anomalies"] },
      { name: "Sort By", options: ["Revenue", "Margin", "Quantity", "Growth %"] }
    ];

    return {
      suggestions: improvements,
      parameters: params,
      enhancedPrompt: `${prompt} with detailed breakdown and trend analysis`
    };
  },

  async streamResponse(prompt, onChunk) {
    const fullResponse = `I've analyzed your request: "${prompt}"\n\nBased on the connected ERP database, I found relevant data across multiple tables. Here's what I discovered:\n\n1. **Data Sources**: I queried 3 tables to compile this report\n2. **Records Found**: 2,847 matching records\n3. **Time Period**: Last 6 months of data\n4. **Key Metrics**: Revenue, margins, and quantities analyzed\n\nI've generated a comprehensive report with visualizations. Click below to explore the full interactive report with charts and data tables.`;
    
    const words = fullResponse.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      await delay(30 + Math.random() * 50);
      onChunk(words.slice(0, i + 1).join(' '));
    }
    
    return fullResponse;
  },

  async getChatHistory() {
    await delay(200);
    return [...mockChatHistory];
  },

  async getSuggestions() {
    await delay(100);
    return suggestions;
  }
};

// Export APIs
export const exportApi = {
  async exportCSV(reportId) {
    await delay(500);
    const report = mockReports.find(r => r.id === reportId);
    if (!report) return null;

    const headers = Object.keys(report.data[0]);
    const csvContent = [
      headers.join(','),
      ...report.data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    return {
      filename: `${report.title.replace(/\s+/g, '_')}.csv`,
      content: csvContent,
      mimeType: 'text/csv'
    };
  },

  async exportPDF(reportId) {
    await delay(1000);
    // In real implementation, this would generate a PDF
    return {
      filename: `report_${reportId}.pdf`,
      message: "PDF export would be generated here"
    };
  }
};
