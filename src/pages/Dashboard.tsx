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
  User,
  Crown,
  MoreHorizontal,
  ChevronUp
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  // Mobile navigation - 4 hoofditems
  const mobileMainNav = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Nieuwe Werkbon', href: '/dashboard/create', icon: Plus, highlight: true },
    { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarIcon },
    { name: 'Meer', action: 'menu', icon: MoreHorizontal }
  ];

  // Overige items voor mobile menu
  const mobileMenuItems = [
    { name: 'Mijn Statistieken', href: '/dashboard/my-statistics', icon: BarChart3 },
    { name: 'Mijn Taken', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Collega\'s', href: '/dashboard/colleagues', icon: Users },
    { name: 'Contacten', href: '/dashboard/contacts', icon: Contact },
    { name: 'Ideeën bus', href: '/dashboard/feedback', icon: MessageSquare },
    { name: 'Bronnen', href: '/dashboard/resources', icon: FileText },
    ...(user?.role === 'admin' ? [{ name: 'Admin Panel', href: '/dashboard/admin', icon: Settings }] : [])
  ];

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

  const isActiveLink = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      <div 
        className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-sm transition-all duration-300 lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      {/* PROFESSIONAL DESKTOP SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`} 
        data-tutorial="sidebar"
      >
        <div className="h-full flex flex-col">
          
          {/* CLEAN PROFESSIONAL HEADER */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-4">
              {/* CLEAN IT KNECHT LOGO */}
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 p-2">
                <img 
                  src="https://itknecht.nl/wp-content/uploads/2025/01/cropped-cropped-file-1-1-e1736278706265.webp"
                  alt="IT Knecht Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  IT Knecht
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Werkbon Systeem
                </p>
              </div>
            </div>
            
            {/* CLEAN CLOSE BUTTON */}
            <button
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={toggleSidebar}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* PROFESSIONAL NAVIGATION */}
          <nav className="flex-1 pt-8 pb-4 px-4 overflow-y-auto">
            <div className="space-y-2">
              {navigation.filter(item => item.showInNav).map((item) => {
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
                
                // Special styling for Create button
                const isCreateButton = item.name === 'Werkbon aanmaken';
                
                return (
                  <LinkComponent
                    key={item.name}
                    {...linkProps}
                    className={`group flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isCreateButton
                        ? (isActive 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'bg-purple-500 hover:bg-purple-600 text-white shadow-md hover:shadow-lg'
                          )
                        : (isActive 
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400'
                          )
                    }`}
                  >
                    {/* Icon */}
                    <div className={`p-2 rounded-lg mr-4 ${
                      isCreateButton
                        ? 'bg-white/20'
                        : (isActive 
                            ? 'bg-purple-100 dark:bg-purple-800/50' 
                            : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/30'
                          )
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    
                    {/* Label */}
                    <span className="font-medium">{item.name}</span>
                    
                    {/* Active indicator */}
                    {isActive && !isCreateButton && (
                      <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </LinkComponent>
                );
              })}
            </div>
          </nav>

          {/* PROFESSIONAL USER SECTION */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div 
              className="relative group"
              onMouseEnter={() => setShowUserMenu(true)}
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <Link 
                to="/dashboard/settings" 
                className="flex items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600"
              >
                {/* Clean Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {user?.name || 'User'}
                    </p>
                    
                    {/* Clean admin badge */}
                    {user?.role === 'admin' && (
                      <div className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md text-xs font-medium flex items-center space-x-1">
                        <Crown className="h-3 w-3" />
                        <span>Admin</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                
                <User className="h-5 w-5 text-gray-400" />
              </Link>
              
              {/* Clean user menu */}
              {showUserMenu && (
                <div className="absolute bottom-full mb-2 left-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <div className="py-2">
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Instellingen</span>
                    </Link>
                    
                    {user?.role === 'admin' && (
                      <Link
                        to="/dashboard/admin"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Crown className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* CLEAN TOP HEADER */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="px-4 lg:px-6">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 mr-3 transition-colors"
                  onClick={toggleSidebar}
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                {/* Page title */}
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

        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 spacing pb-20 lg:pb-0">
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

      {/* MOBILE BOTTOM NAVIGATION - WOW EFFECT */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Mobile menu overlay */}
        {showMobileMenu && (
          <>
            <div
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              style={{ bottom: '80px' }}
            />
            
            {/* WOW Mobile Menu */}
            <div className="fixed bottom-20 left-2 right-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transform transition-all duration-300 origin-bottom">
              {/* Menu header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  Menu
                </h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-full bg-white dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shadow-md transition-colors"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
              </div>
              
              {/* Menu items */}
              <div className="py-3 max-h-80 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 px-3">
                  {mobileMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveLink(item.href);
                    
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setShowMobileMenu(false)}
                        className={`flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`p-3 rounded-xl ${
                          isActive 
                            ? 'bg-purple-100 dark:bg-purple-800/50' 
                            : 'bg-gray-100 dark:bg-gray-600'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-center">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Ultra Modern Bottom Navigation Bar */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-around h-16 px-2">
              {mobileMainNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.action !== 'menu' && isActiveLink(item.href);
                
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
                        {/* Notification badge */}
                        {notificationCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-white">
                              {notificationCount > 9 ? '9+' : notificationCount}
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
                            : (isActive 
                                ? 'text-purple-600 dark:text-purple-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                              )
                        }`}
                      >
                        {/* Special styling for highlight button */}
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
                            isActive 
                              ? 'bg-purple-500/10 shadow-sm' 
                              : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                          }`}>
                            <Icon className="h-5 w-5" />
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
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
        </div>highlight
                            ? (isActive 
                                ? 'text-white' 
                                : 'text-white hover:text-white'
                              )
                            : (isActive 
                                ? 'text-purple-600 dark:text-purple-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                              )
                        }`}
                      >
                        {/* Special styling for highlight button */}
                        {item.highlight ? (
                          <div className={`relative ${
                            isActive 
                              ? 'bg-purple-600 shadow-lg shadow-purple-500/30' 
                              : 'bg-purple-500 hover:bg-purple-600 shadow-md hover:shadow-lg shadow-purple-500/20'
                          } p-3 rounded-xl transition-all duration-200`}>
                            <Icon className="h-6 w-6" />
                          </div>
                        ) : (
                          <div className={`p-2 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-purple-100 dark:bg-purple-900/30' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}>
                            <Icon className="h-5 w-5" />
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
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
      </div>
      
      {/* Original components */}
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