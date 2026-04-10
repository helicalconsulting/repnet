import { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { useApp } from "../context/AppContext";

const dbTypes = [
  { id: "postgresql", name: "PostgreSQL", icon: "🐘", color: "#336791" },
  { id: "mysql", name: "MySQL", icon: "🐬", color: "#4479A1" },
  { id: "sqlserver", name: "SQL Server", icon: "🔷", color: "#CC2927" },
  { id: "oracle", name: "Oracle", icon: "🔴", color: "#F80000" },
  { id: "sqlite", name: "SQLite", icon: "🪶", color: "#003B57" },
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
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const { testConnection } = useApp();

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testConnection({ ...formData, type: selectedType });
    setTestResult(result);
    setIsTesting(false);
  };

  const handleAdd = async () => {
    setIsAdding(true);
    await onAdd({ ...formData, type: selectedType });
    setIsAdding(false);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedType(null);
    setFormData({ name: '', host: '', port: '', database: '', username: '', password: '' });
    setTestResult(null);
  };

  const defaultPorts = {
    postgresql: '5432',
    mysql: '3306',
    sqlserver: '1433',
    oracle: '1521',
    sqlite: ''
  };

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

                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl mb-4">
                  <span className="text-2xl">{dbTypes.find(d => d.id === selectedType)?.icon}</span>
                  <div>
                    <p className="font-medium">{dbTypes.find(d => d.id === selectedType)?.name}</p>
                    <p className="text-xs text-muted-foreground">Enter your connection details below</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Connection Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Production Database"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Host</label>
                      <input
                        type="text"
                        value={formData.host}
                        onChange={e => setFormData(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="localhost or IP"
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

                  <div>
                    <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Database Name</label>
                    <input
                      type="text"
                      value={formData.database}
                      onChange={e => setFormData(prev => ({ ...prev, database: e.target.value }))}
                      placeholder="your_database"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="db_user"
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
                </div>

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
          <div className="flex items-center gap-3 p-5 border-t border-border/50 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
            <button
              onClick={handleTest}
              disabled={isTesting || !formData.host || !formData.database}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Test Connection
            </button>
            <button
              onClick={handleAdd}
              disabled={isAdding || !testResult?.success}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Connection
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function DatabaseConnections() {
  const { connections, addConnection, removeConnection } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const handleSync = async (connectionId) => {
    setSyncingId(connectionId);
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
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
