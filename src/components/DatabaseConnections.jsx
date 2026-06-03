import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldAlert
} from "lucide-react";
import { useApp } from "../context/AppContext";

const dbTypes = [
  { id: "postgres", name: "PostgreSQL", icon: "🐘", color: "#336791", port: "5432" },
  { id: "mysql", name: "MySQL", icon: "🐬", color: "#4479A1", port: "3306" },
  { id: "mssql", name: "SQL Server / Syspro", icon: "🔷", color: "#CC2927", port: "1433" },
  { id: "oracle", name: "Oracle", icon: "🔴", color: "#F80000", port: "1521" },
  { id: "cloudsql", name: "Cloud SQL", icon: "☁️", color: "#4285F4", port: "5432" },
];

function ConnectionCard({ connection, onSync, onDelete }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await onSync(connection.id);
    setIsSyncing(false);
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

      <div className="flex items-center gap-2 pt-3 border-t border-border/50 dark:border-white/5">
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
        <button className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(connection.id)}
          className="p-2 hover:bg-rose-500/10 rounded-lg text-muted-foreground hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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

  const getWsServerUrl = () => {
    const apiBase = import.meta.env.VITE_API_BASE || 'https://repnex-backend.onrender.com/v1';
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
        db_type: selectedType || 'mssql',
        connection_string: formData.connectionString,
        host: '',
        port: 0,
        db_name: '',
        username: '',
        password: '',
        ssl_enabled: false,
      };
    } else {
      payload = {
        name: formData.name || 'Test Connection',
        db_type: selectedType,
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
        db_type: selectedType || 'mssql',
        connection_string: formData.connectionString,
        host: '',
        port: 0,
        db_name: '',
        username: '',
        password: '',
        ssl_enabled: false,
      };
    } else {
      payload = {
        name: formData.name,
        db_type: selectedType,
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
                      setFormData(prev => ({ ...prev, port: defaultPorts[db.id] }));
                      setStep(2);
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border/50 dark:border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <span className="text-3xl">{db.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{db.name}</p>
                      <p className="text-xs text-muted-foreground">Click to connect</p>
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
                  <div>
                    <p className="font-medium">{dbTypes.find(d => d.id === selectedType)?.name}</p>
                    <p className="text-xs text-muted-foreground">Enter your connection details below</p>
                  </div>
                </div>

                {/* Connection Mode toggle */}
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

                {/* Sub-mode toggle for Direct Mode */}
                {connectionMode === 'direct' && (
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

                      {/* Instructions & CLI Command Block */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80 block">Run Agent on Database Laptop</label>
                        <div className="relative group bg-[#111] text-zinc-300 p-3 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-white/5">
                          <pre className="whitespace-pre-wrap select-all">
                            {`python3 repnex-agent.py --server "${getWsServerUrl()}" --token "${localStorage.getItem('repnex-auth-token') || 'YOUR_JWT_TOKEN'}" --agent-name "${agentName}" --db-type "${selectedType}" --db-host "${localDbHost}" --db-port "${localDbPort}" --db-user "${localDbUser}" --db-password "${localDbPassword}"`}
                          </pre>
                          <button
                            type="button"
                            onClick={() => {
                              const cmd = `python3 repnex-agent.py --server "${getWsServerUrl()}" --token "${localStorage.getItem('repnex-auth-token') || ''}" --agent-name "${agentName}" --db-type "${selectedType}" --db-host "${localDbHost}" --db-port "${localDbPort}" --db-user "${localDbUser}" --db-password "${localDbPassword}"`;
                              navigator.clipboard.writeText(cmd);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-all"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal flex items-start gap-1">
                          <Terminal className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>Run this command on your database laptop to tunnel connections without exposing any ports.</span>
                        </p>
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
  const { connections, addConnection, removeConnection, syncConnection } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Add Connection
          </button>
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
        {connections.length === 0 ? (
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Connection
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {connections.map(connection => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onSync={handleSync}
                  onDelete={removeConnection}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
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
