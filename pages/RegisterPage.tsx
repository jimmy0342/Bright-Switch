
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [photoURL, setPhotoURL] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Profile with the IMGBB URL collected from ImageUploader
      await updateProfile(user, {
        displayName: formData.name,
        photoURL: photoURL || null
      });

      // 3. Send Verification Email
      const actionCodeSettings = {
        url: `${window.location.origin}/#/`, 
        handleCodeInApp: true,
      };

      await sendEmailVerification(user, actionCodeSettings);
      
      toast.success('Registration successful!');
      navigate('/verify-email', { state: { email: formData.email } });
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setIsSubmitting(false);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An error occurred during registration.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSubmitting(true);
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setError('Google Sign-in failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-4 py-12 text-left">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-md p-10">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
            <UserPlus className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 mt-2 font-medium">Join the professional electrical network</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col space-y-2 text-red-600 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <ImageUploader 
            onUploadSuccess={(res) => setPhotoURL(res.imageUrl)}
            label="Profile Photo"
            className="flex flex-col items-center mb-4"
          />

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Jamal Pasha"
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="name@company.com"
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Confirm</label>
              <input 
                type="password" 
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 shadow-2xl shadow-blue-100 group"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <>
                <span>Create Account</span>
                <UserPlus className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-10 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <span className="relative bg-white px-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Or sign up with</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all text-gray-700 shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-sm text-gray-500 mt-10 font-medium">
          Already have an account? <Link to="/login" className="text-blue-600 font-black hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
