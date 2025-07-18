import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { Search, Phone, Building, Plus } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ContactModal from '../components/ContactModal';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  department?: string;
  function?: string;
  notes?: string;
}

const Contacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const fetchContacts = async () => {
    try {
      const contactsRef = collection(db, 'contacts');
      const q = query(contactsRef);
      const querySnapshot = await getDocs(q);
      const contactsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      setContacts(contactsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching contacts:', error); 
      setError('Could not load contacts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleDelete = async (contactId: string) => {
    try {
      const contactRef = doc(db, 'contacts', contactId);
      await deleteDoc(contactRef);
      await fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError('Could not delete contact. Please try again later.');
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditContact(null);
  };

  // Group contacts by department and sort alphabetically
  const groupedContacts = contacts.reduce((acc, contact) => {
    const department = contact.department || 'Other';
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  // Sort departments alphabetically
  const sortedDepartments = Object.keys(groupedContacts).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  // Sort contacts within each department
  Object.values(groupedContacts).forEach(departmentContacts => {
    departmentContacts.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Filter contacts
  const filteredDepartments = sortedDepartments.filter(department => {
    const departmentContacts = groupedContacts[department];
    const searchLower = searchTerm.toLowerCase();
    return departmentContacts.some(contact => 
      contact.name.toLowerCase().includes(searchLower) ||
      contact.company.toLowerCase().includes(searchLower) ||
      contact.department?.toLowerCase().includes(searchLower) ||
      contact.function?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="w-48">
          <Input
            placeholder="Zoeken..."
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {user?.role === 'admin' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Contact toevoegen
          </Button>
        )}
      </div>

      {filteredDepartments.map((department) => (
        <motion.div
          key={department}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{department}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedContacts[department]
              .filter(contact => {
                const searchLower = searchTerm.toLowerCase();
                return (
                  contact.name.toLowerCase().includes(searchLower) ||
                  contact.company.toLowerCase().includes(searchLower) ||
                  contact.department?.toLowerCase().includes(searchLower) ||
                  contact.function?.toLowerCase().includes(searchLower)
                );
              })
              .map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{contact.name}</h3>
                          <p className="text-sm text-gray-500">
                            {contact.function && `${contact.function} bij `}{contact.company}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {contact.phone && (
                          <div className="flex items-center space-x-2 leading-none">
                            <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <a href={`tel:${contact.phone}`} className="text-gray-600 dark:text-gray-300">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        {contact.department && (
                          <div className="flex items-center space-x-2 leading-none">
                            <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">{contact.department}</span>
                          </div>
                        )}
                      </div>

                      {user?.role === 'admin' && (
                        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                          >
                            Bewerken
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
                            className="text-error-600"
                          >
                            Verwijderen
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </motion.div>
      ))}

      <ContactModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={fetchContacts}
        editContact={editContact}
      />
    </div>
  );
};

export default Contacts;