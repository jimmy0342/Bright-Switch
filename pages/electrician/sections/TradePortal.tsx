import React, { useState, useEffect } from 'react';
import {
    Search,
    ShoppingCart,
    Package,
    ChevronRight,
    TrendingDown,
    AlertCircle,
    Plus,
    Minus,
    Zap,
    Filter,
    Clock
} from 'lucide-react';
import { db } from '../../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Product } from '../../../types';

export const TradePortal: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(
            collection(db, 'products'),
            where('status', '==', 'published')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
            setLoading(false);
        });

        return () => unsub();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Trade Portal</h2>
                    <p className="text-gray-500 font-bold mt-1">Exclusive wholesale pricing for professionals</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center hover:bg-blue-600 transition-all shadow-xl shadow-gray-100">
                        <Package className="mr-2" size={18} /> Order History
                    </button>
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 relative">
                        <ShoppingCart className="mr-2" size={18} /> Bulk Order Tool
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg">PRO</span>
                    </button>
                </div>
            </div>

            {/* Trade Benefit Alert */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-3xl p-6 text-white flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10 flex items-center space-x-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shrink-0">
                        <TrendingDown size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black tracking-tight">Professional Trade Discount Active</h4>
                        <p className="text-blue-100 font-medium opacity-90">Your pricing is currently <span className="text-white font-black">15% - 30% lower</span> than retail. Exclusive to PEC certified electricians.</p>
                    </div>
                </div>
                <Zap className="absolute right-[-5%] top-[-20%] w-48 h-48 text-white/10 -rotate-12" />
            </div>

            {/* Browser & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Quick search products, SKUs, or specs..."
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-gray-100 focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                    />
                </div>
                <div className="flex space-x-2">
                    {['all', 'Solar', 'Lighting', 'Switchgear'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat.toLowerCase())}
                            className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${activeCategory === cat.toLowerCase()
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                    <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:border-gray-200 transition-all">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Loading Trade Catalog...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <Package size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">No Products Found in Catalog</p>
                    </div>
                ) : products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product: Product) => (
                    <div key={product.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden group hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all flex flex-col text-left">
                        {/* Image Section */}
                        <div className="relative h-48 bg-gray-50 overflow-hidden flex items-center justify-center p-6">
                            <img
                                src={product.images?.main || 'https://via.placeholder.com/200'}
                                alt={product.name}
                                className="h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-black text-gray-900 rounded-lg shadow-sm uppercase tracking-widest">
                                    {product.category}
                                </span>
                            </div>
                            <div className="absolute bottom-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform">
                                <button className="bg-blue-600 text-white p-3 rounded-xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="mb-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{product.sku}</p>
                                <h4 className="text-base font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors uppercase">{product.name}</h4>
                                <p className="text-xs text-gray-500 mt-2 font-medium italic line-clamp-2">{product.shortDescription || product.description || 'No description available'}</p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retail Price</span>
                                    <span className="text-sm font-bold text-gray-400 line-through">PKR {product.price?.base?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Trade Price</span>
                                    <span className="text-xl font-black text-blue-700">PKR {product.price?.b2b?.toLocaleString() || 0}</span>
                                </div>
                            </div>

                            {product.inventory?.stock < 10 && (
                                <div className="mt-4 flex items-center space-x-1.5 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                    <AlertCircle size={10} />
                                    <span>Only {product.inventory.stock} units left</span>
                                </div>
                            )}
                        </div>

                        {/* Buy Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center space-x-3">
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <button className="p-2 hover:bg-gray-50 text-gray-400"><Minus size={14} /></button>
                                <input type="text" value="1" className="w-8 text-center text-xs font-black bg-transparent outline-none" readOnly />
                                <button className="p-2 hover:bg-gray-50 text-gray-400"><Plus size={14} /></button>
                            </div>
                            <button className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Professional Sourcing Note */}
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Truck size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Need something special?</h3>
                <p className="text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                    For project-specific components or large quantity sourcing (transformers, industrial switchgear, or container-load cables), contact our technical procurement direct line.
                </p>
                <button className="text-blue-600 font-black text-sm uppercase tracking-widest hover:underline mt-4">
                    Contact Procurement Office →
                </button>
            </div>
        </div>
    );
};

// Simple Truck Icon shim
const Truck = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
);
