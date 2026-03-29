
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection, query, onSnapshot, doc, updateDoc,
  deleteDoc, addDoc, runTransaction, orderBy,
  where, limit, getDocs, Timestamp, setDoc, getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, LogOut, Search, Plus,
  Edit2, Trash2, TrendingUp, Archive,
  History, X, Loader2, Database,
  Sparkles, DollarSign, BarChart3, PackageX, Minus, Flame,
  Newspaper, Globe, User as UserIcon, Eye, AlertCircle,
  Building2, MapPin, Mail, Shield, CheckCircle2, Clock, Phone, CreditCard, Calendar,
  Printer, Smartphone, Banknote, ShieldAlert, Truck, ChevronDown, Info, Download,
  Zap, FileText, Tag, Percent, Save, ArrowUpRight, ArrowDownRight, Activity, MousePointer2,
  Headphones, Layers, Box, Truck as TruckIcon, BadgePercent, LifeBuoy, Trash,
  BookOpen, FileEdit, Check, ExternalLink, RotateCcw, FolderTree, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import {
  Product, Order, User, Blog, HotDeal, SystemSettings, Payment, Invoice, Shipment, Carrier, FulfillmentTask, FAQ, TeamMember, ShippingZone, Category,
  ElectricianApplication
} from '../../types';
import { paymentService } from '../../services/paymentService';
import { logisticsService } from '../../services/logisticsService';
import { ImageUploader } from '../../components/ImageUploader';
import { CATEGORIES } from '../../constants';
import { ElectricianAppsTab } from './tabs/ElectricianAppsTab';
import { VerifiedElectriciansTab } from './tabs/VerifiedPartnersTab';
import { WarehouseTab } from './tabs/WarehouseTab';

// --- Shared Components ---

const StatCard: React.FC<{
  label: string;
  value: string | number;
  trend?: { val: string; positive: boolean };
  icon: any;
  color: string;
  subtext?: string;
}> = ({ label, value, trend, icon: Icon, color, subtext }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative text-left">
    <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 ${color}`}>
      <Icon size={120} />
    </div>
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-').replace('600', '50')} ${color}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{trend.val}</span>
        </div>
      )}
    </div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{value}</h3>
    {subtext && <p className="text-xs text-gray-400 font-medium mt-2">{subtext}</p>}
  </div>
);

// --- View: Dashboard ---

const DashboardTab: React.FC<{ navigateTo: (tab: string, params?: any) => void }> = ({ navigateTo }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
      setLoading(false);
    });
    return () => { unsubOrders(); unsubProducts(); unsubUsers(); };
  }, []);

  const metrics = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => o.createdAt >= today);
    const revenueToday = todayOrders.reduce((acc, curr) => acc + curr.total, 0);
    const lowStock = products.filter(p => p.inventory?.stock <= (p.inventory?.lowStockThreshold || 0)).length;

    return {
      revenueToday,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'Processing' || o.status === 'pending_payment').length,
      activeProducts: products.length,
      lowStock,
      totalCustomers: users.length,
      codRate: orders.length ? Math.round((orders.filter(o => o.paymentMethod === 'cod').length / orders.length) * 100) : 0,
      avgOrderValue: orders.length ? Math.round(orders.reduce((acc, curr) => acc + curr.total, 0) / orders.length) : 0
    };
  }, [orders, products, users]);

  const salesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Calculate revenue for this specific day
      // Note: In real app, ensure timezone consistency. Here we use simple date string match.
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(d.setHours(23, 59, 59, 999)).getTime();

      const dayRevenue = orders
        .filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd)
        .reduce((sum, o) => sum + o.total, 0);

      return { name: dateStr, revenue: dayRevenue };
    });
    return last7Days;
  }, [orders]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard label="Today's Revenue" value={`Rs. ${metrics.revenueToday.toLocaleString()}`} icon={DollarSign} color="text-blue-600" subtext="Real-time pulse" />
        <StatCard label="Total Orders" value={metrics.totalOrders} icon={ShoppingCart} color="text-orange-600" subtext={`${metrics.pendingOrders} pending`} />
        <StatCard label="Active Catalog" value={metrics.activeProducts} icon={Zap} color="text-purple-600" subtext={`${metrics.lowStock} low stock`} />
        <StatCard label="Total Members" value={metrics.totalCustomers} icon={Users} color="text-indigo-600" />
        <StatCard label="COD Rate" value={`${metrics.codRate}%`} icon={CreditCard} color="text-emerald-600" />
        <StatCard label="Avg Order" value={`Rs. ${metrics.avgOrderValue.toLocaleString()}`} icon={BarChart3} color="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm text-left">
          <div className="mb-10">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Revenue Pulse</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Last 7 cycles • Industrial Aggregate</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }} itemStyle={{ fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8 text-left">
          <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
            <Zap size={140} className="absolute -right-10 -bottom-10 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
            <h3 className="text-xl font-black mb-8 relative z-10">Control Center</h3>
            <div className="grid grid-cols-1 gap-4 relative z-10">
              <button onClick={() => navigateTo('products', { action: 'create' })} className="flex items-center justify-between w-full bg-blue-600 p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/50">
                <div className="flex items-center space-x-3"><Plus size={18} /> <span>New Product</span></div>
              </button>
              <button onClick={() => navigateTo('blogs', { action: 'drafts' })} className="flex items-center justify-between w-full bg-white/10 border border-white/10 p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
                <div className="flex items-center space-x-3"><BookOpen size={18} className="text-blue-400" /> <span>Draft Safety Guide</span></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Form Component ---
const FormField = React.memo(({ label, name, type = 'text', value, options, placeholder, required = false, onChange }: any) => {
  const commonClass = "w-full px-5 py-3 rounded-xl bg-gray-50 border-none font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all";
  return (
    <div className="space-y-1.5 text-left">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(name, e.target.value)} className={commonClass}>
          {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(name, e.target.value)} rows={4} placeholder={placeholder} className={commonClass} />
      ) : type === 'toggle' ? (
        <button type="button" onClick={() => onChange(name, !value)} className={`w-12 h-6 rounded-full relative transition-all ${value ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-7' : 'left-1'}`} /></button>
      ) : (
        <input type={type} value={value} onChange={e => onChange(name, type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={placeholder} className={commonClass} />
      )}
    </div>
  );
});

// --- View: Category Manager ---
const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '', slug: '', description: '', displayOrder: 0, isActive: true
  });

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('displayOrder'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        slug: formData.slug || formData.name?.toLowerCase().replace(/\s+/g, '-'),
        updatedAt: Date.now()
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), data);
        toast.success('Category updated');
      } else {
        await addDoc(collection(db, 'categories'), { ...data, createdAt: Date.now() });
        toast.success('Category created');
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openModal = (category?: Category) => {
    setEditingCategory(category || null);
    setFormData(category || { name: '', slug: '', description: '', displayOrder: categories.length + 1, isActive: true });
    setShowModal(true);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Category Tree</h2>
          <p className="text-gray-500 font-medium">Manage product taxonomy and organization.</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center space-x-3">
          <Plus size={18} /><span>New Category</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6">Order</th>
              <th className="px-10 py-6">Category Name</th>
              <th className="px-10 py-6">Slug</th>
              <th className="px-10 py-6">Status</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-10 py-6 font-bold text-gray-500">#{cat.displayOrder}</td>
                <td className="px-10 py-6 font-black text-gray-900 text-lg">{cat.name}</td>
                <td className="px-10 py-6 font-mono text-xs text-blue-600 bg-blue-50/50 rounded px-2 w-fit">{cat.slug}</td>
                <td className="px-10 py-6"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${cat.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{cat.isActive ? 'Active' : 'Hidden'}</span></td>
                <td className="px-10 py-6 text-right space-x-2">
                  <button onClick={() => openModal(cat)} className="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-3 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-6">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <FormField label="Category Name" value={formData.name} onChange={(n, v) => setFormData({ ...formData, name: v })} required />
              <FormField label="URL Slug" value={formData.slug} onChange={(n, v) => setFormData({ ...formData, slug: v })} placeholder="Auto-generated if empty" />
              <FormField label="Display Order" type="number" value={formData.displayOrder} onChange={(n, v) => setFormData({ ...formData, displayOrder: v })} required />
              <div className="flex items-center space-x-3">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                <span className="font-bold text-gray-700">Category is Active</span>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Save Category</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Product Manager ---
const ProductsTab: React.FC<{ initialAction?: string }> = ({ initialAction }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // ADDED
  const [categoryFilter, setCategoryFilter] = useState('all'); // ADDED
  const [showModal, setShowModal] = useState(false);
  // ... rest of state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formSection, setFormSection] = useState<'basic' | 'description' | 'pricing' | 'inventory' | 'specs' | 'shipping' | 'advanced'>('basic');

  const [formData, setFormData] = useState({
    // Basic
    productName: '', productSku: '', productModel: '', productCategory: CATEGORIES[0], productSubcategory: '',
    // Description
    productDescription: '', shortDescription: '',
    // Pricing
    basePrice: 0, b2bPrice: 0, taxRate: 0, priceUnit: 'Per Piece',
    // Inventory
    stockQuantity: 0, stockStatus: 'In Stock' as const, manageStock: true, lowStockThreshold: 5, backorderAllowed: false, stockLocation: 'Main Warehouse',
    // Specs
    voltageRating: '', currentRating: '', poles: '', breakingCapacity: '', tripCurve: '',
    frequency: '50Hz', material: 'Thermoplastic', color: '',
    // Media
    mainImage: '', galleryImages: [] as string[],
    // Shipping
    weightKg: 0, dimensionsCm: '', shippingWeight: 0, shippingClass: 'Standard', isFragile: false, isHazardous: false, requiresSpecialHandling: false,
    // Visibility
    productStatus: 'published' as const, visibility: 'public', featured: false, newArrival: false, sortOrder: 0,
    // B2B/Advanced
    isB2BProduct: true, b2bMinQty: 10, b2bPriceTiers: [] as { qty: number, price: number }[],
    warrantyPeriod: '1 Year', warrantyType: 'Manufacturer', leadTime: '3-5 Days', reorderPoint: 10, batchNumber: '', serializedInventory: false,
    supportContact: '', returnPolicy: '15 Days', bulkDiscount: 0, moq: 1
  });

  useEffect(() => {
    if (initialAction === 'create') {
      // Needs to run after mount, maybe small delay or direct
      setTimeout(() => openModal(), 100);
    }
  }, [initialAction]);


  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    return () => unsub();
  }, []);

  // Fetch Categories
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'categories'), orderBy('displayOrder')), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
    return () => unsub();
  }, []);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productDoc: any = {
        name: formData.productName,
        sku: formData.productSku,
        model: formData.productModel,
        category: formData.productCategory,
        subCategory: formData.productSubcategory,

        description: formData.productDescription,
        shortDescription: formData.shortDescription,
        status: formData.productStatus,
        price: {
          base: Number(formData.basePrice),
          b2b: Number(formData.b2bPrice),
          taxRate: Number(formData.taxRate),
          unit: formData.priceUnit
        },
        inventory: {
          stock: Number(formData.stockQuantity),
          status: formData.stockStatus,
          manageStock: formData.manageStock,
          lowStockThreshold: Number(formData.lowStockThreshold),
          backorderAllowed: formData.backorderAllowed,
          location: formData.stockLocation
        },
        specs: {
          currentRating: formData.currentRating,
          voltageRating: formData.voltageRating,
          breakingCapacity: formData.breakingCapacity,
          numberOfPoles: formData.poles,
          tripCharacteristic: formData.tripCurve,
          frequency: formData.frequency,
          material: formData.material,
          color: formData.color,
        },
        images: { main: formData.mainImage, gallery: formData.galleryImages.filter(Boolean) },

        shipping: {
          weightKg: Number(formData.weightKg),
          dimensionsCm: formData.dimensionsCm,
          class: formData.shippingClass,
          isFragile: formData.isFragile,
          isHazardous: formData.isHazardous,
          requiresSpecialHandling: formData.requiresSpecialHandling
        },
        b2b: {
          isB2BProduct: formData.isB2BProduct,
          minQty: Number(formData.b2bMinQty),
          priceTiers: formData.b2bPriceTiers,
          leadTime: formData.leadTime,
          moq: Number(formData.moq),
          bulkDiscount: Number(formData.bulkDiscount),
          batchNumber: formData.batchNumber,
          serializedInventory: formData.serializedInventory,
          reorderPoint: Number(formData.reorderPoint)
        },
        warranty: {
          period: formData.warrantyPeriod,
          type: formData.warrantyType,
          supportContact: formData.supportContact,
          returnPolicy: formData.returnPolicy
        },
        sortOrder: Number(formData.sortOrder),
        updatedAt: Date.now()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productDoc);
        toast.success('Product updated');
      } else {
        const newProductDoc = {
          ...productDoc,
          inventory: {
            ...productDoc.inventory,
            initialStock: Number(formData.stockQuantity)
          },
          createdAt: Date.now()
        };
        await addDoc(collection(db, 'products'), newProductDoc);
        toast.success('Product created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setFormData({
        productName: p.name || '', productSku: p.sku || '', productModel: p.model || '',
        productCategory: p.category || (categories.length > 0 ? categories[0].name : CATEGORIES[0]), // Updated
        productSubcategory: p.subCategory || '', productDescription: p.description || '', shortDescription: p.shortDescription || '', productStatus: p.status || 'published',
        basePrice: p.price?.base || 0, b2bPrice: p.price?.b2b || 0, taxRate: p.price?.taxRate || 0, priceUnit: p.price?.unit || 'Per Piece',
        stockQuantity: p.inventory?.stock || 0, stockStatus: p.inventory?.status || 'In Stock', manageStock: p.inventory?.manageStock ?? true, lowStockThreshold: p.inventory?.lowStockThreshold || 5, backorderAllowed: p.inventory?.backorderAllowed || false, stockLocation: p.inventory?.location || 'Main Warehouse',
        currentRating: p.specs?.currentRating || '', voltageRating: p.specs?.voltageRating || '', breakingCapacity: p.specs?.breakingCapacity || '', poles: p.specs?.numberOfPoles || '', tripCurve: p.specs?.tripCharacteristic || '', frequency: p.specs?.frequency || '50Hz', material: p.specs?.material || 'Thermoplastic', color: p.specs?.color || '',
        mainImage: p.images?.main || '', galleryImages: p.images?.gallery || [],
        weightKg: p.shipping?.weightKg || 0, dimensionsCm: p.shipping?.dimensionsCm || '', shippingWeight: 0, shippingClass: p.shipping?.class || 'Standard', isFragile: p.shipping?.isFragile || false, isHazardous: p.shipping?.isHazardous || false, requiresSpecialHandling: p.shipping?.requiresSpecialHandling || false, sortOrder: p.sortOrder || 0,
        isB2BProduct: p.b2b?.isB2BProduct ?? true, b2bMinQty: p.b2b?.minQty || 10, b2bPriceTiers: p.b2b?.priceTiers || [], leadTime: p.b2b?.leadTime || 'In Stock', moq: p.b2b?.moq || 1, bulkDiscount: p.b2b?.bulkDiscount || 0, reorderPoint: p.b2b?.reorderPoint || 10, batchNumber: p.b2b?.batchNumber || '', serializedInventory: p.b2b?.serializedInventory || false,
        warrantyPeriod: p.warranty?.period || '1 Year', warrantyType: p.warranty?.type || 'Manufacturer Warranty', supportContact: p.warranty?.supportContact || '', returnPolicy: p.warranty?.returnPolicy || '15 Days'
      });
    } else {
      setEditingProduct(null);
      setFormData({
        productName: '', productSku: '', productModel: '',
        productCategory: categories.length > 0 ? categories[0].name : CATEGORIES[0], // Updated
        productSubcategory: '',
        productDescription: '', shortDescription: '', productStatus: 'published',
        basePrice: 0, b2bPrice: 0, taxRate: 0, priceUnit: 'Per Piece',
        stockQuantity: 0, stockStatus: 'In Stock', manageStock: true, lowStockThreshold: 5, backorderAllowed: false, stockLocation: 'Main Warehouse',
        currentRating: '', voltageRating: '', breakingCapacity: '', poles: '', tripCurve: '', frequency: '50Hz', material: 'Thermoplastic', color: '',
        mainImage: '', galleryImages: [],
        weightKg: 0, dimensionsCm: '', shippingWeight: 0, shippingClass: 'Standard', isFragile: false, isHazardous: false, requiresSpecialHandling: false, sortOrder: 0,
        isB2BProduct: true, b2bMinQty: 10, b2bPriceTiers: [], leadTime: 'In Stock', moq: 1, bulkDiscount: 0, reorderPoint: 10, batchNumber: '', serializedInventory: false,
        warrantyPeriod: '1 Year', warrantyType: 'Manufacturer Warranty', supportContact: '', returnPolicy: '15 Days'
      });
    }
    setFormSection('basic');
    setShowModal(true);
  };

  const filteredProducts = products.filter(p =>
    (categoryFilter === 'all' || p.category === categoryFilter) &&
    (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
  );



  const updateGalleryImage = (index: number, url: string) => {
    const newGallery = [...formData.galleryImages];
    newGallery[index] = url;
    setFormData({ ...formData, galleryImages: newGallery });
  };

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Product Catalog</h2>
          <p className="text-gray-500 font-medium">Manage technical nodes and inventory.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input type="text" placeholder="Search SKU/Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-900 text-sm" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full md:w-64 px-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-900 text-sm">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button onClick={() => openModal()} className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all hover:scale-105">
            <Plus size={20} /><span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr><th className="px-10 py-6">Product</th><th className="px-10 py-6">SKU</th><th className="px-10 py-6">Stock</th><th className="px-10 py-6">Price</th><th className="px-10 py-6 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-10 py-6 font-bold">{p.name}</td>
                <td className="px-10 py-6 font-mono text-xs uppercase">{p.sku}</td>
                <td className="px-10 py-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.inventory?.stock <= (p.inventory?.lowStockThreshold || 0) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {p.inventory?.stock} Units
                  </span>
                </td>
                <td className="px-10 py-6 font-black text-blue-600">Rs. {p.price?.base?.toLocaleString()}</td>
                <td className="px-10 py-6 text-right space-x-2">
                  <button onClick={() => openModal(p)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={async () => { if (confirm('Purge product?')) await deleteDoc(doc(db, 'products', p.id)); }} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {
        showModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
            <div className="bg-white rounded-[3rem] w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-2xl font-black tracking-tight">{editingProduct ? 'Update Product' : 'Initialize New Product'}</h3>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"><X size={24} /></button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-gray-50 border-r p-6 space-y-2 overflow-y-auto">
                  {[
                    { id: 'basic', label: 'Basic Details', icon: Layers },
                    { id: 'description', label: 'Description', icon: FileText },
                    { id: 'pricing', label: 'Pricing', icon: DollarSign },
                    { id: 'inventory', label: 'Inventory', icon: Box },
                    { id: 'specs', label: 'Specifications', icon: Zap },
                    { id: 'shipping', label: 'Shipping', icon: TruckIcon },
                    { id: 'advanced', label: 'Advanced & B2B', icon: Settings } // Combined B2B, Warranty, Visibility
                  ].map(s => (
                    <button key={s.id} onClick={() => setFormSection(s.id as any)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${formSection === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                      <s.icon size={18} /><span>{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto admin-scroll p-10 bg-white">
                  <form id="productForm" onSubmit={handleSave} className="space-y-10 pb-10">
                    {formSection === 'basic' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="md:col-span-2"><FormField label="Product Name" name="productName" value={formData.productName} onChange={handleFieldChange} required /></div>
                        <FormField label="SKU" name="productSku" value={formData.productSku} onChange={handleFieldChange} required />
                        <FormField label="Model Number" name="productModel" value={formData.productModel} onChange={handleFieldChange} />
                        <FormField
                          label="Category"
                          name="productCategory"
                          type="select"
                          options={categories.length > 0 ? categories.map(c => c.name) : CATEGORIES}
                          value={formData.productCategory}
                          onChange={handleFieldChange}
                          required
                        />
                        <FormField label="Sub-Category" name="productSubcategory" value={formData.productSubcategory} onChange={handleFieldChange} placeholder="e.g. MCB, MCCB" />
                      </div>
                    )}

                    {formSection === 'description' && (
                      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <FormField label="Short Description" name="shortDescription" type="textarea" value={formData.shortDescription} onChange={handleFieldChange} required />
                        <FormField label="Full Description (HTML Supported)" name="productDescription" type="textarea" value={formData.productDescription} onChange={handleFieldChange} />

                        <div className="pt-6 border-t border-gray-100">
                          <div className="flex flex-col lg:flex-row gap-10">
                            <div className="flex-1">
                              <ImageUploader label="PRIMARY IMAGE" onUploadSuccess={(res) => setFormData({ ...formData, mainImage: res.imageUrl })} previewUrl={formData.mainImage} required />
                            </div>
                            <div className="flex-[2] bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">GALLERY IMAGES</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {[0, 1, 2, 3, 4].map((idx) => (
                                  <div key={idx} className="relative group">
                                    <ImageUploader className="w-full" onUploadSuccess={(res) => updateGalleryImage(idx, res.imageUrl)} previewUrl={formData.galleryImages[idx]} />
                                    {formData.galleryImages[idx] && (
                                      <button type="button" onClick={() => { const next = [...formData.galleryImages]; next[idx] = ""; setFormData({ ...formData, galleryImages: next }); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"><X size={12} /></button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                          {/* Removed URLs as per user request */}
                        </div>
                      </div>
                    )}

                    {formSection === 'pricing' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                        <FormField label="Base Price (Rs)" name="basePrice" type="number" value={formData.basePrice} onChange={handleFieldChange} required />
                        <FormField label="B2B / Wholesale Price (Rs)" name="b2bPrice" type="number" value={formData.b2bPrice} onChange={handleFieldChange} />
                        <FormField label="Tax Rate (%)" name="taxRate" type="number" value={formData.taxRate} onChange={handleFieldChange} />
                        <FormField label="Price Unit" name="priceUnit" value={formData.priceUnit} onChange={handleFieldChange} placeholder="Per Piece" />
                      </div>
                    )}

                    {formSection === 'inventory' && (
                      <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="Stock Quantity" name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleFieldChange} required />
                          <FormField label="Low Stock Threshold" name="lowStockThreshold" type="number" value={formData.lowStockThreshold} onChange={handleFieldChange} />
                          <FormField label="Stock Location" name="stockLocation" value={formData.stockLocation} onChange={handleFieldChange} />
                          <FormField label="Stock Status" name="stockStatus" type="select" options={['In Stock', 'Out of Stock']} value={formData.stockStatus} onChange={handleFieldChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                          {/* Removed Min/Max Order Qty */}
                        </div>
                        <div className="flex items-center space-x-8 pt-4">
                          <div className="flex items-center space-x-3">
                            <button type="button" onClick={() => setFormData({ ...formData, manageStock: !formData.manageStock })} className={`w-12 h-6 rounded-full relative transition-all ${formData.manageStock ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.manageStock ? 'left-7' : 'left-1'}`} /></button>
                            <span className="text-xs font-black uppercase text-gray-400">Manage Stock Level</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button type="button" onClick={() => setFormData({ ...formData, backorderAllowed: !formData.backorderAllowed })} className={`w-12 h-6 rounded-full relative transition-all ${formData.backorderAllowed ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.backorderAllowed ? 'left-7' : 'left-1'}`} /></button>
                            <span className="text-xs font-black uppercase text-gray-400">Allow Backorders</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formSection === 'specs' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
                        <FormField label="Current Rating" name="currentRating" value={formData.currentRating} onChange={handleFieldChange} placeholder="e.g. 10A" />
                        <FormField label="Voltage Rating" name="voltageRating" value={formData.voltageRating} onChange={handleFieldChange} placeholder="e.g. 240V" />
                        <FormField label="Breaking Capacity" name="breakingCapacity" value={formData.breakingCapacity} onChange={handleFieldChange} placeholder="e.g. 6kA" />
                        <FormField label="Poles" name="poles" value={formData.poles} onChange={handleFieldChange} placeholder="e.g. 1P+N" />
                        <FormField label="Trip Curve" name="tripCurve" value={formData.tripCurve} onChange={handleFieldChange} placeholder="e.g. Type C" />
                        <FormField label="Frequency" name="frequency" value={formData.frequency} onChange={handleFieldChange} />
                        <FormField label="Material" name="material" value={formData.material} onChange={handleFieldChange} />
                        <FormField label="Color" name="color" value={formData.color} onChange={handleFieldChange} />
                      </div>
                    )}

                    {formSection === 'shipping' && (
                      <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField label="Shipping Weight (Kg)" name="weightKg" type="number" value={formData.weightKg} onChange={handleFieldChange} />
                          <FormField label="Package Dims (Cm)" name="dimensionsCm" value={formData.dimensionsCm} onChange={handleFieldChange} placeholder="L x W x H" />
                          <FormField label="Shipping Class" name="shippingClass" value={formData.shippingClass} onChange={handleFieldChange} />
                        </div>
                        <div className="flex items-center space-x-8 pt-4">
                          <div className="flex items-center space-x-3">
                            <button type="button" onClick={() => setFormData({ ...formData, isFragile: !formData.isFragile })} className={`w-12 h-6 rounded-full relative transition-all ${formData.isFragile ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isFragile ? 'left-7' : 'left-1'}`} /></button>
                            <span className="text-xs font-black uppercase text-gray-400">Fragile</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button type="button" onClick={() => setFormData({ ...formData, isHazardous: !formData.isHazardous })} className={`w-12 h-6 rounded-full relative transition-all ${formData.isHazardous ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isHazardous ? 'left-7' : 'left-1'}`} /></button>
                            <span className="text-xs font-black uppercase text-gray-400">Hazardous</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formSection === 'advanced' && (
                      <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">B2B & Supplier</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField label="MOQ (B2B)" name="moq" type="number" value={formData.moq} onChange={handleFieldChange} />
                            <FormField label="B2B Min Qty" name="b2bMinQty" type="number" value={formData.b2bMinQty} onChange={handleFieldChange} />
                            <FormField label="Bulk Discount (%)" name="bulkDiscount" type="number" value={formData.bulkDiscount} onChange={handleFieldChange} />
                            <FormField label="Lead Time" name="leadTime" value={formData.leadTime} onChange={handleFieldChange} />
                            <div className="flex items-center space-x-3 mt-8">
                              <button type="button" onClick={() => setFormData({ ...formData, isB2BProduct: !formData.isB2BProduct })} className={`w-12 h-6 rounded-full relative transition-all ${formData.isB2BProduct ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isB2BProduct ? 'left-7' : 'left-1'}`} /></button>
                              <span className="text-xs font-black uppercase text-gray-400">B2B Exclusive</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Warranty & Support</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Period" name="warrantyPeriod" value={formData.warrantyPeriod} onChange={handleFieldChange} />
                            <FormField label="Type" name="warrantyType" value={formData.warrantyType} onChange={handleFieldChange} />
                            <FormField label="Support Contact" name="supportContact" value={formData.supportContact} onChange={handleFieldChange} />
                            <FormField label="Return Policy" name="returnPolicy" value={formData.returnPolicy} onChange={handleFieldChange} />
                          </div>
                        </div>

                        <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Visibility & Sort</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Sort Order" name="sortOrder" type="number" value={formData.sortOrder} onChange={handleFieldChange} />
                            <FormField label="Status" name="productStatus" type="select" options={['published', 'draft', 'archived']} value={formData.productStatus} onChange={handleFieldChange} />
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              <div className="p-8 border-t bg-gray-50/50 flex justify-between items-center">
                <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 font-black text-gray-400 uppercase tracking-widest text-xs">DISCARD</button>
                <button form="productForm" type="submit" disabled={loading} className="bg-blue-600 text-white px-16 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center min-w-[280px]">
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (editingProduct ? 'UPDATE PRODUCT' : 'INITIALIZE PRODUCT')}
                </button>
              </div>
            </div>
          </div >
        )}
    </div>
  );
};

// --- View: Blog Manager (REPLACING CAMPAIGNS) ---

const BlogsTab: React.FC<{ initialAction?: string }> = ({ initialAction }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all'); // Added filter state
  // ... other state
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Kept for consistency though possibly unused in view

  // CMS State
  const [activeSection, setActiveSection] = useState<'insights'>('insights');

  // Modal States
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqFormData, setFaqFormData] = useState({ question: '', answer: '', order: 0 });

  const [showExpertModal, setShowExpertModal] = useState(false);
  const [editingExpert, setEditingExpert] = useState<TeamMember | null>(null);
  const [expertFormData, setExpertFormData] = useState({ name: '', role: '', experience: '', specialization: '', image: '', order: 0 });

  const [formData, setFormData] = useState({
    title: '', slug: '', category: 'Electrical Safety', excerpt: '', content: '',
    featuredImage: '', readTime: '5 min', status: 'published' as const, isFeatured: false,
    tags: ''
  });

  // Handle initial action
  useEffect(() => {
    if (initialAction === 'drafts') {
      setFilterStatus('draft'); // Set filter to draft
    }
  }, [initialAction]);


  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')), (snap) => {
      setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Blog)));
    });
    return () => unsub();
  }, []);



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const blogData = {
        title: formData.title,
        slug,
        category: formData.category,
        excerpt: formData.excerpt,
        content: formData.content,
        featuredImage: formData.featuredImage,
        readTime: formData.readTime,
        status: formData.status,
        isFeatured: formData.isFeatured,
        tags: formData.tags.split(',').map(t => t.trim()),
        updatedAt: Date.now(),
        publishedAt: editingBlog?.publishedAt || Date.now()
      };

      if (editingBlog) {
        await updateDoc(doc(db, 'blogs', editingBlog.id), blogData);
        toast.success('Insight updated');
      } else {
        await addDoc(collection(db, 'blogs'), {
          ...blogData,
          createdAt: Date.now(),
          views: 0,
          likes: 0,
          author: { name: 'BrightSwitch Team', role: 'Engineering Experts', avatar: '' }
        });
        toast.success('Insight published');
      }
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to sync insight');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (b?: Blog) => {
    if (b) {
      setEditingBlog(b);
      setFormData({
        title: b.title, slug: b.slug, category: b.category, excerpt: b.excerpt, content: b.content,
        featuredImage: b.featuredImage, readTime: b.readTime, status: b.status as any, isFeatured: b.isFeatured,
        tags: b.tags.join(', ')
      });
    } else {
      setEditingBlog(null);
      setFormData({
        title: '', slug: '', category: 'Electrical Safety', excerpt: '', content: '',
        featuredImage: '', readTime: '5 min', status: 'published', isFeatured: false,
        tags: ''
      });
    }
    setShowModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingFaq) {
        await updateDoc(doc(db, 'faqs', editingFaq.id), { ...faqFormData, updatedAt: Date.now() });
        toast.success('FAQ updated');
      } else {
        await addDoc(collection(db, 'faqs'), { ...faqFormData, createdAt: Date.now() });
        toast.success('FAQ added');
      }
      setShowFaqModal(false);
    } catch (err) { toast.error('Operation failed'); }
    setLoading(false);
  };

  const handleSaveExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingExpert) {
        await updateDoc(doc(db, 'team_experts', editingExpert.id), { ...expertFormData, updatedAt: Date.now() });
        toast.success('Expert profile updated');
      } else {
        await addDoc(collection(db, 'team_experts'), { ...expertFormData, createdAt: Date.now() });
        toast.success('Expert recruited');
      }
      setShowExpertModal(false);
    } catch (err) { toast.error('Operation failed'); }
    setLoading(false);
  }

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Content Control</h2>
          <p className="text-gray-500 font-medium">Manage safety guides and industrial insights.</p>
        </div>
      </div>

      {activeSection === 'insights' && (
        <div className="flex justify-end mb-8">
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center space-x-2 hover:bg-blue-700 shadow-xl transition-all">
            <Plus size={20} /><span>Write Insight</span>
          </button>
        </div>
      )}



      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-8">
        {['all', 'published', 'draft'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {activeSection === 'insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.filter(b => filterStatus === 'all' || b.status === filterStatus).map(blog => (
            <div key={blog.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                <img src={blog.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                {blog.isFeatured && <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg">Featured</div>}
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">{blog.category}</span>
                <h3 className="text-xl font-black text-gray-900 mb-3 line-clamp-2 leading-tight">{blog.title}</h3>
                <p className="text-sm text-gray-400 font-medium mb-6 line-clamp-2 leading-relaxed whitespace-pre-wrap">{blog.excerpt}</p>
                <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button onClick={() => openModal(blog)} className="p-2.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-colors"><FileEdit size={16} /></button>
                    <button onClick={async () => { if (confirm('Purge insight?')) await deleteDoc(doc(db, 'blogs', blog.id)); }} className="p-2.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl transition-colors"><Trash size={16} /></button>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${blog.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>{blog.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}



      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-2xl font-black tracking-tight">{editingBlog ? 'Edit Insight' : 'Draft New Insight'}</h3>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto admin-scroll p-10 bg-gray-50/20">
              <form id="blogForm" onSubmit={handleSave} className="space-y-10">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1">
                      <ImageUploader label="FEATURED COVER" onUploadSuccess={(res) => setFormData({ ...formData, featuredImage: res.imageUrl })} previewUrl={formData.featuredImage} />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">TITLE</label>
                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none font-bold text-xl" placeholder="Safe Load Calculations..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CATEGORY</label>
                          <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-gray-50 border-none font-bold">
                            <option>Electrical Safety</option>
                            <option>Industrial Guides</option>
                            <option>Solar Solutions</option>
                            <option>Circuit Breaker Tech</option>
                            <option>Smart Home Automation</option>
                            <option>Energy Efficiency</option>
                            <option>Lighting Design</option>
                            <option>Installation Tutorials</option>
                            <option>Power Tools & Gear</option>
                            <option>Maintenance Tips</option>
                            <option>Infrastructure & Grid</option>
                            <option>EV Charging Solutions</option>
                            <option>Product Reviews</option>
                            <option>Wiring & Connections</option>
                            <option>Company News</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">READ TIME</label>
                          <input value={formData.readTime} onChange={e => setFormData({ ...formData, readTime: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-gray-50 border-none font-bold" placeholder="5 min" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">EXCERPT (SHORT SUMMARY)</label>
                      <textarea value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} rows={2} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none font-medium text-gray-600 resize-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">FULL CONTENT</label>
                      <textarea required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={12} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none font-medium text-gray-600 font-mono text-sm" placeholder="Paste your article content here. Line breaks are preserved automatically." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">METADATA TAGS (COMMA SEPARATED)</label>
                      <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-gray-50 border-none font-bold" placeholder="breaker, safety, mcb" />
                    </div>
                    <div className="flex items-center space-x-10">
                      <div className="flex items-center space-x-3">
                        <button type="button" onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })} className={`w-12 h-6 rounded-full relative transition-all ${formData.isFeatured ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isFeatured ? 'left-7' : 'left-1'}`} /></button>
                        <span className="text-[10px] font-black uppercase text-gray-400">Mark Featured</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="bg-gray-50 border-none font-bold rounded-xl px-4 py-2 text-xs">
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-8 border-t bg-gray-50/50 flex justify-between items-center">
              <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 font-black text-gray-400 uppercase tracking-widest text-xs">DISCARD</button>
              <button form="blogForm" type="submit" disabled={loading} className="bg-blue-600 text-white px-20 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center min-w-[300px]">
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : 'SYNCHRONIZE INSIGHT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowFaqModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-8">{editingFaq ? 'Edit FAQ' : 'Add Question'}</h3>
            <form onSubmit={handleSaveFaq} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Question</label>
                <input required value={faqFormData.question} onChange={e => setFaqFormData({ ...faqFormData, question: e.target.value })} className="w-full bg-gray-50 px-6 py-4 rounded-xl border-none font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Answer</label>
                <textarea required rows={4} value={faqFormData.answer} onChange={e => setFaqFormData({ ...faqFormData, answer: e.target.value })} className="w-full bg-gray-50 px-6 py-4 rounded-xl border-none font-medium resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sort Order</label>
                <input type="number" required value={faqFormData.order} onChange={e => setFaqFormData({ ...faqFormData, order: parseInt(e.target.value) || 0 })} className="w-full bg-gray-50 px-6 py-4 rounded-xl border-none font-bold" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-700 transition-all">{loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Save FAQ Item'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Expert Modal */}
      {showExpertModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[2rem] p-10 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowExpertModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-8">{editingExpert ? 'Edit Profile' : 'Recruit Expert'}</h3>
            <form onSubmit={handleSaveExpert} className="space-y-8">
              <div className="flex gap-8">
                <div className="w-1/3">
                  <ImageUploader label="PROFILE PHOTO" onUploadSuccess={(res) => setExpertFormData({ ...expertFormData, image: res.imageUrl })} previewUrl={expertFormData.image} />
                </div>
                <div className="w-2/3 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input required value={expertFormData.name} onChange={e => setExpertFormData({ ...expertFormData, name: e.target.value })} className="w-full bg-gray-50 px-6 py-4 rounded-xl border-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Job Title / Role</label>
                    <input required value={expertFormData.role} onChange={e => setExpertFormData({ ...expertFormData, role: e.target.value })} className="w-full bg-gray-50 px-6 py-4 rounded-xl border-none font-bold" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Years Exp.</label>
                  <input required value={expertFormData.experience} onChange={e => setExpertFormData({ ...expertFormData, experience: e.target.value })} className="w-full bg-gray-50 px-6 py-4 rounded-xl border-none font-bold" placeholder="10+ Years" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Specialization</label>
                  <input required value={expertFormData.specialization} onChange={e => setExpertFormData({ ...expertFormData, specialization: e.target.value })} className="w-full bg-gray-50 px-6 py-4 rounded-xl border-none font-bold" placeholder="Industrial Power" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sort Order</label>
                <input type="number" required value={expertFormData.order} onChange={e => setExpertFormData({ ...expertFormData, order: parseInt(e.target.value) || 0 })} className="w-full bg-gray-50 px-6 py-4 rounded-xl border-none font-bold" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-700 transition-all">{loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Update Expert Profile'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Queries Manager ---
const QueriesTab: React.FC = () => {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setQueries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'contactSubmissions', id), { status });
      toast.success(`Query marked as ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Customer Queries</h2>
        <p className="text-gray-500 font-medium">Technical requests and general communications from the root hub.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr><th className="px-10 py-6">Sender</th><th className="px-10 py-6">Category</th><th className="px-10 py-6">Timestamp</th><th className="px-10 py-6">Status</th><th className="px-10 py-6 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {queries.map((iq) => (
              <tr key={iq.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-10 py-6"><p className="font-bold text-gray-900">{iq.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">{iq.email}</p></td>
                <td className="px-10 py-6"><span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">{iq.subject}</span></td>
                <td className="px-10 py-6 text-xs text-gray-500 font-medium">{iq.createdAt?.toDate ? iq.createdAt.toDate().toLocaleString() : 'N/A'}</td>
                <td className="px-10 py-6"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${iq.status === 'new' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>{iq.status}</span></td>
                <td className="px-10 py-6 text-right space-x-2"><button onClick={() => setSelectedQuery(iq)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg transition-all"><Eye size={16} /></button><button onClick={async () => { if (confirm('Purge?')) await deleteDoc(doc(db, 'contactSubmissions', iq.id)); }} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg transition-all"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedQuery && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center"><h3 className="text-xl font-black tracking-tight">Transmission Detail</h3><button onClick={() => setSelectedQuery(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={24} /></button></div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8"><div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sender</p><p className="font-black text-gray-900">{selectedQuery.name}</p><p className="text-xs text-gray-500 font-bold">{selectedQuery.email}</p></div><div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</p><p className="font-black text-gray-900">{selectedQuery.phone || 'N/A'}</p></div></div>
              <div className="pt-8 border-t border-gray-50"><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Message Payload</p><div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100"><p className="text-gray-700 font-medium italic">"{selectedQuery.message}"</p></div></div>
              <div className="flex justify-between items-center pt-8 border-t border-gray-50">
                <div className="flex space-x-3">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedQuery.email}&su=${encodeURIComponent(`Regarding your query: ${selectedQuery.subject}`)}&body=${encodeURIComponent(`Hi ${selectedQuery.name},\n\n`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all border border-gray-100 flex items-center justify-center hover:bg-blue-50"
                    title="Send Email"
                  >
                    <Mail size={18} />
                  </a>
                  {selectedQuery.phone && (
                    <a
                      href={`tel:${selectedQuery.phone}`}
                      className="p-3 text-gray-400 hover:text-green-600 bg-gray-50 rounded-xl transition-all border border-gray-100 flex items-center justify-center hover:bg-green-50"
                      title="Call Phone"
                    >
                      <Phone size={18} />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => updateStatus(selectedQuery.id, 'responded')}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center space-x-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                >
                  <CheckCircle2 size={14} /> <span>Handled</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Order Manager ---
const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [richItems, setRichItems] = useState<any[]>([]);
  const [loadingRichItems, setLoadingRichItems] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeInvoiceMenu, setActiveInvoiceMenu] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const s = await getDoc(doc(db, 'settings', 'contact'));
      if (s.exists()) setSettings(s.data() as SystemSettings);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchRichItems = async () => {
      if (!selectedOrder) {
        setRichItems([]);
        return;
      }
      setLoadingRichItems(true);
      try {
        const details = await Promise.all(selectedOrder.items.map(async (item: any) => {
          const pDoc = await getDoc(doc(db, 'products', item.productId));
          if (pDoc.exists()) {
            return { ...item, specs: pDoc.data().specs };
          }
          return item;
        }));
        setRichItems(details);
      } catch (err) {
        console.error("Error fetching rich items:", err);
      } finally {
        setLoadingRichItems(false);
      }
    };
    fetchRichItems();
  }, [selectedOrder]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  const handlePrintOrder = async (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Pop-up blocked");

    printWindow.document.write('<html><head><title>Loading Order Details...</title></head><body><h1>Generating Invoice...</h1></body></html>');

    // Fetch product specs for each item
    const itemsWithSpecs = await Promise.all(order.items.map(async (item) => {
      try {
        if (!item.productId) return item;
        const pSnap = await getDoc(doc(db, 'products', item.productId));
        if (pSnap.exists()) {
          return { ...item, productDetails: pSnap.data() as any };
        }
      } catch (e) { console.error("Spec fetch error", e); }
      return item;
    }));

    const htmlContent = `
      <html>
        <head>
          <title>Packing Slip - #${order.id.slice(-6).toUpperCase()}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; max-width: 800px; mx-auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
            .brand h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
            .meta { text-align: right; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            table { w-full; width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #000; padding: 10px 0; }
            td { padding: 15px 0; border-bottom: 1px solid #eee; vertical-align: top; }
            .specs { font-size: 10px; color: #666; margin-top: 5px; line-height: 1.4; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
            @media print { body { padding: 0; } button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand"><h1>BrightSwitch</h1><p style="font-size:10px; margin-top:5px;">OFFICIAL PACKING SLIP</p></div>
            <div class="meta"><p><strong>Order #${order.id.slice(-6).toUpperCase()}</strong></p><p>${new Date(order.createdAt).toLocaleDateString()}</p></div>
          </div>

          <div class="grid section">
            <div>
              <div class="section-title">Ship To</div>
              <p><strong>${order.customerName || 'Guest Customer'}</strong></p>
              <p>${order.shippingAddress || 'No Address Provided'}</p>
              <p>${order.customerPhone || ''}</p>
              <p>${order.customerEmail || ''}</p>
            </div>
            <div>
               <div class="section-title">Order Details</div>
               <p><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase()}</p>
               <p><strong>Status:</strong> ${order.status?.toUpperCase()}</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Line Items</div>
            <table>
              <thead><tr><th>Item / Specs</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                ${itemsWithSpecs.map((item: any) => `
                  <tr>
                    <td>
                      <strong>${item.name}</strong>
                      <div class="specs">
                        ${item.productDetails?.specs ? `
                          Rating: ${item.productDetails.specs.currentRating || 'N/A'} • ${item.productDetails.specs.voltageRating || 'N/A'}<br/>
                          Poles: ${item.productDetails.specs.numberOfPoles || 'N/A'} • Curve: ${item.productDetails.specs.tripCharacteristic || 'N/A'}
                        ` : 'Standard Specs'}
                        ${item.productDetails?.shipping ? `<br/>Weight: ${item.productDetails.shipping.weightKg}kg • Class: ${item.productDetails.shipping.class}` : ''}
                      </div>
                    </td>
                    <td>${item.qty}</td>
                    <td>Rs. ${item.price.toLocaleString()}</td>
                    <td>Rs. ${(item.qty * item.price).toLocaleString()}</td>
                  </tr >
  `).join('')}
              </tbody>
            </table>
            <div class="total-row" style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px;"><span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #666;">Subtotal</span><span style="font-size: 14px;">Rs. ${(order.subtotal || (order.total / (1 + (order.taxRate || 0.15)))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
            <div class="total-row" style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px;"><span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #666;">Industrial Tax</span><span style="font-size: 14px;">Rs. ${(order.tax || (order.total - (order.subtotal || (order.total / (1 + (order.taxRate || 0.15)))))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
            ${order.codFee ? `<div class="total-row" style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px;"><span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #666;">COD Delivery Fee</span><span style="font-size: 14px;">Rs. ${order.codFee.toLocaleString()}</span></div>` : ''}
            <div class="total" style="text-align: right; font-size: 24px; font-weight: 900; margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">Net Total: <span style="color: #2563eb;">Rs. ${order.total.toLocaleString()}</span></div>
          </div>

          <div class="section mt-10">
             <p style="font-size: 10px; color: #999; text-align: center;">
              This is a computer-generated packing slip.<br/>
              ${settings?.corporateAddress || 'BrightSwitch Industrial Hub • Peshawar'}
             </p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadOrder = async (order: Order) => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    toast.loading("Generating PDF...", { id: 'download' });

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';

    const itemsWithSpecs = await Promise.all(order.items.map(async (item: any) => {
      const p = await getDoc(doc(db, 'products', item.productId));
      return { ...item, productDetails: p.data() };
    }));

    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; padding: 40px; color: #111; width: 800px; background: white;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px;">
          <div style="text-align: left;"><h1>BRIGHTSWITCH</h1><p style="font-size:10px; margin-top:5px; font-weight: bold; color: #666;">OFFICIAL PACKING SLIP</p></div>
          <div style="text-align: right;"><p><strong>Order #${order.id.slice(-6).toUpperCase()}</strong></p><p>${new Date(order.createdAt).toLocaleDateString()}</p></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
          <div style="text-align: left;">
            <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Ship To</div>
            <p><strong>${order.customerName || 'Guest Customer'}</strong></p>
            <p>${order.shippingAddress || 'No Address Provided'}</p>
            <p>${order.customerPhone || ''}</p>
            <p>${order.customerEmail || ''}</p>
          </div>
          <div style="text-align: left;">
             <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Order Details</div>
             <p><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase()}</p>
             <p><strong>Status:</strong> ${order.status?.toUpperCase()}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead><tr><th style="text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #000; padding: 10px 0;">Item / Specs</th><th style="padding:10px 0;">Qty</th><th style="padding:10px 0;">Price</th><th style="text-align: right; padding:10px 0;">Total</th></tr></thead>
          <tbody>
            ${itemsWithSpecs.map((item: any) => `
              <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid #eee; text-align: left;">
                  <strong>${item.name}</strong>
                  <div style="font-size: 10px; color: #666; margin-top: 5px; line-height: 1.4;">
                    ${item.productDetails?.specs ? `Rating: ${item.productDetails.specs.currentRating || 'N/A'} • ${item.productDetails.specs.voltageRating || 'N/A'}` : 'Standard Specs'}
                  </div>
                </td>
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
          <div style="display: flex; justify-content: flex-end; gap: 40px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #000;">Net Payable</span><span style="font-size: 20px; font-weight: 900; color: #2563eb;">Rs. ${order.total.toLocaleString()}</span></div>
        </div>
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 9px; color: #999;">
          ${settings?.corporateAddress || 'BrightSwitch Industrial Hub • Peshawar'}
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
      pdf.save(`Order_${order.id.slice(-6).toUpperCase()}.pdf`);
      toast.success("Download complete", { id: 'download' });
    } catch (err) {
      toast.error("Download failed", { id: 'download' });
    } finally {
      document.body.removeChild(container);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h2>
        <p className="text-gray-500 font-medium">Track and fulfil customer orders.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-6 py-6">Order ID</th>
              <th className="px-6 py-6">Customer</th>
              <th className="px-6 py-6">Date</th>
              <th className="px-6 py-6">Status</th>
              <th className="px-6 py-6 text-right">Total</th>
              <th className="px-6 py-6 text-right">Invoice</th>
              <th className="px-6 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-6 py-6 font-mono text-xs font-bold text-gray-500">#{order.id.slice(-6).toUpperCase()}</td>
                <td className="px-6 py-6">
                  <p className="font-bold text-gray-900">{order.customerName || 'Guest'}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{order.customerEmail}</p>
                </td>
                <td className="px-6 py-6 text-xs text-gray-500 font-medium whitespace-nowrap">
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() :
                    (order.createdAt && new Date(order.createdAt).toLocaleDateString() !== 'Invalid Date') ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-6">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none ${order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                      order.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-6 py-6 font-black text-gray-900 whitespace-nowrap">Rs. {order.total.toLocaleString()}</td>
                <td className="px-6 py-6 text-right relative">
                  <button
                    onClick={() => setActiveInvoiceMenu(activeInvoiceMenu === order.id ? null : order.id)}
                    className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center space-x-2 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <FileText size={14} />
                    <span>Invoice</span>
                    <ChevronDown size={14} className={`transition-transform ${activeInvoiceMenu === order.id ? 'rotate-180' : ''}`} />
                  </button>

                  {activeInvoiceMenu === order.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => { handlePrintOrder(order); setActiveInvoiceMenu(null); }}
                        className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                      >
                        <Printer size={14} />
                        <span>Print Slip</span>
                      </button>
                      <button
                        onClick={() => { handleDownloadOrder(order); setActiveInvoiceMenu(null); }}
                        className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center space-x-3"
                      >
                        <Download size={14} />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-6 text-right">
                  <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg transition-all">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {
        selectedOrder && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
            <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Order #{selectedOrder.id.slice(-6).toUpperCase()}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Placed on {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() :
                      (selectedOrder.createdAt && new Date(selectedOrder.createdAt).toLocaleString() !== 'Invalid Date') ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handlePrintOrder(selectedOrder)} className="bg-gray-100 text-gray-900 px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center space-x-2 hover:bg-gray-200 transition-all">
                    <Printer size={16} /> <span>Print</span>
                  </button>
                  <button onClick={() => handleDownloadOrder(selectedOrder)} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg">
                    <Download size={16} /> <span>Download</span>
                  </button>
                  <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"><X size={24} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto admin-scroll p-10 bg-gray-50/20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center"><UserIcon size={14} className="mr-2" /> Customer Details</h4>
                    <div className="space-y-4">
                      <div><p className="text-xs text-gray-400 font-bold uppercase">Name</p><p className="font-black text-gray-900">{selectedOrder.customerName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-400 font-bold uppercase">Email</p><p className="font-medium text-gray-900 break-all">{selectedOrder.customerEmail}</p></div>
                      <div><p className="text-xs text-gray-400 font-bold uppercase">Phone</p><p className="font-medium text-gray-900">{selectedOrder.customerPhone || 'N/A'}</p></div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center"><MapPin size={14} className="mr-2" /> Shipping Address</h4>
                    <p className="font-medium text-gray-700 leading-relaxed">{selectedOrder.shippingAddress}</p>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center"><CreditCard size={14} className="mr-2" /> Payment & Status</h4>
                    <div className="space-y-4">
                      <div><p className="text-xs text-gray-400 font-bold uppercase">Method</p><p className="font-black text-gray-900 uppercase">{selectedOrder.paymentMethod}</p></div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-2">Order Status</p>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as any)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Order Manifest</h4>
                  <div className="space-y-6">
                    {(loadingRichItems ? selectedOrder.items : richItems).map((item, idx) => (
                      <div key={idx} className="flex flex-col p-6 rounded-[2rem] hover:bg-gray-50 transition-all border border-gray-100 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                              {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 leading-tight">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                                Qty: {item.qty} × Rs. {item.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="font-black text-gray-900 text-lg">Rs. {(item.qty * item.price).toLocaleString()}</p>
                        </div>

                        {item.specs && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pt-4 border-t border-gray-50">
                            {item.specs.currentRating && (
                              <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rating</p>
                                <p className="text-[10px] font-bold text-gray-600">{item.specs.currentRating}</p>
                              </div>
                            )}
                            {item.specs.voltageRating && (
                              <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Voltage</p>
                                <p className="text-[10px] font-bold text-gray-600">{item.specs.voltageRating}</p>
                              </div>
                            )}
                            {item.specs.numberOfPoles && (
                              <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Poles</p>
                                <p className="text-[10px] font-bold text-gray-600">{item.specs.numberOfPoles}</p>
                              </div>
                            )}
                            {item.specs.tripCharacteristic && (
                              <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Curve</p>
                                <p className="text-[10px] font-bold text-gray-600">{item.specs.tripCharacteristic}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="pt-6 border-t border-dashed border-gray-200 flex justify-between items-center">
                      <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Total Amount</p>
                      <p className="text-2xl font-black text-blue-600">Rs. {selectedOrder.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

// --- View: Directory Manager ---
const DirectoryTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setLoadingOrders(true);
      const q = query(collection(db, 'orders'), where('userId', '==', selectedUser.uid), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setUserOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        setLoadingOrders(false);
      });
      return () => unsub();
    }
  }, [selectedUser]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">User Directory</h2>
        <p className="text-gray-500 font-medium">Manage customer accounts and B2B profiles.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6">User</th>
              <th className="px-10 py-6">Role</th>
              <th className="px-10 py-6">Company</th>
              <th className="px-10 py-6">Joined</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.uid} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-10 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black uppercase text-sm">
                      {u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-full object-cover" /> : u.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{u.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6"><span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">{u.role}</span></td>
                <td className="px-10 py-6 text-xs text-gray-500 font-bold">{u.companyName || '—'}</td>
                <td className="px-10 py-6 text-xs text-gray-500 font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-10 py-6 text-right">
                  <button onClick={() => setSelectedUser(u)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg transition-all"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-2xl font-black tracking-tight">{selectedUser.name}'s Profile</h3>
              <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto admin-scroll p-10 bg-gray-50/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center"><UserIcon size={14} className="mr-2" /> Personal Information</h4>
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600 font-black text-2xl uppercase">
                      {selectedUser.photoURL ? <img src={selectedUser.photoURL} className="w-full h-full rounded-[1.5rem] object-cover" /> : selectedUser.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-xl text-gray-900">{selectedUser.name}</p>
                      <p className="text-sm font-medium text-gray-500">{selectedUser.email}</p>
                      <span className="inline-block mt-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedUser.role}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</p><p className="font-bold text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p><p className="font-bold text-green-600 flex items-center"><CheckCircle2 size={12} className="mr-1" /> Active</p></div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center"><Building2 size={14} className="mr-2" /> Business Profile</h4>
                  {selectedUser.companyName ? (
                    <div className="space-y-4">
                      <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</p><p className="font-black text-lg text-gray-900">{selectedUser.companyName}</p></div>
                      <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax ID / NTN</p><p className="font-mono font-bold text-gray-600">{selectedUser.taxId || 'N/A'}</p></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Addresses</p>
                        <ul className="space-y-2">
                          {selectedUser.addresses?.map((addr, i) => (
                            <li key={i} className="flex items-start text-xs font-bold text-gray-600"><MapPin size={12} className="mr-2 mt-0.5 flex-shrink-0" /> {addr}</li>
                          )) || <li className="text-xs text-gray-400 italic">No addresses saved</li>}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <Building2 size={32} className="text-gray-300 mb-2" />
                      <p className="text-gray-400 font-bold text-sm">No Business Profile</p>
                      <p className="text-[10px] text-gray-400">Regular Customer Account</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center"><History size={14} className="mr-2" /> Recent Order History</h4>
                {loadingOrders ? (
                  <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
                ) : userOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <tr><th className="px-6 py-4 rounded-l-xl">Order ID</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Items</th><th className="px-6 py-4">Total</th><th className="px-6 py-4 rounded-r-xl text-right">Status</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {userOrders.map(order => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 font-mono text-xs font-bold">#{order.id.slice(-6).toUpperCase()}</td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-900">{order.items.length} items</td>
                            <td className="px-6 py-4 text-xs font-black text-gray-900">Rs. {order.total.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${order.status === 'Delivered' ? 'bg-green-50 text-green-600' : order.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{order.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold text-sm">No orders found for this user.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Payment Manager ---
// --- View: B2B Order Management ---
const B2BOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const s = await getDoc(doc(db, 'settings', 'contact'));
      if (s.exists()) setSettings(s.data() as SystemSettings);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('orderType', '==', 'b2b'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, (err) => {
      console.error("B2B Orders fetch error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePrintInvoice = async (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Pop-up blocked");

    printWindow.document.write('<html><head><title>Generating B2B Invoice...</title></head><body><h1>Loading Financial Documentation...</h1></body></html>');

    const htmlContent = `
          <html>
            <head>
              <title>B2B TAX INVOICE - #${order.id.slice(-6).toUpperCase()}</title>
              <style>
                body {font - family: 'Inter', sans-serif; padding: 50px; color: #111; max-width: 900px; margin: auto; }
                .header {display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
                .brand h1 {margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 3px; }
                .brand p {font - size: 10px; font-weight: 800; color: #666; margin-top: 5px; }
                .meta {text - align: right; }
                .invoice-title {font - size: 40px; font-weight: 900; text-transform: uppercase; margin: 40px 0; letter-spacing: -1px; }
                .grid {display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 50px; }
                .section-title {font - size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }
                table {width: 100%; border-collapse: collapse; margin-top: 20px; }
                th {text - align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #000; padding: 15px 10px; }
                td {padding: 20px 10px; border-bottom: 1px solid #eee; font-size: 14px; }
                .totals {margin - top: 40px; border-top: 2px solid #000; padding-top: 20px; text-align: right; }
                .total-row {display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px; }
                .total-label {font - size: 12px; font-weight: 800; text-transform: uppercase; color: #666; }
                .total-value {font - size: 18px; font-weight: 900; }
                .grand-total {font - size: 28px; color: #2563eb; }
                @media print {body {padding: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="brand"><h1>BrightSwitch</h1><p>INDUSTRIAL POWER SOLUTIONS • B2B DIVISION</p></div>
                <div class="meta"><p><strong>INVOICE NO:</strong> ${order.id.slice(-8).toUpperCase()}</p><p><strong>DATE:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p></div>
              </div>

              <div class="invoice-title">Tax Invoice</div>

              <div class="grid">
                <div>
                  <div class="section-title">Sold To</div>
                  <p><strong>${order.userCompanyName || order.customerName}</strong></p>
                  <p>${order.shippingAddress}</p>
                  <p>Email: ${order.customerEmail}</p>
                </div>
                <div>
                  <div class="section-title">Payment Terms</div>
                  <p><strong>Method:</strong> ${order.paymentMethod?.toUpperCase()}</p>
                  <p><strong>Status:</strong> ${order.paymentStatus?.toUpperCase()}</p>
                  <p><strong>Terms:</strong> Net 30 Days</p>
                </div>
              </div>

              <table>
                <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
                <tbody>
                  ${order.items.map((item: any) => `
                <tr>
                  <td><strong>${item.name}</strong><br/><span style="font-size:10px; color:#999; font-family:monospace">${item.productId.slice(0, 8)}</span></td>
                  <td style="text-align:center">${item.qty}</td>
                  <td style="text-align:right">Rs. ${item.price.toLocaleString()}</td>
                  <td style="text-align:right">Rs. ${(item.qty * item.price).toLocaleString()}</td>
                </tr>
              `).join('')}
                </tbody>
              </table>

              <div class="totals">
                <div class="total-row"><span class="total-label">Subtotal</span><span class="total-value">Rs. ${(order.subtotal || (order.total / (1 + (order.taxRate || 0.15)))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                <div class="total-row"><span class="total-label">Industrial Tax</span><span class="total-value">Rs. ${(order.tax || (order.total - (order.subtotal || (order.total / (1 + (order.taxRate || 0.15)))))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                ${order.codFee ? `<div class="total-row"><span class="total-label">COD Delivery Fee</span><span class="total-value">Rs. ${order.codFee.toLocaleString()}</span></div>` : ''}
                <div class="total-row"><span class="total-label" style="font-size:20px; color:#000;">Net Payable</span><span class="total-value grand-total">Rs. ${order.total.toLocaleString()}</span></div>
              </div>

              <div style="margin-top:100px; border-top:1px solid #eee; padding-top:10px; text-align:center; font-size:10px; color:#999;">
                This is a computer-generated document. No signature is required. <br />
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

  const handleDownloadInvoice = async (order: Order) => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    toast.loading("Generating B2B Invoice...", { id: 'download-b2b' });

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';

    const htmlContent = `
          <div style="font-family: 'Inter', sans-serif; padding: 50px; color: #111; width: 800px; background: white;">
            <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 40px;">
              <div style="text-align: left;"><h1>BRIGHTSWITCH</h1><p style="font-size: 10px; font-weight: 800; color: #666; margin-top: 5px;">INDUSTRIAL POWER SOLUTIONS • B2B DIVISION</p></div>
              <div style="text-align: right;"><p><strong>INVOICE NO:</strong> ${order.id.slice(-8).toUpperCase()}</p><p><strong>DATE:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p></div>
            </div>
            <div style="font-size: 40px; font-weight: 900; text-transform: uppercase; margin: 40px 0; letter-spacing: -1px; text-align: left;">Tax Invoice</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 50px;">
              <div style="text-align: left;">
                <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Sold To</div>
                <p><strong>${order.userCompanyName || order.customerName}</strong></p>
                <p>${order.shippingAddress}</p>
                <p>Email: ${order.customerEmail}</p>
              </div>
              <div style="text-align: left;">
                <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Payment Terms</div>
                <p><strong>Method:</strong> ${order.paymentMethod?.toUpperCase()}</p>
                <p><strong>Status:</strong> ${order.paymentStatus?.toUpperCase()}</p>
                <p><strong>Terms:</strong> Net 30 Days</p>
              </div>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead><tr><th style="text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #000; padding: 15px 10px;">Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                ${order.items.map((item: any) => `
              <tr>
                <td style="padding: 20px 10px; border-bottom: 1px solid #eee; font-size: 14px; text-align: left;"><strong>${item.name}</strong><br/><span style="font-size:10px; color:#999;">${item.productId.slice(0, 8)}</span></td>
                <td style="padding: 20px 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
                <td style="padding: 20px 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price.toLocaleString()}</td>
                <td style="padding: 20px 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${(item.qty * item.price).toLocaleString()}</td>
              </tr>
            `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; text-align: right;">
              <div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #666;">Subtotal</span><span>Rs. ${(order.subtotal || (order.total / (1 + (order.taxRate || 0.15)))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
              <div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #666;">Industrial Tax</span><span>Rs. ${(order.tax || (order.total - (order.subtotal || (order.total / (1 + (order.taxRate || 0.15)))))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
              ${order.codFee ? `<div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #666;">COD Delivery Fee</span><span>Rs. ${order.codFee.toLocaleString()}</span></div>` : ''}
              <div style="display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #000;">Net Payable</span><span style="font-size: 28px; font-weight: 900; color: #2563eb;">Rs. ${order.total.toLocaleString()}</span></div>
            </div>
            <div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 9px; color: #999;">
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
      toast.success("B2B Invoice downloaded", { id: 'download-b2b' });
    } catch (err) {
      toast.error("Download failed", { id: 'download-b2b' });
    } finally {
      document.body.removeChild(container);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Institutional B2B Orders</h2>
        <p className="text-gray-500 font-medium">Manage wholesale procurement requests and manage credit accounts.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-6 py-6 font-mono">Ref</th>
              <th className="px-6 py-6">Company / Buyer</th>
              <th className="px-8 py-6">Date</th>
              <th className="px-6 py-6">Value</th>
              <th className="px-6 py-6">Terms</th>
              <th className="px-6 py-6">Status</th>
              <th className="px-6 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-6 py-6 font-mono text-xs font-bold text-gray-500">#{o.id.slice(-6).toUpperCase()}</td>
                <td className="px-6 py-6">
                  <p className="font-bold text-gray-900 leading-tight">{o.userCompanyName || 'Individual'}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[150px]">{o.customerName}</p>
                </td>
                <td className="px-8 py-6 text-xs text-gray-500 font-medium whitespace-nowrap">
                  {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() :
                    new Date(o.createdAt).toLocaleDateString() !== 'Invalid Date' ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-6 font-black text-gray-900 whitespace-nowrap text-sm">Rs. {o.total.toLocaleString()}</td>
                <td className="px-6 py-6">
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest whitespace-nowrap">
                    {o.paymentMethod === 'invoice' ? 'Credit' : o.paymentMethod}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${o.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                    o.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-6 text-right relative">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setSelectedOrder(o)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg transition-all" title="View Details"><Eye size={16} /></button>
                  </div>
                </td>
              </tr >
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-bold">No B2B orders found.</td></tr>}
          </tbody >
        </table >
      </div >

      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Institutional Request Detail</h3>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Contract Order #{selectedOrder.id.slice(-6).toUpperCase()}</p>
                  <span className="text-gray-300">•</span>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleDateString() :
                      (selectedOrder.createdAt && new Date(selectedOrder.createdAt).toLocaleDateString() !== 'Invalid Date') ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto admin-scroll p-10 bg-gray-50/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Buyer Logistics</p>
                  <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                  <p className="font-black text-blue-600 text-lg mb-4">{selectedOrder.userCompanyName}</p>
                  <p className="text-gray-500 font-medium text-sm leading-relaxed">{selectedOrder.shippingAddress}</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Financial Status</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-500">Total Contract Value</span>
                    <span className="text-2xl font-black text-gray-900">Rs. {selectedOrder.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">Payment Status</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${selectedOrder.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>{selectedOrder.paymentStatus}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Component Manifest</p>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border">{item.image && <img src={item.image} className="w-full h-full object-cover" />}</div>
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{item.qty} Units × Rs. {item.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="font-black text-gray-900">Rs. {(item.qty * item.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t bg-white flex space-x-4">
              <button
                onClick={() => handlePrintInvoice(selectedOrder)}
                className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2 hover:bg-gray-200 transition-all border border-gray-200"
              >
                <Printer size={18} /> <span>Print Invoice</span>
              </button>
              <button
                onClick={() => handleDownloadInvoice(selectedOrder)}
                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all shadow-xl"
              >
                <Download size={18} /> <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

// --- View: Logistics Manager ---
const LogisticsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'fulfillment' | 'shipping' | 'tracking'>('fulfillment');
  const [queue, setQueue] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);

  // Modal State
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editableZones, setEditableZones] = useState<ShippingZone[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const queueData = await logisticsService.getFulfillmentQueue();
      const shipmentData = await logisticsService.getActiveShipments();
      const carrierData = logisticsService.getCarriers();
      const zoneData = await logisticsService.getShippingZones();

      setQueue(queueData);
      setShipments(shipmentData);
      setCarriers(carrierData);
      setShippingZones(zoneData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (order: Order) => {
    // Simple prompt for MVP.
    // In a full implementation, this would be a modal with weight, dimensions, and carrier selection.
    const tracking = prompt("Enter Tracking Number for Order #" + order.id.slice(-6));
    if (!tracking) return;

    try {
      await logisticsService.createShipment(order.id, {
        trackingNumber: tracking,
        carrier: 'FedEx', // Defaulting for simple MVP
        cost: 0,
        weight: 1
      });
      toast.success("Shipment created & Order updated");
      loadData();
    } catch (error) {
      toast.error("Failed to create shipment");
    }
  };

  const openZoneModal = () => {
    setEditableZones(JSON.parse(JSON.stringify(shippingZones)));
    setShowZoneModal(true);
  };

  const saveZones = async () => {
    try {
      for (const zone of editableZones) {
        await logisticsService.updateShippingZone(zone);
      }
      toast.success("Shipping zones updated");
      setShippingZones(editableZones);
      setShowZoneModal(false);
    } catch (err) {
      toast.error("Failed to save zones");
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Logistics Command</h2>
          <p className="text-gray-500 font-medium">Manage fulfillment, shipping and delivery.</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          {(['fulfillment', 'shipping', 'tracking'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'fulfillment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Queue Column */}
          <div className="col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-gray-900 flex items-center"><Box size={20} className="mr-2 text-blue-600" /> Order Queue <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">{queue.length}</span></h3>
            </div>

            {queue.length > 0 ? queue.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleCreateShipment(order)} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                    <TruckIcon size={20} />
                  </button>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order #{order.id.slice(-6).toUpperCase()}</span>
                    <h4 className="text-lg font-black text-gray-900 mt-1">{order.customerName || 'Guest'}</h4>
                    <p className="text-xs font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase rounded-lg">Pending Fulfillment</span>
                </div>

                <div className="border-t border-dashed border-gray-100 my-4"></div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {/* Simple item previews */}
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white overflow-hidden">
                        {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                      </div>
                    ))}
                    {order.items.length > 3 && <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-500">+{order.items.length - 3}</div>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-400">Items</p>
                    <p className="font-bold text-gray-900">{order.items.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-400">Total Weight</p>
                    <p className="font-bold text-gray-900">2.4 kg</p> {/* Metric placeholder */}
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                <CheckCircle2 size={48} className="mx-auto text-green-400 mb-4" />
                <h3 className="text-lg font-black text-gray-900">All Caught Up!</h3>
                <p className="text-sm font-medium text-gray-500">No pending orders in the queue.</p>
              </div>
            )}
          </div>

          {/* Stats / Quick Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-200 relative overflow-hidden">
              <TruckIcon size={120} className="absolute -right-4 -bottom-4 opacity-10" />
              <h3 className="text-2xl font-black mb-1">{queue.length}</h3>
              <p className="text-xs font-bold uppercase opacity-80 mb-6">Orders to Ship</p>
              <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors">Start Batch Picking</button>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Carrier Status</h4>
              <div className="space-y-3">
                {carriers.map(c => (
                  <div key={c.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${c.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-bold text-sm text-gray-700">{c.name}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${c.connected ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{c.connected ? 'Online' : 'Offline'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'shipping' && (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem]">
          <Package size={64} className="mx-auto text-gray-300 mb-6" />
          <h3 className="text-xl font-black text-gray-900">Shipping Management</h3>
          <p className="text-gray-500 font-medium max-w-md mx-auto mt-2">Create manual labels, manage rates, and configure shipping zones.</p>
          <button onClick={openZoneModal} className="mt-8 px-8 py-3 bg-white border border-gray-200 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Configure Shipping Zones</button>
        </div>
      )}

      {/* Shipping Zones Modal (Editable) */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[2rem] p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowZoneModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-4">Shipping Configuration</h3>
            <p className="text-gray-500 font-medium mb-8">Manage regional delivery zones and flat rates.</p>
            <div className="space-y-4">
              {editableZones.map((zone, index) => (
                <div key={zone.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 w-full space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Zone Name</label>
                    <input
                      value={zone.name}
                      onChange={(e) => {
                        const newZones = [...editableZones];
                        newZones[index].name = e.target.value;
                        setEditableZones(newZones);
                      }}
                      className="w-full bg-white px-4 py-2 rounded-xl font-bold text-gray-900 border-none outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Region Description</label>
                    <input
                      value={zone.description}
                      onChange={(e) => {
                        const newZones = [...editableZones];
                        newZones[index].description = e.target.value;
                        setEditableZones(newZones);
                      }}
                      className="w-full bg-white px-4 py-2 rounded-xl text-xs font-bold text-gray-500 border-none outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Rate (PKR)</label>
                    <input
                      type="number"
                      value={zone.price}
                      onChange={(e) => {
                        const newZones = [...editableZones];
                        newZones[index].price = Number(e.target.value);
                        setEditableZones(newZones);
                      }}
                      className="w-full bg-white px-4 py-2 rounded-xl font-black text-blue-600 border-none outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={saveZones} className="w-full mt-8 bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Save Changes</button>
          </div>
        </div>
      )}

      {activeSubTab === 'tracking' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Tracking #</th>
                <th className="px-8 py-6">Carrier</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Shipped Date</th>
                <th className="px-8 py-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-8 py-6 font-mono text-xs font-bold text-gray-600">{s.trackingNumber}</td>
                  <td className="px-8 py-6 font-bold text-gray-900 uppercase">{s.carrier}</td>
                  <td className="px-8 py-6">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{s.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-8 py-6 text-xs font-medium text-gray-500">
                    {s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-blue-600 font-bold text-xs hover:underline">Track</button>
                  </td>
                </tr>
              ))}
              {shipments.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold">No active shipments found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- View: Admin Sidebar ---
const AdminSidebar: React.FC<{ activeTab: string; setActiveTab: (t: string) => void }> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'categories', label: 'Categories', icon: FolderTree }, // ADDED
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'blogs', label: 'Safety Blogs', icon: BookOpen }, // REPLACED CAMPAIGNS
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'warehouse', label: 'Warehouse', icon: Archive },
    { id: 'inquiries', label: 'Queries', icon: Headphones },
    { id: 'b2b-orders', label: 'B2B Orders', icon: BarChart3 },
    { id: 'electrician-apps', label: 'Electrician Apps', icon: FileEdit },
    { id: 'verified-partners', label: 'Verified Electricians', icon: Zap },
    { id: 'users', label: 'Directory', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-50 text-white">
      <div className="p-8 border-b border-gray-800"><div className="flex items-center space-x-2 text-blue-500 mb-2"><Zap size={24} className="fill-current" /><span className="font-black text-xl tracking-tighter text-white uppercase">BrightSwitch</span></div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Admin Terminal</p></div>
      <div className="p-4 border-b border-gray-800">
        <Link to="/" className="w-full flex items-center space-x-3 px-4 py-3 bg-white/5 text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all no-underline">
          <Globe size={16} />
          <span>Return to Website</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto admin-scroll">{menuItems.map((item) => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><item.icon size={20} /><span className="text-[10px] uppercase tracking-widest">{item.label}</span></button>))}</nav>
      <div className="p-4 border-t border-gray-800"><button onClick={() => logout()} className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"><LogOut size={20} /><span className="text-[10px] uppercase tracking-widest">Terminate Session</span></button></div>
    </div>
  );
};

// --- Main Controller ---
export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabParams, setTabParams] = useState<any>({}); // Store params for tabs
  const { user } = useAuth();

  const navigateToTab = (tab: string, params: any = {}) => {
    setTabParams(params);
    setActiveTab(tab);
  };

  if (user?.role !== 'admin' && user?.role !== 'warehouse') {
    return <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50"><X size={64} className="text-red-500 mb-6" /><h2 className="text-3xl font-black text-gray-900 tracking-tight">Access Restricted</h2><button onClick={() => window.location.href = '/'} className="mt-10 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Exit Secure Area</button></div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab navigateTo={navigateToTab} />;
      case 'categories': return <CategoriesTab />; // ADDED
      case 'products': return <ProductsTab initialAction={tabParams.action} />;
      case 'blogs': return <BlogsTab initialAction={tabParams.action} />; // ADDED
      case 'orders': return <OrdersTab />;
      case 'warehouse': return <WarehouseTab />;
      case 'inquiries': return <QueriesTab />;
      case 'b2b-orders': return <B2BOrdersTab />;
      case 'users': return <DirectoryTab />;
      case 'electrician-apps': return <ElectricianAppsTab />;
      case 'verified-partners': return <VerifiedElectriciansTab />;
      case 'settings': return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-left">
      <Toaster position="top-right" />
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="ml-64 p-16">
        <header className="flex justify-between items-center mb-16 text-left">
          <div className="text-left"><h1 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-2">Operational Terminal</h1><div className="flex items-center space-x-4 mt-1"><span className="text-5xl font-black text-gray-900 tracking-tighter">System Admin</span><div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div></div></div>
          <div className="flex items-center space-x-10"><div className="text-right"><p className="text-sm font-black text-gray-900">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p><p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1">Status: Operational</p></div><div className="w-16 h-16 rounded-[1.5rem] bg-white border-2 border-white shadow-xl flex items-center justify-center overflow-hidden ring-4 ring-blue-50">{user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" /> : <div className="text-2xl font-black text-blue-600 uppercase">{user?.name.charAt(0)}</div>}</div></div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

// --- Settings Tab ---
const SettingsTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'general' | 'faqs' | 'experts'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [formData, setFormData] = useState<SystemSettings>({
    corporateAddress: 'Plot 45, Industrial Area Phase 2, Peshawar, Pakistan',
    supportEmail: 'support@brightswitch.pro',
    supportPhone: '+92 (300) 123 4567',
    officeHours: 'Mon - Fri: 09:00 - 18:00',
    industrialTax: 0,
    codFee: 150,
    mapLat: 34.0044,
    mapLng: 71.5375,
    easypaisaNumber: '03001234567',
    updatedAt: Date.now()
  });

  // FAQs State
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0 });

  // Experts State
  const [experts, setExperts] = useState<TeamMember[]>([]);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [editingExpert, setEditingExpert] = useState<TeamMember | null>(null);
  const [expertForm, setExpertForm] = useState({ name: '', role: '', specialization: '', experience: '', image: '', order: 0 });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load Settings
      const settingsSnap = await getDoc(doc(db, 'settings', 'contact'));
      if (settingsSnap.exists()) setFormData(settingsSnap.data() as SystemSettings);

      // Load FAQs
      const faqsSnap = await getDocs(collection(db, 'faqs'));
      setFaqs(faqsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FAQ)).sort((a, b) => (a.order || 0) - (b.order || 0)));

      // Load Experts
      const expertsSnap = await getDocs(collection(db, 'experts'));
      setExperts(expertsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember)).sort((a, b) => (a.order || 0) - (b.order || 0)));

    } catch (err) {
      console.error(err);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'contact'), { ...formData, updatedAt: Date.now() });
      toast.success('System parameters synchronized');
    } catch (err) {
      toast.error('Failed to sync settings');
    } finally {
      setSaving(false);
    }
  };

  // --- FAQ Handlers ---
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await updateDoc(doc(db, 'faqs', editingFaq.id), { ...faqForm, updatedAt: Date.now() });
        toast.success('FAQ updated');
      } else {
        await addDoc(collection(db, 'faqs'), { ...faqForm, createdAt: Date.now() });
        toast.success('FAQ added');
      }
      setShowFaqModal(false);
      loadAllData();
    } catch (err) {
      toast.error('Failed to save FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await deleteDoc(doc(db, 'faqs', id));
      toast.success('FAQ deleted');
      loadAllData();
    } catch (err) {
      toast.error('Failed to delete FAQ');
    }
  };

  const openFaqModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqForm({ question: faq.question, answer: faq.answer, order: faq.order || 0 });
    } else {
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', order: 0 });
    }
    setShowFaqModal(true);
  };

  // --- Expert Handlers ---
  const handleSaveExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpert) {
        await updateDoc(doc(db, 'experts', editingExpert.id), { ...expertForm, updatedAt: Date.now() });
        toast.success('Expert profile updated');
      } else {
        await addDoc(collection(db, 'experts'), { ...expertForm, createdAt: Date.now() });
        toast.success('Expert profile added');
      }
      setShowExpertModal(false);
      loadAllData();
    } catch (err) {
      toast.error('Failed to save expert profile');
    }
  };

  const handleDeleteExpert = async (id: string) => {
    if (!confirm('Remove this expert?')) return;
    try {
      await deleteDoc(doc(db, 'experts', id));
      toast.success('Expert removed');
      loadAllData();
    } catch (err) {
      toast.error('Failed to remove expert');
    }
  };

  const openExpertModal = (expert?: TeamMember) => {
    if (expert) {
      setEditingExpert(expert);
      setExpertForm({
        name: expert.name, role: expert.role, specialization: expert.specialization,
        experience: expert.experience, image: expert.image, order: expert.order || 0
      });
    } else {
      setEditingExpert(null);
      setExpertForm({ name: '', role: '', specialization: '', experience: '', image: '', order: 0 });
    }
    setShowExpertModal(true);
  };


  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="max-w-6xl animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Global Control</h2>
          <p className="text-gray-500 font-medium mt-1">Configure core corporate data, FAQs, and Team.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {(['general', 'faqs', 'experts'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveSection(tab)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSection === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeSection === 'general' && (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-10 space-y-10">
            <form onSubmit={handleSaveSettings} className="space-y-10">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center"><Building2 size={16} className="mr-2" /> Identity Index</h4>
                <div className="grid grid-cols-1 gap-6"><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Corporate Physical Address</label><textarea rows={3} required value={formData.corporateAddress} onChange={e => setFormData({ ...formData, corporateAddress: e.target.value })} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none" /></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Public Support Email</label><input type="email" required value={formData.supportEmail} onChange={e => setFormData({ ...formData, supportEmail: e.target.value })} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all" /></div>
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Hotline</label><input type="text" required value={formData.supportPhone} onChange={e => setFormData({ ...formData, supportPhone: e.target.value })} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all" /></div>
                </div>
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Operational Hours</label><input type="text" required value={formData.officeHours} onChange={e => setFormData({ ...formData, officeHours: e.target.value })} className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all" /></div>

                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center pt-6"><DollarSign size={16} className="mr-2" /> Financial Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Industrial Tax (%)</label>
                    <input
                      type="number" required value={formData.industrialTax}
                      onChange={e => setFormData({ ...formData, industrialTax: Number(e.target.value) })}
                      className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">COD Processing Fee (Rs.)</label>
                    <input
                      type="number" required value={formData.codFee}
                      onChange={e => setFormData({ ...formData, codFee: Number(e.target.value) })}
                      className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Easypaisa Number (For Commissions)</label>
                    <input
                      type="text" value={formData.easypaisaNumber || ''}
                      onChange={e => setFormData({ ...formData, easypaisaNumber: e.target.value })}
                      className="w-full bg-gray-50 rounded-2xl px-6 py-4 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                      placeholder="e.g. 03001234567"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-10 flex justify-end"><button type="submit" disabled={saving} className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center space-x-3 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}<span>Commit System Changes</span></button></div>
            </form>
          </div>
        </div>
      )}

      {activeSection === 'faqs' && (
        <div className="space-y-6">
          <div className="flex justify-end"><button onClick={() => openFaqModal()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-2"><Plus size={16} /><span>Add New FAQ</span></button></div>
          <div className="grid gap-4">
            {faqs.map(faq => (
              <div key={faq.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-start group hover:border-blue-100 transition-all">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-sm text-gray-500">{faq.answer}</p>
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openFaqModal(faq)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteFaq(faq.id)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {faqs.length === 0 && <div className="text-center p-10 bg-gray-50 rounded-2xl text-gray-400 font-bold">No FAQs added yet.</div>}
          </div>
        </div>
      )}

      {activeSection === 'experts' && (
        <div className="space-y-6">
          <div className="flex justify-end"><button onClick={() => openExpertModal()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-2"><Plus size={16} /><span>Add New Expert</span></button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map(expert => (
              <div key={expert.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 relative group overflow-hidden">
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => openExpertModal(expert)} className="p-2 bg-white/90 backdrop-blur text-gray-600 rounded-lg hover:text-blue-600 shadow-sm"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteExpert(expert.id)} className="p-2 bg-white/90 backdrop-blur text-gray-600 rounded-lg hover:text-red-600 shadow-sm"><Trash2 size={14} /></button>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 bg-gray-100">
                    <img src={expert.image || 'https://via.placeholder.com/150'} alt={expert.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-black text-lg text-gray-900">{expert.name}</h4>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">{expert.role}</p>
                  <div className="space-y-1 w-full text-sm">
                    <div className="flex justify-between text-gray-500 font-medium"><span>Experience</span><span className="text-gray-900 font-bold">{expert.experience}</span></div>
                    <div className="flex justify-between text-gray-500 font-medium"><span>Specialization</span><span className="text-gray-900 font-bold">{expert.specialization}</span></div>
                  </div>
                </div>
              </div>
            ))}
            {experts.length === 0 && <div className="col-span-full text-center p-10 bg-gray-50 rounded-2xl text-gray-400 font-bold">No Experts added yet.</div>}
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowFaqModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-6">{editingFaq ? 'Edit FAQ' : 'New FAQ'}</h3>
            <form onSubmit={handleSaveFaq} className="space-y-6">
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Question</label><input required value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600" /></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Answer</label><textarea required rows={4} value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600 resize-none" /></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sort Order</label><input type="number" value={faqForm.order} onChange={e => setFaqForm({ ...faqForm, order: Number(e.target.value) })} className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600" /></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Save FAQ</button>
            </form>
          </div>
        </div>
      )}

      {/* Expert Modal */}
      {showExpertModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[2rem] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowExpertModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-6">{editingExpert ? 'Edit Expert Profile' : 'New Expert Profile'}</h3>
            <form onSubmit={handleSaveExpert} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label><input required value={expertForm.name} onChange={e => setExpertForm({ ...expertForm, name: e.target.value })} className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600" /></div>
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role / Title</label><input required value={expertForm.role} onChange={e => setExpertForm({ ...expertForm, role: e.target.value })} className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600" /></div>
                </div>
                <div className="flex-1 space-y-6">
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Experience</label><input required value={expertForm.experience} onChange={e => setExpertForm({ ...expertForm, experience: e.target.value })} placeholder="e.g. 15+ Years" className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600" /></div>
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Specialization</label><input required value={expertForm.specialization} onChange={e => setExpertForm({ ...expertForm, specialization: e.target.value })} className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600" /></div>
                </div>
              </div>
              <div>
                <ImageUploader label="PROFILE IMAGE" onUploadSuccess={(res) => setExpertForm({ ...expertForm, image: res.imageUrl })} previewUrl={expertForm.image} required />
              </div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sort Order</label><input type="number" value={expertForm.order} onChange={e => setExpertForm({ ...expertForm, order: Number(e.target.value) })} className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold border-none outline-none focus:ring-2 focus:ring-blue-600" /></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Save Expert Profile</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
