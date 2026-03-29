import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, updateDoc, increment,
  deleteDoc, query, collection, where,
  getDocs, runTransaction, setDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Order, CODCollection, SystemSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Clock, Truck, CreditCard, ShieldCheck,
  ChevronRight, Loader2, AlertCircle, MapPin, User as UserIcon, Phone,
  Smartphone, Building2, Banknote, CheckCircle2, X, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { InstallationToggle } from '../components/InstallationToggle';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('card');
  const [needsInstallation, setNeedsInstallation] = useState(false);

  // Form state
  const [shippingDetails, setShippingDetails] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: user?.addresses?.[0] || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name === 'fullName') {
      if (!value) newErrors.fullName = 'Recipient name is required';
      else delete newErrors.fullName;
    } else if (name === 'email') {
      if (!emailRegex.test(value)) newErrors.email = 'Valid email is required';
      else delete newErrors.email;
    } else if (name === 'phone') {
      if (value.length !== 11) newErrors.phone = 'Requires exactly 11 digits';
      else delete newErrors.phone;
    } else if (name === 'address') {
      if (value.length <= 15) newErrors.address = 'Must be more than 15 characters';
      else delete newErrors.address;
    }
    setErrors(newErrors);
  };

  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const fetchOrderAndSettings = async () => {
      try {
        const [orderSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'orders', orderId)),
          getDoc(doc(db, 'settings', 'contact'))
        ]);

        if (!orderSnap.exists()) {
          toast.error('Order not found');
          navigate('/');
          return;
        }
        const data = orderSnap.data() as Order;
        if (data.status !== 'pending_payment') {
          toast.error('Order is no longer available for checkout');
          navigate('/');
          return;
        }
        setOrder(data);
        if (data.expiresAt) {
          const remaining = Math.floor((data.expiresAt - Date.now()) / 1000);
          setTimeLeft(remaining > 0 ? remaining : 0);
        }

        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as SystemSettings);
        }
      } catch (err) {
        toast.error('Failed to load order');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndSettings();
  }, [orderId, navigate]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleOrderExpiry();
    }
  }, [timeLeft]);

  const handleOrderExpiry = async () => {
    if (!orderId || !order) return;
    try {
      const q = query(collection(db, 'stockReservations'), where('orderId', '==', orderId));
      const snap = await getDocs(q);

      for (const resDoc of snap.docs) {
        const res = resDoc.data();
        await updateDoc(doc(db, 'products', res.productId), {
          reserved: increment(-res.quantity)
        });
        await deleteDoc(resDoc.ref);
      }

      await updateDoc(doc(db, 'orders', orderId), { status: 'expired' });
      navigate('/order-expired');
    } catch (err) {
      console.error("Expiry cleanup failed:", err);
    }
  };

  const scheduleCODCollection = (transaction: any, orderId: string, orderData: any) => {
    const collectionRef = doc(collection(db, "codCollections"));
    const collectionData: CODCollection = {
      id: collectionRef.id,
      orderId: orderId,
      customer: {
        name: orderData.customerName,
        phone: orderData.customerPhone,
        address: orderData.shippingAddress
      },
      expectedAmount: orderData.total,
      collectedAmount: 0,
      collectionStatus: "scheduled",
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      scheduledTimeSlot: "09:00-17:00",
      priority: orderData.total > 10000 ? "high" : "normal",
      assignedAgentId: null,
      assignedAgentName: null,
      warehouseId: "WH-MAIN-01",
      attemptCount: 0,
      maxAttempts: 3,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    transaction.set(collectionRef, collectionData);
    return collectionRef.id;
  };

  const finalizeOrder = async (method: Order['paymentMethod']) => {
    if (!orderId || !order) return;

    setIsProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const isCOD = method === 'cod';
        const orderStatus = isCOD ? 'cod_pending' : 'confirmed';
        const paymentStatus = isCOD ? 'Pending' : (method === 'bank' ? 'awaiting_bank_transfer' : 'Paid');

        // Dynamic calculations
        const taxRate = (settings?.industrialTax || 15) / 100;
        const codFeeVal = isCOD ? (settings?.codFee || 150) : 0;

        // Total already includes the base amount from product page/cart
        // We need to clarify if order.total is subtotal or net total.
        // Looking at CartPage/ProductPage, 'total' is just sum(qty * price).
        // For B2C, we should treat that as subtotal or calculate tax on top?
        // Usually, total = subtotal + tax.
        const subtotal = order.total;
        const taxAmount = subtotal * taxRate;
        const finalTotal = subtotal + taxAmount + codFeeVal;

        const updatedOrderData = {
          status: orderStatus,
          paymentStatus: paymentStatus,
          paymentMethod: method,
          subtotal: subtotal,
          tax: taxAmount,
          taxRate: taxRate,
          codFee: codFeeVal,
          total: finalTotal,
          confirmedAt: Date.now(),
          customerName: shippingDetails.fullName,
          customerEmail: shippingDetails.email,
          customerPhone: shippingDetails.phone,
          shippingAddress: shippingDetails.address,
          paymentVerified: isCOD ? true : false,
          paymentDetails: isCOD ? {
            codFee: codFeeVal,
            totalWithFee: finalTotal,
            verified: true
          } : undefined
        };

        // 1. COLLECT ALL DATA (READS)
        const reservationSnaps = await Promise.all(order.items.map(async (item) => {
          const q = query(collection(db, 'stockReservations'),
            where('orderId', '==', orderId),
            where('productId', '==', item.productId)
          );
          return await getDocs(q);
        }));

        const productSnaps = await Promise.all(order.items.map(async (item) => {
          return await transaction.get(doc(db, 'products', item.productId));
        }));

        // 2. APPLY ALL CHANGES (WRITES)
        transaction.update(doc(db, 'orders', orderId), updatedOrderData);

        order.items.forEach((item, idx) => {
          const productDoc = productSnaps[idx];
          const data = productDoc.data();
          if (data) {
            transaction.update(productDoc.ref, {
              stock: data.stock - item.qty,
              reserved: (data.reserved || 0) - item.qty,
              soldCount: increment(item.qty)
            });
          }

          // Delete reservations
          reservationSnaps[idx].forEach(d => transaction.delete(d.ref));
        });

        if (isCOD) {
          scheduleCODCollection(transaction, orderId, updatedOrderData);
        }
      });

      // Clear cart
      if (!order.isBuyNow) {
        clearCart();
      }

      toast.success('Order confirmed successfully!');

      if (needsInstallation) {
        navigate(`/hire-electrician?orderId=${orderId}`);
      } else {
        navigate(`/order-success/${orderId}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Order finalization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSubmit = () => {
    // Validation for COD limit
    if (paymentMethod === 'cod' && order!.total > 20000) {
      toast.error('COD is only available for orders up to Rs. 20,000');
      return;
    }
    finalizeOrder(paymentMethod);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const PAYMENT_METHODS = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, desc: 'Secure online payment', disabled: false },
    { id: 'bank', name: 'Bank Transfer', icon: Building2, desc: 'IBFT / Online Banking', disabled: false },
    { id: 'easypaisa', name: 'EasyPaisa', icon: Smartphone, desc: 'Instant mobile wallet', disabled: false },
    { id: 'jazzcash', name: 'JazzCash', icon: Smartphone, desc: 'Quick mobile account', disabled: false },
    { id: 'cod', name: 'Cash on Delivery', icon: Banknote, desc: 'Pay at your doorstep', disabled: (order?.total || 0) > 20000 }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-20 text-left">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gray-900 text-white p-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-left">
              <h1 className="text-3xl font-black tracking-tight">Checkout Terminal</h1>
              <p className="text-gray-400 font-medium mt-1">Order Index: #{orderId?.slice(-8).toUpperCase()}</p>
            </div>
            <div className="bg-blue-600 px-6 py-3 rounded-2xl flex items-center space-x-3 shadow-xl shadow-blue-900/40">
              <Clock size={20} className="animate-pulse" />
              <span className="font-black text-xl">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-0">
            <div className="md:col-span-7 p-10 space-y-12 border-r border-gray-50">
              <div className="flex items-center space-x-4 overflow-x-auto pb-4">
                {[1, 2].map(s => (
                  <div key={s} className="flex items-center space-x-3 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>{s}</div>
                    <span className={`text-xs font-black uppercase tracking-widest ${step >= s ? 'text-gray-900' : 'text-gray-400'
                      }`}>{s === 1 ? 'Logistics' : 'Settlement'}</span>
                    {s < 2 && <ChevronRight size={14} className="text-gray-300" />}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <h3 className="text-2xl font-black text-gray-900 flex items-center tracking-tight">
                    <MapPin className="mr-3 text-blue-600" /> Dispatch Logistics
                  </h3>
                  <div className="space-y-5">
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text" placeholder="Authorized Recipient Name"
                        value={shippingDetails.fullName}
                        onChange={e => {
                          setShippingDetails({ ...shippingDetails, fullName: e.target.value });
                          if (errors.fullName) setErrors(prev => { const n = { ...prev }; delete n.fullName; return n; });
                        }}
                        onBlur={() => validateField('fullName', shippingDetails.fullName)}
                        className={`w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 font-bold ${errors.fullName ? 'ring-2 ring-red-500' : 'focus:ring-blue-600'}`}
                      />
                      {errors.fullName && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-4">{errors.fullName}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <input
                          type="email" placeholder="Billing Email"
                          value={shippingDetails.email}
                          onChange={e => {
                            setShippingDetails({ ...shippingDetails, email: e.target.value });
                            if (errors.email) setErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                          }}
                          onBlur={() => validateField('email', shippingDetails.email)}
                          className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 font-bold ${errors.email ? 'ring-2 ring-red-500' : 'focus:ring-blue-600'}`}
                        />
                        {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-4">{errors.email}</p>}
                      </div>
                      <div className="flex flex-col">
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Contact Terminal (11 Digits)"
                            value={shippingDetails.phone}
                            onChange={e => {
                              setShippingDetails({ ...shippingDetails, phone: e.target.value.replace(/\D/g, '') });
                              if (errors.phone) setErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                            }}
                            onBlur={() => validateField('phone', shippingDetails.phone)}
                            className={`w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 font-bold ${errors.phone ? 'ring-2 ring-red-500' : 'focus:ring-blue-600'}`}
                          />
                        </div>
                        {errors.phone && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-4">{errors.phone}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <textarea
                        placeholder="Complete Shipping Address (Building, Street, Area, City)"
                        rows={3} value={shippingDetails.address}
                        onChange={e => {
                          setShippingDetails({ ...shippingDetails, address: e.target.value });
                          if (errors.address) setErrors(prev => { const n = { ...prev }; delete n.address; return n; });
                        }}
                        onBlur={() => validateField('address', shippingDetails.address)}
                        className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 font-bold resize-none ${errors.address ? 'ring-2 ring-red-500' : 'focus:ring-blue-600'}`}
                      />
                      {errors.address && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-4">{errors.address}</p>}
                    </div>
                    {order && (
                      <InstallationToggle
                        cartItems={order.items.map(i => ({
                          ...i,
                          id: i.productId,
                          quantity: i.qty,
                          price: { base: i.price, cost: 0, b2b: i.price, taxRate: 0, unit: 'pcs' },
                          images: { main: i.image || '', gallery: [] }
                        } as any))}
                        onServiceRequested={setNeedsInstallation}
                        className="mb-8"
                      />
                    )}

                    <button
                      onClick={() => {
                        const newErrors: { [key: string]: string } = {};
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                        if (!shippingDetails.fullName) newErrors.fullName = 'Recipient name is required';
                        if (!emailRegex.test(shippingDetails.email)) newErrors.email = 'Valid email is required';
                        if (shippingDetails.phone.length !== 11) newErrors.phone = 'Requires exactly 11 digits';
                        if (shippingDetails.address.length <= 15) newErrors.address = 'Must be more than 15 characters';

                        if (Object.keys(newErrors).length > 0) {
                          setErrors(newErrors);
                          toast.error('Please correct the errors in the form');
                          return;
                        }
                        setStep(2);
                      }}
                      className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                    >
                      Confirm Logistics Node
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h3 className="text-2xl font-black text-gray-900 flex items-center tracking-tight">
                    <CreditCard className="mr-3 text-blue-600" /> Payment Selection
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        disabled={method.disabled}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all group ${paymentMethod === method.id
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-gray-100 bg-white hover:border-blue-200'
                          } ${method.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center space-x-5 text-left">
                          <div className={`p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform ${paymentMethod === method.id ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'
                            }`}>
                            <method.icon size={24} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg">{method.name}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">{method.desc}</p>
                          </div>
                        </div>
                        {paymentMethod === method.id && (
                          <div className="bg-blue-600 rounded-full p-1 text-white"><CheckCircle2 size={24} /></div>
                        )}
                        {method.disabled && (
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Limit Exceeded</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="bg-gray-900 p-8 rounded-3xl text-white space-y-6">
                    {paymentMethod === 'bank' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">HBL Corporate Account</p>
                        <div className="space-y-4 font-mono text-sm">
                          <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-gray-500">Title:</span>
                            <span className="font-bold">BrightSwitch Electrical</span>
                          </div>
                          <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-gray-500">Number:</span>
                            <span className="font-bold">1234 5678 9012 34</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-4">Instruction: Use Order ID as reference. Email receipt to payments@brightswitch.pk</p>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'cod' && (
                      <div className="flex items-start space-x-4 animate-in fade-in">
                        <div className="bg-blue-600/20 p-3 rounded-xl text-blue-400"><Banknote size={20} /></div>
                        <p className="text-sm font-medium text-gray-300 leading-relaxed">A standard Rs. {settings?.codFee ?? 150} processing fee applies to all COD orders. Pay Rs. {((order?.total || 0) + (settings?.codFee ?? 150)).toLocaleString()} in cash upon delivery.</p>
                      </div>
                    )}
                    {paymentMethod === 'card' && (
                      <div className="flex items-center space-x-4 animate-in fade-in">
                        <ShieldCheck size={24} className="text-green-400" />
                        <p className="text-sm font-medium text-gray-300">Your connection is encrypted via Stripe secure processing node.</p>
                      </div>
                    )}

                    <button
                      onClick={handlePaymentSubmit} disabled={isProcessing}
                      className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center space-x-4"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : (
                        <>
                          <ShieldCheck size={20} />
                          <span>FINALIZE SETTLEMENT (Rs. {((order?.total || 0) + (paymentMethod === 'cod' ? (settings?.codFee ?? 150) : 0)).toLocaleString()})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button onClick={() => setStep(1)} className="w-full text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-gray-600 transition-colors">Return to Logistics Node</button>
                </div>
              )}
            </div>

            <div className="md:col-span-5 bg-gray-50/50 p-10 space-y-10">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                  <Truck size={14} className="mr-2 text-blue-600" /> Dispatch To
                </h4>
                <div className="space-y-2">
                  <p className="font-black text-gray-900 text-sm">{shippingDetails.fullName || 'Authorized Recipient'}</p>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">{shippingDetails.address || 'Specify logistics node...'}</p>
                  <p className="text-xs text-gray-500 font-bold">{shippingDetails.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Order Manifest Summary</h4>
                <div className="space-y-6">
                  {order?.items.map((item, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={item.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black text-gray-900 text-sm leading-tight line-clamp-2">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Qty: {item.qty} • Rs. {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-400 font-bold text-xs uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-gray-900">Rs. {order.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-bold text-xs uppercase tracking-widest">
                    <span>Industrial Tax (${settings?.industrialTax || 15}%)</span>
                    <span className="text-gray-900">Rs. {(order.total * (settings?.industrialTax || 15) / 100).toLocaleString()}</span>
                  </div>
                  {paymentMethod === 'cod' && (
                    <div className="flex justify-between text-blue-600 font-bold text-xs uppercase tracking-widest">
                      <span>COD Delivery Fee</span>
                      <span>Rs. {(settings?.codFee || 150).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t flex justify-between">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Net Payable</span>
                    <span className="text-xl font-black text-blue-600">
                      Rs. {(order.total * (1 + (settings?.industrialTax || 15) / 100) + (paymentMethod === 'cod' ? (settings?.codFee || 150) : 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white text-left relative overflow-hidden shadow-2xl shadow-blue-100">
                <Zap size={120} className="absolute -bottom-10 -right-10 text-white/10" />
                <h5 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center">
                  <ShieldCheck size={18} className="mr-2" /> Global Safety Promise
                </h5>
                <p className="text-xs text-blue-100 font-medium leading-relaxed">Every component index is certified for high breaking capacity and industrial operational safety standards.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};