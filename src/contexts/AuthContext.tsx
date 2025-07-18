import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { NotificationService } from '../services/NotificationService';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'monteur';
  phoneNumber?: string;
  bio?: string;
  department?: string;
  expertise?: string[];
  projects?: string[];
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loaded: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Store unsubscribe function in a ref
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Clean up previous listener if it exists
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }

        // Set up real-time listener for user document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeRef.current = onSnapshot(userDocRef, (doc) => {
          if (!doc.exists()) {
            setUser(null);
            setLoaded(true);
            return;
          }

          const userData = doc.data();
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userData.name || 'User',
            role: userData.role || 'monteur',
            phoneNumber: userData.phoneNumber,
            bio: userData.bio,
            department: userData.department,
            expertise: userData.expertise || [],
            projects: userData.projects || [],
            avatar: userData.avatar
          });
          
          // Initialize notifications for the user
          if (Notification.permission === 'granted') {
            NotificationService.autoEnableNotifications(firebaseUser.uid);
          }
          
          setLoaded(true);
        });
      } else {
        // Clean up listener when user logs out
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setUser(null);
        setLoaded(true);
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Enable persistent auth state
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      
      // Initialize notifications after successful login
      if (Notification.permission === 'granted') {
        await NotificationService.autoEnableNotifications(firebaseUser.uid);
      }
      
    } catch (error) {
      throw new Error('Invalid email or password');
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Store user data in Firestore
      const userData = {
        name: name,
        email: email,
        role: email.includes('admin') ? 'admin' : 'monteur',
        createdAt: new Date().toISOString(),
        totalHoursWorked: 0,
        totalWorkOrdersCompleted: 0,
        totalKilometersDriven: 0
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    } catch (error) {
      throw new Error('Failed to create account');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clean up listener before logging out
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Clear FCM token from localStorage on logout
      localStorage.removeItem('itknecht_fcm_token');
      
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    const { currentPassword, newPassword, ...userData } = data as any;
    
    try {
      const userDocRef = doc(db, 'users', user.id);
      
      // If changing password
      if (currentPassword && newPassword) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser!.email!,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser!, credential);
        await updatePassword(auth.currentUser!, newPassword);
      }

      // Update Firestore document
      if (Object.keys(userData).length > 0) {
        await updateDoc(userDocRef, {
          ...userData,
          updatedAt: new Date().toISOString()
        });
      }

      // If email is being updated, update it in Firebase Auth
      if (userData.email && userData.email !== user.email) {
        await updateEmail(auth.currentUser!, userData.email);
      }

      // Update local state
      if (Object.keys(userData).length > 0) {
        setUser(prev => prev ? { ...prev, ...userData } : null);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to update profile');
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        loaded,
        updateUser,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};