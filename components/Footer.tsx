import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram
} from 'lucide-react';
import { collection, query, limit, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Category, SystemSettings } from '../types';

export const Footer: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [contactInfo, setContactInfo] = useState<SystemSettings | null>(null);

    useEffect(() => {
        // Fetch Contact Info
        const unsubSettings = onSnapshot(doc(db, 'settings', 'contact'), (doc) => {
            if (doc.exists()) {
                setContactInfo(doc.data() as SystemSettings);
            }
        });

        // Fetch Categories for Quick Links
        const qCats = query(collection(db, 'categories'), orderBy('displayOrder'), limit(5));
        const unsubCats = onSnapshot(qCats, (snap) => {
            setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
        });

        return () => {
            unsubSettings();
            unsubCats();
        };
    }, []);

    return (
        <footer className="bg-gray-900 pt-24 pb-12 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-left">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Zap className="text-blue-500 fill-current" size={28} />
                            <span className="text-2xl font-black tracking-tighter">BRIGHTSWITCH</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed font-medium">
                            Authorized provider of industrial circuit protection. Engineered for global excellence and operational safety. We empower the world's most critical circuits.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-blue-600 transition-all"><Facebook size={18} /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-blue-600 transition-all"><Twitter size={18} /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-blue-600 transition-all"><Linkedin size={18} /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-blue-600 transition-all"><Instagram size={18} /></a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Quick Links</h4>
                        <ul className="space-y-4 text-sm font-bold text-gray-400">
                            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link to="/shop" className="hover:text-white transition-colors">Products</Link></li>
                            <li><Link to="/shop" className="hover:text-white transition-colors">Categories</Link></li>
                            <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Shop Categories</h4>
                        <ul className="space-y-4 text-sm font-bold text-gray-400">
                            {categories.length > 0 ? categories.slice(0, 5).map(cat => (
                                <li key={cat.id}><Link to={`/shop?category=${encodeURIComponent(cat.name)}`} className="hover:text-white transition-colors">{cat.name}</Link></li>
                            )) : (
                                <>
                                    <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
                                    <li><Link to="/shop" className="hover:text-white transition-colors">Lighting</Link></li>
                                    <li><Link to="/shop" className="hover:text-white transition-colors">Wiring</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Contact Us</h4>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3 group">
                                <Mail className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                                <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{contactInfo?.supportEmail || 'support@brightswitch.pro'}</span>
                            </div>
                            <div className="flex items-start space-x-3 group">
                                <Phone className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                                <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{contactInfo?.supportPhone || '+92 (300) 1234567'}</span>
                            </div>
                            <div className="flex items-start space-x-3 group">
                                <MapPin className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                                <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{contactInfo?.corporateAddress || '123 Industrial Estate, Phase 4, Lahore, Pakistan'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                        © 2024 BRIGHTSWITCH GLOBAL. ALL RIGHTS RESERVED.
                    </div>
                    <div className="flex space-x-8 text-[10px] font-black uppercase tracking-widest text-gray-600">
                        <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-blue-500 transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
