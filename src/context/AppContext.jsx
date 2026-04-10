import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { databaseApi, reportApi, aiApi } from '../services/mockApi';
import { mockReports, mockDatabaseConnections } from '../services/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Database connections state
  const [connections, setConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  // Reports state
  const [reports, setReports] = useState([]);
  const [pinnedReports, setPinnedReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Current report being built/viewed
  const [currentReport, setCurrentReport] = useState(null);

  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // UI state
  const [notifications, setNotifications] = useState([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [conns, reps] = await Promise.all([
          databaseApi.getConnections(),
          reportApi.getReports()
        ]);
        setConnections(conns);
        setReports(reps);
        setPinnedReports(reps.filter(r => r.isPinned));
        
        // Set first connected database as active
        const firstConnected = conns.find(c => c.status === 'connected');
        if (firstConnected) {
          setActiveConnection(firstConnected.id);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoadingConnections(false);
        setIsLoadingReports(false);
      }
    };
    loadData();
  }, []);

  // Database functions
  const addConnection = useCallback(async (connectionData) => {
    const newConn = await databaseApi.addConnection(connectionData);
    setConnections(prev => [...prev, newConn]);
    addNotification('success', `Connected to ${connectionData.name}`);
    return newConn;
  }, []);

  const removeConnection = useCallback(async (id) => {
    await databaseApi.deleteConnection(id);
    setConnections(prev => prev.filter(c => c.id !== id));
    if (activeConnection === id) {
      setActiveConnection(null);
    }
    addNotification('info', 'Connection removed');
  }, [activeConnection]);

  const testConnection = useCallback(async (connectionData) => {
    return await databaseApi.testConnection(connectionData);
  }, []);

  // Report functions
  const togglePinReport = useCallback(async (reportId) => {
    const updated = await reportApi.togglePin(reportId);
    setReports(prev => prev.map(r => r.id === reportId ? updated : r));
    setPinnedReports(prev => {
      if (updated.isPinned) {
        return [...prev, updated];
      }
      return prev.filter(r => r.id !== reportId);
    });
    addNotification('success', updated.isPinned ? 'Report pinned to dashboard' : 'Report unpinned');
  }, []);

  const updateReport = useCallback(async (reportId, updates) => {
    const updated = await reportApi.updateReport(reportId, updates);
    setReports(prev => prev.map(r => r.id === reportId ? updated : r));
    if (currentReport?.id === reportId) {
      setCurrentReport(updated);
    }
    return updated;
  }, [currentReport]);

  const saveReport = useCallback(async (reportData) => {
    const newReport = await reportApi.saveReport(reportData);
    setReports(prev => [newReport, ...prev]);
    addNotification('success', 'Report saved successfully');
    return newReport;
  }, []);

  const deleteReport = useCallback(async (reportId) => {
    await reportApi.deleteReport(reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
    setPinnedReports(prev => prev.filter(r => r.id !== reportId));
    addNotification('info', 'Report deleted');
  }, []);

  const searchReports = useCallback(async (query) => {
    if (!query.trim()) {
      return reports;
    }
    return await reportApi.searchReports(query);
  }, [reports]);

  // AI/Chat functions
  const generateReport = useCallback(async (prompt) => {
    const result = await aiApi.generateReport(prompt);
    const newReport = {
      id: result.reportId,
      title: prompt.slice(0, 60) + (prompt.length > 60 ? '...' : ''),
      query: prompt,
      chartType: result.chartType,
      chartConfig: result.chartConfig,
      data: result.data,
      tables: result.tables,
      sql: result.sql,
      insights: result.insights,
      createdAt: new Date().toISOString(),
      isPinned: false
    };
    setCurrentReport(newReport);
    return newReport;
  }, []);

  // Notification functions
  const addNotification = useCallback((type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const value = {
    // Database state
    connections,
    activeConnection,
    setActiveConnection,
    isLoadingConnections,
    addConnection,
    removeConnection,
    testConnection,

    // Reports state
    reports,
    pinnedReports,
    isLoadingReports,
    currentReport,
    setCurrentReport,
    togglePinReport,
    updateReport,
    saveReport,
    deleteReport,
    searchReports,

    // AI/Chat state
    chatHistory,
    setChatHistory,
    activeChatId,
    setActiveChatId,
    generateReport,

    // Notifications
    notifications,
    addNotification,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
