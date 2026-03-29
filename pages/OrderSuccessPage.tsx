import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Printer, Home, Zap, Loader2, MapPin, CreditCard, ShoppingBag, Download } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Order, SystemSettings } from '../types';

export const OrderSuccessPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'orders', id));
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
        }

        const settingsSnap = await getDoc(doc(db, 'settings', 'contact'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as SystemSettings);
        }
      } catch (err) {
        console.error("Error fetching order/settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleDownloadInvoice = async (order: Order) => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const toast = (await import('react-hot-toast')).default;
    toast.loading("Generating PDF...", { id: 'download' });

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';

    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; padding: 40px; color: #111; width: 800px; background: white;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px;">
          <div style="text-align: left;"><h1>BRIGHTSWITCH</h1><p style="font-size: 10px; font-weight: bold; color: #666; margin-top: 5px;">OFFICIAL PROCUREMENT INVOICE</p></div>
          <div style="text-align: right;"><p><strong>Order #${order.id.slice(-8).toUpperCase()}</strong></p><p>${new Date(order.createdAt).toLocaleDateString()}</p></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
          <div style="text-align: left;">
            <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Ship To</div>
            <p><strong>${order.customerName}</strong></p>
            <p>${order.shippingAddress}</p>
            <p>${order.customerPhone}</p>
            <p>${order.customerEmail}</p>
          </div>
          <div style="text-align: left;">
             <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Order Details</div>
             <p><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase()}</p>
             <p><strong>Status:</strong> ${order.status?.toUpperCase()}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead><tr><th style="text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #000; padding: 10px 0;">Item</th><th style="padding:10px 0;">Qty</th><th style="padding:10px 0;">Price</th><th style="text-align: right; padding:10px 0;">Total</th></tr></thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid #eee; text-align: left;"><strong>${item.name}</strong></td>
                <td style="padding: 15px 0; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
                <td style="padding: 15px 0; border-bottom: 1px solid #eee; text-align: center;">Rs. ${item.price.toLocaleString()}</td>
                <td style="padding: 15px 0; border-bottom: 1px solid #eee; text-align: right;">Rs. ${(item.qty * item.price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; border-top: 2px solid #000; padding-top: 15px; text-align: right;">
          <div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px;"><span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #666;">Subtotal</span><span style="font-size: 12px;">Rs. ${(order.subtotal || (order.total / (1 + (order.taxRate || 0.15)))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
          <div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px;"><span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #666;">Industrial Tax</span><span style="font-size: 12px;">Rs. ${(order.tax || (order.total - (order.subtotal || (order.total / (1 + (order.taxRate || 0.15)))))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
          ${order.codFee ? `<div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px;"><span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #666;">COD Fee</span><span style="font-size: 12px;">Rs. ${order.codFee.toLocaleString()}</span></div>` : ''}
          <div style="display: flex; justify-content: flex-end; gap: 40px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #000;">Total Payable</span><span style="font-size: 20px; font-weight: 900; color: #2563eb;">Rs. ${order.total.toLocaleString()}</span></div>
        </div>
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 10px; color: #999;">
          ${settings?.corporateAddress || 'BrightSwitch Industrial Hub • Plot 45, Industrial Area Phase 2, Peshawar'}
        </div>
      </div>
    `;

    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Order_${order.id.slice(-8).toUpperCase()}.pdf`);
      toast.success("Download successful", { id: 'download' });
    } catch (err) {
      toast.error("Download failed", { id: 'download' });
    } finally {
      document.body.removeChild(container);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600 h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-left">
      <div className="max-w-2xl w-full text-center">
        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner animate-in zoom-in duration-700">
          <CheckCircle2 size={48} />
        </div>

        <span className="inline-block px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
          Procurement Success
        </span>

        <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">System Nodes Indexed.</h1>
        <p className="text-lg text-gray-500 font-medium leading-relaxed mb-12 max-w-lg mx-auto">
          Your order <span className="font-black text-gray-900">#{id?.slice(-8).toUpperCase()}</span> has been confirmed. Our warehouse engineers are currently prepping your components for dispatch.
        </p>

        {order && (
          <div className="bg-gray-50 rounded-[3rem] p-10 mb-12 border border-gray-100 text-left animate-in slide-in-from-bottom-4 duration-700">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center">
                    <MapPin size={14} className="mr-2 text-blue-600" /> Dispatch Destination
                  </h4>
                  <p className="text-gray-900 font-black text-lg">{order.customerName}</p>
                  <p className="text-gray-500 text-sm font-bold leading-relaxed mt-1">{order.shippingAddress}</p>
                  <p className="text-gray-500 text-sm font-bold mt-1">{order.customerPhone}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center">
                    <CreditCard size={14} className="mr-2 text-blue-600" /> Settlement Method
                  </h4>
                  <p className="text-gray-900 font-black uppercase tracking-widest text-sm">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                  <ShoppingBag size={14} className="mr-2 text-blue-600" /> Order Manifest
                </h4>
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 admin-scroll">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                        <img src={item.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase mt-1">Qty: {item.qty} • Rs. {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Total Settlement</span>
                  <span className="text-2xl font-black text-gray-900 tracking-tighter">Rs. {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-1 gap-6 mb-12">
          <div className="bg-gray-900 p-8 rounded-[3rem] text-white text-left relative overflow-hidden group print:hidden">
            <Zap size={80} className="absolute -right-5 -bottom-5 text-white/5 -rotate-12 transition-transform group-hover:scale-110" />
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Technical Files</h4>
            <p className="text-sm text-gray-400 font-bold mb-6">Invoice and datasheets ready.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.print()}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center"
              >
                <Printer size={12} className="mr-2" /> Print
              </button>
              <button
                onClick={() => order && handleDownloadInvoice(order)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center shadow-lg shadow-blue-900/50"
              >
                <Download size={12} className="mr-2" /> Download
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 print:hidden">
          <Link to="/shop" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
            Continue Sourcing
          </Link>
          <Link to="/" className="bg-gray-100 text-gray-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center hover:bg-gray-200 transition-all">
            <Home size={16} className="mr-2" /> System Root
          </Link>
        </div>
      </div>
    </div>
  );
};
