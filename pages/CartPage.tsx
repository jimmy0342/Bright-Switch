
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const CartPage: React.FC = () => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const navigate = useNavigate();
    const { user } = useAuth();

    const total = cart.reduce((sum, item) => sum + (item.price.base * item.quantity), 0);

    const handleCheckout = async () => {
        try {
            const orderData = {
                userId: user?.uid || 'guest',
                customerEmail: user?.email || '',
                customerName: user?.name || '',
                items: cart.map(item => ({
                    productId: item.id,
                    name: item.name,
                    qty: item.quantity,
                    price: item.price.base,
                    image: item.images?.main,
                    category: item.category,
                    subCategory: item.subCategory
                })),
                total: total,
                status: 'pending_payment',
                paymentStatus: 'Pending',
                createdAt: serverTimestamp(),
                isBuyNow: false,
                expiresAt: Date.now() + (15 * 60 * 1000) // 15 mins
            };

            const docRef = await addDoc(collection(db, 'orders'), orderData);
            navigate(`/checkout?orderId=${docRef.id}`);
        } catch (error) {
            toast.error("Failed to initiate checkout");
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 font-medium mb-8">Looks like you haven't added any electrical components yet.</p>
                    <Link to="/shop" className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                        Browse Catalog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shopping Cart</h1>
                <button onClick={clearCart} className="text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
                    Clear Cart
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                                <img src={item.images?.main} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                                            {item.category}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">SKU: {item.sku}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center bg-gray-50 rounded-xl p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                            className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:bg-white rounded-lg transition-all"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:bg-white rounded-lg transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="font-black text-lg text-gray-900">
                                        Rs. {(item.price.base * item.quantity).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-xl font-black mb-6">Order Summary</h3>

                            <div className="space-y-4 text-sm font-medium text-gray-400">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-white font-bold">Rs. {total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="text-green-400 font-bold">Calculated at Checkout</span>
                                </div>
                                <div className="flex justify-between pt-4 border-t border-gray-800 text-lg text-white font-black">
                                    <span>Total</span>
                                    <span>Rs. {total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pt-6 space-y-3">
                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-600/20"
                                >
                                    Proceed to Checkout <ArrowRight size={16} className="ml-2" />
                                </button>
                                <Link to="/shop" className="block w-full text-center py-4 text-gray-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors">
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
