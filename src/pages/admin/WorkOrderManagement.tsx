import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, Query, DocumentData, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { FileText, Clock, MapPin, Send, CheckSquare, Square, Edit2, Trash2, Filter, X, Download } from 'lucide-react';
import Input from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link, useSearchParams } from 'react-router-dom';
import { getDayOfWeek, getWeekNumber, formatDateForInput } from '../../utils/dateHelpers';

interface WorkOrder {
  id: string;
  status: 'draft' | 'ready_to_send' | 'pending' | 'sent' | 'processed';
  workOrderDate?: string;
  entries: Array<{
    timeSpent: number;
    address: string;
    description: string;
    notes?: string;
    plannedHours?: number;
    client?: string;
    otherClient?: string;
    statusOutcome?: string;
    arrivalTime?: string;
    isCancelled?: boolean;
    addressDetails?: any;
  }>;
  userName: string;
  userId: string;
  timestamp: string;
  vertrekTijd: string;
  thuiskomstTijd: string;
  kilometers: number;
  totalHours?: number;
}

interface Colleague {
  id: string;
  name: string;
}

const WorkOrderManagement = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [groupedWorkOrders, setGroupedWorkOrders] = useState<Record<string, WorkOrder[]>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Get initial status from URL params
  const initialStatus = searchParams.get('status') || '';
  const [filters, setFilters] = useState({
    status: initialStatus,
    weekNumber: '',
    dayOfWeek: '',
    search: ''
  });

  console.log('WorkOrderManagement: Initialized with status filter:', initialStatus);

  const fetchColleagues = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      const colleaguesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setColleagues(colleaguesList);
      console.log('WorkOrderManagement: Fetched', colleaguesList.length, 'colleagues');
    } catch (error) {
      console.error('WorkOrderManagement: Error fetching colleagues:', error);
    }
  }, []);

  const handleSelectAll = () => {
    if (selectedOrders.length === workOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(workOrders.map(order => order.id));
    }
  };

  const handleSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSendSelected = async () => {
    if (!selectedOrders.length) return;
    
    const readyOrders = selectedOrders.filter(id => 
      workOrders.find(order => order.id === id && order.status === 'ready_to_send')
    );

    if (readyOrders.length === 0) {
      alert('Alleen werkbonnen met status "Gecontroleerd" kunnen worden verzonden.');
      return;
    }

    if (!window.confirm(`Weet je zeker dat je ${readyOrders.length} werkbon${readyOrders.length > 1 ? 'nen' : ''} wilt verzenden?`)) {
      return;
    }

    setIsSending(true);
    try {
      const selectedWorkOrders = workOrders.filter(order => 
        readyOrders.includes(order.id)
      );

      const formattedData = {
        workOrders: selectedWorkOrders.map(order => ({
          entries: order.entries.map(entry => ({
            client: entry.client === 'Anders namelijk:' ? entry.otherClient : entry.client,
            timeSpent: parseFloat(entry.timeSpent.toFixed(2)),
            plannedHours: parseFloat((entry.plannedHours || 0).toFixed(2)),
            statusOutcome: entry.statusOutcome,
            arrivalTime: entry.arrivalTime || '',
            address: {
              full: entry.address.trim(),
              street: entry.addressDetails?.street,
              number: entry.addressDetails?.number,
              postalCode: entry.addressDetails?.postalCode,
              city: entry.addressDetails?.city
            },
            description: entry.description.trim(),
            notes: entry.notes?.trim() || '',
            isCancelled: entry.isCancelled || false
          })),
          travel: {
            vertrekTijd: order.vertrekTijd,
            thuiskomstTijd: order.thuiskomstTijd,
            totalHours: order.totalHours || 0,
            kilometers: Number(order.kilometers)
          },
          user: {
            name: order.userName || '',
            id: order.userId || ''
          },
          weekNumber: getWeekNumber(order.timestamp),
          dayOfWeek: getDayOfWeek(order.timestamp),
          timestamp: order.timestamp,
          workOrderDate: order.workOrderDate
        }))
      };

      console.log('WorkOrderManagement: Sending', formattedData.workOrders.length, 'work orders to webhook');

      const response = await fetch('https://hook.eu2.make.com/fo5alcs3vyvat6n5wmxltk5m63snpj9n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        throw new Error('Failed to send work orders');
      }

      // Update status to sent
      await Promise.all(
        readyOrders.map(orderId =>
          updateDoc(doc(db, 'workOrders', orderId), { 
            status: 'sent',
            sentAt: new Date().toISOString()
          })
        )
      );

      setSelectedOrders([]);
      fetchWorkOrders();
      
      console.log('WorkOrderManagement: Successfully sent', readyOrders.length, 'work orders');
    } catch (error) {
      console.error('WorkOrderManagement: Error sending work orders:', error);
      alert('Er is een fout opgetreden bij het verzenden van de werkbonnen.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (workOrderId: string) => {
    if (!window.confirm('Weet je zeker dat je deze werkbon wilt verwijderen?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'workOrders', workOrderId));
      fetchWorkOrders();
      console.log('WorkOrderManagement: Deleted work order:', workOrderId);
    } catch (error) {
      console.error('WorkOrderManagement: Error deleting work order:', error);
      alert('Fout bij verwijderen werkbon');
    }
  };

  const handleStatusChange = async (workOrderId: string, newStatus: 'draft' | 'ready_to_send' | 'pending' | 'sent' | 'processed') => {
    setIsUpdatingStatus(workOrderId);
    try {
      const workOrderRef = doc(db, 'workOrders', workOrderId);
      await updateDoc(workOrderRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      fetchWorkOrders();
      console.log('WorkOrderManagement: Updated status for', workOrderId, 'to', newStatus);
    } catch (error) {
      console.error('WorkOrderManagement: Error updating work order status:', error);
      alert('Fout bij bijwerken werkbon status');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const fetchWorkOrders = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      console.log('WorkOrderManagement: Fetching work orders with filters:', filters);
      
      const workOrdersRef = collection(db, 'workOrders');
      let q: Query<DocumentData>;
      
      // Base query - admin sees all, users see only their own
      if (user.role === 'admin') {
        q = query(workOrdersRef, orderBy('timestamp', 'desc'));
      } else {
        q = query(
          workOrdersRef,
          where('userId', '==', user.id),
          orderBy('timestamp', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      let orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        workOrderDate: doc.data().timestamp ? formatDateForInput(doc.data().timestamp) : undefined
      })) as WorkOrder[];

      console.log('WorkOrderManagement: Fetched', orders.length, 'work orders from Firestore');

      // Apply client-side filters
      if (filters.status) {
        orders = orders.filter(order => order.status === filters.status);
        console.log('WorkOrderManagement: Filtered by status', filters.status, ':', orders.length, 'remaining');
      }
      
      if (filters.weekNumber) {
        orders = orders.filter(order => {
          const weekNumber = getWeekNumber(order.timestamp);
          return weekNumber.toString() === filters.weekNumber;
        });
        console.log('WorkOrderManagement: Filtered by week', filters.weekNumber, ':', orders.length, 'remaining');
      }
      
      if (filters.dayOfWeek) {
        orders = orders.filter(order => {
          const dayOfWeek = getDayOfWeek(order.timestamp);
          return dayOfWeek === filters.dayOfWeek;
        });
        console.log('WorkOrderManagement: Filtered by day', filters.dayOfWeek, ':', orders.length, 'remaining');
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        orders = orders.filter(order => 
          order.userName?.toLowerCase().includes(searchLower) ||
          order.entries?.some(entry => 
            entry.address?.toLowerCase().includes(searchLower) ||
            entry.description?.toLowerCase().includes(searchLower)
          )
        );
        console.log('WorkOrderManagement: Filtered by search', filters.search, ':', orders.length, 'remaining');
      }

      setWorkOrders(orders);
      
      // Group work orders by userId
      const grouped = orders.reduce((acc, order) => {
        const userId = order.userId || 'unknown';
        acc[userId] = acc[userId] || [];
        acc[userId].push(order);
        return acc;
      }, {} as Record<string, WorkOrder[]>);
      
      setGroupedWorkOrders(grouped);
      console.log('WorkOrderManagement: Grouped into', Object.keys(grouped).length, 'user groups');
      
    } catch (error) {
      console.error('WorkOrderManagement: Error fetching work orders:', error);
      setError('Fout bij laden werkbonnen');
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  useEffect(() => {
    fetchColleagues();
  }, [fetchColleagues]);

  // Update filters when URL params change
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== filters.status) {
      setFilters(prev => ({ ...prev, status: statusParam }));
    }
  }, [searchParams, filters.status]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));

    // Update URL params for status filter
    if (filterType === 'status') {
      if (value) {
        setSearchParams({ status: value });
      } else {
        setSearchParams({});
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      weekNumber: '',
      dayOfWeek: '',
      search: ''
    });
    setSearchParams({});
  };

  const hasActiveFilters = filters.status || filters.weekNumber || filters.dayOfWeek || filters.search;

  // Generate week numbers for current year
  const generateWeekNumbers = () => {
    const weeks = [];
    for (let i = 1; i <= 53; i++) {
      weeks.push(i);
    }
    return weeks;
  };

  const weekNumbers = generateWeekNumbers();
  const daysOfWeek = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
  const statusOptions = [
    { value: 'draft', label: 'Concept' },
    { value: 'ready_to_send', label: 'Gecontroleerd' },
    { value: 'pending', label: 'In behandeling' },
    { value: 'sent', label: 'Verzonden' },
    { value: 'processed', label: 'Verwerkt' }
  ];

  const exportToCSV = () => {
    const csvData = workOrders.map(order => ({
      'Werkbon ID': order.id,
      'Monteur': order.userName,
      'Datum': new Date(order.timestamp).toLocaleDateString('nl-NL'),
      'Week': getWeekNumber(order.timestamp),
      'Dag': getDayOfWeek(order.timestamp),
      'Status': order.status,
      'Vertrektijd': order.vertrekTijd,
      'Thuiskomsttijd': order.thuiskomstTijd,
      'Totaal Uren': order.totalHours,
      'Kilometers': order.kilometers,
      'Aantal Locaties': order.entries?.length || 0,
      'Omzet (ex BTW)': ((order.totalHours || 0) * 41.31).toFixed(2)
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `werkbonnen-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('WorkOrderManagement: Exported', workOrders.length, 'work orders to CSV');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <FileText className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Fout bij laden</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle>
                <div className="flex items-center space-x-4">
                  <span>Werkbonnen Beheer</span>
                  {hasActiveFilters && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({workOrders.length} gefilterd)
                    </span>
                  )}
                </div>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => setShowFilters(!showFilters)}
                  icon={<Filter className="h-4 w-4" />}
                >
                  Filters {hasActiveFilters && `(${Object.values(filters).filter(Boolean).length})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:hidden w-10 p-0 min-w-[40px]"
                  onClick={() => setShowFilters(!showFilters)}
                  icon={<Filter className="h-4 w-4" />}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={exportToCSV}
                  icon={<Download className="h-4 w-4" />}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:hidden w-10 p-0 min-w-[40px]"
                  onClick={exportToCSV}
                  icon={<Download className="h-4 w-4" />}
                />
                {user?.role === 'admin' && selectedOrders.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="hidden sm:flex"
                    onClick={handleSendSelected}
                    isLoading={isSending}
                    icon={<Send className="h-4 w-4" />}
                  >
                    Verzend ({selectedOrders.length})
                  </Button>
                )}
                {user?.role === 'admin' && selectedOrders.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    className={`sm:hidden w-10 p-0 min-w-[40px] ${selectedOrders.length > 0 ? '' : 'hidden'}`}
                    onClick={handleSendSelected}
                    isLoading={isSending}
                    icon={<Send className="h-4 w-4" />}
                  />
                )}
              </div>
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Zoeken..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Alle statussen</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weeknummer
                    </label>
                    <select
                      value={filters.weekNumber}
                      onChange={(e) => handleFilterChange('weekNumber', e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Alle weken</option>
                      {weekNumbers.map(week => (
                        <option key={week} value={week.toString()}>
                          Week {week}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dag van de week
                    </label>
                    <select
                      value={filters.dayOfWeek}
                      onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Alle dagen</option>
                      {daysOfWeek.map(day => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {workOrders.length} werkbon{workOrders.length !== 1 ? 'nen' : ''} gevonden
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      icon={<X className="h-4 w-4" />}
                    >
                      Filters wissen
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {workOrders.length === 0 && hasActiveFilters && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Geen werkbonnen gevonden</h3>
              <p>Probeer de filters aan te passen om meer resultaten te zien.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
                icon={<X className="h-4 w-4" />}
              >
                Filters wissen
              </Button>
            </div>
          )}
          
          {workOrders.length === 0 && !hasActiveFilters && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Geen werkbonnen</h3>
              <p>Er zijn nog geen werkbonnen aangemaakt.</p>
            </div>
          )}
          
          {/* Select All Checkbox for Admin */}
          {user?.role === 'admin' && workOrders.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === workOrders.length && workOrders.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selecteer alle werkbonnen ({workOrders.length})
                </span>
              </label>
            </div>
          )}
          
          {Object.entries(groupedWorkOrders).map(([userId, userOrders]) => {
            const technician = colleagues.find(c => c.id === userId);
            const totalWorkedHours = userOrders.reduce((sum, order) => 
              sum + (order.totalHours || 0), 0
            );
            const totalPlannedHours = userOrders.reduce((sum, order) => 
              sum + order.entries.reduce((total, entry) => total + (entry.plannedHours || 0), 0), 0
            );
            const totalRevenue = totalWorkedHours * 41.31;
            
            return (
              <div key={userId} className="mb-8 last:mb-0 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                      <span className="text-xl font-semibold text-primary-600">{technician?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{technician?.name || 'Onbekende gebruiker'}</h3>
                      <div className="text-sm text-gray-500">
                        {userOrders.length} werkbon{userOrders.length !== 1 ? 'nen' : ''} • 
                        Gewerkt: {totalWorkedHours.toFixed(1)}u • 
                        Gepland: {totalPlannedHours.toFixed(1)}u • 
                        Omzet: €{totalRevenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {userOrders.map((workOrder) => {
                    const dayOfWeek = getDayOfWeek(workOrder.timestamp);
                    const weekNumber = getWeekNumber(workOrder.timestamp);
                    
                    return (
                      <div
                        key={workOrder.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-3">
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleSelect(workOrder.id)}
                                className="focus:outline-none"
                              >
                                {selectedOrders.includes(workOrder.id) 
                                  ? <CheckSquare className="h-5 w-5 text-primary-600" />
                                  : <Square className="h-5 w-5 text-gray-400" />
                                }
                              </button>
                            )}
                            <div>
                              <div className="text-sm font-medium">{dayOfWeek}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(workOrder.timestamp).toLocaleDateString('nl-NL')} • Week {weekNumber}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {user?.role === 'admin' && (
                              <select
                                value={workOrder.status}
                                onChange={(e) => handleStatusChange(workOrder.id, e.target.value as any)}
                                className={`px-2 py-1 text-xs font-medium rounded-full border ${
                                  workOrder.status === 'sent'
                                    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                    : workOrder.status === 'processed'
                                    ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                                    : workOrder.status === 'ready_to_send'
                                    ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                                    : workOrder.status === 'pending'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                    : 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                                }`}
                                disabled={isUpdatingStatus === workOrder.id}
                              >
                                <option value="draft">Concept</option>
                                <option value="ready_to_send">Gecontroleerd</option>
                                <option value="pending">In behandeling</option>
                                <option value="sent">Verzonden</option>
                                <option value="processed">Verwerkt</option>
                              </select>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-4">
                          <details className="group">
                            <summary className="flex items-center justify-between cursor-pointer">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>Vertrektijd: {workOrder.vertrekTijd} • Thuiskomst: {workOrder.thuiskomstTijd}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{workOrder.kilometers} km • {workOrder.entries.length} locatie{workOrder.entries.length !== 1 ? 's' : ''} • €{((workOrder.totalHours || 0) * 41.31).toFixed(2)}</span>
                              </div>
                            </summary>
                            <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                              {workOrder.entries.map((entry, entryIndex) => (
                                <div key={entryIndex} className="mb-4 last:mb-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {entry.address}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300">
                                    {entry.description} • {entry.client}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Gewerkt: {entry.timeSpent}u • Gepland: {entry.plannedHours || 0}u • Status: {entry.statusOutcome}
                                    {entry.arrivalTime && ` • Aankomst: ${entry.arrivalTime}`}
                                  </div>
                                  {entry.notes && (
                                    <div className="text-xs text-gray-500 mt-1 italic">
                                      Notities: {entry.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                        
                        {(workOrder.status === 'draft' || workOrder.status === 'pending') && (
                          <div className="mt-4 flex justify-end space-x-2">
                            <Link to={`/dashboard/werkbonnen/edit/${workOrder.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit2 className="h-4 w-4" />}
                              >
                                Bewerken
                              </Button>
                            </Link>
                            {user?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(workOrder.id)}
                                icon={<Trash2 className="h-4 w-4 text-error-600" />}
                              >
                                Verwijderen
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrderManagement;