
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, collection, query, where, limit,
  getDocs, updateDoc, increment, serverTimestamp,
  runTransaction, setDoc, addDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import {
  ShoppingCart, Star, Shield, Truck,
  ChevronRight, Minus, Plus, Loader2, AlertTriangle,
  CheckCircle2, Info, Zap, X, Share2, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'Description' | 'Specifications' | 'Installation'>('Description');

  const allImages = useMemo(() => {
    if (!product) return [];
    return [product.images.main, ...(product.images.gallery || [])];
  }, [product]);

  const isAdminOrBuyer = user?.role === 'admin' || user?.role === 'buyer';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        let productData: Product | null = null;
        if (docSnap.exists()) productData = { id: docSnap.id, ...docSnap.data() } as Product;
        if (!productData) {
          const q = query(collection(db, 'products'), where('slug', '==', id), limit(1));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) productData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as Product;
        }
        if (!productData) { setError("Product not found"); return; }
        setProduct(productData);
        await updateDoc(doc(db, 'products', productData.id), { views: increment(1) });
      } catch (err) { setError("Failed to load product"); } finally { setLoading(false); }
    };
    fetchProduct();
  }, [id]);

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      const orderData = {
        userId: user?.uid || 'guest',
        customerEmail: user?.email || '',
        customerName: user?.name || '',
        items: [{
          productId: product.id,
          name: product.name,
          qty: quantity,
          price: (isAdminOrBuyer && product.price.b2b) ? product.price.b2b : product.price.base,
          image: product.images.main,
          category: product.category,
          subCategory: product.subCategory
        }],
        total: ((isAdminOrBuyer && product.price.b2b) ? product.price.b2b : product.price.base) * quantity,
        status: 'pending_payment',
        paymentStatus: 'Pending',
        createdAt: serverTimestamp(),
        isBuyNow: true,
        expiresAt: Date.now() + (15 * 60 * 1000) // 15 mins
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      navigate(`/checkout?orderId=${docRef.id}`);
    } catch (error) {
      toast.error("Failed to initiate checkout");
    }
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" /><p className="font-black text-xs uppercase tracking-widest text-gray-400">Syncing Product Matrix...</p></div>;
  if (error || !product) return <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center"><AlertTriangle className="h-16 w-16 text-orange-500 mb-6" /><h1 className="text-3xl font-black text-gray-900">Product Unavailable</h1><Link to="/shop" className="mt-8 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs">Back to Product Catalog</Link></div>;

  const stockLevel = product.inventory?.stock || 0;
  const isOutOfStock = stockLevel <= 0;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 text-left">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <Link to="/" className="hover:text-blue-600">Home</Link><ChevronRight size={14} />
          <Link to="/shop" className="hover:text-blue-600">Product Catalog</Link><ChevronRight size={14} />
          <span className="text-gray-600 truncate">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-4">
            <div
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden aspect-square cursor-zoom-in group relative"
              onClick={() => setShowLightbox(true)}
            >
              <img
                src={allImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <Share2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-200'
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] bg-blue-50 px-3 py-1 rounded-lg">{product.category}</span>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">{product.name}</h1>
              <p className="text-xs font-bold text-gray-400 uppercase">Model: {product.model} • SKU: {product.sku}</p>
            </div>

            <div className="space-y-4">
              {isAdminOrBuyer ? (
                <div>
                  <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] bg-blue-50 px-3 py-1 rounded-lg mb-2 inline-block">Wholesale Active</span>
                  <p className="text-4xl font-black text-green-600">Rs. {product.price?.b2b?.toLocaleString() || product.price?.base?.toLocaleString()}</p>
                </div>
              ) : (
                <span className="text-4xl font-black text-gray-900">Rs. {product.price?.base?.toLocaleString()}</span>
              )}
            </div>

            <div className="space-y-6">
              <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center w-fit ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
                {isOutOfStock ? 'Out of Stock' : `Active Supply (${stockLevel} units)`}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900"><Minus size={18} /></button>
                  <span className="w-12 text-center font-black text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900"><Plus size={18} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => addToCart(product, quantity)} disabled={isOutOfStock || isAdmin} className="bg-gray-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl disabled:opacity-50 hover:bg-gray-800 transition-all">Add To Cart</button>
                <button onClick={handleBuyNow} disabled={isOutOfStock || isAdmin} className="bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl shadow-blue-200 disabled:opacity-50 hover:bg-blue-700 transition-all">Buy Now</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center"><Info size={14} className="mr-2 text-blue-600" /> Technical Data</h4>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm border-b border-gray-50 pb-2"><span className="text-gray-400 font-bold">Amps</span><span className="text-gray-900 font-black">{product.specs?.currentRating}</span></li>
                <li className="flex justify-between items-center text-sm border-b border-gray-50 pb-2"><span className="text-gray-400 font-bold">Volts</span><span className="text-gray-900 font-black">{product.specs?.voltageRating}</span></li>
                <li className="flex justify-between items-center text-sm"><span className="text-gray-400 font-bold">Poles</span><span className="text-gray-900 font-black">{product.specs?.numberOfPoles}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-50 bg-gray-50/50">
            {['Description', 'Specifications', 'Installation'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-10 py-6 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                  ? 'bg-white text-blue-600 border-x border-gray-100 first:border-l-0'
                  : 'text-gray-400 hover:text-gray-900'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10 md:p-16">
            <div className={`animate-in fade-in duration-500 ${activeTab === 'Description' ? 'block' : 'hidden'}`}>
              <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Product Narrative</h3>
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-500 font-medium leading-relaxed whitespace-pre-line text-lg">
                  {product.description || "No full description provided for this component level yet."}
                </p>
              </div>
            </div>

            <div className={`animate-in fade-in duration-500 ${activeTab === 'Specifications' ? 'block' : 'hidden'}`}>
              <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Technical Data Sheets</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { label: 'Form Factor', value: product.category },
                  { label: 'Current Rating', value: product.specs?.currentRating || 'N/A' },
                  { label: 'Voltage Rating', value: product.specs?.voltageRating || 'N/A' },
                  { label: 'Number of Poles', value: product.specs?.numberOfPoles || 'N/A' },
                  { label: 'Trip Curve', value: product.specs?.tripCharacteristic || 'N/A' },
                  { label: 'Frequency', value: product.specs?.frequency || '50/60Hz' },
                  { label: 'Housing Material', value: product.specs?.material || 'Polycarbonate' },
                  { label: 'Color Index', value: product.specs?.color || 'Standard White' },
                  { label: 'Shipping Weight', value: `${product.shipping?.weightKg || 0}kg` },
                  { label: 'Safety Class', value: product.shipping?.class || 'Industrial' }
                ].map((spec, i) => (
                  <div key={i} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{spec.label}</p>
                    <p className="text-gray-900 font-black">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`animate-in fade-in duration-500 ${activeTab === 'Installation' ? 'block' : 'hidden'}`}>
              <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Safety & Installation Protocols</h3>
              <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-[2.5rem] flex items-start space-x-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Shield size={24} />
                </div>
                <div>
                  <p className="text-blue-900 font-bold mb-2 uppercase text-[10px] tracking-widest">Authorized Personnel Only</p>
                  <p className="text-blue-700/80 font-medium leading-relaxed text-sm">
                    This component must be installed in accordance with local electrical codes and standards. Ensure power source is terminated and locked out before proceeding with integration. Consult the technical manual for specific DIN-rail mounting instructions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {showLightbox && (
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

          <div className="mt-8 flex gap-2 overflow-x-auto max-w-full p-2">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-transparent opacity-50 hover:opacity-100'
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
