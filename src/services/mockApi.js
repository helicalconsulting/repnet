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
