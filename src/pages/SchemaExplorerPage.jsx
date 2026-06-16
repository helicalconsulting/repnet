import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Search, 
  Database, 
  RefreshCw, 
  Loader2, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchemaExplorerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { connections, getTables, getTableColumns, syncSchema } = useApp();
  
  const connection = connections.find(c => c.id === id);

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  
  const [columns, setColumns] = useState([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedCol, setCopiedCol] = useState(null);

  const loadTablesList = async () => {
    if (!id) return;
    setLoadingTables(true);
    try {
      const data = await getTables(id);
      setTables(data || []);
      // Auto-select first table if any
      if (data && data.length > 0 && !selectedTable) {
        handleTableSelect(data[0].name);
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    if (connection) {
      loadTablesList();
    }
  }, [id, connection?.tables_count]);

  const handleTableSelect = async (tableName) => {
    setSelectedTable(tableName);
    setLoadingColumns(true);
    try {
      const cols = await getTableColumns(id, tableName);
      setColumns(cols || []);
    } catch (err) {
      console.error("Failed to load columns for table:", tableName, err);
      setColumns([]);
    } finally {
      setLoadingColumns(false);
    }
  };

  const handleSync = async () => {
    if (!id) return;
    setIsSyncing(true);
    try {
      await syncSchema(id);
      await loadTablesList();
    } catch (err) {
      console.error("Failed to sync schema:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopy = (text, colName) => {
    navigator.clipboard.writeText(text);
    setCopiedCol(colName);
    setTimeout(() => setCopiedCol(null), 2000);
  };

  const handleAskAI = (tableName) => {
    navigate('/chat', { state: { initialPrompt: `Describe the schema and show me top 5 rows of table ${tableName}` } });
  };

  if (!connection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-foreground bg-background">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Connection not found</h2>
        <button 
          onClick={() => navigate('/connections')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Back to Connections
        </button>
      </div>
    );
  }

  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-border/50 dark:border-white/5 p-4 md:px-8 md:py-5 flex flex-wrap items-center justify-between gap-4 bg-card/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/connections')}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            title="Back to Connections"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Schema Explorer
              </h1>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                {connection.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {connection.database} • {connection.type.toUpperCase()} • {tables.length} Tables synced
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Schema'}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Table List Panel */}
        <AnimatePresence initial={false}>
          {!isFullscreen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-r border-border/50 dark:border-white/5 bg-card/10 flex flex-col h-full shrink-0 overflow-hidden"
            >
              {/* Search */}
              <div className="p-4 border-b border-border/30 dark:border-white/5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/[0.03] border border-border/50 dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              {/* Table List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {loadingTables ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mb-3 text-primary" />
                    <span className="text-sm">Loading database tables...</span>
                  </div>
                ) : filteredTables.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No matching tables found.
                  </div>
                ) : (
                  filteredTables.map((t) => {
                    const isSelected = selectedTable === t.name;
                    return (
                      <button
                        key={t.name}
                        onClick={() => handleTableSelect(t.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left relative group ${
                          isSelected 
                            ? 'bg-primary/10 text-primary font-semibold' 
                            : 'hover:bg-black/5 dark:hover:bg-white/[0.02] text-foreground/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">📋</span>
                          <span className="truncate text-sm" title={t.name}>{t.name}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected ? 'bg-primary/20 text-primary' : 'bg-black/10 dark:bg-white/5 text-muted-foreground'
                        }`}>
                          {t.columns_count} cols
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Columns Grid Panel */}
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
          {selectedTable ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Table Header Info */}
              <div className="p-4 md:p-6 border-b border-border/30 dark:border-white/5 flex flex-wrap justify-between items-center gap-4 bg-card/10">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                    <span>📋</span>
                    {selectedTable}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Detailed schema structure mapping and column details
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAskAI(selectedTable)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/95 hover:to-blue-600/95 text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ask AI to Describe Table
                  </button>
                </div>
              </div>

              {/* Columns Table */}
              <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
                {loadingColumns ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
                    <span className="text-sm">Fetching column structures...</span>
                  </div>
                ) : columns.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                    <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-3" />
                    <span className="text-sm">No column mapping found. Sync schema to fetch columns.</span>
                  </div>
                ) : (
                  <div className="w-full border border-border/50 dark:border-white/5 rounded-2xl overflow-hidden bg-card/20 backdrop-blur-md">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 dark:border-white/5 bg-black/5 dark:bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <th className="px-6 py-4">Column Name</th>
                          <th className="px-6 py-4">Data Type</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 dark:divide-white/5 text-sm">
                        {columns.map((col) => (
                          <tr 
                            key={col.name} 
                            className="hover:bg-black/5 dark:hover:bg-white/[0.01] transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-foreground/90">
                              <span className="flex items-center gap-2">
                                <span className="text-muted-foreground/60 text-xs font-mono">#</span>
                                {col.name}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-black/10 dark:bg-white/5 border border-border/50 dark:border-white/5 rounded text-xs font-mono uppercase text-muted-foreground">
                                {col.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleCopy(col.name, col.name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                                title="Copy column name"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                {copiedCol === col.name ? 'Copied' : 'Copy'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="w-16 h-16 rounded-2xl bg-card border border-border/50 dark:border-white/5 flex items-center justify-center mb-4 shadow-lg">
                <Database className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Select a table</h3>
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Choose a table from the sidebar list to explore its database column specifications.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
