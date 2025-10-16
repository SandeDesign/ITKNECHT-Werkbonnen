import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabaseNotifications } from '../contexts/SupabaseNotificationContext';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  ClipboardList,
  Plus,
  Home,
  Calendar as CalendarIcon,
  BarChart3,
  FileText,
  Contact,
  MessageSquare,
  CheckSquare,
  User,
  Crown,
  MoreHorizontal,
  ChevronUp,
  ArrowLeft,
  Shield,
  UserCircle,
  Clock
} from 'lucide-react';
import Button from '../components/ui/Button';
import DashboardHome from './DashboardHome';
import Profile from '../components/dashboard/Profile';
import Overview from '../components/dashboard/Overview';
import Colleagues from './Colleagues';
import UserSettings from '../components/dashboard/UserSettings';
import ColleagueProfile from './ColleagueProfile';
import TutorialOverlay from '../components/TutorialOverlay';
import Resources from './Resources';
import Contacts from './Contacts';
import Feedback from './Feedback';
import Tasks from './Tasks';
import Calendar from './Calendar';
import FeedbackList from '../components/FeedbackList';
import MyStatistics from './MyStatistics';
import AdminLayout from './admin/AdminLayout';
import WebmailModal from '../components/WebmailModal';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import NotificationDebug from '../components/dashboard/NotificationDebug';
import WeeklyHours from './pages/WeeklyHours';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useSupabaseNotifications();
  const navigate = useNavigate();
  const [showWebmailModal, setShowWebmailModal] = useState(false);
  const [webmailUrl, setWebmailUrl] = useState('');
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const isHomePage = location.pathname === '/dashboard' || location.pathname === '/dashboard/admin';

  const baseNavigation = isAdmin ? [
    { name: 'Admin Dashboard', href: '/dashboard/admin', icon: LayoutDashboard, showInNav: true },
    { name: 'Medewerker Dashboard', href: '/dashboard', icon: UserCircle, showInNav: true },
    { name: 'Werkbon aanmaken', href: '/dashboard/create', icon: Plus, showInNav: true },
    { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarIcon, showInNav: true },
    { name: 'Week Uren', href: '/dashboard/weekly-hours', icon: Clock, showInNav: true },
    { name: 'Mijn Statistieken', href: '/dashboard/my-statistics', icon: BarChart3, showInNav: true },
    { name: 'Collega\'s', href: '/dashboard/colleagues', icon: Users, showInNav: true },
    { name: 'Contacten', href: '/dashboard/contacts', icon: Contact, showInNav: true },
    { name: 'Ideeën bus', href: '/dashboard/feedback', icon: MessageSquare, showInNav: true },
    { name: 'Bronnen', href: '/dashboard/resources', icon: FileText, showInNav: true }
  ] : [
    { name: 'Home', href: '/dashboard', icon: Home, showInNav: true },
    { name: 'Werkbon aanmaken', href: '/dashboard/create', icon: Plus, showInNav: true },
    { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarIcon, showInNav: true },
    { name: 'Week Uren', href: '/dashboard/weekly-hours', icon: Clock, showInNav: true },
    { name: 'Mijn Statistieken', href: '/dashboard/my-statistics', icon: BarChart3, showInNav: true },
    { name: 'Collega\'s', href: '/dashboard/colleagues', icon: Users, showInNav: true },
    { name: 'Contacten', href: '/dashboard/contacts', icon: Contact, showInNav: true },
    { name: 'Ideeën bus', href: '/dashboard/feedback', icon: MessageSquare, showInNav: true },
    { name: 'Bronnen', href: '/dashboard/resources', icon: FileText, showInNav: true }
  ];

  const navigation = baseNavigation;

  const mobileMainNav = [
    { 
      name: isAdmin ? 'Admin' : 'Home', 
      href: isAdmin ? '/dashboard/admin' : '/dashboard', 
      icon: isAdmin ? LayoutDashboard : Home 
    },
    { name: 'Werkbon', href: '/dashboard/create', icon: Plus, highlight: true },
    { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarIcon },
    { name: 'Meer', action: 'menu', icon: MoreHorizontal }
  ];

  const mobileMenuItems = isAdmin ? [
    { name: 'Medewerker Dashboard', href: '/dashboard', icon: UserCircle },
    { name: 'Mijn Statistieken', href: '/dashboard/my-statistics', icon: BarChart3 },
    { name: 'Collega\'s', href: '/dashboard/colleagues', icon: Users },
    { name: 'Contacten', href: '/dashboard/contacts', icon: Contact },
    { name: 'Week Uren', href: '/dashboard/weekly-hours', icon: Clock},
    { name: 'Ideeën bus', href: '/dashboard/feedback', icon: MessageSquare },
    { name: 'Bronnen', href: '/dashboard/resources', icon: FileText }
  ] : [
    { name: 'Mijn Statistieken', href: '/dashboard/my-statistics', icon: BarChart3 },
    { name: 'Collega\'s', href: '/dashboard/colleagues', icon: Users },
    { name: 'Contacten', href: '/dashboard/contacts', icon: Contact },
    { name: 'Week Uren', href: '/dashboard/weekly-hours', icon: Clock},
    { name: 'Ideeën bus', href: '/dashboard/feedback', icon: MessageSquare },
    { name: 'Bronnen', href: '/dashboard/resources', icon: FileText }
  ];

  const handleLogout = () => {
    logout();
  };

  const handleWebmailClick = (url: string) => {
    setWebmailUrl(url);
    setShowWebmailModal(true);
  };

  const handleWebmailConfirm = () => {
    window.open(webmailUrl, '_blank');
    setShowWebmailModal(false);
  };

  const isActiveLink = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/dashboard/admin') {
      return location.pathname === '/dashboard/admin' || location.pathname.startsWith('/dashboard/admin/');
    }
    return location.pathname.startsWith(path);
  };

  const handleBackNavigation = () => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/admin') {
      return;
    }
    
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length <= 2) {
      navigate(isAdmin ? '/dashboard/admin' : '/dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* DESKTOP SIDEBAR */}
      <aside 
        className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700" 
        data-tutorial="sidebar"
      >
        <div className="h-full flex flex-col w-full">
          <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src="https://itknecht.nl/wp-content/uploads/2025/01/cropped-cropped-file-1-1-e1736278706265.webp"
                  alt="IT Knecht Logo"
                  className="w-16 h-16 object-contain drop-shadow-lg"
                />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  IT Knecht
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 pt-8 pb-4 px-4 overflow-y-auto">
            <div className="space-y-1">
              {navigation.filter(item => item.showInNav).map((item) => {
                const isActive = isActiveLink(item.href);
                const LinkComponent = item.external ? 'a' : Link;
                const linkProps = item.external ? { 
                  href: '#',
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    handleWebmailClick(item.href);
                  }
                } : { 
                  to: item.href
                };
                
                const isCreateButton = item.name === 'Werkbon aanmaken';
                const isAdminDashboard = item.name === 'Admin Dashboard';
                const isMedewerkerDashboard = item.name === 'Medewerker Dashboard';
                
                return (
                  <LinkComponent
                    key={item.name}
                    {...linkProps}
                    className={`group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isCreateButton
                        ? (isActive 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'bg-purple-500 hover:bg-purple-600 text-white shadow-md hover:shadow-lg'
                          )
                        : isAdminDashboard
                        ? (isActive
                            ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                            : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 border border-orange-200/50 dark:border-orange-800/50'
                          )
                        : isMedewerkerDashboard
                        ? (isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          )
                        : (isActive 
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400'
                          )
                    }`}
                  >
                    <div className={`p-1.5 rounded-md mr-3 ${
                      isCreateButton
                        ? 'bg-white/20'
                        : isAdminDashboard
                        ? (isActive ? 'bg-orange-100 dark:bg-orange-800/50' : 'bg-orange-100/50 dark:bg-orange-800/30')
                        : isMedewerkerDashboard
                        ? (isActive ? 'bg-blue-100 dark:bg-blue-800/50' : 'bg-blue-100/50 dark:bg-blue-800/30')
                        : (isActive 
                            ? 'bg-purple-100 dark:bg-purple-800/50' 
                            : 'bg-transparent'
                          )
                    }`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    
                    <span>{item.name}</span>
                    
                    {isActive && !isCreateButton && !isAdminDashboard && !isMedewerkerDashboard && (
                      <div className="ml-auto w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    )}
                  </LinkComponent>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-gray-200/30 dark:border-gray-700/30 p-4">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center p-3 rounded-lg bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-200/50 dark:border-gray-600/50"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold shadow-sm overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white dark:border-gray-800 rounded-full" />
                </div>
                
                <div className="ml-3 flex-1 min-w-0 text-left">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                      {user?.name || 'User'}
                    </p>
                    
                    {user?.role === 'admin' && (
                      <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded text-xs font-medium">
                        Admin
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                
                <User className="h-4 w-4 text-gray-400" />
              </button>
              
              {showUserMenu && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-50">
                  <div className="py-1">
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200 text-sm"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Instellingen</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-200 text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Uitloggen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen lg:ml-72">
        <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 z-10">
          <div className="px-4 lg:px-6">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center">
                {isHomePage ? (
                  <button
                    onClick={() => navigate('/dashboard/settings')}
                    className="lg:hidden p-1.5 rounded-full mr-3 transition-all duration-200"
                  >
                    <div className="w-9 h-9 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                  </button>
                ) : (
                  <button
                    className="lg:hidden p-2.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 mr-3 transition-all duration-200 backdrop-blur-sm"
                    onClick={handleBackNavigation}
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                )}
                
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {location.pathname.startsWith('/dashboard/admin') ? 'Admin Panel' : 
                     location.pathname === '/dashboard/settings' ? 'Instellingen' : 
                     location.pathname === '/dashboard/create' ? 'Nieuwe Werkbon' :
                     location.pathname === '/dashboard/calendar' ? 'Planning' :
                     location.pathname === '/dashboard/my-statistics' ? 'Statistieken' :
                     'Dashboard'}
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <NotificationCenter />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 lg:p-6 pb-24 lg:pb-6">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/create" element={<Overview />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/my-statistics" element={<MyStatistics />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/dashboard/weekly-hours" element={<WeeklyHours />} />
            <Route path="/werkbonnen/edit/:id" element={<Overview />} />
            <Route path="/colleagues" element={<Colleagues />} />
            <Route path="/colleagues/:id" element={<ColleagueProfile />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/feedback">
              <Route index element={user?.role === 'admin' ? <FeedbackList /> : <Feedback />} />
              <Route path="create" element={<Feedback />} />
            </Route>
            <Route path="/admin/*" element={<AdminLayout />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/notification-debug" element={<NotificationDebug />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {showMobileMenu && (
          <>
            <div
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              style={{ bottom: '80px' }}
            />
            
            <div className="fixed bottom-20 left-2 right-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 overflow-hidden transform transition-all duration-300 origin-bottom">
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-purple-500/5 dark:bg-purple-900/10">
                <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  Menu
                </h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shadow-sm transition-all duration-200 backdrop-blur-sm"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
              </div>
              
              <div className="py-4">
                <div className="grid grid-cols-3 gap-3 px-4">
                  {mobileMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveLink(item.href);
                    const isMedewerkerItem = item.name === 'Medewerker Dashboard';
                    
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setShowMobileMenu(false)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                          isMedewerkerItem
                            ? (isActive
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                              )
                            : (isActive 
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 hover:text-purple-600 dark:hover:text-purple-400'
                              )
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg transition-all duration-200 mb-1 ${
                          isMedewerkerItem
                            ? (isActive ? 'bg-blue-500/20' : 'bg-blue-100/50 dark:bg-blue-800/30')
                            : (isActive 
                                ? 'bg-purple-500/20' 
                                : 'bg-gray-100/50 dark:bg-gray-700/50 hover:bg-purple-500/10'
                              )
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-center leading-tight">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-xl pb-2">
          <div className="flex items-center justify-around h-16 px-2">
              {mobileMainNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.action !== 'menu' && isActiveLink(item.href);
                const isAdminHome = isAdmin && item.name === 'Admin';
                
                return (
                  <div key={item.name} className="flex-1 flex justify-center">
                    {item.action === 'menu' ? (
                      <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className={`flex flex-col items-center justify-center space-y-1 p-2 transition-all duration-200 relative ${
                          showMobileMenu 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                        }`}
                      >
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-white">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          </div>
                        )}
                        
                        <div className={`p-2.5 rounded-lg transition-all duration-200 ${
                          showMobileMenu 
                            ? 'bg-purple-500/10 shadow-sm' 
                            : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">{item.name}</span>
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        className={`flex flex-col items-center justify-center space-y-1 p-2 transition-all duration-200 relative ${
                          item.highlight
                            ? 'text-white'
                            : isAdminHome
                            ? (isActive
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300'
                              )
                            : (isActive 
                                ? 'text-purple-600 dark:text-purple-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                              )
                        }`}
                      >
                        {item.highlight ? (
                          <div className={`relative ${
                            isActive 
                              ? 'bg-purple-600 shadow-lg' 
                              : 'bg-purple-500 hover:bg-purple-600 shadow-md hover:shadow-lg'
                          } p-3 rounded-xl transition-all duration-200`}>
                            <Icon className="h-6 w-6" />
                          </div>
                        ) : (
                          <div className={`p-2.5 rounded-lg transition-all duration-200 relative ${
                            isAdminHome
                              ? (isActive
                                  ? 'bg-orange-500/10 shadow-sm'
                                  : 'hover:bg-orange-100/50 dark:hover:bg-orange-900/30'
                                )
                              : (isActive 
                                  ? 'bg-purple-500/10 shadow-sm' 
                                  : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                                )
                          }`}>
                            <Icon className="h-5 w-5" />
                            {isActive && (
                              <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                                isAdminHome ? 'bg-orange-500' : 'bg-purple-500'
                              }`} />
                            )}
                          </div>
                        )}
                        
                        <span className="text-xs font-medium">{item.name}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
        </div>
      </div>
      
      <TutorialOverlay 
        isActive={isTutorialActive}
        onClose={() => setIsTutorialActive(false)}
      />
      <WebmailModal
        isOpen={showWebmailModal}
        onClose={() => setShowWebmailModal(false)}
        onConfirm={handleWebmailConfirm}
      />
    </div>
  );
};

export default Dashboard;