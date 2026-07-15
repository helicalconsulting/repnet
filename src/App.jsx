import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import { AppProvider } from './context/AppContext';
import { PersonalizationProvider } from './context/PersonalizationContext';
import { authApi } from './services/api';

import MainLayout from './layouts/MainLayout';
import ChatPage from './pages/ChatPage';
import ReportPage from './pages/ReportPage';
import ReportsListPage from './pages/ReportsListPage';
import DashboardPage from './pages/DashboardPage';
import ConnectionsPage from './pages/ConnectionsPage';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SchemaExplorerPage from './pages/SchemaExplorerPage';


function LoginRoute({ sessionUser, onAuthSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = location.state?.from?.pathname || '/dashboard';

  if (sessionUser) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSuccess = (authenticatedUser) => {
    onAuthSuccess(authenticatedUser);
    navigate(redirectPath, { replace: true });
  };

  return <AuthPage onAuthSuccess={handleSuccess} />;
}

function ProtectedLayout({ sessionUser, onSignOut }) {
  const location = useLocation();

  if (!sessionUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!sessionUser.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppProvider user={sessionUser}>
      <PersonalizationProvider user={sessionUser}>
        <MainLayout user={sessionUser} onSignOut={onSignOut} settingsPage={<SettingsPage user={sessionUser} />} />
      </PersonalizationProvider>
    </AppProvider>
  );
}

function OnboardingRoute({ sessionUser, onOnboardingComplete }) {
  const location = useLocation();

  if (!sessionUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (sessionUser.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingPage user={sessionUser} onComplete={onOnboardingComplete} />;
}

function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const session = await authApi.getSession();
        if (isMounted) {
          setSessionUser(session);
        }
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    setSessionUser(authenticatedUser);
  };

  const handleOnboardingComplete = (authenticatedUser) => {
    setSessionUser(authenticatedUser);
  };

  const handleSignOut = async () => {
    await authApi.signOut();
    setSessionUser(null);
  };

  if (isSessionLoading) {
    return (
      <div className="h-screen w-full bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <LoginRoute
              sessionUser={sessionUser}
              onAuthSuccess={handleAuthSuccess}
            />
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute
              sessionUser={sessionUser}
              onOnboardingComplete={handleOnboardingComplete}
            />
          }
        />
        {/* Invitation accept — public route, no auth required */}
        <Route
          path="/accept-invite"
          element={<AcceptInvitePage onAuthSuccess={handleAuthSuccess} />}
        />
        <Route element={<ProtectedLayout sessionUser={sessionUser} onSignOut={handleSignOut} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/chat/:id?"
            element={
              sessionUser?.role !== 'viewer' ? (
                <ChatPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route path="/report" element={<ReportsListPage />} />
          <Route path="/report/:id" element={<ReportPage />} />
          <Route path="/reports" element={<Navigate to="/report" replace />} />

          <Route
            path="/connections"
            element={
              sessionUser?.role === 'admin' ? (
                <ConnectionsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/connections/:id/schema"
            element={
              sessionUser?.role === 'admin' ? (
                <SchemaExplorerPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route path="/settings" element={<SettingsPage user={sessionUser} />} />
          {/* Fallback for other sidebar items like /saved */}
          <Route path="*" element={
            <div className="flex h-full items-center justify-center text-foreground font-semibold flex-col gap-2">
               <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                 <span className="text-4xl">🚀</span>
               </div>
               <span className="text-xl capitalize">Coming Soon</span>
               <span className="text-sm text-muted-foreground font-normal">This module is under construction</span>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
