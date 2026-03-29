import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AIAssistant } from './components/AIAssistant.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { ProductPage } from './pages/ProductPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderSuccessPage } from './pages/OrderSuccessPage.tsx';
import { OrderExpiredPage } from './pages/OrderExpiredPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { VerifyEmailPage } from './pages/VerifyEmailPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { MyAccountPage } from './pages/MyAccountPage.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { BuyerDashboard } from './pages/buyer/BuyerDashboard.tsx';
import { BlogListingPage } from './pages/blog/BlogListingPage.tsx';
import { BlogPostPage } from './pages/blog/BlogPostPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ElectricianRegisterPage } from './pages/ElectricianRegisterPage.tsx';
import { ElectricianDashboard } from './pages/electrician/ElectricianDashboard.tsx';
import { ServiceRequestPage } from './pages/hiring/ServiceRequestPage';
import { ElectricianDirectoryPage } from './pages/hiring/ElectricianDirectoryPage';
import { ServiceTrackingPage } from './pages/hiring/ServiceTrackingPage';
import { JobTrackingPage } from './pages/hiring/JobTrackingPage';
import { UserRole } from './types.ts';
import { Toaster } from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) return <Navigate to="/login" state={{ from: location }} />;

  if (!user.emailVerified && user.role !== 'electrician' && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

// Global Error Boundary to catch and display rendering crashes
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  state: { hasError: boolean, error: Error | null } = { hasError: false, error: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Global Catch @ App:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-20 text-center bg-white min-h-screen font-sans">
          <div className="max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">System Exception Detected</h1>
            <p className="text-gray-500 mb-10 font-bold">The application encountered a fatal error during the render cycle.</p>

            <div className="bg-gray-900 rounded-[2rem] p-8 text-left overflow-hidden shadow-2xl relative">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Kernel Panic @ {new Date().toLocaleTimeString()}</span>
              </div>
              <pre className="text-sm font-mono text-blue-400 overflow-auto max-h-[400px] leading-relaxed">
                <span className="text-red-400 font-black">ERROR:</span> {this.state.error?.message}
                {"\n\n"}<span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Stack Trace:</span>{"\n"}
                {this.state.error?.stack}
              </pre>
            </div>

            <div className="mt-12 flex items-center justify-center space-x-4">
              <button
                onClick={() => window.location.hash = '#/'}
                className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-all shadow-xl"
              >
                Safe Mode (Home)
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
              >
                Soft Reboot
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const AppContent: React.FC = () => {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin') || location.pathname.startsWith('/electrician-dashboard') || location.pathname.startsWith('/buyer-dashboard');

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!hideNavbar && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/order-expired" element={<OrderExpiredPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/blog" element={<BlogListingPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'warehouse']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Buyer Routes */}
          <Route path="/buyer-dashboard" element={
            <ProtectedRoute allowedRoles={['buyer', 'admin', 'electrician']}>
              <BuyerDashboard />
            </ProtectedRoute>
          } />

          {/* Electrician Routes */}
          <Route path="/electrician-register" element={<ElectricianRegisterPage />} />
          <Route path="/electrician-dashboard" element={
            <ProtectedRoute allowedRoles={['electrician', 'admin']}>
              <ElectricianDashboard />
            </ProtectedRoute>
          } />

          {/* Customer Account */}
          <Route path="/my-account" element={
            <ProtectedRoute allowedRoles={['customer', 'buyer', 'admin', 'electrician']}>
              <MyAccountPage />
            </ProtectedRoute>
          } />

          {/* Service Hiring Routes */}
          <Route path="/hire-electrician" element={<ElectricianDirectoryPage />} />
          <Route path="/service-request" element={<ServiceRequestPage />} />
          <Route path="/service-request/:orderId" element={<ServiceRequestPage />} />
          <Route path="/service-tracking/:requestId" element={<ServiceTrackingPage />} />
          <Route path="/job-tracking/:jobId" element={
            <ProtectedRoute allowedRoles={['customer', 'buyer', 'admin', 'electrician']}>
              <JobTrackingPage />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!hideNavbar && <AIAssistant />}
      {!hideNavbar && <Footer />}
      <Toaster position="top-center" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;