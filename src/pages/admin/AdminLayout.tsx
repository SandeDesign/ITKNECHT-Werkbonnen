import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  Users,
  ChevronRight,
  Home,
  CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminDashboard from './AdminDashboard';
import WorkOrderManagement from './WorkOrderManagement';
import StatisticsPanel from './StatisticsPanel';
import UserManagement from './UserManagement';
import AdminTasks from './AdminTasks';

const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const adminNavigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard/admin', 
      icon: LayoutDashboard,
    },
    { 
      name: 'Werkbonnen', 
      href: '/dashboard/admin/werkbonnen', 
      icon: ClipboardList,
    },
    { 
      name: 'Statistieken', 
      href: '/dashboard/admin/statistieken', 
      icon: BarChart3,
    },
    { 
      name: 'Werknemers', 
      href: '/dashboard/admin/gebruikers', 
      icon: Users,
    },
    { 
      name: 'Taken', 
      href: '/dashboard/admin/tasks', 
      icon: CheckSquare,
    }
  ];

  const currentPath = location.pathname;
  const currentNav = adminNavigation.find(nav => 
    currentPath === nav.href || currentPath.startsWith(nav.href + '/')
  );

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Admin Panel', href: '/dashboard/admin' }
    ];

    if (currentNav && currentPath !== '/dashboard/admin') {
      breadcrumbs.push({ name: currentNav.name, href: currentNav.href });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="space-y-6">
      {/* Sub-navigation for specific sections */}
      {currentNav && currentNav.subItems && currentPath !== '/dashboard/admin' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap gap-2">
            {currentNav.subItems.map((subItem) => {
              const isActive = location.pathname + location.search === subItem.href;
              return (
                <Link
                  key={subItem.href}
                  to={subItem.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {subItem.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/werkbonnen" element={<WorkOrderManagement />} />
          <Route path="/statistieken" element={<StatisticsPanel />} />
          <Route path="/gebruikers" element={<UserManagement />} />
          <Route path="/tasks" element={<AdminTasks />} />
          <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminLayout;