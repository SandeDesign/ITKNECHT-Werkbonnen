import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Button from '../ui/Button';
import { Plus, MessageSquarePlus, X, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseNotifications } from '../../contexts/SupabaseNotificationContext';
import NewsItem from './NewsItem';
import { NotificationService } from '../../services/NotificationService';

interface AdminMessage {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  createdAt: string;
}

const DashboardNews = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useSupabaseNotifications(); 
  
  const [editingNewsItem, setEditingNewsItem] = useState<AdminMessage | null>(null);
  const [newsItems, setNewsItems] = useState<AdminMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low'); 
  const [expiresAt, setExpiresAt] = useState('');

  // Track processed notification IDs to prevent duplicates
  const [processedNotifications, setProcessedNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('processedNewsNotifications');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    // Set up real-time listener for news items
    const newsRef = collection(db, 'news');
    const q = query(newsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AdminMessage[];
        
        setNewsItems(newsData);
        
        // Process notifications for high priority news
        if (newsData.length > 0) {
          const highPriorityItems = newsData.filter(
            item => item.priority === 'high' && !processedNotifications.includes(item.id)
          );
          
          if (highPriorityItems.length > 0 && user?.id) {
            // Process each high priority item
            const newProcessed: string[] = [...processedNotifications];
            
            highPriorityItems.forEach(item => {
              // Simulate notification
              if (typeof window !== 'undefined' && window.location.hostname.includes('webcontainer')) {
                NotificationService.simulateNotification(
                  user.id,
                  'Nieuwe belangrijke update',
                  item.title
                );
              }
              
              // Trigger notification refresh
              refreshNotifications();

              // Mark as processed
              newProcessed.push(item.id);
            });

            // Update processed notifications
            setProcessedNotifications(newProcessed);
            localStorage.setItem('processedNewsNotifications', JSON.stringify(newProcessed));
          }
        }
      },
      (error) => {
        console.error('Error fetching news:', error);
        setError('Fout bij laden van nieuws');
      }
    );

    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, [refreshNotifications, processedNotifications, user?.id]);

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (editingNewsItem) {
        // Update existing news item
        const newsRef = doc(db, 'news', editingNewsItem.id);
        await updateDoc(newsRef, {
          title: newTitle,
          content: newContent,
          priority,
          expiresAt: expiresAt || null,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new news item
        await addDoc(collection(db, 'news'), {
          title: newTitle,
          content: newContent,
          priority,
          expiresAt: expiresAt || null,
          createdAt: new Date().toISOString(),
          createdBy: user?.id
        });
      }
      
      setNewTitle('');
      setNewContent('');
      setPriority('low');
      setExpiresAt('');
      setShowAddForm(false);
      setEditingNewsItem(null);
    } catch (error) {
      console.error('Error saving news:', error);
      setError('Fout bij opslaan van nieuws');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNews = (newsItem: AdminMessage) => {
    setEditingNewsItem(newsItem);
    setNewTitle(newsItem.title);
    setNewContent(newsItem.content);
    setPriority(newsItem.priority);
    setExpiresAt(newsItem.expiresAt || '');
    setShowAddForm(true);
  };

  const handleDeleteNews = async (id: string) => {
    if (window.confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) {
      setIsLoading(true);
      try {
        const newsRef = doc(db, 'news', id);
        await deleteDoc(newsRef);
      } catch (error) {
        console.error('Error deleting news:', error);
        setError('Fout bij verwijderen van nieuws');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingNewsItem(null);
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
          <CardTitle>Updates</CardTitle>
          <div className="flex items-center space-x-2">
            {user?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? 'Annuleren' : editingNewsItem ? 'Bewerken' : 'Update toevoegen'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && user?.role === 'admin' && (
          <form onSubmit={handleAddNews} className="mb-6 space-y-4"> 
            {error && (
              <div className="p-3 text-sm text-error-700 bg-error-100 rounded-lg">
                {error}
              </div>
            )}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingNewsItem ? 'Update bewerken' : 'Nieuwe update toevoegen'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                icon={<X className="h-4 w-4" />}
              />
            </div>
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
                  disabled={isLoading}
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
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleCancelEdit}
              >
                Annuleren
              </Button>
              <Button type="submit" isLoading={isLoading}>
                {editingNewsItem ? 'Update opslaan' : 'Update plaatsen'}
              </Button>
            </div>
          </form>
        )}
        
        {newsItems.map((item) => (
          <NewsItem
            key={item.id}
            id={item.id} 
            title={item.title}
            content={item.content}
            priority={item.priority}
            expiresAt={item.expiresAt}
            createdAt={item.createdAt}
            onEdit={() => handleEditNews(item)}
            onDelete={() => handleDeleteNews(item.id)}
          />
        ))}
        
        {newsItems.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                <MessageSquarePlus className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p>Geen nieuws of updates beschikbaar</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardNews;