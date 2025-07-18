import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { User, Mail, Phone, Building, X, Briefcase } from 'lucide-react';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editContact?: Contact;
}

const ContactModal = ({ isOpen, onClose, onSuccess, editContact }: ContactModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [function_, setFunction] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editContact) {
      setName(editContact.name);
      setEmail(editContact.email);
      setPhone(editContact.phone || '');
      setCompany(editContact.company);
      setDepartment(editContact.department || '');
      setFunction(editContact.function || '');
      setNotes(editContact.notes || '');
    }
  }, [editContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const contactData = {
        name,
        email,
        phone,
        company,
        department,
        function: function_,
        notes,
        createdAt: new Date().toISOString()
      };

      if (editContact) {
        await updateDoc(doc(db, 'contacts', editContact.id), contactData);
      } else {
        await addDoc(collection(db, 'contacts'), contactData);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{editContact ? 'Contact bewerken' : 'Contact toevoegen'}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                icon={<X className="h-4 w-4" />}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error-700 bg-error-100 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Naam"
                icon={<User size={18} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              
              <Input
                label="Email"
                type="email"
                icon={<Mail size={18} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefoon"
                type="tel"
                icon={<Phone size={18} />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              
              <Input
                label="Bedrijf"
                icon={<Building size={18} />}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Afdeling"
                icon={<Building size={18} />}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              
              <Input
                label="Functie"
                icon={<Briefcase size={18} />}
                value={function_}
                onChange={(e) => setFunction(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notities
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuleren
            </Button>
            <Button 
              type="submit"
              isLoading={isLoading}
            >
              {editContact ? 'Opslaan' : 'Contact toevoegen'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ContactModal;