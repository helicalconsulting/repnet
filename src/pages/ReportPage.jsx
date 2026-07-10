import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  CalendarClock,
  History,
  BarChart3,
  ChevronLeft,
} from 'lucide-react';
import ReportBuilder from '../components/ReportBuilder';
import ScheduleModal from '../components/ScheduleModal';
import SnapshotHistory from '../components/SnapshotHistory';
import { reportApi, databaseApi } from '../services/api';
import { useApp } from '../context/AppContext';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'report', label: 'Report', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
];

export default function ReportPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeConnection, connections, user } = useApp();
  const isViewer = user?.role === 'viewer';

  const [reportConfig, setReportConfig] = useState(null);  // raw config from API
  const [reportData, setReportData] = useState(location.state?.data || null);
  const [query, setQuery] = useState(location.state?.query || 'Database Analytics');
  const [loading, setLoading] = useState(!!id && !location.state?.data);
  const [error, setError] = useState(null);

  // Active tab: 'report' | 'history'
  const [activeTab, setActiveTab] = useState('report');

  // Schedule modal
  const [showSchedule, setShowSchedule] = useState(false);

  // Manual refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [connections2, setConnections2] = useState([]);

  // Sync state if location.state changes
  useEffect(() => {
    if (location.state?.data) setReportData(location.state.data);
    if (location.state?.query) setQuery(location.state.query);
  }, [location.state]);

  // Load report + run it
  useEffect(() => {
    if (id && id !== 'new' && !location.state?.data) {
      setLoading(true);
      reportApi.getReport(id)
        .then(async (config) => {
          setReportConfig(config);
          try {
            const connId = activeConnection || (connections && connections[0]?.id);
            if (connId) {
              const runResult = await reportApi.runReport(id, connId);
              setReportData({
                ...config,
                rows: runResult.rows,
                sql: config.sql || runResult.sql,
              });
            } else {
              setReportData(config);
            }
          } catch (runErr) {
            console.error('Failed to run report:', runErr);
            setReportData(config);
          }
          setQuery(config.name || 'Report');
        })
        .catch(err => setError(err.message || 'Could not load report'))
        .finally(() => setLoading(false));
    }
  }, [id, location.state?.data, activeConnection, connections]);

  // Load connections for manual refresh / schedule
  useEffect(() => {
    databaseApi.getConnections().then(setConnections2).catch(() => {});
  }, []);

  const connId = activeConnection || connections?.[0]?.id || connections2?.[0]?.id;

  const handleManualRefresh = async () => {
    if (isViewer) return;
    if (!connId || !id) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const snap = await reportApi.refreshReport(id, connId);
      // Update the displayed data with the fresh snapshot rows
      setReportData((prev) => ({
        ...prev,
        rows: snap.rows_data,
      }));
    } catch (err) {
      setRefreshError(err.message || 'Refresh failed');
      setTimeout(() => setRefreshError(null), 4000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleScheduleSaved = (updatedReport) => {
    setReportConfig(updatedReport);
    setShowSchedule(false);
  };

  const handleBack = () => {
    const fromChat = location.state?.fromChat;
    const sessionId = location.state?.sessionId;
    if (fromChat) {
      navigate(sessionId ? `/chat/${sessionId}` : '/chat');
    } else {
      navigate('/report');
    }
  };

  const mockReportData = {
    id: 'loading-id',
    title: 'Loading Report...',
    chartType: 'bar',
    columns: ['Category', 'Value A', 'Value B'],
    rows: [
      { Category: 'Category 1', 'Value A': 100, 'Value B': 200 },
      { Category: 'Category 2', 'Value A': 150, 'Value B': 250 },
      { Category: 'Category 3', 'Value A': 120, 'Value B': 220 },
      { Category: 'Category 4', 'Value A': 180, 'Value B': 280 },
    ]
  };

  // ── Error states ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-rose-500" />
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={handleBack}
            className="text-sm text-primary hover:underline font-medium"
          >
            {location.state?.fromChat ? '← Back to Chat' : '← Back to Reports'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <SmartSkeleton loading={loading}>
      {loading ? (
        <div className="flex-1 flex flex-col w-full h-full bg-background overflow-hidden">
          {/* Top Bar Skeleton */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur z-10 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground/45">
                <ChevronLeft className="w-4 h-4 text-muted-foreground/30" />
                <span className="h-4 bg-muted/65 rounded w-12 animate-pulse" />
              </div>
              <div className="flex items-center bg-muted/20 rounded-xl p-1 gap-0.5">
                <div className="h-7 bg-muted rounded-lg w-16 animate-pulse" />
                <div className="h-7 bg-muted/40 rounded-lg w-16 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 bg-muted rounded-xl w-20 sm:w-24 animate-pulse" />
              <div className="h-8 bg-muted rounded-xl w-24 sm:w-28 animate-pulse" />
            </div>
          </div>

          {/* Main Content Area Skeleton */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6 custom-scrollbar bg-background">
            
            {/* Header Title Card Skeleton */}
            <div className="min-h-16 bg-card/30 border border-border/50 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 pr-4">
                <span className="w-2 h-2 rounded-full bg-blue-500/40 shrink-0 animate-pulse"></span>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-2/3 max-w-sm animate-pulse" />
                  <div className="h-3 bg-muted/60 rounded w-1/3 max-w-xs animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 bg-muted rounded-lg w-16 animate-pulse hidden sm:block" />
                <div className="h-8 bg-muted rounded-lg w-16 animate-pulse hidden sm:block" />
                <div className="h-8 bg-muted rounded-lg w-8 animate-pulse hidden sm:block" />
                <div className="h-8 bg-muted rounded-lg w-20 animate-pulse" />
              </div>
            </div>

            {/* KPI Cards Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="h-4 bg-muted/70 rounded w-24 animate-pulse" />
                  <div className="flex justify-between items-end">
                    <div className="h-7 bg-muted rounded w-16 animate-pulse" />
                    <div className="h-5 bg-muted/50 rounded-full w-12 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Customization Control Bar Skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="h-8 bg-muted rounded-lg w-32 animate-pulse" />
                <div className="h-8 bg-muted rounded-lg w-20 animate-pulse" />
                <div className="h-8 bg-muted rounded-lg w-24 animate-pulse" />
              </div>
              <div className="h-8 bg-muted rounded-lg w-28 animate-pulse" />
            </div>

            {/* Visualization Area Skeleton */}
            <div className="bg-card/40 border border-border/50 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 min-h-[350px] sm:min-h-[420px]">
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <div className="h-5 bg-muted rounded w-28 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted/65 rounded w-16 animate-pulse" />
                  <div className="h-6 bg-muted/65 rounded w-24 animate-pulse" />
                </div>
              </div>
              {/* Pulsing visual chart simulator */}
              <div className="flex-1 flex items-end justify-around gap-2 px-2 sm:px-6 pt-10 min-h-[220px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-muted/70 rounded-t-lg w-4 sm:w-8 animate-pulse" 
                    style={{ height: `${Math.max(15, Math.floor(Math.random() * 80))}%` }} 
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col w-full h-full bg-background overflow-hidden">
          {/* ── Top action bar (only for saved reports) ─────────────────────── */}
          {id && id !== 'new' && (
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur z-10 flex-shrink-0">
              {/* Left: back + tabs */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {location.state?.fromChat ? 'Back to Chat' : 'Reports'}
                </button>
                <div className="flex items-center bg-muted/40 rounded-xl p-1 gap-0.5">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: actions */}
              {!isViewer && (
                <div className="flex items-center gap-2">
                  {/* Schedule badge/info */}
                  {reportConfig?.refresh_interval_days > 0 && (
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 border border-primary/20 rounded-xl text-xs text-primary font-medium">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {reportConfig.refresh_interval_days === 1 ? 'Daily' : `Every ${reportConfig.refresh_interval_days}d`}
                    </div>
                  )}

                  {/* Schedule button */}
                  <button
                    onClick={() => setShowSchedule(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      reportConfig?.refresh_interval_days > 0
                        ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    Schedule
                  </button>

                  {/* Refresh Now */}
                  <button
                    onClick={handleManualRefresh}
                    disabled={refreshing || !connId}
                    title={!connId ? 'No database connection available' : 'Refresh data now and save snapshot'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      refreshError
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshError ? 'Failed' : refreshing ? 'Refreshing…' : 'Refresh Now'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Tab content ──────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden relative">
            {/* Report tab */}
            {activeTab === 'report' && (
              <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative w-full absolute inset-0">
                <ReportBuilder
                  query={query}
                  reportData={loading ? mockReportData : reportData}
                  onClose={handleBack}
                />
              </div>
            )}

            {/* History tab */}
            {activeTab === 'history' && id && id !== 'new' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full overflow-y-auto p-6 custom-scrollbar"
              >
                <div className="max-w-2xl mx-auto">
                  <SnapshotHistory
                    report={reportConfig || { id }}
                    connections={connections2}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Schedule Modal */}
          {showSchedule && (reportConfig || id) && (
            <ScheduleModal
              report={reportConfig || { id, name: query }}
              onClose={() => setShowSchedule(false)}
              onSaved={handleScheduleSaved}
            />
          )}
        </div>
      )}
    </SmartSkeleton>
  );
}
