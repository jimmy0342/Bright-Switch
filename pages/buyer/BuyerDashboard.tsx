import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, where, onSnapshot, doc,
  addDoc, writeBatch, orderBy, limit, updateDoc, setDoc, getDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, FileText, Package,
  Building2, LogOut, Search,
  CheckCircle2, Clock, AlertCircle, DollarSign,
  ArrowRight, Eye, Send, Save,
  MapPin, Printer, Loader2, Zap, X, Download, Wrench, ChevronRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Product, Quote, Order, ActivityLogItem, QuoteItem, Invoice, SystemSettings, ServiceRequest, ServiceJob } from '../../types';

// --- Components ---

const BuyerSidebar: React.FC<{ activeTab: string; setActiveTab: (t: string) => void }> = ({ activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'catalog', label: 'B2B Catalog', icon: ShoppingBag },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'reports', label: 'Analytics', icon: Clock },
    { id: 'profile', label: 'Company Profile', icon: Building2 },
  ];

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8 border-b">
        <div className="flex items-center space-x-2 text-blue-600 mb-2">
          <Zap size={24} className="fill-current" />
          <span className="font-black text-xl tracking-tighter">BrightSwitch</span>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.companyName || 'Business Account'}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === item.id
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-200'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={() => logout()}
          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

// --- View: Overview ---

const OverviewTab: React.FC<{ products: Product[]; orders: Order[] }> = ({ products, orders }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);

  useEffect(() => {
    if (!user) return;

    const errorCallback = (err: any) => {
      console.warn("Buyer Overview snapshot error:", err.message);
    };

    const qLogs = query(collection(db, 'users', user.uid, 'activityLog'), orderBy('timestamp', 'desc'), limit(5));

    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLogItem)));
    }, errorCallback);

    return () => { unsubLogs(); };
  }, [user]);

  const stats = [
    { label: 'Total Products', value: `${products.length} Items`, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Orders', value: orders.filter(o => ['Processing', 'Shipped'].includes(o.status)).length, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
    {
      label: 'Monthly Spend', value: `Rs. ${orders.filter(o => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.status !== 'Cancelled';
      }).reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}`, icon: Clock, color: 'text-green-600', bg: 'bg-green-50'
    },
  ];

  const lowStockProducts = useMemo(() => {
    // This assumes we have a list of products available in context or fetched here
    // For simplicity, we could fetch them or pass them down. 
    // Let's assume for this widget we fetch all products and filter
    return []; // Placeholder until we add the product fetch logic to OverviewTab
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border shadow-sm">
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-gray-900 mt-2">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <Clock size={20} className="mr-2 text-blue-600" /> Recent Activity
          </h3>
          <div className="space-y-4">
            {logs.length > 0 ? logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                <div className="mt-1 bg-white border p-2 rounded-xl shadow-sm text-left">
                  {log.type.includes('quote') ? <FileText size={16} className="text-blue-600" /> : <Package size={16} className="text-orange-600" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{log.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-gray-400 font-medium">No recent activities to show.</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[2rem] text-white relative overflow-hidden flex flex-col justify-center text-left">
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-4 leading-tight">Fast Procurement <br />Starts Here</h3>
              <p className="text-blue-100 mb-8 max-w-xs leading-relaxed">Direct SKU entry system now active for industrial electricians.</p>
              <div className="flex space-x-3">
                <button className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl transition-all">Quick Order</button>
              </div>
            </div>
            <Zap size={200} className="absolute -right-20 -bottom-20 text-white/10 rotate-12" />
          </div>

          <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center text-red-600">
              <AlertCircle size={20} className="mr-2" /> Stock Watchlist
            </h3>
            <p className="text-sm text-gray-500 mb-4">Real-time inventory highlights for your frequently ordered items.</p>
            <div className="space-y-3">
              {products.filter(p => orders.some(o => o.items.some(oi => oi.productId === p.id))).slice(0, 3).map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                  <span className="font-bold text-sm truncate max-w-[150px]">{p.name}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${p.inventory.stock > (p.inventory.lowStockThreshold || 10) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.inventory.stock > (p.inventory.lowStockThreshold || 10) ? `In Stock (${p.inventory.stock}+)` : `Low Stock (${p.inventory.stock})`}
                  </span>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4 italic">Order items to see stock highlights.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: B2B Catalog ---

const CatalogTab: React.FC<{ products: Product[]; settings: SystemSettings | null }> = ({ products, settings }) => {
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'transfer' | 'easypaisa'>('cod');
  const [activeImage, setActiveImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const allImages = useMemo(() => {
    if (!activeProduct) return [];
    return [activeProduct.images.main, ...(activeProduct.images.gallery || [])];
  }, [activeProduct]);

  // Products are now passed as props from the parent Dashboard controller

  const openProductModal = (p: Product) => {
    setActiveProduct(p);
    setActiveImage(0);
    const existingQty = selectedItems[p.id] || 10;
    setModalQty(existingQty < 10 ? 10 : existingQty);
  };

  const confirmModalSelection = () => {
    if (!activeProduct) return;
    setSelectedItems(prev => ({ ...prev, [activeProduct.id]: modalQty }));
    setActiveProduct(null);
    toast.success(`Updated ${activeProduct.name} batch`);
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setSelectedItems(prev => ({ ...prev, [id]: qty }));
  };

  const calculatePrice = (product: Product, qty: number) => {
    const tiers = product.b2b?.priceTiers || [];
    const sortedTiers = [...tiers].sort((a, b) => b.qty - a.qty);
    const applicableTier = sortedTiers.find(t => qty >= t.qty);
    return applicableTier ? applicableTier.price : (product.price?.b2b || product.price?.cost || product.price?.base || 0);
  };

  const selectedCount = Object.keys(selectedItems).length;
  const subtotal = useMemo(() => {
    return Object.entries(selectedItems).reduce((acc, [id, qty]) => {
      const prod = products.find(p => p.id === id);
      if (!prod) return acc;
      return acc + (calculatePrice(prod, qty as number) * (qty as number));
    }, 0);
  }, [selectedItems, products]);

  const placeDirectOrder = async () => {
    if (selectedCount === 0 || !user) return;

    // Check credit limit
    if (user.creditLimit && (user.creditUsed || 0) + subtotal > user.creditLimit) {
      toast.error('Order exceeds available credit limit. Please contact your account manager.');
      return;
    }

    const loadingToast = toast.loading('Processing B2B direct order...');

    try {
      const orderRef = doc(collection(db, 'orders'));
      const items = Object.entries(selectedItems).map(([id, qty]) => {
        const p = products.find(prod => prod.id === id)!;
        const finalUnitPrice = calculatePrice(p, qty as number);
        return {
          productId: p.id,
          name: p.name,
          qty: qty as number,
          price: finalUnitPrice,
          image: p.images?.main || null
        };
      });

      const taxRate = (settings?.industrialTax || 15) / 100;
      const codFee = paymentMethod === 'cod' ? (settings?.codFee || 0) : 0;
      const totalAmount = (subtotal * (1 + taxRate)) + codFee;

      const orderData: Partial<Order> = {
        userId: user.uid,
        customerEmail: user.email,
        customerName: user.name || 'B2B Customer',
        userCompanyName: user.companyName || 'Corporate Client',
        source: 'direct',
        items,
        subtotal,
        tax: subtotal * taxRate,
        taxRate: taxRate,
        codFee,
        total: totalAmount,
        status: 'confirmed',
        orderType: 'b2b',
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Credit',
        shippingAddress: user.addresses?.[0] || 'Company HQ',
        createdAt: Date.now()
      };

      await setDoc(orderRef, orderData);

      // Create Invoice automatically
      const invoiceRef = doc(collection(db, 'invoices'));
      await setDoc(invoiceRef, {
        buyerId: user.uid,
        companyName: user.companyName || 'Corporate Client',
        invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        orderId: orderRef.id,
        items,
        subtotal,
        tax: subtotal * taxRate,
        taxRate: taxRate,
        total: totalAmount,
        status: 'sent',
        paymentTerms: user.paymentTerms === 'Net 60' ? 60 : (user.paymentTerms === 'Net 30' ? 30 : 15),
        dueDate: Date.now() + (user.paymentTerms === 'Net 60' ? 60 * 86400000 : (user.paymentTerms === 'Net 30' ? 30 * 86400000 : 15 * 86400000)),
        createdAt: Date.now()
      });

      // Update credit used
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        creditUsed: (user.creditUsed || 0) + totalAmount
      });

      await addDoc(collection(db, 'users', user.uid, 'activityLog'), {
        type: 'order_placed',
        message: `Direct B2B order #${orderRef.id.slice(-6).toUpperCase()} placed via credit account.`,
        timestamp: Date.now(),
        read: false
      });

      setSelectedItems({});
      toast.success('B2B Order Confirmed!', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order', { id: loadingToast });
    }
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">B2B Selection Catalog</h2>
          <p className="text-gray-500">Exclusive wholesale pricing for high-volume procurement.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SKU or component name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border bg-white focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
          <div
            key={p.id}
            onClick={() => openProductModal(p)}
            className={`bg-white rounded-[2rem] border-2 transition-all p-6 cursor-pointer group hover:shadow-xl text-left ${selectedItems[p.id] ? 'border-blue-600 shadow-lg shadow-blue-50 bg-blue-50/20' : 'border-gray-100 hover:border-blue-200'
              }`}
          >
            <div className="aspect-video rounded-2xl bg-gray-50 mb-6 overflow-hidden border">
              <img src={p.images?.main} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-900 line-clamp-1">{p.name}</h4>
              {selectedItems[p.id] && <CheckCircle2 className="text-blue-600 fill-white" size={20} />}
            </div>
            <p className="text-xs text-gray-400 font-mono mb-4 uppercase">{p.sku}</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">B2B Base Rate</p>
                <p className="text-xl font-black text-blue-600">Rs. {calculatePrice(p, selectedItems[p.id] || 10).toLocaleString()}</p>
                {selectedItems[p.id] && (
                  <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Batch Qty: {selectedItems[p.id]}</p>
                )}
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {selectedItems[p.id] ? 'Update' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeProduct && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-[3rem] shadow-2xl p-10 overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setActiveProduct(null)} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>

            <div className="flex flex-col items-center text-center">
              <div
                className="w-48 h-48 rounded-[2rem] border overflow-hidden mb-4 cursor-zoom-in active:scale-95 transition-transform"
                onClick={() => setShowLightbox(true)}
              >
                <img src={allImages[activeImage]} alt="" className="w-full h-full object-cover" />
              </div>

              {allImages.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto max-w-full pb-1 scrollbar-hide">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-12 h-12 rounded-xl border-2 transition-all overflow-hidden flex-shrink-0 ${activeImage === idx ? 'border-blue-600' : 'border-gray-100 hover:border-gray-300'
                        }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{activeProduct.sku}</p>
              <h3 className="text-2xl font-black text-gray-900 mb-6">{activeProduct.name}</h3>

              <div className="bg-gray-50 rounded-3xl p-8 w-full border border-gray-100 mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Procurement Volume</p>
                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={() => setModalQty(q => Math.max(10, q - 1))}
                    disabled={modalQty <= 10}
                    className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center text-2xl font-bold shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-all"
                  >
                    -
                  </button>
                  <span className="text-4xl font-black text-gray-900 w-24">{modalQty}</span>
                  <button
                    onClick={() => setModalQty(q => q + 1)}
                    className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center text-2xl font-bold shadow-sm hover:bg-gray-50 transition-all"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-4 italic">Minimum order quantity for B2B accounts: 10 units</p>
              </div>

              <div className="flex justify-between items-center w-full mb-8 px-4">
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Unit Price</p>
                  <p className="text-2xl font-black text-gray-900">Rs. {calculatePrice(activeProduct, modalQty).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selection Total</p>
                  <p className="text-2xl font-black text-blue-600">Rs. {(calculatePrice(activeProduct, modalQty) * modalQty).toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={confirmModalSelection}
                className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
              >
                <Zap size={20} className="fill-current" />
                <span>Confirm Selection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="fixed bottom-10 left-64 right-10 z-[60] bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10 text-left">
          <div className="flex items-center space-x-8 px-4">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Items Selected</p>
              <p className="text-xl font-black">{selectedCount} Products</p>
            </div>
            <div className="h-10 w-px bg-gray-800"></div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Calculated Total</p>
              <p className="text-xl font-black text-blue-400">Rs. {((subtotal * (1 + (settings?.industrialTax || 15) / 100)) + (paymentMethod === 'cod' ? (settings?.codFee || 0) : 0)).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-800 p-1.5 rounded-2xl border border-gray-700">
              {[
                { id: 'cod', label: 'COD', fee: settings?.codFee },
                { id: 'card', label: 'Card' },
                { id: 'transfer', label: 'Bank' },
                { id: 'easypaisa', label: 'EP' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${paymentMethod === m.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {m.label}
                  {m.id !== 'cod' && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[6px] px-1 rounded-full animate-pulse">Wait</span>
                  )}
                </button>
              ))}
            </div>
            {paymentMethod !== 'cod' && (
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">Coming Soon</p>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setSelectedItems({})} className="px-6 py-3 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors">Clear</button>
            <button
              onClick={placeDirectOrder}
              disabled={paymentMethod !== 'cod'}
              className={`bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-blue-700 shadow-xl shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ShoppingBag size={18} />
              <span>Confirm Order</span>
            </button>
          </div>
        </div>
      )}
      {showLightbox && activeProduct && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-8 right-8 text-white/50 hover:text-white p-2 transition-colors"
          >
            <X size={40} />
          </button>

          <div className="w-full max-w-5xl aspect-auto max-h-[80vh] flex items-center justify-center relative group">
            <button
              onClick={() => setActiveImage(prev => (prev === 0 ? allImages.length - 1 : prev - 1))}
              className="absolute left-4 p-4 text-white/30 hover:text-white transition-colors bg-white/5 rounded-full backdrop-blur-md"
            >
              <ChevronRight size={32} className="rotate-180" />
            </button>

            <img
              src={allImages[activeImage]}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg animate-in fade-in zoom-in-95 duration-300"
            />

            <button
              onClick={() => setActiveImage(prev => (prev === allImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 p-4 text-white/30 hover:text-white transition-colors bg-white/5 rounded-full backdrop-blur-md"
            >
              <ChevronRight size={32} />
            </button>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto max-w-full p-2 scrollbar-hide">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === idx ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-6">
            Image {activeImage + 1} of {allImages.length}
          </p>
        </div>
      )}
    </div>
  );
};

// --- View: Quotes ---

// QuotesTab removed as per user request to streamline procurement.

// --- View: Orders ---

// --- Invoice Helpers ---
const handlePrintInvoice = (order: Order, settings: SystemSettings | null) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return toast.error("Pop-up blocked");

  printWindow.document.write('<html><head><title>Generating Invoice...</title></head><body><h1>Loading Financial Documentation...</h1></body></html>');

  const subtotal = order.subtotal || (order.total / (1 + (order.taxRate || 0.15)));
  const tax = order.tax || (order.total - subtotal);
  const codFee = order.codFee || 0;

  const htmlContent = `
    <html>
      <head>
        <title>VAT INVOICE - #${order.id.slice(-6).toUpperCase()}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 50px; color: #111; max-width: 850px; margin: auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
          .brand h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
          .meta { text-align: right; }
          .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 50px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #000; padding: 15px 10px; }
          td { padding: 20px 10px; border-bottom: 1px solid #eee; font-size: 14px; }
          .totals { margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; text-align: right; }
          .total-row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px; }
          .total-label { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #666; }
          .total-value { font-size: 18px; font-weight: 900; }
          .grand-total { font-size: 28px; color: #2563eb; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand"><h1>BrightSwitch</h1><p>OFFICIAL B2B INVOICE</p></div>
          <div class="meta"><p><strong>ORDER NO:</strong> ${order.id.slice(-8).toUpperCase()}</p><p><strong>DATE:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p></div>
        </div>
        <div style="font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 40px 0; letter-spacing: -1px;">VAT Invoice</div>
        <div class="grid">
          <div>
            <div class="section-title">Billing To</div>
            <p><strong>${order.userCompanyName || order.customerName}</strong></p>
            <p>${order.shippingAddress}</p>
            <p>${order.customerEmail}</p>
          </div>
          <div class="meta">
             <div class="section-title">Payment Method</div>
             <p><strong>${order.paymentMethod?.toUpperCase()}</strong></p>
             <p>Status: ${order.paymentStatus}</p>
          </div>
        </div>
        <table>
          <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td style="text-align:center">${item.qty}</td>
                <td style="text-align:right">Rs. ${item.price.toLocaleString()}</td>
                <td style="text-align:right">Rs. ${(item.qty * item.price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
           <div class="total-row"><span class="total-label">Subtotal</span><span class="total-value">Rs. ${subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
           <div class="total-row"><span class="total-label">Industrial Tax</span><span class="total-value">Rs. ${tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
           ${codFee > 0 ? `<div class="total-row"><span class="total-label">COD Delivery Fee</span><span class="total-value">Rs. ${codFee.toLocaleString()}</span></div>` : ''}
           <div class="total-row"><span class="total-label" style="font-size:20px; color:#000;">Total Payable</span><span class="total-value grand-total">Rs. ${order.total.toLocaleString()}</span></div>
        </div>
        <div style="margin-top: 80px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 10px; color: #999;">
          ${settings?.corporateAddress || 'BrightSwitch Industrial Hub • Plot 45, Industrial Area Phase 2, Peshawar'}
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

const handleDownloadInvoice = async (order: Order, settings: SystemSettings | null) => {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  toast.loading("Preparing Download...", { id: 'download-buyer' });

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';

  const subtotal = order.subtotal || (order.total / (1 + (order.taxRate || 0.15)));
  const tax = order.tax || (order.total - subtotal);
  const codFee = order.codFee || 0;

  const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; padding: 50px; color: #111; width: 800px; background: white;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px;">
          <div style="text-align: left;"><h1>BRIGHTSWITCH</h1><p style="font-size: 10px; font-weight: 800; color: #666; margin-top: 5px;">OFFICIAL B2B INVOICE</p></div>
          <div style="text-align: right;"><p><strong>ORDER NO:</strong> ${order.id.slice(-8).toUpperCase()}</p><p><strong>DATE:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p></div>
        </div>
        <div style="font-size: 32px; font-weight: 900; text-transform: uppercase; margin: 40px 0; letter-spacing: -1px; text-align: left;">Tax Invoice</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 40px;">
          <div style="text-align: left;">
            <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Billing To</div>
            <p><strong>${order.userCompanyName || order.customerName}</strong></p>
            <p>${order.shippingAddress}</p>
            <p>${order.customerEmail}</p>
          </div>
          <div style="text-align: right;">
             <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Settlement</div>
             <p><strong>${order.paymentMethod?.toUpperCase()}</strong></p>
             <p>Status: ${order.paymentStatus}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead><tr><th style="text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #000; padding: 15px 10px;">Description</th><th style="padding:15px 10px;">Qty</th><th style="padding:15px 10px;">Rate</th><th style="text-align: right; padding:15px 10px;">Amount</th></tr></thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr>
                <td style="padding: 20px 10px; border-bottom: 1px solid #eee; font-size: 14px; text-align: left;"><strong>${item.name}</strong></td>
                <td style="padding: 20px 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
                <td style="padding: 20px 10px; border-bottom: 1px solid #eee; text-align: center;">Rs. ${item.price.toLocaleString()}</td>
                <td style="padding: 20px 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${(item.qty * item.price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; text-align: right;">
          <div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #666;">Subtotal</span><span>Rs. ${subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
          <div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #666;">Industrial Tax</span><span>Rs. ${tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
          ${codFee > 0 ? `<div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #666;">COD Delivery Fee</span><span>Rs. ${codFee.toLocaleString()}</span></div>` : ''}
          <div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #000;">Total Payable</span><span style="font-size: 28px; font-weight: 900; color: #2563eb;">Rs. ${order.total.toLocaleString()}</span></div>
        </div>
        <div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 10px; color: #999;">
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
    pdf.save(`Invoice_${order.id.slice(-6).toUpperCase()}.pdf`);
    toast.success("Download successful", { id: 'download-buyer' });
  } catch (err) {
    toast.error("Generation failed", { id: 'download-buyer' });
  } finally {
    document.body.removeChild(container);
  }
};

const OrdersTab: React.FC<{ settings: SystemSettings | null }> = ({ settings }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleReorder = async (originalOrder: Order) => {
    const loadingToast = toast.loading('Cloning order to new draft...');
    try {
      // For now, we'll just use the same direct order logic to place a new one
      // In a more complex app, we might add these to a cart first
      const orderRef = doc(collection(db, 'orders'));
      const newOrderData: Partial<Order> = {
        ...originalOrder,
        id: undefined,
        status: 'confirmed',
        paymentStatus: 'Credit',
        createdAt: Date.now(),
        source: 'direct'
      };
      delete newOrderData.id;

      await setDoc(orderRef, newOrderData);

      // Create Invoice automatically
      const invoiceRef = doc(collection(db, 'invoices'));
      await setDoc(invoiceRef, {
        buyerId: user!.uid,
        companyName: user!.companyName,
        invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        orderId: orderRef.id,
        items: originalOrder.items,
        subtotal: originalOrder.total / 1.15, // Approx subtotal
        tax: originalOrder.total - (originalOrder.total / 1.15),
        total: originalOrder.total,
        status: 'sent',
        paymentTerms: user!.paymentTerms === 'Net 60' ? 60 : (user!.paymentTerms === 'Net 30' ? 30 : 15),
        dueDate: Date.now() + (user!.paymentTerms === 'Net 60' ? 60 * 86400000 : (user!.paymentTerms === 'Net 30' ? 30 * 86400000 : 15 * 86400000)),
        createdAt: Date.now()
      });

      // Update credit used
      const userRef = doc(db, 'users', user!.uid);
      await updateDoc(userRef, {
        creditUsed: (user!.creditUsed || 0) + originalOrder.total
      });

      await addDoc(collection(db, 'users', user!.uid, 'activityLog'), {
        type: 'order_placed',
        message: `Quick reorder #${orderRef.id.slice(-6).toUpperCase()} placed based on history.`,
        timestamp: Date.now(),
        read: false
      });

      toast.success('Quick reorder successful!', { id: loadingToast });
    } catch (err) {
      toast.error('Reorder failed', { id: loadingToast });
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <p className="text-gray-500">Track your procurement history and perform quick reorders.</p>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-5">Order ID</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Items</th>
              <th className="px-8 py-5">Value</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5"><span className="font-black text-gray-900">#{o.id.slice(-6).toUpperCase()}</span></td>
                <td className="px-8 py-5 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-8 py-5 font-bold text-gray-900">{o.items.length} Products</td>
                <td className="px-8 py-5 font-bold text-blue-600">Rs. {o.total.toLocaleString()}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    o.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                      o.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                    }`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button onClick={() => handlePrintInvoice(o, settings)} className="p-2 text-gray-400 hover:text-gray-900 transition-all" title="Print Invoice">
                    <Printer size={18} />
                  </button>
                  <button onClick={() => handleDownloadInvoice(o, settings)} className="p-2 text-gray-400 hover:text-blue-600 transition-all" title="Download PDF">
                    <Download size={18} />
                  </button>
                  <button onClick={() => handleReorder(o)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all">
                    Reorder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- View: Invoices ---

const InvoicesTab: React.FC<{ settings: SystemSettings | null }> = ({ settings }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const handleInvoicedPrint = async (orderId: string) => {
    const d = await getDoc(doc(db, 'orders', orderId));
    if (d.exists()) handlePrintInvoice({ id: d.id, ...d.data() } as Order, settings);
  };

  const handleInvoicedDownload = async (orderId: string) => {
    const d = await getDoc(doc(db, 'orders', orderId));
    if (d.exists()) handleDownloadInvoice({ id: d.id, ...d.data() } as Order, settings);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'invoices'), where('buyerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Invoice History</h2>
        <p className="text-gray-500">Manage your business billing, credit terms, and payment status.</p>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-5">Invoice #</th>
              <th className="px-8 py-5">Order ID</th>
              <th className="px-8 py-5">Due Date</th>
              <th className="px-8 py-5">Total Amount</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5"><span className="font-black text-gray-900">{inv.invoiceNumber}</span></td>
                <td className="px-8 py-5 text-sm text-gray-400">#{inv.orderId?.slice(-6).toUpperCase()}</td>
                <td className="px-8 py-5 text-sm font-bold text-red-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="px-8 py-5 font-bold text-gray-900">Rs. {inv.total.toLocaleString()}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-700 animate-pulse' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button onClick={() => handleInvoicedPrint(inv.orderId)} className="p-2 text-gray-400 hover:text-gray-900 transition-all" title="Print Invoice">
                    <Printer size={18} />
                  </button>
                  <button onClick={() => handleInvoicedDownload(inv.orderId)} className="p-2 text-gray-400 hover:text-blue-600 transition-all" title="Download PDF">
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- View: Quick Order ---

const QuickOrderTab: React.FC<{ products: Product[]; settings: SystemSettings | null }> = ({ products, settings }) => {
  const { user } = useAuth();
  const [skuInput, setSkuInput] = useState('');
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'transfer' | 'easypaisa'>('cod');

  // Products are now passed as props from the parent Dashboard controller

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.sku.toLowerCase() === skuInput.toLowerCase() || p.name.toLowerCase().includes(skuInput.toLowerCase()));
    if (!prod) {
      toast.error('Product not found in B2B database');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) {
        return prev.map(item => item.product.id === prod.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product: prod, qty: 1 }];
    });
    setSkuInput('');
    toast.success(`Added ${prod.name}`);
  };

  const calculateTierPrice = (product: Product, qty: number) => {
    const tiers = product.b2b?.priceTiers || [];
    const sortedTiers = [...tiers].sort((a, b) => b.qty - a.qty);
    const applicableTier = sortedTiers.find(t => qty >= t.qty);
    return applicableTier ? applicableTier.price : (product.price?.b2b || product.price?.cost || product.price?.base || 0);
  };

  const subtotal = cart.reduce((acc, item) => acc + (calculateTierPrice(item.product, item.qty) * item.qty), 0);

  const placeBatchOrder = async () => {
    if (cart.length === 0 || !user) return;
    const loadingToast = toast.loading('Processing batch order...');
    try {
      const orderRef = doc(collection(db, 'orders'));
      const items = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        qty: item.qty,
        price: calculateTierPrice(item.product, item.qty),
        image: item.product.images?.main
      }));

      const taxRate = (settings?.industrialTax || 15) / 100;
      const codFee = paymentMethod === 'cod' ? (settings?.codFee || 0) : 0;
      const totalAmount = (subtotal * (1 + taxRate)) + codFee;

      await setDoc(orderRef, {
        userId: user.uid,
        customerEmail: user.email,
        customerName: user.name,
        userCompanyName: user.companyName,
        source: 'direct',
        items,
        subtotal,
        tax: subtotal * taxRate,
        taxRate: taxRate,
        codFee,
        total: totalAmount,
        status: 'confirmed',
        orderType: 'b2b',
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Credit',
        shippingAddress: user.addresses?.[0] || 'Company HQ',
        createdAt: Date.now()
      });

      // Create Invoice automatically
      const invoiceRef = doc(collection(db, 'invoices'));
      await setDoc(invoiceRef, {
        buyerId: user.uid,
        companyName: user.companyName,
        invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        orderId: orderRef.id,
        items,
        subtotal,
        tax: subtotal * taxRate,
        taxRate: taxRate,
        total: totalAmount,
        status: 'sent',
        paymentTerms: user.paymentTerms === 'Net 60' ? 60 : (user.paymentTerms === 'Net 30' ? 30 : 15),
        dueDate: Date.now() + (user.paymentTerms === 'Net 60' ? 60 * 86400000 : (user.paymentTerms === 'Net 30' ? 30 * 86400000 : 15 * 86400000)),
        createdAt: Date.now()
      });

      // Update credit used
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        creditUsed: (user.creditUsed || 0) + totalAmount
      });
      setCart([]);
      toast.success('Batch order placed!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to place batch order', { id: loadingToast });
    }
  };

  return (
    <div className="max-w-4xl animate-in fade-in duration-500 text-left">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900">⚡ Quick SKU Order</h2>
        <p className="text-gray-500">Rapid batch entry for known product identifiers.</p>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border shadow-sm mb-8">
        <form onSubmit={handleAdd} className="flex space-x-4">
          <div className="flex-1 relative">
            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
            <input
              type="text"
              placeholder="Enter SKU or Product Name..."
              value={skuInput}
              onChange={e => setSkuInput(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-bold"
            />
          </div>
          <button type="submit" className="bg-gray-900 text-white px-8 rounded-2xl font-bold">Add to List</button>
        </form>
      </div>

      {cart.length > 0 && (
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden text-left">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Component</th>
                <th className="px-8 py-4 text-center">Batch Qty</th>
                <th className="px-8 py-4">Unit Rate</th>
                <th className="px-8 py-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-8 py-4">
                    <p className="font-bold text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.product.sku}</p>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-center space-x-4">
                      <button onClick={() => setCart(c => c.map(i => i.product.id === item.product.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50">-</button>
                      <span className="font-bold w-8 text-center">{item.qty}</span>
                      <button onClick={() => setCart(c => c.map(i => i.product.id === item.product.id ? { ...i, qty: i.qty + 1 } : i))} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50">+</button>
                    </div>
                  </td>
                  <td className="px-8 py-4 font-bold text-gray-900">Rs. {calculateTierPrice(item.product, item.qty).toLocaleString()}</td>
                  <td className="px-8 py-4 text-right font-black text-blue-600">Rs. {(calculateTierPrice(item.product, item.qty) * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-8 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center space-x-10">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Batch Settle</p>
                <p className="text-3xl font-black text-gray-900">Rs. {((subtotal * (1 + (settings?.industrialTax || 15) / 100)) + (paymentMethod === 'cod' ? (settings?.codFee || 0) : 0)).toLocaleString()}</p>
              </div>
              <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm items-center">
                {[
                  { id: 'cod', label: 'COD' },
                  { id: 'card', label: 'Card' },
                  { id: 'transfer', label: 'Bank' },
                  { id: 'easypaisa', label: 'EP' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${paymentMethod === m.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                      }`}
                  >
                    {m.label}
                    {m.id !== 'cod' && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[6px] px-1 rounded-full">Wait</span>
                    )}
                  </button>
                ))}
              </div>
              {paymentMethod !== 'cod' && (
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-3 py-2 bg-amber-50/50 rounded-lg border border-amber-100">Coming Soon</p>
              )}
            </div>
            <button
              onClick={placeBatchOrder}
              disabled={paymentMethod !== 'cod'}
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Initialize Procurement
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Company Profile ---

const ProfileTab: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    taxId: user?.taxId || '',
    address: user?.addresses?.[0] || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        companyName: formData.companyName,
        taxId: formData.taxId,
        addresses: [formData.address]
      });
      toast.success('Business profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl animate-in fade-in duration-500 text-left">
      <div className="mb-8 text-left">
        <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
        <p className="text-gray-500">Configure your professional identity and billing defaults.</p>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm p-10 text-left">
        <form onSubmit={handleSave} className="space-y-8 text-left">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-left">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 text-left">Legal Entity Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text" required value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold"
                  placeholder="ACME Corp LLC"
                />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 text-left">Tax Identification Number</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text" required value={formData.taxId}
                  onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold"
                  placeholder="NTN / STRN"
                />
              </div>
            </div>
          </div>

          <div className="text-left">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 text-left">Primary Logistics Node</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
              <textarea
                rows={3} required value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold resize-none"
                placeholder="123 Industrial Area, City, Zip"
              />
            </div>
          </div>

          {user?.addresses && user.addresses.length > 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest text-left">Secondary Locations</label>
              {user.addresses.slice(1).map((addr, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm font-bold text-gray-500">
                  {addr}
                </div>
              ))}
            </div>
          )}

          <div className="pt-6 border-t text-left">
            <button
              type="submit" disabled={isSaving}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 shadow-xl shadow-blue-100 disabled:opacity-50 transition-all"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              <span>Save Business Credentials</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- View: Reports ---

const ReportsTab: React.FC<{ products: Product[]; orders: Order[] }> = ({ products, orders }) => {
  const { user } = useAuth();

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  const categoryPieData = useMemo(() => {
    const densities: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(oi => {
        const prod = products.find(p => p.id === oi.productId);
        const cat = prod?.category || 'General';
        densities[cat] = (densities[cat] || 0) + (oi.qty * oi.price); // Value-based density
      });
    });
    return Object.entries(densities).map(([name, value]) => ({ name, value }));
  }, [orders, products]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ month: m, total: 0 }));
    orders.forEach(o => {
      const date = new Date(o.createdAt);
      if (date.getFullYear() === new Date().getFullYear()) {
        data[date.getMonth()].total += o.total;
      }
    });
    return data;
  }, [orders]);

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900">Procurement Intelligence</h2>
        <p className="text-gray-500">Analyze your spending patterns and category distributions.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border shadow-sm">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Monthly Expenditure (Current Year)</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#9ca3af' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#9ca3af' }}
                  tickFormatter={(val) => `Rs.${(val / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  formatter={(val: number) => [`Rs. ${val.toLocaleString()}`, 'Expenditure']}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Purchase Density</h4>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-4">
            {categoryPieData.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-gray-600">{cat.name}</span>
                </div>
                <span className="text-xs font-black text-gray-900">
                  {Math.round((cat.value / (categoryPieData.reduce((acc, curr) => acc + curr.value, 0) || 1)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: My Services ---

const MyServicesTab: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">My Installations & Services</h2>
        <p className="text-gray-500">Track your professional installation requests and active job statuses.</p>
      </div>
    </div>
  );
};

// --- Main Dashboard Controller ---

export const BuyerDashboard: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch system settings for tax and COD fees
    getDoc(doc(db, 'settings', 'contact')).then(snap => {
      if (snap.exists()) {
        setSettings(snap.data() as SystemSettings);
      }
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), where('userId', '==', user.uid)), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });

    return () => { unsubProducts(); unsubOrders(); };
  }, [user]);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'electrician') {
        navigate('/electrician-dashboard');
      } else if (user.role === 'admin' || user.role === 'warehouse') {
        navigate('/admin');
      } else if (user.role === 'customer') {
        navigate('/my-account');
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 size={40} className="text-blue-600 animate-spin" /></div>;

  // Final safety check to prevent rendering dashboard for unauthorized roles
  if (user?.role !== 'buyer' && user?.role !== 'admin') {
    return <div className="h-screen flex items-center justify-center"><Loader2 size={40} className="text-blue-600 animate-spin" /></div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab products={products} orders={orders} />;
      case 'catalog': return <CatalogTab products={products} settings={settings} />;
      case 'orders': return <OrdersTab settings={settings} />;
      case 'services': return <MyServicesTab />;
      case 'invoices': return <InvoicesTab settings={settings} />;
      case 'reports': return <ReportsTab products={products} orders={orders} />;
      case 'profile': return <ProfileTab />;
      default: return <OverviewTab products={products} orders={orders} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-left">
      <Toaster position="top-right" />
      <BuyerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="ml-64 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-sm font-bold text-blue-600 uppercase tracking-[0.3em] mb-1">Corporate Command</h1>
            <div className="flex items-center space-x-3">
              <span className="text-4xl font-black text-gray-900 text-left">Welcome, {user.name}</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest">B2B Authorized</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-green-500 font-bold flex items-center justify-end uppercase">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Secure Session
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-xl flex items-center justify-center overflow-hidden ring-4 ring-blue-50">
              {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <Building2 className="text-blue-200" size={28} />}
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};