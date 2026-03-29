import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Zap, Loader2, AlertCircle, ShieldCheck, User as UserIcon, Wrench, Building2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loginType, setLoginType] = useState<'buyer' | 'electrician'>('buyer');
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setUserManually } = useAuth();
  const navigate = useNavigate();

  // Reset fallback when switching modes
  useEffect(() => {
    setShowPasswordFallback(false);
    setError('');
  }, [loginType]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'warehouse') {
        navigate('/admin');
      } else if (user.role === 'electrician') {
        navigate('/electrician-dashboard');
      } else if (user.role === 'buyer') {
        navigate('/buyer-dashboard');
      } else {
        navigate('/my-account');
      }
    }
  }, [user, navigate]);

  const handleAdminBypass = () => {
    setIsSubmitting(true);
    const adminUser = {
      uid: 'admin-id',
      email: 'admin@cbp.pro',
      name: 'System Admin',
      role: 'admin' as const,
      addresses: [],
      emailVerified: true,
      createdAt: Date.now(),
    };
    setUserManually(adminUser);
    setTimeout(() => {
      navigate('/admin');
      setIsSubmitting(false);
    }, 500);
  };

  const migrateElectricianProfile = async (oldDocId: string, newUid: string, data: any) => {
    try {
      // 1. Create new document with UID as ID
      await setDoc(doc(db, 'electricians', newUid), {
        ...data,
        userId: newUid,
        updatedAt: Date.now()
      }, { merge: true });

      // 2. If it's a different document, delete the old one
      if (oldDocId !== newUid) {
        await deleteDoc(doc(db, 'electricians', oldDocId));
        console.log(`Migrated electrician profile from ${oldDocId} to ${newUid}`);
      }
    } catch (err) {
      console.error("Migration error:", err);
      // Fallback: just update the userId on existing doc
      await updateDoc(doc(db, 'electricians', oldDocId), {
        userId: newUid,
        updatedAt: Date.now()
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setError('');

    if (loginType === 'electrician') {
      const normalizedEmail = email.trim().toLowerCase();
      try {
        // 1. Check if an approved electrician exists with this email
        const q = query(
          collection(db, 'electricians'),
          where('email', '==', normalizedEmail)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('No approved electrician profile found with this email. Please apply first.');
          setIsSubmitting(false);
          return;
        }

        const electricianData = snapshot.docs[0].data();
        if (electricianData.status !== 'approved' && electricianData.status !== 'active') {
          setError('Your electrician account is pending approval or has been suspended.');
          setIsSubmitting(false);
          return;
        }

        try {
          // 2. Attempt standard sign in
          const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
          const fbUser = userCredential.user;

          // Migrated Link logic: Ensure the profile is linked/migrated to the current UID
          await migrateElectricianProfile(snapshot.docs[0].id, fbUser.uid, electricianData);

          navigate('/electrician-dashboard');
          return;
        } catch (authErr: any) {
          // 3. Handle First-Time Login for approved Guests
          if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
            try {
              // Check placeholder document for password match
              const placeholderRef = doc(db, 'users', `approved_pro_${normalizedEmail}`);
              const placeholderSnap = await getDoc(placeholderRef);

              if (placeholderSnap.exists()) {
                const placeholderData = placeholderSnap.data();
                const storedPassword = placeholderData.password;

                if (storedPassword && storedPassword === password) {
                  // Password matches! 
                  let finalFbUser;
                  try {
                    // 1. Try to create the Auth account
                    const createCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
                    finalFbUser = createCredential.user;
                  } catch (createErr: any) {
                    if (createErr.code === 'auth/email-already-in-use') {
                      // 2. If it already exists, just sign in (Auth account might be from a buyer registration)
                      const signCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
                      finalFbUser = signCredential.user;
                    } else {
                      throw createErr;
                    }
                  }

                  if (!finalFbUser) throw new Error("Authentication failed during synchronization");

                  // Migrated Link logic: Promotion to permanent UID
                  await migrateElectricianProfile(snapshot.docs[0].id, finalFbUser.uid, electricianData);

                  navigate('/electrician-dashboard');
                  return;
                } else {
                  setError('The password you entered does not match our records. Please use the password you provided during registration.');
                  setIsSubmitting(false);
                  return;
                }
              } else if (authErr.code === 'auth/invalid-credential') {
                // If no placeholder exists and it's invalid-credential, it's just a wrong password for an existing account
                setError('Incorrect password for your existing account.');
              } else {
                setError('Account not found. Please register as an electrician first.');
              }
              setIsSubmitting(false);
              return;
            } catch (syncErr: any) {
              console.error("Synchronization Error:", syncErr);
              // Provide more specific feedback if possible
              const errorMsg = syncErr.code === 'auth/wrong-password' || syncErr.code === 'auth/invalid-credential'
                ? 'Authentication failed. Please verify your password.'
                : `Synchronization failed: ${syncErr.message || 'Unknown error'}`;

              setError(errorMsg);
              setIsSubmitting(false);
              return;
            }
          }
          throw authErr;
        }
      } catch (err: any) {
        console.error("Electrician Login Error:", err);
        setError(err.message || 'Electrician access failed.');
        setIsSubmitting(false);
        return;
      }
    }

    // Admin login bypass for testing
    if (email.toLowerCase() === 'admin' && password === 'admin') {
      handleAdminBypass();
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Fetch user role from Firestore to determine if we should bypass verification
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      const userData = userDoc.data();
      const role = userData?.role;

      if (role !== 'electrician' && !fbUser.emailVerified) {
        navigate('/verify-email', { state: { email: fbUser.email } });
        return;
      }

      if (loginType === 'buyer' && role !== 'buyer' && role !== 'admin') {
        setError('This account does not have B2B Buyer access.');
        setIsSubmitting(false);
        return;
      }

      if (role === 'admin' || role === 'warehouse' || email.toLowerCase().includes('admin')) {
        navigate('/admin');
      } else if (role === 'electrician') {
        navigate('/electrician-dashboard');
      } else if (role === 'buyer') {
        navigate('/buyer-dashboard');
      } else {
        navigate('/my-account');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSubmitting(true);
      const userCredential = await signInWithPopup(auth, googleProvider);
      const fbUser = userCredential.user;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      const userData = userDoc.data();
      const role = userData?.role || 'customer'; // Default to 'customer' if role not found

      if (loginType === 'buyer' && role !== 'buyer' && role !== 'admin') {
        setError('This account does not have B2B Buyer access.');
        setIsSubmitting(false);
        return;
      }

      if (role === 'admin' || role === 'warehouse') {
        navigate('/admin');
      } else if (role === 'electrician') {
        navigate('/electrician-dashboard');
      } else if (role === 'buyer') {
        navigate('/buyer-dashboard');
      } else {
        navigate('/my-account'); // Default for 'customer' or unknown roles
      }
    } catch (err: any) {
      console.error(err);
      setError('Google Sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-md p-10 text-left">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2 font-medium">Sign in to manage your electrical supply</p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-10">
          <button
            onClick={() => setLoginType('buyer')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${loginType === 'buyer' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}
          >
            <Building2 size={14} />
            <span className="hidden sm:inline">B2B Buyer</span>
          </button>
          <button
            onClick={() => setLoginType('electrician')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${loginType === 'electrician' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}
          >
            <Wrench size={14} />
            <span className="hidden sm:inline">Electrician</span>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email or Username</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
            />
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
              {loginType !== 'electrician' && (
                <Link to="/forgot-password" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                  Forgot?
                </Link>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
              placeholder="••••••••"
              required
            />
            {loginType === 'electrician' && (
              <p className="text-[10px] font-bold text-gray-400 mt-2 italic px-2">
                Enter the password you chose during registration.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 shadow-2xl shadow-blue-100"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="relative my-10 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <span className="relative bg-white px-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Or continue with</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all text-gray-700 shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
          <span>Google Workspace</span>
        </button>

        <div className="mt-10 space-y-3 text-center">
          <p className="text-sm text-gray-500 font-medium tracking-tight">
            New here? <Link to="/register" className="text-blue-600 font-black hover:underline underline-offset-4 decoration-2">Create B2B Account</Link>
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="h-px w-4 bg-gray-100"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Registered Electrician?</p>
            <div className="h-px w-4 bg-gray-100"></div>
          </div>
          <p className="text-sm text-gray-500 font-medium tracking-tight">
            Professional expert? <Link to="/electrician-register" className="text-blue-600 font-black hover:underline underline-offset-4 decoration-2">Join as Electrician</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
