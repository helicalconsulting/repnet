import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { databaseApi, reportApi, aiApi, queryApi } from '../services/api';

const AppContext = createContext(null);

// Normalise a report from the backend (snake_case) to the frontend shape (camelCase).
// Keeps original fields too so nothing breaks.
function normaliseReport(r) {
  if (!r) return r;
  const isPinned = r.is_pinned ?? r.isPinned ?? false;
  return {
    ...r,
    // camelCase aliases used throughout the UI
    isPinned,
    is_pinned: isPinned,                          // keep both so nothing breaks
    title: r.title || r.name || '',
    query: r.query || r.query_template_id || '',
    createdAt: r.createdAt || r.created_at || null,
    chartType: r.chartType || r.parameters?.chartType || 'bar',
    data: r.data || r.parameters?.data || [],
  };
}

export function AppProvider({ children, user }) {
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

  // Helper to map backend database connection to frontend schema
  const formatConnection = useCallback((conn) => {
    if (!conn) return null;
    return {
      ...conn,
      type: conn.db_type || conn.type || 'mssql',
      database: conn.db_name || conn.database || '',
      status: conn.is_active ? 'connected' : 'disconnected',
      tables: conn.tables_count || conn.tables || 0,
      lastSync: conn.schema_last_synced_at
        ? new Date(conn.schema_last_synced_at).toLocaleString()
        : (conn.last_tested_at ? new Date(conn.last_tested_at).toLocaleDateString() : 'Never')
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [conns, reps] = await Promise.all([
          databaseApi.getConnections(),
          reportApi.getReports()
        ]);
        const formatted = conns.map(formatConnection).filter(Boolean);
        setConnections(formatted);

        const normReps = reps.map(normaliseReport);
        setReports(normReps);
        setPinnedReports(normReps.filter(r => r.isPinned));

        // Set first connected database as active
        const firstConnected = formatted.find(c => c.status === 'connected');
        if (firstConnected) {
          setActiveConnection(firstConnected.id);
        }

        // Run initial health check shortly after mount
        setTimeout(async () => {
          try {
            const checks = await Promise.all(
              formatted.map(async (c) => {
                try {
                  const res = await databaseApi.syncConnection(c.id);
                  return { id: c.id, status: res.ok ? 'connected' : 'disconnected' };
                } catch {
                  return { id: c.id, status: 'disconnected' };
                }
              })
            );
            setConnections(prev =>
              prev.map(c => {
                const check = checks.find(x => x.id === c.id);
                return check ? { ...c, status: check.status } : c;
              })
            );
          } catch (e) {
            console.warn("Initial health check failed:", e);
          }
        }, 800);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoadingConnections(false);
        setIsLoadingReports(false);
      }
    };
    loadData();
  }, [formatConnection]);

  // Periodic background health check for connections
  useEffect(() => {
    if (connections.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const checks = await Promise.all(
          connections.map(async (c) => {
            try {
              const res = await databaseApi.syncConnection(c.id);
              return { id: c.id, status: res.ok ? 'connected' : 'disconnected' };
            } catch {
              return { id: c.id, status: 'disconnected' };
            }
          })
        );

        setConnections(prev => {
          let changed = false;
          const updated = prev.map(c => {
            const check = checks.find(x => x.id === c.id);
            if (check && check.status !== c.status) {
              changed = true;
              return { ...c, status: check.status };
            }
            return c;
          });
          return changed ? updated : prev;
        });
      } catch (err) {
        console.error("Periodic health check failed:", err);
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(interval);
  }, [connections.length]);

  // Database functions
  const addConnection = useCallback(async (connectionData) => {
    const newConn = await databaseApi.addConnection(connectionData);
    const formatted = formatConnection(newConn);
    setConnections(prev => [...prev, formatted]);
    if (!activeConnection) {
      setActiveConnection(formatted.id);
    }
    addNotification('success', `Connected to ${connectionData.name}`);
    return formatted;
  }, [activeConnection, formatConnection]);

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

  const listDatabases = useCallback(async (serverInfo) => {
    return await databaseApi.listDatabases(serverInfo);
  }, []);

  const listGatewayAgents = useCallback(async () => {
    return await databaseApi.listGatewayAgents();
  }, []);

  const syncConnection = useCallback(async (id) => {
    try {
      const res = await databaseApi.syncConnection(id);
      if (res && res.ok) {
        setConnections((prev) =>
          prev.map((connection) =>
            connection.id === id
              ? { 
                  ...connection, 
                  status: 'connected', 
                  lastSync: connection.schema_last_synced_at 
                    ? new Date(connection.schema_last_synced_at).toLocaleString() 
                    : 'Just now'
                }
              : connection
          )
        );
        if (!activeConnection) {
          setActiveConnection(id);
        }
        addNotification('success', 'Connection is online and healthy');
      } else {
        setConnections((prev) =>
          prev.map((connection) =>
            connection.id === id
              ? { ...connection, status: 'disconnected' }
              : connection
          )
        );
        addNotification('error', `Connection failed: ${res?.error || 'Database is offline'}`);
      }
    } catch (err) {
      setConnections((prev) =>
        prev.map((connection) =>
          connection.id === id
            ? { ...connection, status: 'disconnected' }
            : connection
        )
      );
      addNotification('error', 'Failed to communicate with connection');
    }
  }, [activeConnection]);

  const syncSchema = useCallback(async (id) => {
    const updated = await databaseApi.syncSchema(id);
    const formatted = formatConnection(updated);
    setConnections((prev) =>
      prev.map((connection) =>
        connection.id === id ? formatted : connection
      )
    );
    if (!activeConnection) {
      setActiveConnection(id);
    }
    addNotification('success', 'Database schema synced');
    return formatted;
  }, [activeConnection, formatConnection]);

  const getTables = useCallback(async (id) => {
    return await databaseApi.getTables(id);
  }, []);

  const getTableColumns = useCallback(async (id, tableName) => {
    return await databaseApi.getTableColumns(id, tableName);
  }, []);

  const generateAdapters = useCallback(async (id) => {
    const res = await databaseApi.generateAdapters(id);
    addNotification('success', 'Semantic mapping and adapters successfully generated!');
    return res;
  }, []);

  // Report functions
  const togglePinReport = useCallback(async (reportId) => {
    // Optimistic update: flip the local isPinned immediately
    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, isPinned: !r.isPinned, is_pinned: !r.isPinned } : r
    ));

    try {
      // Confirm with backend and use the authoritative response
      const raw = await reportApi.togglePin(reportId);
      const updated = normaliseReport(raw);

      setReports(prev => prev.map(r => r.id === reportId ? updated : r));
      setPinnedReports(prev => {
        if (updated.isPinned) {
          // Replace if already in list, otherwise append
          if (prev.some(r => r.id === reportId)) {
            return prev.map(r => r.id === reportId ? updated : r);
          }
          return [...prev, updated];
        }
        return prev.filter(r => r.id !== reportId);
      });
      addNotification('success', updated.isPinned ? 'Report pinned to dashboard' : 'Report unpinned');
      return updated;
    } catch (err) {
      // Rollback optimistic update on failure
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, isPinned: !r.isPinned, is_pinned: !r.isPinned } : r
      ));
      addNotification('error', 'Failed to update pin status');
      throw err;
    }
  }, []);

  const updateReport = useCallback(async (reportId, updates) => {
    const raw = await reportApi.updateReport(reportId, updates);
    const updated = normaliseReport(raw);
    setReports(prev => prev.map(r => r.id === reportId ? updated : r));
    if (currentReport?.id === reportId) {
      setCurrentReport(updated);
    }
    return updated;
  }, [currentReport]);

  const saveReport = useCallback(async (reportData) => {
    const raw = await reportApi.saveReport(reportData);
    const newReport = normaliseReport(raw);
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
    const raw = await reportApi.searchReports(query);
    return raw.map(normaliseReport);
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
      isPinned: false,
      is_pinned: false,
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
    // Current logged-in user
    user,

    // Database state
    connections,
    activeConnection,
    setActiveConnection,
    isLoadingConnections,
    addConnection,
    removeConnection,
    testConnection,
    listDatabases,
    listGatewayAgents,
    syncConnection,
    syncSchema,
    getTables,
    getTableColumns,
    generateAdapters,

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
