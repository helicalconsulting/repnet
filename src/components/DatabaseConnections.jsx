import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import { 
  Database, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  RefreshCw, 
  Trash2, 
  ChevronRight,
  Server,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Link2,
  SlidersHorizontal,
  Copy,
  Terminal,
  ShieldAlert,
  Download,
  MonitorDown,
  Maximize2
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { databaseApi } from "../services/api";

const dbTypes = [
  { id: "postgres", name: "PostgreSQL", icon: "🐘", color: "#336791", port: "5432" },
  { id: "supabase", name: "Supabase (Helios ERP)", icon: "⚡", color: "#3ECF8E", port: "5432", dialect: "postgres", hint: "postgresql://user:pass@db.xxx.supabase.co:5432/postgres" },
  { id: "mssql", name: "SQL Server / Syspro", icon: "🔷", color: "#CC2927", port: "1433" },
  { id: "mysql", name: "MySQL", icon: "🐬", color: "#4479A1", port: "3306" },
  { id: "oracle", name: "Oracle", icon: "🔴", color: "#F80000", port: "1521" },
  { id: "cloudsql", name: "Cloud SQL", icon: "☁️", color: "#4285F4", port: "5432" },
];

function ConnectionCard({ connection, onSync, onSyncSchema, onGenerateAdapters, onDelete, isAdmin, isViewer }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [isSyncingSchema, setIsSyncingSchema] = useState(false);
  const [isGeneratingAdapters, setIsGeneratingAdapters] = useState(false);

  const { getTables, getTableColumns } = useApp();
  
  // Local schema explorer state
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTable, setExpandedTable] = useState(null);
  const [columnsMap, setColumnsMap] = useState({});
  const [loadingColumnsTable, setLoadingColumnsTable] = useState(null);

  const loadTables = async () => {
    setLoadingTables(true);
    try {
      const data = await getTables(connection.id);
      setTables(data || []);
    } catch (err) {
      console.error("Failed to load tables list:", err);
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    if (showSchema && connection.tables > 0) {
      loadTables();
    }
  }, [showSchema, connection.tables]);

  const handleSync = async () => {
    setIsSyncing(true);
    await onSync(connection.id);
    setIsSyncing(false);
  };

  const handleSyncSchema = async () => {
    setIsSyncingSchema(true);
    try {
      await onSyncSchema(connection.id);
      await loadTables();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncingSchema(false);
    }
  };

  const handleGenerateAdapters = async () => {
    setIsGeneratingAdapters(true);
    try {
      await onGenerateAdapters(connection.id);
    } catch (err) {
      console.error("Adapter generation failed:", err);
    } finally {
      setIsGeneratingAdapters(false);
    }
  };

  const handleTableClick = async (tableName) => {
    if (expandedTable === tableName) {
      setExpandedTable(null);
      return;
    }
    
    setExpandedTable(tableName);
    
    if (!columnsMap[tableName]) {
      setLoadingColumnsTable(tableName);
      try {
        const cols = await getTableColumns(connection.id, tableName);
        setColumnsMap(prev => ({ ...prev, [tableName]: cols || [] }));
      } catch (err) {
        console.error("Failed to load table columns:", err);
      } finally {
        setLoadingColumnsTable(null);
      }
    }
  };

  const dbType = dbTypes.find(d => d.id === connection.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl p-5 hover:border-border dark:hover:border-white/10 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${dbType?.color}15` }}
          >
            {dbType?.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{connection.name}</h3>
            <p className="text-xs text-muted-foreground">{dbType?.name} • {connection.database}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
          connection.status === 'connected' 
             ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
             : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            connection.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}></span>
          {connection.status === 'connected' ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Host</p>
          <p className="text-sm font-medium truncate">{connection.host}</p>
        </div>
        <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Tables</p>
          <p className="text-sm font-medium">{connection.tables}</p>
        </div>
        <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Last Sync</p>
          <p className="text-sm font-medium">{connection.lastSync}</p>
        </div>
      </div>

      {!isViewer && (
        <div className="flex flex-col gap-2 pt-3 border-t border-border/50 dark:border-white/5">
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            <button
              onClick={handleGenerateAdapters}
              disabled={isGeneratingAdapters || connection.tables === 0}
              title={connection.tables === 0 ? "Sync schema first to map concepts" : "Run AI ontology mapping & index adapters"}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGeneratingAdapters ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isGeneratingAdapters ? 'Importing...' : 'Import Schema (AI)'}
            </button>

            <button className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          {isAdmin && (
            <button 
              onClick={() => onDelete(connection.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>
      )}

      {/* Collapsible Schema Section */}
      <div className="mt-4 pt-3 border-t border-border/50 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showSchema ? 'rotate-90' : ''}`} />
              {showSchema ? 'Hide Database Schema' : 'View Database Schema'}
            </button>
            <span className="text-muted-foreground/30 text-[10px]">|</span>
            <Link
              to={`/connections/${connection.id}/schema`}
              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              Open Explorer
            </Link>
          </div>
          
          {showSchema && !isViewer && (
            <button
              onClick={handleSyncSchema}
              disabled={isSyncingSchema}
              className="flex items-center gap-1 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              {isSyncingSchema ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {isSyncingSchema ? 'Syncing...' : 'Sync Schema'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showSchema && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3"
            >
              {connection.tables > 0 ? (
                <>
                  {/* Search Bar */}
                  <input
                    type="text"
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/[0.03] border border-border/40 dark:border-white/5 rounded-xl px-3 py-2 text-xs mb-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />

                  <SmartSkeleton loading={loadingTables}>
                    {loadingTables ? (
                      <div className="space-y-2 max-h-60 overflow-hidden pr-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="bg-black/5 dark:bg-white/[0.02] border border-border/30 dark:border-white/5 rounded-xl p-2.5 flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-2 w-2/3">
                              <div className="w-3.5 h-3.5 bg-muted rounded shrink-0" />
                              <div className="h-3 bg-muted rounded w-3/4" />
                            </div>
                            <div className="h-3 bg-muted rounded w-1/4" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
                        {tables
                          .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((table) => {
                            const isExpanded = expandedTable === table.name;
                            const isLoadingColumns = loadingColumnsTable === table.name;
                            const cols = columnsMap[table.name] || [];

                            return (
                              <div key={table.name} className="bg-black/5 dark:bg-white/[0.02] border border-border/30 dark:border-white/5 rounded-xl p-2.5">
                                <button
                                  onClick={() => handleTableClick(table.name)}
                                  className="w-full text-left font-semibold text-foreground flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>📋</span>
                                    <span className="truncate max-w-[200px]" title={table.name}>{table.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-normal shrink-0">
                                    <span>{table.columns_count} cols</span>
                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="mt-2.5 pt-2.5 border-t border-border/10 dark:border-white/[0.03]">
                                    <SmartSkeleton loading={isLoadingColumns}>
                                      {isLoadingColumns ? (
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5">
                                          {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex items-center justify-between py-1 border-b border-border/10 dark:border-white/[0.02] animate-pulse">
                                              <div className="h-3 bg-muted rounded w-2/3" />
                                              <div className="h-3 bg-muted rounded w-1/4" />
                                            </div>
                                          ))}
                                        </div>
                                      ) : cols.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5 text-[11px] text-muted-foreground">
                                          {cols.map((col) => (
                                            <div key={col.name} className="flex items-center justify-between py-0.5 border-b border-border/10 dark:border-white/[0.02] truncate">
                                              <span className="font-medium text-foreground/80 truncate pr-2" title={col.name}>{col.name}</span>
                                              <span className="text-[9px] uppercase px-1 bg-black/10 dark:bg-white/5 rounded text-muted-foreground shrink-0">{col.type}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-muted-foreground pl-5 py-1">No columns found.</div>
                                      )}
                                    </SmartSkeleton>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {tables.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <div className="text-center py-4 text-xs text-muted-foreground">No matching tables found.</div>
                        )}
                      </div>
                    )}
                  </SmartSkeleton>
                </>
              ) : (
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 text-center mt-2">
                  <p className="text-xs text-muted-foreground mb-3">No schema has been synced for this connection yet.</p>
                  {!isViewer && (
                    <button
                      onClick={handleSyncSchema}
                      disabled={isSyncingSchema}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSyncingSchema ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Sync Database Schema
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function AddConnectionModal({ isOpen, onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [inputMode, setInputMode] = useState('fields'); // 'fields' | 'string'
  const [connectionMode, setConnectionMode] = useState('direct'); // 'direct' | 'gateway'
  const [agentName, setAgentName] = useState('my-laptop');
  const [localDbHost, setLocalDbHost] = useState('localhost');
  const [localDbPort, setLocalDbPort] = useState('');
  const [localDbUser, setLocalDbUser] = useState('');
  const [localDbPassword, setLocalDbPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [agentToken, setAgentToken] = useState('');

  useEffect(() => {
    if (isOpen && connectionMode === 'gateway' && !agentToken) {
      databaseApi.getAgentToken()
        .then(token => setAgentToken(token))
        .catch(err => console.error("Failed to generate agent token:", err));
    }
  }, [isOpen, connectionMode, agentToken]);

  const getWsServerUrl = () => {
    const apiBase = import.meta.env.VITE_API_BASE || 'https://repnex-production.up.railway.app/v1';
    let wsBase = apiBase.replace(/\/v1\/?$/, '');
    wsBase = wsBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    return wsBase;
  };

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    connectionString: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // ── "Fetch Databases" state ───────────────────────────────────────────
  const [isFetchingDbs, setIsFetchingDbs] = useState(false);
  const [availableDbs, setAvailableDbs] = useState([]);
  const [fetchDbError, setFetchDbError] = useState(null);

  const { testConnection, listDatabases, listGatewayAgents } = useApp();

  // ── Live agent status polling ─────────────────────────────────────────
  const [agentOnline, setAgentOnline] = useState(false);

  useEffect(() => {
    if (!isOpen || connectionMode !== 'gateway' || !agentName.trim()) {
      setAgentOnline(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      const agents = await listGatewayAgents();
      if (!cancelled) setAgentOnline(agents.includes(agentName.trim()));
    };
    check();
    const iv = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [isOpen, connectionMode, agentName, listGatewayAgents]);

  const handleFetchDatabases = async () => {
    setIsFetchingDbs(true);
    setFetchDbError(null);
    setAvailableDbs([]);
    setFormData(prev => ({ ...prev, database: '' }));
    setTestResult(null);
    try {
      const dbs = await listDatabases({
        db_type: selectedType,
        host: formData.host,
        port: parseInt(formData.port) || parseInt(defaultPorts[selectedType]) || 0,
        username: formData.username,
        password: formData.password,
      });
      setAvailableDbs(dbs);
      if (dbs.length === 1) {
        setFormData(prev => ({ ...prev, database: dbs[0] }));
      }
    } catch (err) {
      setFetchDbError(err.message || 'Could not connect to server');
    } finally {
      setIsFetchingDbs(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    let payload;
    if (connectionMode === 'gateway') {
      payload = {
        name: formData.name || 'Test Gateway Connection',
        db_type: selectedType,
        host: `gateway:${agentName}`,
        port: 0,
        db_name: formData.database,
        username: 'agent',
        password: 'agent',
        ssl_enabled: false,
      };
    } else if (inputMode === 'string') {
      payload = {
        name: formData.name || 'Test Connection',
        db_type: (selectedType === 'supabase' ? 'postgres' : selectedType) || 'mssql',
        connection_string: formData.connectionString,
        host: '',
        port: 0,
        db_name: '',
        username: '',
        password: '',
        ssl_enabled: selectedType === 'supabase',
      };
    } else {
      payload = {
        name: formData.name || 'Test Connection',
        db_type: selectedType === 'supabase' ? 'postgres' : selectedType,
        host: formData.host,
        port: parseInt(formData.port) || parseInt(defaultPorts[selectedType]) || 0,
        db_name: formData.database,
        username: formData.username,
        password: formData.password,
        ssl_enabled: false,
      };
    }
    const result = await testConnection(payload);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleAdd = async () => {
    setIsAdding(true);
    
    let payload;
    if (connectionMode === 'gateway') {
      payload = {
        name: formData.name,
        db_type: selectedType,
        host: `gateway:${agentName}`,
        port: 0,
        db_name: formData.database,
        username: 'agent',
        password: 'agent',
        ssl_enabled: false,
      };
    } else if (inputMode === 'string') {
      payload = {
        name: formData.name,
        db_type: (selectedType === 'supabase' ? 'postgres' : selectedType) || 'mssql',
        connection_string: formData.connectionString,
        host: '',
        port: 0,
        db_name: '',
        username: '',
        password: '',
        ssl_enabled: selectedType === 'supabase',
      };
    } else {
      payload = {
        name: formData.name,
        db_type: selectedType === 'supabase' ? 'postgres' : selectedType,
        host: formData.host,
        port: parseInt(formData.port) || parseInt(defaultPorts[selectedType]) || 0,
        db_name: formData.database,
        username: formData.username,
        password: formData.password,
        ssl_enabled: false,
      };
    }
    await onAdd(payload);
    setIsAdding(false);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedType(null);
    setInputMode('fields');
    setConnectionMode('direct');
    setAgentName('my-laptop');
    setLocalDbHost('localhost');
    setLocalDbPort('');
    setLocalDbUser('');
    setLocalDbPassword('');
    setCopied(false);
    setAgentToken('');
    setFormData({ name: '', host: '', port: '', database: '', username: '', password: '', connectionString: '' });
    setTestResult(null);
    setAvailableDbs([]);
    setFetchDbError(null);
  };

  const defaultPorts = {};
  dbTypes.forEach(d => { defaultPorts[d.id] = d.port; });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card dark:bg-[#1C1C1C] rounded-2xl w-full max-w-lg overflow-hidden border border-border/50 dark:border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 dark:border-white/5">
          <div>
            <h2 className="text-lg font-semibold">Connect Database</h2>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? 'Select your database type' : 'Enter connection details'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 gap-3"
              >
                {dbTypes.map(db => (
                  <button
                    key={db.id}
                    onClick={() => {
                      setSelectedType(db.id);
                      setFormData(prev => ({ ...prev, port: db.port }));
                      // Supabase → force connection-string mode
                      if (db.id === 'supabase') {
                        setInputMode('string');
                        setConnectionMode('direct');
                      }
                      setStep(2);
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border/50 dark:border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <span className="text-3xl">{db.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{db.name}</p>
                      <p className="text-xs text-muted-foreground">{db.id === 'supabase' ? 'Paste connection string' : 'Click to connect'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Back button */}
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to database selection
                </button>

                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
                  <span className="text-2xl">{dbTypes.find(d => d.id === selectedType)?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{dbTypes.find(d => d.id === selectedType)?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedType === 'supabase' ? 'Paste your Supabase PostgreSQL connection string below' : 'Enter your connection details below'}</p>
                  </div>
                  {selectedType === 'supabase' && (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">Helios ERP</span>
                  )}
                </div>

                {/* Supabase info banner */}
                {selectedType === 'supabase' && (
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-400">
                    <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Use the PostgreSQL connection string from your Supabase project dashboard. Format: <code className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded">postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:5432/postgres</code></span>
                  </div>
                )}

                {/* Connection Mode toggle — hide for Supabase (always direct) */}
                {selectedType !== 'supabase' && (
                <div className="flex rounded-xl overflow-hidden border border-border/50 dark:border-white/10 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setConnectionMode('direct');
                      setFormData(prev => ({ ...prev, host: '', port: defaultPorts[selectedType] || '' }));
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-medium transition-colors ${
                      connectionMode === 'direct'
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Direct Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectionMode('gateway');
                      setFormData(prev => ({
                        ...prev,
                        database: prev.database || 'CompanyDB',
                      }));
                      if (!localDbPort) {
                        setLocalDbPort(defaultPorts[selectedType] || '1433');
                      }
                      if (!localDbUser) {
                        setLocalDbUser(selectedType === 'postgres' ? 'postgres' : 'sa');
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-medium transition-colors ${
                      connectionMode === 'gateway'
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Secure Gateway
                  </button>
                </div>
                )}

                {/* Sub-mode toggle for Direct Mode — hide for Supabase (always string) */}
                {connectionMode === 'direct' && selectedType !== 'supabase' && (
                  <div className="flex rounded-xl overflow-hidden border border-border/50 dark:border-white/10 text-xs w-fit">
                    <button
                      type="button"
                      onClick={() => setInputMode('fields')}
                      className={`px-3 py-1.5 font-medium transition-colors ${
                        inputMode === 'fields'
                          ? 'bg-black/10 dark:bg-white/15 text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Manual Fields
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('string')}
                      className={`px-3 py-1.5 font-medium transition-colors ${
                        inputMode === 'string'
                          ? 'bg-black/10 dark:bg-white/15 text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Connection String
                    </button>
                  </div>
                )}

                {/* Connection Name (always shown) */}
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Connection Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Production ERP"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                  />
                </div>

                <AnimatePresence mode="wait">
                  {connectionMode === 'gateway' ? (
                    <motion.div key="gateway" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-foreground/80 mb-1.5 flex items-center gap-2">
                            Agent Name
                            {agentName.trim() && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                agentOnline
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : 'bg-rose-500/15 text-rose-500'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  agentOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`} />
                                {agentOnline ? 'Online' : 'Offline – run agent on DB laptop'}
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={agentName}
                            onChange={e => setAgentName(e.target.value)}
                            placeholder="my-laptop"
                            className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Database Name</label>
                          <input
                            type="text"
                            value={formData.database}
                            onChange={e => setFormData(prev => ({ ...prev, database: e.target.value }))}
                            placeholder="CompanyDB"
                            className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* Config fields to auto-generate CLI command */}
                      <div className="p-4 rounded-xl border border-dashed border-border/50 dark:border-white/5 space-y-3">
                        <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Configure Local Target DB (For CLI command generation)</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Local Host</label>
                            <input
                              type="text"
                              value={localDbHost}
                              onChange={e => setLocalDbHost(e.target.value)}
                              placeholder="localhost"
                              className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/5 dark:bg-white/5 border border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Local Port</label>
                            <input
                              type="text"
                              value={localDbPort}
                              onChange={e => setLocalDbPort(e.target.value)}
                              placeholder="1433"
                              className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/5 dark:bg-white/5 border border-transparent outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Local DB User</label>
                            <input
                              type="text"
                              value={localDbUser}
                              onChange={e => setLocalDbUser(e.target.value)}
                              placeholder="sa"
                              className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/5 dark:bg-white/5 border border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Local DB Password</label>
                            <input
                              type="password"
                              value={localDbPassword}
                              onChange={e => setLocalDbPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/5 dark:bg-white/5 border border-transparent outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Setup & CLI Command Block */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground/80 block">Setup Agent on Database Laptop</label>

                        {/* One-click installer download buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const token = agentToken || 'YOUR_AGENT_TOKEN';
                              const port = localDbPort || (selectedType === 'postgres' ? '5432' : '1433');
                              const serverHttp = getWsServerUrl().replace('wss://', 'https://').replace('ws://', 'http://');
                              const serverWs = getWsServerUrl();

                              // Build PowerShell setup script
                              const ps1 = [
                                `Write-Host ''`,
                                `Write-Host '  Repnex Gateway Agent - Windows Setup' -ForegroundColor Cyan`,
                                `Write-Host '=====================================================' -ForegroundColor Cyan`,
                                `Write-Host ''`,
                                ``,
                                `$dir = if ($env:REPNEX_DIR) { $env:REPNEX_DIR.TrimEnd('\\') } else { (Get-Location).Path }`,
                                ``,
                                `# Find Python 3`,
                                `$py = $null`,
                                `foreach ($c in @('python','python3','py')) {`,
                                `    try {`,
                                `        $v = & $c --version 2>&1`,
                                `        if ("$v" -match 'Python 3') { $py = $c; Write-Host "Found: $v" -ForegroundColor Green; break }`,
                                `    } catch {}`,
                                `}`,
                                `if (-not $py) {`,
                                `    Write-Host 'Python 3 not found. Trying winget...' -ForegroundColor Yellow`,
                                `    try {`,
                                `        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null`,
                                `        $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')`,
                                `        $py = 'python'`,
                                `        Write-Host 'Python installed via winget!' -ForegroundColor Green`,
                                `    } catch {`,
                                `        Write-Host 'Could not auto-install Python. Please install Python 3 from python.org' -ForegroundColor Red`,
                                `        Read-Host 'Press Enter to exit'`,
                                `        exit 1`,
                                `    }`,
                                `}`,
                                ``,
                                `Write-Host ''`,
                                `Write-Host 'Installing Python packages...' -ForegroundColor Cyan`,
                                `& $py -m pip install --upgrade websockets pymssql asyncpg --quiet`,
                                `if ($LASTEXITCODE -ne 0) {`,
                                `    Write-Host 'pip install failed. Check internet connection.' -ForegroundColor Red`,
                                `    Read-Host 'Press Enter to exit'; exit 1`,
                                `}`,
                                ``,
                                `Write-Host ''`,
                                `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`,
                                `$agentPath = Join-Path $dir 'repnex-agent.py'`,
                                `$localAgent = Join-Path $dir 'repnex_backend_complete\\repnex-agent.py'`,
                                `if (Test-Path $localAgent) {`,
                                `    Copy-Item $localAgent $agentPath -Force`,
                                `    Write-Host 'Using local development agent.' -ForegroundColor Green`,
                                `} else {`,
                                `    Write-Host 'Downloading repnex-agent.py from cloud...' -ForegroundColor Cyan`,
                                `    try {`,
                                `        Invoke-WebRequest -Uri '${serverHttp}/v1/agent/download' -OutFile $agentPath -UseBasicParsing`,
                                `    } catch {`,
                                `        Write-Host "Download failed: $_" -ForegroundColor Red`,
                                `        Read-Host 'Press Enter to exit'; exit 1`,
                                `    }`,
                                `}`,
                                ``,
                                `# Get full python exe path`,
                                `$pyExe = (Get-Command $py -EA SilentlyContinue).Source`,
                                `if (-not $pyExe) { $pyExe = $py }`,
                                ``,
                                `# Build launcher bat line-by-line (no escaping issues)`,
                                `$launcherPath = Join-Path $dir 'start-repnex-agent.bat'`,
                                `$startupFolder = [Environment]::GetFolderPath('Startup')`,
                                `$batLines = @(`,
                                `    '@echo off',`,
                                `    'title Repnex Gateway Agent',`,
                                `    'echo =====================================================',`,
                                `    'echo    Repnex Gateway Agent - Running',`,
                                `    'echo =====================================================',`,
                                `    'echo.',`,
                                `    'echo Keep this window open. Press Ctrl+C to stop.',`,
                                `    'echo.',`,
                                `    ':loop',`,
                                `    ('"' + $pyExe + '" "' + $agentPath + '" --server "${serverWs}" --token "${token}" --agent-name "${agentName}" --db-type "${selectedType}" --db-host "${localDbHost}" --db-port "${port}" --db-user "${localDbUser}" --db-password "${localDbPassword}"'),`,
                                `    'echo.',`,
                                `    'echo Agent stopped. Restarting in 10 seconds...',`,
                                `    'timeout /t 10 /nobreak >nul',`,
                                `    'goto loop'`,
                                `)`,
                                `$batLines | Out-File -FilePath $launcherPath -Encoding ascii`,
                                `Copy-Item $launcherPath (Join-Path $startupFolder 'start-repnex-agent.bat') -Force`,
                                ``,
                                `Write-Host ''`,
                                `Write-Host '=====================================================' -ForegroundColor Green`,
                                `Write-Host '  SUCCESS! Agent installed.' -ForegroundColor Green`,
                                `Write-Host '  Opening agent window now...' -ForegroundColor Green`,
                                `Write-Host '=====================================================' -ForegroundColor Green`,
                                `Write-Host ''`,
                                `Write-Host '  Auto-starts on every Windows login.' -ForegroundColor Gray`,
                                `Write-Host '  To stop: close the Repnex Agent window.' -ForegroundColor Gray`,
                                `Write-Host '  To uninstall: delete start-repnex-agent.bat from shell:startup' -ForegroundColor Gray`,
                                `Write-Host ''`,
                                `Start-Process cmd -ArgumentList @('/k', $launcherPath)`,
                                `Read-Host 'Done! Press Enter to close this setup window'`,
                              ].join('\r\n');

                              // Encode as UTF-16LE base64 (PowerShell -EncodedCommand format)
                              // This produces a clean .bat with NO special-char issues — works on all Windows
                              function toUtf16LeBase64(str) {
                                const bytes = [];
                                for (let i = 0; i < str.length; i++) {
                                  const code = str.charCodeAt(i);
                                  bytes.push(code & 0xff);
                                  bytes.push((code >> 8) & 0xff);
                                }
                                let binary = '';
                                for (let i = 0; i < bytes.length; i++) {
                                  binary += String.fromCharCode(bytes[i]);
                                }
                                return btoa(binary);
                              }

                              const encoded = toUtf16LeBase64(ps1);
                              // No admin needed — Startup Folder works under current user
                              const batContent = [
                                '@echo off',
                                'set "REPNEX_DIR=%~dp0"',
                                `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
                              ].join('\r\n');

                              const blob = new Blob([batContent], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url; a.download = 'repnex-setup.bat'; a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-sm font-medium transition-colors"
                          >
                            <MonitorDown className="w-4 h-4 text-blue-500" />
                            Windows Setup (.bat)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const token = agentToken || 'YOUR_AGENT_TOKEN';
                              const port = localDbPort || (selectedType === 'postgres' ? '5432' : '1433');
                              const serverHttp = getWsServerUrl().replace('wss://', 'https://').replace('ws://', 'http://');
                              const serverWs = getWsServerUrl();
                              const shLines = [
                                '#!/bin/bash',
                                'set -e',
                                'echo ""',
                                'echo "  Repnex Gateway Agent - Linux/Mac Setup"',
                                'echo "======================================================"',
                                'echo ""',
                                '',
                                '# Find Python 3',
                                'PY=""',
                                'for cmd in python3 python; do',
                                '  if command -v "$cmd" &>/dev/null && "$cmd" --version 2>&1 | grep -q "Python 3"; then',
                                '    PY="$cmd"; echo "Found: $($cmd --version)"; break',
                                '  fi',
                                'done',
                                '',
                                'if [ -z "$PY" ]; then',
                                '  echo "Python 3 not found. Installing..."',
                                '  if command -v apt-get &>/dev/null; then',
                                '    sudo apt-get update -y && sudo apt-get install -y python3 python3-pip && PY=python3',
                                '  elif command -v yum &>/dev/null; then',
                                '    sudo yum install -y python3 python3-pip && PY=python3',
                                '  elif command -v brew &>/dev/null; then',
                                '    brew install python3 && PY=python3',
                                '  else',
                                '    echo "Cannot auto-install Python. Visit: https://python.org/downloads"; exit 1',
                                '  fi',
                                'fi',
                                '',
                                '$PY -m pip --version &>/dev/null || $PY -m ensurepip --upgrade 2>/dev/null || curl -sS https://bootstrap.pypa.io/get-pip.py | $PY',
                                '',
                                'echo "Installing Python dependencies..."',
                                '$PY -m pip install websockets pymssql asyncpg --quiet',
                                '',
                                'DIR="$(cd "$(dirname "$0")" && pwd)"',
                                'echo ""',
                                'if [ -f "$DIR/repnex_backend_complete/repnex-agent.py" ]; then',
                                '  cp "$DIR/repnex_backend_complete/repnex-agent.py" "$DIR/repnex-agent.py"',
                                '  echo "Using local development agent from repnex_backend_complete."',
                                'else',
                                '  echo "Downloading repnex-agent.py..."',
                                `  curl -fsSL "${serverHttp}/v1/agent/download" -o "$DIR/repnex-agent.py"`,
                                'fi',
                                '',
                                'echo ""',
                                'echo "Registering as auto-start service..."',
                                `$PY "$DIR/repnex-agent.py" --install-service \\`,
                                `  --server "${serverWs}" \\`,
                                `  --token "${token}" \\`,
                                `  --agent-name "${agentName}" \\`,
                                `  --db-type "${selectedType}" \\`,
                                `  --db-host "${localDbHost}" \\`,
                                `  --db-port "${port}" \\`,
                                `  --db-user "${localDbUser}" \\`,
                                `  --db-password "${localDbPassword}"`,
                                '',
                                'echo ""',
                                'echo "SUCCESS! Agent running and auto-starts on reboot."',
                              ];
                              const content = shLines.join('\n');
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url; a.download = 'repnex-setup.sh'; a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4 text-emerald-500" />
                            Linux/Mac Setup (.sh)
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          ⬆️ Download the installer on your database laptop, double-click (Windows) or run <code className="bg-black/10 dark:bg-white/10 px-1 rounded">bash repnex-setup.sh</code> (Linux). It installs Python deps and registers the agent as a background service that auto-starts on reboot.
                        </p>

                        {/* Manual CLI fallback */}
                        <details className="group">
                          <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                            <Terminal className="w-3 h-3" /> Advanced: manual command
                          </summary>
                          <div className="mt-2 relative bg-[#111] text-zinc-300 p-3 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-white/5">
                            <pre className="whitespace-pre-wrap select-all">
                              {`python3 repnex-agent.py --server "${getWsServerUrl()}" --token "${agentToken || 'YOUR_AGENT_TOKEN'}" --agent-name "${agentName}" --db-type "${selectedType}" --db-host "${localDbHost}" --db-port "${localDbPort}" --db-user "${localDbUser}" --db-password "${localDbPassword}"`}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                const cmd = `python3 repnex-agent.py --server "${getWsServerUrl()}" --token "${agentToken || ''}" --agent-name "${agentName}" --db-type "${selectedType}" --db-host "${localDbHost}" --db-port "${localDbPort}" --db-user "${localDbUser}" --db-password "${localDbPassword}"`;
                                navigator.clipboard.writeText(cmd);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="absolute top-2.5 right-2.5 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-all"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </details>
                      </div>
                    </motion.div>
                  ) : inputMode === 'string' ? (
                    <motion.div key="str" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Connection String</label>
                      <textarea
                        value={formData.connectionString}
                        onChange={e => setFormData(prev => ({ ...prev, connectionString: e.target.value }))}
                        rows={5}
                        placeholder={`ADO.NET (SQL Server / SysPro):\nServer=myhost,1433;Database=mydb;User Id=sa;Password=mypass;\n\nOr SQLAlchemy URL:\nmssql+pyodbc://sa:mypass@myhost:1433/mydb\npostgresql://user:pass@host:5432/db`}
                        className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors font-mono text-xs resize-none leading-relaxed placeholder:text-muted-foreground/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Supports ADO.NET (<code className="font-mono">Server=…;Database=…;User Id=…;Password=…</code>) and SQLAlchemy URLs.
                        Host, port, database and credentials are parsed automatically.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key="fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Host / Server</label>
                          <input
                            type="text"
                            value={formData.host}
                            onChange={e => setFormData(prev => ({ ...prev, host: e.target.value }))}
                            placeholder="192.168.1.10 or hostname"
                            className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Port</label>
                          <input
                            type="text"
                            value={formData.port}
                            onChange={e => setFormData(prev => ({ ...prev, port: e.target.value }))}
                            placeholder={defaultPorts[selectedType]}
                            className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Username</label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="sa"
                            className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Password</label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* ── Fetch Databases button ─────────────────────────── */}
                      <button
                        type="button"
                        onClick={handleFetchDatabases}
                        disabled={isFetchingDbs || !formData.host || !formData.username || !formData.password}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-primary/40 hover:border-primary/80 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isFetchingDbs ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Database className="w-4 h-4" />
                        )}
                        {isFetchingDbs ? 'Connecting to server…' : 'Fetch Databases'}
                      </button>

                      {/* ── Fetch error ────────────────────────────────────── */}
                      <AnimatePresence>
                        {fetchDbError && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {fetchDbError}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Database dropdown (appears after fetch) ────────── */}
                      <AnimatePresence>
                        {availableDbs.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                              Select Database
                              <span className="ml-2 text-xs text-muted-foreground font-normal">({availableDbs.length} found)</span>
                            </label>
                            <select
                              value={formData.database}
                              onChange={e => {
                                setFormData(prev => ({ ...prev, database: e.target.value }));
                                setTestResult(null);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                            >
                              <option value="">— choose a database —</option>
                              {availableDbs.map(db => (
                                <option key={db} value={db}>{db}</option>
                              ))}
                            </select>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Test Result */}
                <AnimatePresence>
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-xl flex items-center gap-3 ${
                        testResult.success 
                          ? 'bg-emerald-500/10 border border-emerald-500/20' 
                          : 'bg-rose-500/10 border border-rose-500/20'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                      )}
                      <div>
                        <p className={`font-medium ${testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {testResult.message}
                        </p>
                        {testResult.latency && (
                          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                            Latency: {testResult.latency}ms
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="flex flex-col gap-3 p-5 border-t border-border/50 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
            {/* Gateway offline warning */}
            {connectionMode === 'gateway' && agentName.trim() && !agentOnline && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold">Agent '{agentName}' is offline.</span> Run the command below on your database laptop first, then test.
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              {(connectionMode === 'gateway' || inputMode === 'fields') && (
                <button
                  onClick={handleTest}
                  disabled={isTesting || (
                    connectionMode === 'gateway'
                      ? (!agentName.trim() || !formData.database || !agentOnline)
                      : (!formData.host || !formData.database)
                  )}
                  title={connectionMode === 'gateway' && !agentOnline ? 'Start the agent on your database laptop first' : ''}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {connectionMode === 'gateway' && !agentOnline ? 'Agent Offline' : 'Test Connection'}
                </button>
              )}
              <button
                onClick={handleAdd}
                disabled={isAdding || !formData.name || (
                  connectionMode === 'gateway'
                    ? (!testResult?.ok)
                    : (inputMode === 'fields' ? (!testResult?.ok) : !formData.connectionString.trim())
                )}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-600/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {inputMode === 'string' ? 'Save Connection' : 'Add Connection'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function DatabaseConnections() {
  const { connections, addConnection, removeConnection, syncConnection, syncSchema, generateAdapters, user, isLoadingConnections } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  const handleSync = async (connectionId) => {
    setSyncingId(connectionId);
    await syncConnection(connectionId);
    setSyncingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Database className="w-7 h-7 text-primary" />
              Database Connections
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your ERP and SQL databases to generate AI-powered reports
            </p>
          </div>
          {!isViewer && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              Add Connection
            </button>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Secure Connection</h3>
              <p className="text-xs text-muted-foreground">All credentials are encrypted and never stored in plain text</p>
            </div>
          </div>
          <div className="bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Read-Only Access</h3>
              <p className="text-xs text-muted-foreground">We only read data - no modifications to your database</p>
            </div>
          </div>
          <div className="bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Real-time Sync</h3>
              <p className="text-xs text-muted-foreground">Data is fetched in real-time for up-to-date reports</p>
            </div>
          </div>
        </div>

        {/* Connections Grid */}
        <SmartSkeleton loading={isLoadingConnections}>
          {isLoadingConnections ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 h-14" />
                    <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 h-14" />
                    <div className="bg-black/5 dark:bg-white/5 rounded-lg p-3 h-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : connections.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 dark:border-white/10 rounded-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No connections yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Connect your first database to start generating AI-powered reports and analytics
              </p>
              {!isViewer && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Connection
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {connections.map(connection => (
                  <ConnectionCard
                     key={connection.id}
                     connection={connection}
                     onSync={handleSync}
                     onSyncSchema={syncSchema}
                     onGenerateAdapters={generateAdapters}
                     onDelete={removeConnection}
                     isAdmin={isAdmin}
                     isViewer={isViewer}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </SmartSkeleton>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AddConnectionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAdd={addConnection}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
