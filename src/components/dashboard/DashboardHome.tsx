import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { Plus, MessageSquarePlus, X, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseNotifications } from '../../contexts/SupabaseNotificationContext';
import { useState, useEffect } from 'react';

interface AdminMessage {
  import { Star, ThumbsUp, Calendar } from 'lucide-react';
  import { Link } from 'react-router-dom';
  import Button from '../ui/Button';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  createdAt: string;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
}

const DashboardHome = () => {
  const { user } = useAuth();
  const { preferences, requestBrowserPermission, browserPermissionStatus } = useSupabaseNotifications();

const [newsItems, setNewsItems] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('newsItems');
    return saved ? JSON.parse(saved) : [];
});

const [showAddForm, setShowAddForm] = useState(false);
const [newTitle, setNewTitle] = useState('');
const [newContent, setNewContent] = useState('');
const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
const [expiresAt, setExpiresAt] = useState('');

useEffect(() => {
  localStorage.setItem('newsItems', JSON.stringify(newsItems));
  
  // Add to notifications if high priority
  if (newsItems.length > 0) {
    const latestItem = newsItems[0];
    if (latestItem.priority === 'high') {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const newNotification = {
        id: Date.now(),
        title: 'Nieuwe belangrijke update',
        message: latestItem.title,
        timestamp: new Date().toISOString(),
        read: false
      };
      localStorage.setItem('notifications', JSON.stringify([newNotification, ...notifications]));
    }
  }
}, [newsItems]);

const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem = {
      id: Date.now(),
      title: newTitle,
      content: newContent,
      priority,
      expiresAt: expiresAt || undefined,
      createdAt: new Date().toISOString()
    };

    const updatedItems = [newItem, ...newsItems];
    setNewsItems(updatedItems);
    
    setNewTitle('');
    setNewContent('');
    setPriority('low');
    setExpiresAt('');
    setShowAddForm(false);
};

return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Nieuws & Updates</CardTitle>
                <div className="flex items-center space-x-2">
                    {user?.role === 'admin' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            {showAddForm ? 'Annuleren' : 'Update toevoegen'}
                        </Button>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Laten we er samen een productieve dag van maken! 💪
            </p>
            
            {browserPermissionStatus !== 'granted' && browserPermissionStatus !== 'unsupported' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-start">
                  <Bell className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Schakel pushmeldingen in
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Blijf op de hoogte van nieuwe taken en updates, zelfs als de app gesloten is.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-2"
                      onClick={() => requestBrowserPermission()}
                    >
                      Inschakelen
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {showAddForm && user?.role === 'admin' && (
                <form onSubmit={handleAddNews} className="mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Titel
                            </label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Prioriteit
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                                <option value="low">Laag</option>
                                <option value="medium">Medium</option>
                                <option value="high">Hoog</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Inhoud
                            </label>
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                rows={3}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Verloopt op (optioneel)
                            </label>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <Button type="submit">
                        Update plaatsen
                    </Button>
                </form>
            )}
            {newsItems.map((item) => (
                <div
                    key={item.id}
                    className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                    style={{
                        borderLeft: item.priority === 'high' ? '4px solid #EF4444' : 
                                 item.priority === 'medium' ? '4px solid #F59E0B' : 
                                 '4px solid transparent',
                        paddingLeft: item.priority !== 'low' ? '1rem' : '0'
                    }}
                >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                        {item.priority !== 'low' && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                item.priority === 'high' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' :
                                'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                            }`}>
                                {item.priority === 'high' ? 'Hoge prioriteit' : 'Medium prioriteit'}
                            </span>
                        )}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {item.content}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                        {item.expiresAt && (
                            <span className="ml-2 text-warning-600 dark:text-warning-400">
                                Verloopt: {new Date(item.expiresAt).toLocaleDateString('nl-NL')}
                            </span>
                        )}
                    </p>
                </div>
            ))}
        </CardContent>
    </Card>
);
};

export default DashboardHome;