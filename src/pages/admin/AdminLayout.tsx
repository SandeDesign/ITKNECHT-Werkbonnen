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
      name: 'Gebruikers', 
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
      {/* Admin Navigation Cards - Only show on main admin page */}
      {currentPath === '/dashboard/admin' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {adminNavigation.slice(1).map((nav, index) => (
            <motion.div
              key={nav.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={nav.href}>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:shadow-md group">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                      <nav.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {nav.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

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