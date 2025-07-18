import { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form'; 
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Plus, Trash2, Clock, MapPin, FileText, Save, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import JsonPreview from './JsonPreview';
import AddressModal from './AddressModal';
import TravelDetailsModal from './TravelDetailsModal';
import ThankYouPage from './ThankYouPage';
import { getDayOfWeek, getWeekNumber, formatDateForInput, getCurrentDate, dateToISOString } from '../../utils/dateHelpers';

const timeBlocks = Array.from({ length: 32 }, (_, i) => (i + 1) * 0.25).filter(time => time <= 8);

const workOrderSchema = z.object({
  workOrderDate: z.string().min(1, 'Datum is verplicht'),
  entries: z.array(z.object({
    timeSpent: z.number().min(0.5, 'Minimaal 30 minuten vereist'),
    address: z.string().min(1, 'Adres is verplicht').optional(),
    isCancelled: z.boolean().optional(),
    plannedHours: z.number().min(0, 'Geplande uren moet 0 of hoger zijn'),
    statusOutcome: z.enum(['succesvol', 'niet succesvol', 'N.V.T.']),
    arrivalTime: z.string().optional(),
    description: z.string().min(1, 'Werkbeschrijving is verplicht'),
    client: z.string().min(1, 'Opdrachtgever is verplicht'),
    otherClient: z.string().optional(),
    notes: z.string().optional(),
  })).min(1, 'Minimaal één invoer vereist'),
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  workOrderId?: string;
}

const WorkOrderForm = ({ workOrderId }: WorkOrderFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [travelDetails, setTravelDetails] = useState<any>(null);
  const [currentData, setCurrentData] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [currentEntryIndex, setCurrentEntryIndex] = useState<number | null>(null);

  const { register, control, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      workOrderDate: getCurrentDate(),
      entries: [{
        timeSpent: 0.5,
        plannedHours: 1,
        address: '',
        isCancelled: false,
        statusOutcome: 'N.V.T.',
        arrivalTime: '',
        description: '',
        client: 'Vodafone',
        otherClient: '',
        notes: '',
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
  });

  const workOrderDate = watch('workOrderDate');

  useEffect(() => {
    const fetchWorkOrder = async () => {
      const orderId = workOrderId || id;
      if (!orderId) return;

      try {
        const workOrderDoc = await getDoc(doc(db, 'workOrders', orderId));
        if (workOrderDoc.exists()) {
          const data = workOrderDoc.data();
          setCurrentData(data);
          if (data.status === 'sent') {
            navigate('/dashboard/werkbonnen');
            return;
          }
          
          // Initialize travel details from existing data
          setTravelDetails({
            vertrekTijd: data.vertrekTijd || '',
            thuiskomstTijd: data.thuiskomstTijd || '',
            kilometers: data.kilometers || 0,
            totalHours: data.totalHours || 0,
          });
          
          // Pre-fill form with existing data
          // Use the timestamp as the work order date, or fall back to current date
          const workOrderDate = data.timestamp ? formatDateForInput(data.timestamp) : getCurrentDate();
          
          reset({
            workOrderDate,
            entries: data.entries || [{
              timeSpent: 0.5,
              plannedHours: 1,
              address: '',
              isCancelled: false,
              statusOutcome: 'N.V.T.',
              arrivalTime: '',
              description: '',
              client: 'Vodafone',
              otherClient: '',
              notes: '',
            }]
          });
        }
      } catch (error) {
        console.error('Error fetching work order:', error);
      }
    };

    fetchWorkOrder();
  }, [workOrderId, id, navigate, reset]);

  const onSubmit = async (data: WorkOrderFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate day of week and week number from the work order date
      const dayOfWeek = getDayOfWeek(data.workOrderDate);
      const weekNumber = getWeekNumber(data.workOrderDate);
      const timestamp = dateToISOString(data.workOrderDate);

      // Show travel modal if details are missing
      if (!travelDetails) {
        const defaultTravelDetails = {
          vertrekTijd: '09:00',
          thuiskomstTijd: '17:00',
          totalHours: 0,
          kilometers: 0,
        };
        setTravelDetails(defaultTravelDetails);
        setShowTravelModal(true);
        setCurrentData({ ...data, dayOfWeek, weekNumber, timestamp });
        setIsSubmitting(false);
        return;
      }
      
      const finalData = {
        entries: data.entries,
        ...travelDetails,
        dayOfWeek,
        weekNumber,
        timestamp,
        userName: user?.name,
        userId: id ? currentData?.userId : user?.id,
        status: 'draft',
        updatedAt: new Date().toISOString()
      };

      let docRef;
      if (id) {
        docRef = doc(db, 'workOrders', id);
        await updateDoc(docRef, finalData);
      } else {
        const workOrdersRef = collection(db, 'workOrders');
        docRef = await addDoc(workOrdersRef, finalData);
      }

      // Update user statistics
      const userRef = doc(db, 'users', user?.id);
      await updateDoc(userRef, { updatedAt: new Date().toISOString() });

      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error saving work order:', error);
      setError(`Fout bij opslaan werkbon: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTravelDetailsSubmit = async (details: any) => {
    setIsSubmitting(true);
    setError(null);
    setTravelDetails(details);

    try {
      if (currentData) {
        const finalData = {
          entries: currentData.entries,
          ...details,
          dayOfWeek: currentData.dayOfWeek,
          weekNumber: currentData.weekNumber,
          timestamp: currentData.timestamp,
          userName: user?.name,
          userId: id ? currentData?.userId : user?.id,
          status: 'draft',
          updatedAt: new Date().toISOString()
        };

        let docRef;
        if (id) {
          docRef = doc(db, 'workOrders', id);
          await updateDoc(docRef, finalData);
        } else {
          const workOrdersRef = collection(db, 'workOrders');
          docRef = await addDoc(workOrdersRef, finalData);
        }

        // Update user statistics
        const userId = id ? currentData?.userId : user?.id;
        if (userId) {
          await updateDoc(doc(db, 'users', userId), { 
            updatedAt: new Date().toISOString() 
          });
        }

        setIsSubmitted(true);
      }
      setShowTravelModal(false);
    } catch (error: any) {
      console.error('Error saving work order:', error);
      setError(`Fout bij opslaan werkbon: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTravelDetailsCancel = () => {
    setShowTravelModal(false);
    setTravelDetails(null);
    setIsSubmitting(false);
    setError(null);
  };

  const handlePreview = () => {
    if (currentData) {
      const previewData = {
        ...currentData,
        vertrekTijd: travelDetails?.vertrekTijd || '',
        thuiskomstTijd: travelDetails?.thuiskomstTijd || '',
        kilometers: travelDetails?.kilometers || 0,
      };
      setPreviewData(previewData);
    }
  };

  const handleBack = useCallback(() => {
    setPreviewData(null);
    setError(null);
  }, []);

  const handleAddressClick = (index: number) => {
    setCurrentEntryIndex(index);
    setShowAddressModal(true);
  };

  const handleAddressSubmit = (addressDetails: {
    street: string;
    number: string;
    postalCode: string;
    city: string;
  }) => {
    if (currentEntryIndex === null) return;

    // Format the address as a single line
    const formattedAddress = `${addressDetails.street} ${addressDetails.number}, ${addressDetails.postalCode} ${addressDetails.city}`;
    
    // Update the address field
    setValue(`entries.${currentEntryIndex}.address`, formattedAddress);
    
    // Store the separate address components
    setValue(`entries.${currentEntryIndex}.addressDetails`, addressDetails);
    
    setShowAddressModal(false);
    setCurrentEntryIndex(null);
  };

  // Use useWatch to observe the client field for each entry
  const entries = useWatch({
    control,
    name: 'entries',
  });

  if (isSubmitted) return <ThankYouPage />;
  if (previewData) return <JsonPreview data={previewData} onBack={handleBack} />;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card data-tutorial="workorder-form">
          <CardHeader>
            <CardTitle>
              Werkbon invullen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Work Order Date */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Input
                label="Werkbon Datum"
                type="date"
                icon={<Calendar size={18} />}
                error={errors.workOrderDate?.message}
                {...register('workOrderDate')}
              />
              {workOrderDate && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{getDayOfWeek(workOrderDate)}</span> • Week {getWeekNumber(workOrderDate)}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      {field.address ? field.address : `Nieuwe invoer ${index + 1}`}
                    </h3>
                    <div className="flex-shrink-0">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          icon={<Trash2 className="h-4 w-4" />}
                        >
                          <span className="hidden sm:inline">Verwijderen</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Geplande tijd (uren)
                        </label>
                        <select
                          {...register(`entries.${index}.plannedHours`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {timeBlocks.map((block) => (
                            <option key={block} value={block}>{block.toFixed(2)} uur</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Bestede tijd (uren)
                        </label>
                        <select
                          {...register(`entries.${index}.timeSpent`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {timeBlocks.map((block) => (
                            <option key={block} value={block}>{block.toFixed(2)} uur</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status uitkomst *
                    </label>
                    <select
                      {...register(`entries.${index}.statusOutcome`)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="succesvol">Succesvol</option>
                      <option value="niet succesvol">Niet succesvol</option>
                      <option value="N.V.T.">N.V.T.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Aankomsttijd
                    </label>
                    <Input
                      type="time"
                      {...register(`entries.${index}.arrivalTime`)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Werkbeschrijving *
                    </label>
                    <select
                      {...register(`entries.${index}.description`)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    >
                      <option value="Werkinstallatie Standaard">Werkinstallatie Standaard</option>
                      <option value="Werkinstallatie SMUC">Werkinstallatie SMUC</option>
                      <option value="Werkinstallatie OneNet">Werkinstallatie OneNet</option>
                      <option value="Werkinstallatie 4G">Werkinstallatie 4G</option>
                      <option value="CPE Replacement">CPE Replacement</option>
                      <option value="Incident">Incident</option>
                      <option value="Migratie Flex naar Meraki">Migratie Flex naar Meraki</option>
                      <option value="Hardware ophalen">Hardware ophalen</option>
                      <option value="Afspraak geannuleerd">Afspraak geannuleerd</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Opdrachtgever *
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        {...register(`entries.${index}.client`)}
                        className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="Vodafone">Vodafone</option>
                        <option value="Yielder">Yielder</option>
                        <option value="Anders namelijk:">Anders namelijk:</option>
                      </select>
                      {entries?.[index]?.client === 'Anders namelijk:' && (
                        <Input
                          placeholder="Andere opdrachtgever"
                          {...register(`entries.${index}.otherClient`)}
                          className="flex-1"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Klant adres
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          {...register(`entries.${index}.isCancelled`)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue(`entries.${index}.address`, 'Geen adres beschikbaar');
                            } else {
                              setValue(`entries.${index}.address`, '');
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Afspraak geannuleerd</span>
                      </label>
                    </div>
                    {!entries?.[index]?.isCancelled && (
                      <Input
                        icon={<MapPin size={18} />}
                        error={errors.entries?.[index]?.address?.message}
                        {...register(`entries.${index}.address`)}
                        placeholder="Voer het adres van de klant in"
                        onClick={() => handleAddressClick(index)}
                        readOnly
                      />
                    )}
                  </div>

                  <Input
                    label="Aanvullende notities"
                    type="textarea"
                    error={errors.entries?.[index]?.notes?.message}
                    {...register(`entries.${index}.notes`)}
                    placeholder="Eventuele aanvullende notities (optioneel)"
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                data-tutorial="add-entry"
                onClick={() => append({
                  timeSpent: 0.5,
                  address: '',
                  plannedHours: 1,
                  isCancelled: false,
                  statusOutcome: 'N.V.T.',
                  arrivalTime: '',
                  description: '',
                  client: 'Vodafone',
                  otherClient: '',
                  notes: '',
                })}
                icon={<Plus className="h-4 w-4" />}
              >
                Adres toevoegen
              </Button>
            </div>

            <div className="mt-6">
              <div className="flex gap-4">
                <Button
                  type="submit"
                  isFullWidth
                  isLoading={isSubmitting}
                  icon={<Save className="h-4 w-4" />}
                >
                  Werkbonnen opslaan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
      {showAddressModal && (
        <AddressModal
          onSubmit={handleAddressSubmit}
          onCancel={() => setShowAddressModal(false)}
        />
      )}
      {showTravelModal && (
        <TravelDetailsModal
          onSubmit={handleTravelDetailsSubmit}
          onCancel={handleTravelDetailsCancel}
          workOrderDate={workOrderDate}
          existingDetails={travelDetails}
        />
      )}
    </>
  );
};

export default WorkOrderForm;