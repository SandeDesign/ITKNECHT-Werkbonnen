import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { MapPin } from 'lucide-react';

interface AddressModalProps {
  onSubmit: (details: {
    street: string;
    number: string;
    postalCode: string;
    city: string;
  }) => void;
  onCancel: () => void;
}

const AddressModal = ({ onSubmit, onCancel }: AddressModalProps) => {
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!street || !number || !postalCode || !city) {
      setError('Alle velden zijn verplicht');
      return;
    }

    onSubmit({
      street,
      number,
      postalCode,
      city
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Adres Invoeren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-error-600 text-sm bg-error-50 p-2 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input
                  label="Straat"
                  icon={<MapPin size={18} />}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  label="Nummer"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postcode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />
              <Input
                label="Plaats"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Annuleren
            </Button>
            <Button type="submit">
              Bevestigen
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddressModal;