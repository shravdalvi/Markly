import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

// Import Firebase tools
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<{success: boolean, status?: 'LOGGED_IN' | 'NEEDS_PROFILE', firebaseUser?: any, errorMsg?: string}>;
  completeGoogleAuth: (firebaseUser: any, role: UserRole, extraAuthData: any) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: UserRole, extraAuthData?: { clubId?: string, admissionNumber?: string, division?: string, collegeYear?: string, committee?: string, department?: string, position?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

// --- INITIAL LOAD LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // QUICK CHECK: If we already manually set the user in login/register, skip this!
        setUser((currentUser) => {
          if (currentUser?.id === firebaseUser.uid) {
             return currentUser; // Keep existing state, avoid lag
          }
          return currentUser;
        });

        // Only fetch if we DON'T have the user state yet (e.g., page refresh)
        if (!user) {
            try {
              const docRef = doc(db, 'users', firebaseUser.uid);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                const userData = docSnap.data();
                setUser({
                  id: firebaseUser.uid,
                  name: userData.name,
                  email: userData.email,
                  role: userData.role as UserRole,
                  clubId: userData.clubId,
                  admissionNumber: userData.admissionNumber,
                  division: userData.division,
                  collegeYear: userData.collegeYear,
                  committee: userData.committee,
                  department: userData.department,
                  position: userData.position
                });
              }
            } catch (error) {
              console.error("Error fetching user data from Firestore:", error);
            }
        }
      } else {
        setUser(null);
      }
      setIsInitialized(true); 
    });

    return () => unsubscribe();
  }, []); // We intentionally leave the dependency array empty here

  // --- REAL LOGIN LOGIC ---
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // FIX: Fetch the role and set the state immediately so the router doesn't kick us out
      const docRef = doc(db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser({
          id: userCredential.user.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole,
          clubId: userData.clubId,
          admissionNumber: userData.admissionNumber,
          division: userData.division,
          collegeYear: userData.collegeYear,
          committee: userData.committee,
          department: userData.department,
          position: userData.position
        });
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      setIsLoading(false);
      return false;
    }
  };

  // --- REAL REGISTRATION LOGIC ---
  const register = async (email: string, password: string, name: string, role: UserRole, extraAuthData?: { clubId?: string, admissionNumber?: string, division?: string, collegeYear?: string, committee?: string, department?: string, position?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 1. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Save their extra details (role, name, etc.) in Firestore
      const newUserData = {
        name,
        email,
        role,
        ...(extraAuthData?.clubId && { clubId: extraAuthData.clubId }),
        ...(extraAuthData?.admissionNumber && { admissionNumber: extraAuthData.admissionNumber }),
        ...(extraAuthData?.division && { division: extraAuthData.division }),
        ...(extraAuthData?.collegeYear && { collegeYear: extraAuthData.collegeYear }),
        ...(extraAuthData?.committee && { committee: extraAuthData.committee }),
        ...(extraAuthData?.department && { department: extraAuthData.department }),
        ...(extraAuthData?.position && { position: extraAuthData.position })
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);

      // FIX: Manually set the user state right now so the router knows their role
      setUser({
        id: firebaseUser.uid,
        name: newUserData.name,
        email: newUserData.email,
        role: newUserData.role,
        clubId: newUserData.clubId,
        admissionNumber: newUserData.admissionNumber,
        division: newUserData.division,
        collegeYear: newUserData.collegeYear,
        committee: newUserData.committee,
        department: newUserData.department,
        position: newUserData.position
      });

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Registration Error:", error);
      setIsLoading(false);
      return false;
    }
  };

  // --- GOOGLE LOGIN/REGISTER LOGIC ---
  const loginWithGoogle = async (): Promise<{success: boolean, status?: 'LOGGED_IN' | 'NEEDS_PROFILE', firebaseUser?: any, errorMsg?: string}> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser({
          id: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole,
          clubId: userData.clubId,
          admissionNumber: userData.admissionNumber,
          division: userData.division,
          collegeYear: userData.collegeYear,
          committee: userData.committee,
          department: userData.department,
          position: userData.position
        });
        setIsLoading(false);
        return { success: true, status: 'LOGGED_IN' };
      } else {
        setIsLoading(false);
        return { success: true, status: 'NEEDS_PROFILE', firebaseUser };
      }
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setIsLoading(false);
      return { success: false, errorMsg: error?.message || "Google Auth Error" };
    }
  };

  const completeGoogleAuth = async (firebaseUser: any, role: UserRole, extraAuthData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      const newUserData = {
        name: extraAuthData.name || firebaseUser.displayName || 'Google User',
        email: firebaseUser.email,
        role: role,
        ...(extraAuthData?.clubId && { clubId: extraAuthData.clubId }),
        ...(extraAuthData?.admissionNumber && { admissionNumber: extraAuthData.admissionNumber }),
        ...(extraAuthData?.division && { division: extraAuthData.division }),
        ...(extraAuthData?.collegeYear && { collegeYear: extraAuthData.collegeYear }),
        ...(extraAuthData?.committee && { committee: extraAuthData.committee }),
        ...(extraAuthData?.department && { department: extraAuthData.department }),
        ...(extraAuthData?.position && { position: extraAuthData.position })
      };
      
      const docRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(docRef, newUserData);

      setUser({
        id: firebaseUser.uid,
        ...newUserData
      });
      setIsLoading(false);
      return true;
    } catch (error) {
       console.error("Complete Google Auth Error:", error);
       setIsLoading(false);
       return false;
    }
  };

  // --- REAL LOGOUT LOGIC ---
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null); // Clear the state immediately
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, completeGoogleAuth, register, logout, isLoading, isInitialized }}>
      {/* Wait for Firebase to initialize before rendering the app to prevent redirect bugs */}
      {!isInitialized ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};