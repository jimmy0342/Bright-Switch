
import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const ProductSlider: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { addToCart } = useCart();

    useEffect(() => {
        const q = query(collection(db, 'products'), limit(18)); // Fetch up to 18 products (3 slides of 6)
        const unsub = onSnapshot(q, (snap) => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
            setIsLoading(false);
        }, (err) => {
            console.error("Product Slider Fetch Error:", err);
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const totalSlides = Math.ceil(products.length / 6);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, [totalSlides]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    useEffect(() => {
        if (totalSlides <= 1) return;
        const interval = setInterval(nextSlide, 15000);
        return () => clearInterval(interval);
    }, [nextSlide, totalSlides]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
                <p className="font-black text-xs uppercase tracking-widest">Loading Premium Deals...</p>
            </div>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex flex-col items-center justify-center mb-12">
                    <div className="text-center">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4">Hot Deals & New Arrivals</h2>
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">High-performance components at the best prices</p>
                    </div>
                    <div className="flex space-x-2 mt-6 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
                        <button
                            onClick={prevSlide}
                            className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-400 hover:text-blue-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-gray-400 hover:text-blue-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden">
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                            <div key={slideIndex} className="w-full flex-shrink-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.slice(slideIndex * 6, slideIndex * 6 + 6).map((p) => (
                                        <div key={p.id} className="bg-white group rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col text-left">
                                            <Link to={`/product/${p.slug || p.id}`} className="aspect-[3/2] relative overflow-hidden bg-gray-50 block">
                                                <img
                                                    src={p.images?.main}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                                                    Best Seller
                                                </div>
                                            </Link>
                                            <div className="p-4 flex-1 flex flex-col">
                                                <div className="text-[9px] text-blue-600 font-black uppercase tracking-wider mb-1.5">{p.category}</div>
                                                <Link to={`/product/${p.slug || p.id}`} className="block">
                                                    <h3 className="font-black text-base text-gray-900 mb-1.5 leading-tight h-10 line-clamp-2 hover:text-blue-600 transition-colors">{p.name}</h3>
                                                </Link>
                                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                                    <div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Special Price</span>
                                                        <span className="text-lg font-black text-gray-900">Rs. {p.price?.base?.toLocaleString()}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            addToCart(p);
                                                            toast.success(`${p.name} added to cart!`);
                                                        }}
                                                        className="bg-gray-900 text-white p-3 rounded-xl hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-200"
                                                    >
                                                        <ShoppingCart size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center mt-12 space-x-2">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`h-2 rounded-full transition-all duration-300 ${currentIndex === i ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
