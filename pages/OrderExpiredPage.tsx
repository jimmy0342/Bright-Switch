
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';

export const OrderExpiredPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-left">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <AlertCircle size={40} />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Checkout Protocol Timed Out</h1>
        <p className="text-gray-500 font-medium leading-relaxed mb-10">
          The 30-minute stock reservation for your "Buy Now" request has expired. Reserved units have been released back into the global catalog pool.
        </p>

        <div className="space-y-4">
          <Link to="/shop" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
            <RotateCcw size={16} className="mr-2" /> Re-Initialize Procurement
          </Link>
          <Link to="/" className="w-full text-gray-400 font-black uppercase text-[10px] tracking-widest flex items-center justify-center hover:text-gray-900 transition-colors">
            <ArrowLeft size={14} className="mr-2" /> Return to System Core
          </Link>
        </div>
      </div>
    </div>
  );
};
