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
      <div className="workspace-canvas flex flex-1 flex-col items-center justify-center p-6 text-foreground">
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
    <div className="workspace-canvas flex h-full flex-1 flex-col overflow-hidden text-foreground">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-background/82 p-4 backdrop-blur-xl md:px-8 md:py-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/connections')}
            className="app-card flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground"
            title="Back to Connections"
            aria-label="Back to connections"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-heading flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                <Database className="w-5 h-5 text-primary" />
                Schema Explorer
              </h1>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                {connection.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
                {connection.database} · {connection.type.toUpperCase()} · {tables.length} tables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/8 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/12 disabled:opacity-50 sm:px-4"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync schema'}</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="app-card flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            aria-label={isFullscreen ? "Exit fullscreen view" : "Open fullscreen view"}
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
              className="hidden h-full shrink-0 flex-col overflow-hidden border-r border-border/60 bg-card/45 md:flex"
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
                    Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl">
                        <div className="flex items-center gap-2.5 w-full">
                          <span className="text-base shrink-0">📋</span>
                          <div className="h-4 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    ))
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
        <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-background/35">
          {selectedTable ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Table Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 bg-card/45 p-4 md:p-6">
                <div>
                  <div className="mb-3 md:hidden">
                    <label htmlFor="mobile-table-select" className="meta-label mb-1.5 block">Table</label>
                    <select
                      id="mobile-table-select"
                      value={selectedTable}
                      onChange={(event) => handleTableSelect(event.target.value)}
                      className="h-10 max-w-[75vw] rounded-xl border border-border/70 bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary/50"
                    >
                      {filteredTables.map((table) => (
                        <option key={table.name} value={table.name}>{table.name}</option>
                      ))}
                    </select>
                  </div>
                  <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                    <span>📋</span>
                    {selectedTable}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Column names, data types, and field details
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAskAI(selectedTable)}
                    className="brand-gradient flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 sm:px-4"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ask AI about table</span>
                    <span className="sm:hidden">Ask AI</span>
                  </button>
                </div>
              </div>

              {/* Columns Table */}
              <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
                {loadingColumns ? (
                    <div className="data-table-shell w-full">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/50 dark:border-white/5 bg-black/5 dark:bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <th className="px-6 py-4">Column Name</th>
                            <th className="px-6 py-4">Data Type</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 dark:divide-white/5 text-sm">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4">
                                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                              </td>
                              <td className="px-6 py-4">
                                <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="h-6 bg-muted rounded w-12 ml-auto animate-pulse" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
