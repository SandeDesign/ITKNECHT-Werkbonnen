import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import InstallGuide from './pages/InstallGuide';
import WeeklyHours from './pages/WeeklyHours';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { loaded } = useAuth();

  if (!loaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-primary-600 dark:text-primary-400">
          <div className="h-8 w-8 rounded-full border-4 border-current border-r-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/install-guide" element={<InstallGuide />} />
      <Route path="/dashboard/weekly-hours" element={<WeeklyHours />} />
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;