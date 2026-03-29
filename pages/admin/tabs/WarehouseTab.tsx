
import React, { useState, useEffect } from 'react';
import {
    collection, query, onSnapshot, orderBy
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import {
    Loader2, Package, ShoppingCart, Archive, TrendingUp, AlertTriangle, Search
} from 'lucide-react';
import { Product, Order } from '../../../types';

export const WarehouseTab: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        });

        const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
            setLoading(false);
        });

        return () => {
            unsubProducts();
            unsubOrders();
        };
    }, []);

    // Calculate sales per product
    const getSalesData = (productId: string) => {
        return orders.reduce((acc, order) => {
            const item = order.items.find(i => i.productId === productId);
            return acc + (item ? item.qty : 0);
        }, 0);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase font-inter">Warehouse Inventory</h2>
                    <p className="text-gray-500 font-bold mt-1">Real-time stock tracking and movement analysis</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search SKU or Product..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-600 outline-none shadow-sm transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                            <Package size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total SKUs</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{products.length}</h3>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pieces Sold</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                        {orders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + i.qty, 0), 0)}
                    </h3>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                            <Archive size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                        {products.filter(p => (p.inventory?.stock || 0) <= (p.inventory?.lowStockThreshold || 5)).length}
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Intelligence</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Stock</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Sold Units</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Current Stock</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Inventory Health</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map(product => {
                                const sold = getSalesData(product.id);
                                const initial = product.inventory?.initialStock ?? product.inventory?.stock ?? 0;
                                const current = Math.max(0, initial - sold);
                                const lowThreshold = product.inventory?.lowStockThreshold || 5;
                                const isLow = current <= lowThreshold && current > 0;
                                const isOut = current === 0;

                                return (
                                    <tr key={product.id} className="hover:bg-blue-50/20 transition-all duration-300 group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                                    <img src={product.images?.main} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 tracking-tight leading-tight">{product.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{product.sku}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-gray-900 text-sm">{initial.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">Pieces</span></p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg">
                                                <ShoppingCart size={12} />
                                                <span className="font-black text-[10px] uppercase">{sold.toLocaleString()} Sold</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <p className={`font-black text-lg ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-blue-600'}`}>
                                                {current.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {isOut ? (
                                                <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-red-100 text-red-600 rounded-full font-black text-[10px] uppercase tracking-widest">
                                                    <AlertTriangle size={12} />
                                                    <span>Stock Exhausted</span>
                                                </span>
                                            ) : isLow ? (
                                                <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full font-black text-[10px] uppercase tracking-widest">
                                                    <AlertTriangle size={12} />
                                                    <span>Critical Level</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-green-100 text-green-600 rounded-full font-black text-[10px] uppercase tracking-widest">
                                                    <CheckCircle size={12} />
                                                    <span>Healthy Stock</span>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Internal icon shim if needed
const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
