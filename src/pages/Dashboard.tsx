import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
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
  Sparkles,
  User,
  Crown
} from 'lucide-react';
import Button from '../components/ui/Button';
import DashboardHome from './DashboardHome';
import Profile from '../components/dashboard/Profile';
import { default as SettingsPage } from '../components/dashboard/Settings';
import Werkbonnen from './Werkbonnen';
import Overview from '../components/dashboard/Overview';
import Colleagues from './Colleagues';
import UserSettings from '../components/dashboard/UserSettings';
import { default as AdminPanel } from '../components/dashboard/Settings';
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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { notificationCount } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWebmailModal, setShowWebmailModal] = useState(false);
  const [webmailUrl, setWebmailUrl] = useState('');
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [showAdminSubMenu, setShowAdminSubMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const baseNavigation = [
    { name: 'Home', href: '/dashboard', icon: Home, showInNav: true },
    { name: 'Werkbon aanmaken', href: '/dashboard/create', icon: Plus, showInNav: true },
    { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarIcon, showInNav: true },
    { name: 'Mijn Statistieken', href: '/dashboard/my-statistics', icon: BarChart3, showInNav: true },
    { name: 'Mijn Taken', href: '/dashboard/tasks', icon: CheckSquare, showInNav: false },
    { name: 'Collega\'s', href: '/dashboard/colleagues', icon: Users, showInNav: true },
    { name: 'Contacten', href: '/dashboard/contacts', icon: Contact, showInNav: true },
    { name: 'Ideeën bus', href: '/dashboard/feedback', icon: MessageSquare, showInNav: true },
    { name: 'Bronnen', href: '/dashboard/resources', icon: FileText, showInNav: true }
  ];
  
  const adminNavigation = [
    { name: 'Admin Panel', href: '/dashboard/admin', icon: Settings, showInNav: false }
  ];

  const navigation = [...baseNavigation, ...(user?.role === 'admin' ? adminNavigation : [])];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      <div 
        className={`fixed inset-0 z-20 bg-black/40 backdrop-blur-sm transition-all duration-300 lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      {/* ULTRA MODERN SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`} 
        data-tutorial="sidebar"
      >
        <div className="h-full flex flex-col relative">
          
          {/* ULTRA MODERN HEADER */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl z-10">
            <div className="flex items-center space-x-3">
              {/* MODERN LOGO CONTAINER */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                  <img 
                    src="https://itknecht.nl/wp-content/uploads/2025/01/cropped-cropped-file-1-1-e1736278706265.webp"
                    alt="IT Knecht Logo"
                    className="h-6 w-6 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  IT Knecht
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">Werkbon Systeem</p>
              </div>
            </div>
            
            {/* MODERN CLOSE BUTTON */}
            <button
              className="lg:hidden p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              onClick={toggleSidebar}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ULTRA MODERN NAVIGATION */}
          <nav className="flex-1 pt-6 pb-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <div className="space-y-2">
              {navigation.filter(item => item.showInNav).map((item, index) => {
                const isActive = location.pathname === item.href;
                const LinkComponent = item.external ? 'a' : Link;
                const linkProps = item.external ? { 
                  href: '#',
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    handleWebmailClick(item.href);
                  }
                } : { 
                  to: item.href,
                  onClick: () => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }
                };
                
                // SPECIAL HIGHLIGHT voor "Werkbon aanmaken"
                const isCreateButton = item.name === 'Werkbon aanmaken';
                
                return (
                  <LinkComponent
                    key={item.name}
                    {...linkProps}
                    className={`group relative flex items-center px-4 py-3.5 rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      isCreateButton
                        ? (isActive 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/30' 
                            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl shadow-purple-500/25'
                          )
                        : (isActive 
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 shadow-md border border-purple-200/50 dark:border-purple-800/50' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-purple-600 dark:hover:text-purple-400'
                          )
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'slideInLeft 0.5s ease-out forwards'
                    }}
                  >
                    {/* ICON CONTAINER - ULTRA MODERN */}
                    <div className={`relative p-2.5 rounded-xl mr-3 transition-all duration-200 ${
                      isCreateButton
                        ? 'bg-white/20 text-white backdrop-blur-sm'
                        : (isActive 
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 shadow-lg' 
                            : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400 shadow-sm'
                          )
                    }`}>
                      <item.icon className="h-5 w-5" />
                      
                      {/* ACTIVE PULSE INDICATOR */}
                      {isActive && !isCreateButton && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full">
                          <div className="absolute inset-0 bg-purple-600 dark:bg-purple-400 rounded-full animate-ping opacity-75" />
                        </div>
                      )}
                      
                      {/* SPARKLE EFFECT voor create button */}
                      {isCreateButton && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Sparkles className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* LABEL */}
                    <span className="text-sm font-medium">{item.name}</span>
                    
                    {/* SPECIAL GLOW EFFECT voor create button */}
                    {isCreateButton && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-sm -z-10" />
                    )}
                    
                    {/* HOVER GRADIENT OVERLAY */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/5 group-hover:to-blue-600/5 transition-all duration-300" />
                  </LinkComponent>
                );
              })}
            </div>
          </nav>

          {/* ULTRA MODERN USER SECTION */}
          <div className="relative border-t border-gray-200/50 dark:border-gray-700/50 p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/50">
            
            {/* USER PROFILE CARD */}
            <div 
              className="relative group"
              onMouseEnter={() => setShowUserMenu(true)}
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <Link 
                to="/dashboard/settings" 
                className="flex items-center p-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* MODERN AVATAR */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-lg">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  
                  {/* ONLINE STATUS INDICATOR */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                  </div>
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {user?.name || 'User'}
                    </p>
                    
                    {/* ADMIN CROWN BADGE */}
                    {user?.role === 'admin' && (
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-md">
                        <Crown className="h-3 w-3" />
                        <span>Admin</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                
                {/* SETTINGS ICON */}
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors duration-200">
                  <User className="h-4 w-4 text-gray-500 group-hover:text-purple-600 dark:text-gray-400 dark:group-hover:text-purple-400" />
                </div>
              </Link>
              
              {/* FLOATING USER MENU */}
              {showUserMenu && (
                <div className="absolute bottom-full mb-2 left-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-50">
                  {/* Quick Actions */}
                  <div className="p-3 space-y-2">
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm font-medium">Instellingen</span>
                    </Link>
                    
                    {/* ADMIN PANEL SHORTCUT */}
                    {user?.role === 'admin' && (
                      <Link
                        to="/dashboard/admin"
                        className="flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-900/20 dark:hover:to-orange-900/20 hover:text-yellow-700 dark:hover:text-yellow-400 transition-all duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">Admin Panel</span>
                      </Link>
                    )}
                    
                    {/* LOGOUT BUTTON */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Uitloggen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - BEHOUD ORIGINEEL */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* ULTRA MODERN TOP HEADER */}
        <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 z-10">
          <div className="spacing-x">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center">
                {/* MODERN MOBILE MENU BUTTON */}
                <button
                  className="lg:hidden p-2.5 rounded-xl bg-gray-100/80 hover:bg-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-3 transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                  onClick={toggleSidebar}
                >
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowAdminSubMenu(true)}
                    onMouseLeave={() => setShowAdminSubMenu(false)}
                  >
                    <Menu className="h-6 w-6" />
                  </div>
                </button>
                
                {/* MODERN PAGE TITLE */}
                <div className="ml-2 lg:ml-0">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {location.pathname.startsWith('/dashboard/admin') ? '⚡ Admin Panel' : 
                     location.pathname === '/dashboard/settings' ? '⚙️ Instellingen' : '🏠 Dashboard'}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                    {location.pathname.startsWith('/dashboard/admin') ? 'Systeembeheer' : 
                     location.pathname === '/dashboard/settings' ? 'Persoonlijke voorkeuren' : 'Welkom terug!'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <NotificationCenter />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content area - BEHOUD ORIGINEEL */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 spacing">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/create" element={<Overview />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/my-statistics" element={<MyStatistics />} />
            <Route path="/tasks" element={<Tasks />} />
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      
      {/* BEHOUD ORIGINELE COMPONENTS */}
      <TutorialOverlay 
        isActive={isTutorialActive}
        onClose={() => setIsTutorialActive(false)}
      />
      <WebmailModal
        isOpen={showWebmailModal}
        onClose={() => setShowWebmailModal(false)}
        onConfirm={handleWebmailConfirm}
      />

      {/* CSS ANIMATIONS */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 0.5rem;
        }
        
        .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;