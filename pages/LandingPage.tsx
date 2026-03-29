
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Zap, ArrowRight, ArrowLeft, Plus, ShoppingCart,
  ShieldCheck, Flame, Globe, ChevronRight, Loader2,
  Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram,
  Calendar, Clock, Sparkles
} from 'lucide-react';
import { collection, query, where, limit, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useCart } from '../context/CartContext';
import { Product, Blog, SystemSettings, Category } from '../types';
import toast from 'react-hot-toast';
import { ProductSlider } from '../components/ProductSlider';

export const LandingPage: React.FC = () => {
  const { addToCart } = useCart();

  const [latestInsights, setLatestInsights] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contactInfo, setContactInfo] = useState<SystemSettings | null>(null);

  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isLoadingCats, setIsLoadingCats] = useState(true);

  useEffect(() => {
    // Fetch Status Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'contact'), (doc) => {
      if (doc.exists()) {
        setContactInfo(doc.data() as SystemSettings);
      }
    });

    // Fetch Hot Deals


    // Fetch Latest Blog Insights
    const qInsights = query(
      collection(db, 'blogs'),
      where('status', '==', 'published'),
      limit(3)
    );

    const unsubInsights = onSnapshot(qInsights, (snap) => {
      const blogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Blog));
      // Sort client-side to avoid needing a complex index for this limited landing page query
      setLatestInsights(blogs.sort((a, b) => b.publishedAt - a.publishedAt));
      setIsLoadingInsights(false);
    }, (err) => {
      console.error("Insights fetch error:", err);
      setIsLoadingInsights(false);
    });

    // Fetch Categories
    const qCats = query(collection(db, 'categories'), orderBy('displayOrder'), limit(5));
    const unsubCats = onSnapshot(qCats, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      setIsLoadingCats(false);
    });

    return () => {
      unsubSettings();
      unsubInsights();
      unsubCats();
    };
  }, []);

  const handleAddToCart = (p: Product) => {
    addToCart(p);
    toast.success(`${p.name} added to cart!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Banner Section */}
      <section className="relative h-[700px] flex items-start overflow-hidden pt-[80px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero.jpg"
            alt="BrightSwitch Store"
            className="w-full h-full object-cover scale-105 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 px-4 py-2 rounded-full mb-8">
              <Sparkles size={16} className="text-blue-400" />
              <span className="text-blue-200 text-xs font-black uppercase tracking-widest">Premium Electrical Solutions</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
              POWERING THE <span className="text-blue-500">FUTURE</span> OF INFRASTRUCTURE
            </h1>
            <p className="text-xl text-gray-300 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Industrial-grade components, professional engineering expertise, and smart energy solutions for the modern world.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                to="/shop"
                className="group relative px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 w-full sm:w-auto text-center"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Explore Catalog
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </span>
              </Link>
              <Link
                to="/contact"
                className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all w-full sm:w-auto text-center"
              >
                Get Expert Advice
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories (Icon Grid) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col items-center justify-center mb-16">
            <div className="text-center">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4">Our Product Categories</h2>
              <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Global standard safety components</p>
            </div>
            <div className="mt-6 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
              <Link to="/shop" className="text-blue-600 font-black flex items-center hover:translate-x-2 transition-transform">
                View Complete Catalog <ArrowRight size={20} className="ml-2" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {isLoadingCats ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm animate-pulse border border-gray-100 h-64">
                  <div className="bg-gray-100 w-16 h-16 rounded-3xl mb-8"></div>
                  <div className="h-6 bg-gray-100 w-3/4 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-100 w-1/2 rounded-lg"></div>
                </div>
              ))
            ) : categories.map((cat, i) => (
              <Link key={cat.id} to={`/shop?category=${encodeURIComponent(cat.name)}`} className="bg-white p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group text-left border border-gray-100">
                <div className="bg-gray-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 text-3xl group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-blue-200">
                  <span className="group-hover:hidden">
                    {cat.name.includes('Light') ? '💡' :
                      cat.name.includes('Breaker') ? '⚡' :
                        cat.name.includes('Solar') ? '☀️' :
                          cat.name.includes('Tool') ? '🔧' :
                            cat.name.includes('Wiring') ? '🔌' : '📦'}
                  </span>
                  <Plus className="hidden group-hover:block text-white" size={24} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{cat.name}</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">Premium Collection</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductSlider />

      {/* Preventive Safety Section */}
      <section className="py-32 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 rounded-[4rem] p-12 md:p-24 flex flex-col lg:flex-row items-center gap-16 border border-blue-100 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

            <div className="flex-1 text-left relative z-10">
              <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mb-10 shadow-2xl shadow-blue-200">
                <ShieldCheck size={40} className="text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-8">Why Electrical Safety Matters</h2>
              <p className="text-xl text-gray-700 font-medium leading-relaxed mb-10">
                Electrical faults can lead to serious safety risks and system downtime.
                <span className="text-blue-600 font-black px-1">BrightSwitch Solutions</span> are designed to automatically isolate faults and ensure controlled power switching, safeguarding equipment, property, and human life.
              </p>
              <Link to="/blog" className="inline-flex items-center text-blue-600 font-black text-lg uppercase tracking-widest hover:translate-x-2 transition-transform">
                Technical Safety Guide <ArrowRight className="ml-3" />
              </Link>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 relative z-10 w-full items-stretch">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl text-left border border-blue-100 hover:-translate-y-2 transition-all flex flex-col h-full">
                <Flame size={32} className="text-orange-500 mb-6" />
                <h5 className="font-black text-lg mb-2">Fire Mitigation</h5>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Advanced arc quenching technology to prevent electrical ignitions.</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl text-left border border-blue-100 hover:-translate-y-2 transition-all flex flex-col h-full">
                <Globe size={32} className="text-blue-500 mb-6" />
                <h5 className="font-black text-lg mb-2">Global Compliance</h5>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Fully certified to IEC, CE, and ISO standards for international export.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Electrical Safety Insights Section (DYNAMIC) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Electrical Safety Insights</h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoadingInsights ? (
              [1, 2, 3].map(n => (
                <div key={n} className="bg-white rounded-[2rem] overflow-hidden shadow-sm h-96 animate-pulse">
                  <div className="h-56 bg-gray-200"></div>
                  <div className="p-8 space-y-4">
                    <div className="h-6 bg-gray-200 w-3/4 rounded-lg"></div>
                    <div className="h-4 bg-gray-200 w-full rounded-lg"></div>
                    <div className="h-4 bg-gray-200 w-1/2 rounded-lg"></div>
                  </div>
                </div>
              ))
            ) : latestInsights.length > 0 ? (
              latestInsights.map((post) => (
                <div key={post.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-gray-100 flex flex-col h-full text-left">
                  <div className="h-56 overflow-hidden">
                    <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center text-[10px] text-gray-400 font-black uppercase tracking-widest space-x-4 mb-4">
                      <span className="flex items-center"><Calendar size={12} className="mr-1.5" /> {new Date(post.publishedAt).toLocaleDateString()}</span>
                      <span className="flex items-center"><Clock size={12} className="mr-1.5" /> {post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 font-medium mb-8 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto">
                      <Link to={`/blog/${post.slug}`} className="inline-flex items-center text-blue-600 font-black uppercase text-xs tracking-widest hover:translate-x-2 transition-transform">
                        Read Full Guide <ChevronRight size={16} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed">
                <p className="text-gray-400 font-black uppercase tracking-widest">No published insights found</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-32 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 text-left">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4 block">Our Mission</span>
              <h2 className="text-5xl font-black text-gray-900 tracking-tight mb-10 leading-[1.1]">The Engineering Behind <br /><span className="text-blue-600 underline decoration-blue-200 underline-offset-8">BrightSwitch Solutions</span></h2>
              <div className="space-y-6 text-lg text-gray-600 font-medium leading-relaxed">
                <p>
                  BrightSwitch is a reliable provider of advanced AC and DC circuit breakers, circuit protection devices, and changeover breakers designed to ensure safe and uninterrupted power distribution.
                </p>
                <p>
                  Our products are engineered to protect electrical systems from overloads, short circuits, and power faults, reducing the risk of equipment damage, fire hazards, and operational failure. Manufactured in compliance with international safety standards, BrightSwitch solutions offer high breaking capacity, durability, and consistent performance.
                </p>
                <p>
                  With a wide range of variants suitable for residential, commercial, industrial, and solar power applications, BrightSwitch delivers dependable electrical protection and smooth power transfer where safety and reliability are critical.
                </p>
              </div>
              <div className="flex items-center space-x-6 mt-12">
                <div className="flex flex-col items-center">
                  <div className="bg-blue-50 p-4 rounded-2xl mb-2">
                    <Shield className="text-blue-600" size={32} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ISO Certified</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-blue-50 p-4 rounded-2xl mb-2">
                    <Globe className="text-blue-600" size={32} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intl Standards</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="w-full aspect-square rounded-[5rem] bg-gray-200 overflow-hidden shadow-2xl relative z-10 border-8 border-white">
                <img src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
