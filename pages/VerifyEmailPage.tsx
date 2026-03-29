
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, LogIn, RefreshCw, Loader2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, resendVerification, logout, refreshUserStatus } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  const email = location.state?.email || user?.email || 'your email address';

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin' || user.role === 'warehouse') return '/admin';
    if (user.role === 'electrician') return '/electrician-dashboard';
    return '/buyer-dashboard';
  };

  // 1. Auto-redirection logic when verification is detected
  useEffect(() => {
    if (user?.emailVerified) {
      const targetPath = getDashboardPath();
      const roleName = user.role === 'electrician' ? 'Electrician Hub' : 'Buyer Dashboard';
      toast.success(`Email verified! Redirecting to ${roleName}...`);
      const timer = setTimeout(() => navigate(targetPath), 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.emailVerified, navigate, user?.role]);


  // 2. Active Polling for verification status
  useEffect(() => {
    if (user && !user.emailVerified) {
      pollIntervalRef.current = window.setInterval(async () => {
        const isNowVerified = await refreshUserStatus();
        if (isNowVerified && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }, 2500);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [user, refreshUserStatus]);

  // 3. Resend cooldown timer
  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    try {
      await resendVerification();
      toast.success('Verification link resent!');
      setCooldown(60);
    } catch (err: any) {
      console.error('Resend error:', err);
      toast.error('Failed to resend. Please wait.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    const isVerified = await refreshUserStatus();
    setIsChecking(false);

    if (isVerified) {
      toast.success('Verified! Opening Dashboard.');
      navigate(getDashboardPath());
    } else {
      toast.error('Not verified yet. Please check your inbox.');
    }
  };

  const handleLoginRedirect = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-4 py-12">
      <Toaster position="top-right" />
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 w-full max-w-xl p-10 md:p-16 text-center overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
          <div className={`h-full transition-all duration-1000 ${user?.emailVerified ? 'w-full bg-green-500' : 'w-1/3 bg-blue-600 animate-pulse'}`}></div>
        </div>

        <div className={`mx-auto mb-10 w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-inner transition-all duration-700 ${user?.emailVerified ? 'bg-green-50 text-green-600 scale-110' : 'bg-blue-50 text-blue-600'}`}>
          {user?.emailVerified ? (
            <CheckCircle2 className="h-14 w-14 animate-in zoom-in duration-500" />
          ) : (
            <Mail className="h-14 w-14 animate-bounce duration-[2000ms]" />
          )}
        </div>

        <h1 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">
          {user?.emailVerified ? 'Identity Confirmed' : 'Verify Your Email'}
        </h1>

        <div className="space-y-6 mb-12">
          <p className="text-gray-500 leading-relaxed font-medium text-lg px-4">
            {user?.emailVerified
              ? 'Verification complete. Welcome to the professional buyer network.'
              : 'Check your inbox for a link to activate your professional account.'}
          </p>
          {!user?.emailVerified && (
            <div className="bg-blue-50 py-3 px-6 rounded-2xl inline-block border border-blue-100">
              <span className="text-blue-700 font-black text-sm break-all">{email}</span>
            </div>
          )}
        </div>

        {!user?.emailVerified ? (
          <div className="space-y-4 max-w-sm mx-auto">
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center shadow-xl shadow-blue-100 group disabled:opacity-50"
            >
              {isChecking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />}
              I've Verified My Email
            </button>

            <button
              onClick={handleLoginRedirect}
              className="w-full bg-gray-50 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all border border-gray-100"
            >
              Return to Login
            </button>

            <div className="pt-4">
              <button
                disabled={isResending || cooldown > 0}
                onClick={handleResend}
                className="text-blue-600 text-sm font-black hover:underline disabled:opacity-50 transition-opacity"
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                ) : cooldown > 0 ? (
                  `Resend link in ${cooldown}s`
                ) : (
                  'Resend verification email'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-2" />
            <p className="text-sm font-bold text-green-600 uppercase tracking-widest">Entering Buyer Dashboard</p>
          </div>
        )}

        <div className="mt-16 pt-10 border-t border-gray-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            BrightSwitch Identity Management
          </p>
        </div>
      </div>
    </div>
  );
};
