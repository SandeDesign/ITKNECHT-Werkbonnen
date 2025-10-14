import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export type CalendarViewType = 'day' | 'week' | 'month';

interface CalendarPreferences {
  defaultView: CalendarViewType;
}

const DEFAULT_PREFERENCES: CalendarPreferences = {
  defaultView: 'day'
};

export const useCalendarPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<CalendarPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const prefRef = doc(db, 'userSettings', user.id);
        const prefSnap = await getDoc(prefRef);

        if (prefSnap.exists()) {
          const data = prefSnap.data();
          setPreferences({
            defaultView: data.calendarDefaultView || DEFAULT_PREFERENCES.defaultView
          });
        } else {
          await setDoc(prefRef, {
            calendarDefaultView: DEFAULT_PREFERENCES.defaultView
          });
        }
      } catch (error) {
        console.error('Error loading calendar preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id]);

  const savePreferences = async (newPreferences: Partial<CalendarPreferences>) => {
    if (!user?.id) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      const prefRef = doc(db, 'userSettings', user.id);
      await setDoc(prefRef, {
        calendarDefaultView: updatedPreferences.defaultView
      }, { merge: true });
    } catch (error) {
      console.error('Error saving calendar preferences:', error);
    }
  };

  return {
    preferences,
    savePreferences,
    isLoading
  };
};
