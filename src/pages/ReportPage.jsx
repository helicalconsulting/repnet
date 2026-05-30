import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import ReportBuilder from '../components/ReportBuilder';
import RightPanel from '../components/RightPanel';
import { reportApi } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ReportPage() {
  const { id } = useParams();          // /report/:id  → from list page
  const location = useLocation();
  const navigate = useNavigate();
  const { activeConnection, connections } = useApp();

  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [reportData, setReportData] = useState(location.state?.data || null);
  const [query, setQuery] = useState(location.state?.query || 'Database Analytics');
  const [loading, setLoading] = useState(!!id && !location.state?.data);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id && id !== 'new' && !location.state?.data) {
      setLoading(true);
      reportApi.getReport(id)
        .then(async (config) => {
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-rose-500" />
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/report')}
            className="text-sm text-primary hover:underline font-medium"
          >
            ← Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex w-full h-full relative overflow-hidden bg-background">
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        <ReportBuilder
          query={query}
          reportData={reportData}
          onClose={() => navigate('/report')}
          onToggleInsights={() => setIsRightPanelOpen(prev => !prev)}
        />
      </div>

      <RightPanel
        isOpen={isRightPanelOpen}
        onClose={() => setIsRightPanelOpen(false)}
      />
    </div>
  );
}
