import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, deleteUser, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, query, collection, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, UserRole } from '../types';
import { uploadToImgbb } from '../services/imgbbService';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  setUserManually: (user: User | null) => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateProfilePhoto: (file: File) => Promise<string>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUserStatus: () => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserWithFirestore = async (fbUser: any) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);

      // Attempt to get the document with a specific catch for permission/existence issues
      let userDoc;
      try {
        userDoc = await getDoc(userRef);
      } catch (err) {
        console.warn("Firestore access restricted or delayed during sync:", err);
      }

      if (userDoc && userDoc.exists()) {
        const data = userDoc.data();
        let updatedRole = data.role;

        // Auto-upgrade to electrician if approved application exists
        if (updatedRole === 'buyer' || !updatedRole) {
          const appQ = query(
            collection(db, 'electricianApplications'),
            where('personalInfo.email', '==', fbUser.email),
            where('status', '==', 'approved')
          );
          const appSnap = await getDocs(appQ);
          if (!appSnap.empty) {
            updatedRole = 'electrician';
            await updateDoc(userRef, { role: 'electrician', updatedAt: serverTimestamp() });
          }
        }

        if (data.isSuspended) {
          await signOut(auth);
          setUser(null);
          localStorage.removeItem('cbp_manual_user');
          toast.error("Your account has been suspended. Please contact support.");
          // We don't throw here to avoid a black screen, but return null to trigger typical guest flow
          return null;
        }

        if (data.emailVerified !== fbUser.emailVerified || data.role !== updatedRole) {
          await updateDoc(userRef, {
            emailVerified: fbUser.emailVerified,
            role: updatedRole,
            updatedAt: serverTimestamp()
          });
        }
        const updatedUser = { ...data, uid: fbUser.uid, emailVerified: fbUser.emailVerified, role: updatedRole } as User;
        setUser(updatedUser);
        return updatedUser;
      } else {
        // Create new profile if it doesn't exist
        const isAdmin = fbUser.email === 'admin@cbp.pro' || fbUser.email === 'admin@admin.com';
        let initialRole: UserRole = isAdmin ? 'admin' : 'buyer';
        let initialData: any = {};

        // NEW: Adoption Logic for Proactive Approval Documents
        const placeholderRef = doc(db, 'users', `approved_pro_${fbUser.email.trim().toLowerCase()}`);
        const placeholderSnap = await getDoc(placeholderRef);

        if (placeholderSnap.exists()) {
          const placeholderData = placeholderSnap.data();
          initialRole = placeholderData.role || 'electrician';
          initialData = { ...placeholderData };
          // Remove placeholder after adoption
          await deleteDoc(placeholderRef);
        }

        let newUser: User = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          role: initialRole,
          photoURL: fbUser.photoURL || '',
          addresses: [],
          emailVerified: fbUser.emailVerified,
          creditLimit: initialRole === 'admin' ? 0 : 50000,
          creditUsed: 0,
          paymentTerms: 'Net 30',
          createdAt: Date.now(),
        };

        newUser = { ...newUser, ...initialData };

        try {
          await setDoc(userRef, newUser);
        } catch (setErr) {
          console.error("Failed to create user document in Firestore:", setErr);
        }

        // Link/Create Electrician Profile if role is electrician
        if (initialRole === 'electrician' || newUser.role === 'electrician') {
          try {
            // 1. Search for existing profile by email (handling potential case sensitivity in legacy data)
            const normalizedEmail = fbUser.email.trim().toLowerCase();
            const qLower = query(collection(db, 'electricians'), where('email', '==', normalizedEmail));
            const qOriginal = query(collection(db, 'electricians'), where('email', '==', fbUser.email.trim()));

            let snap = await getDocs(qLower);
            if (snap.empty && normalizedEmail !== fbUser.email.trim()) {
              snap = await getDocs(qOriginal);
            }

            if (!snap.empty) {
              // 2. Link UID to existing profile document
              const existingDoc = snap.docs[0];
              await updateDoc(doc(db, 'electricians', existingDoc.id), {
                userId: fbUser.uid,
                email: normalizedEmail, // Normalize it now
                updatedAt: serverTimestamp()
              });
            } else {
              // 3. Fallback: Create new profile if none exists
              const electricianRef = doc(db, 'electricians', fbUser.uid);
              await setDoc(electricianRef, {
                electricianId: fbUser.uid,
                userId: fbUser.uid,
                fullName: newUser.name || 'Professional Electrician',
                email: normalizedEmail,
                status: 'active',
                verified: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          } catch (elecErr) {
            console.error("Failed to link/create electrician profile:", elecErr);
          }
        }

        setUser(newUser);
        return newUser;
      }
    } catch (err) {
      console.error("Critical Auth Sync Error:", err);
      // Minimal fallback to allow the app to function if Firestore is totally blocked
      const fallbackUser = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || 'User',
        role: 'buyer',
        emailVerified: fbUser.emailVerified,
        addresses: [],
        createdAt: Date.now()
      } as any;
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          await syncUserWithFirestore(fbUser);
        } else {
          const manual = localStorage.getItem('cbp_manual_user');
          if (manual) {
            setUser(JSON.parse(manual));
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Auth observer error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setUserManually = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem('cbp_manual_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('cbp_manual_user');
    }
  };

  const refreshUserStatus = async (): Promise<boolean> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedFbUser = auth.currentUser;
      const syncedUser = await syncUserWithFirestore(updatedFbUser);
      return syncedUser?.emailVerified || false;
    }
    return false;
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user || !auth.currentUser) return;
    const userRef = doc(db, 'users', user.uid);

    await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });

    if (data.name || data.photoURL) {
      await updateProfile(auth.currentUser, {
        displayName: data.name || user.name,
        photoURL: data.photoURL || user.photoURL
      });
    }

    setUser({ ...user, ...data });
  };

  const updateProfilePhoto = async (file: File): Promise<string> => {
    if (!user) throw new Error("No user logged in");
    const response = await uploadToImgbb(file);
    const downloadURL = response.imageUrl;
    await updateUserProfile({ photoURL: downloadURL });
    return downloadURL;
  };

  const deleteAccount = async () => {
    if (!auth.currentUser || !user) return;
    const uid = user.uid;
    const currentUser = auth.currentUser;
    try {
      await deleteDoc(doc(db, 'users', uid));
      await deleteUser(currentUser);
    } catch (e) {
      console.error("Deletion failed:", e);
    }
    setUser(null);
    localStorage.removeItem('cbp_manual_user');
  };

  const logout = async () => {
    await signOut(auth);
    setUserManually(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUserManually,
      updateUserProfile,
      updateProfilePhoto,
      deleteAccount,
      logout,
      resendVerification,
      refreshUserStatus,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};