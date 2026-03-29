import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, Menu, X, Zap, Search, ChevronDown, Layout, FolderTree } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Category } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  const navigate = useNavigate();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin' || user.role === 'warehouse') return '/admin';
    if (user.role === 'electrician') return '/electrician-dashboard';
    if (user.role === 'buyer') return '/buyer-dashboard';
    return '/my-account';
  };

  React.useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('displayOrder'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
    return () => unsub();
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'warehouse';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-[100] shadow-sm">
      {/* Top Utility Bar */}
      <div className="hidden md:block bg-gray-900 text-white py-2 text-[10px] font-black uppercase tracking-[0.2em]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          Free Shipping on Industrial Orders Over Rs. 50,000 | Authorized BrightSwitch Electrician
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* LEFT: Logo Group */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0 no-underline">
              <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-100">
                <Zap className="h-6 w-6 text-white fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-gray-900 leading-none">
                  BRIGHT<span className="text-blue-600">SWITCH</span>
                </span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Powering Protection</span>
              </div>
            </Link>
          </div>

          {/* CENTER: Main Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 absolute left-1/2 -translate-x-1/2 space-x-8 text-sm font-bold text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition-colors no-underline">Home</Link>
            <Link to="/about" className="hover:text-blue-600 transition-colors no-underline">About</Link>

            <div
              className="relative group"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <Link to="/shop" className="hover:text-blue-600 transition-colors flex items-center no-underline py-4">
                Products <ChevronDown size={14} className={`ml-1 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
              </Link>

              {showCategories && categories.length > 0 && (
                <div className="absolute top-full left-0 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${encodeURIComponent(cat.name)}`}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all font-bold no-underline"
                        onClick={() => setShowCategories(false)}
                      >
                        <FolderTree size={16} className="text-blue-600" />
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/blog" className="hover:text-blue-600 transition-colors no-underline">Safety Guide</Link>
            <Link to="/hire-electrician" className="hover:text-blue-600 transition-colors no-underline">Services</Link>
            <Link to="/contact" className="hover:text-blue-600 transition-colors no-underline">Contact</Link>
          </div>



          {/* RIGHT: Actions Section */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/cart" className="relative p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all group no-underline">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-black ring-4 ring-white shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link to={getDashboardLink()} className="transition-all no-underline">
              {user ? (
                <div className={`flex items-center px-4 py-2.5 rounded-2xl border transition-all hover:shadow-lg ${isAdmin ? 'bg-gray-900 border-gray-800' : 'bg-blue-50 border-blue-100'}`}>
                  <div className={`p-1.5 rounded-lg mr-3 ${isAdmin ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white shadow-sm'}`}>
                    {isAdmin ? <Layout size={14} /> : <User size={14} />}
                  </div>
                  <div className="flex flex-col items-start justify-center leading-none mt-0.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest mb-0.5 whitespace-nowrap ${isAdmin ? 'text-blue-400' : 'text-blue-600'}`}>
                      {isAdmin ? 'System console' : 'Account Active'}
                    </span>
                    <span className={`text-xs font-black uppercase whitespace-nowrap ${isAdmin ? 'text-white' : 'text-gray-900'}`}>
                      {user.name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl">
                  <User className="h-6 w-6" />
                </div>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-2xl transition-all">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-50 py-8 px-6 space-y-6 shadow-2xl animate-in slide-in-from-top-5 duration-300">
          <div className="relative group mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search components..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex flex-col space-y-4">
            <Link to="/" className="text-lg font-black text-gray-900 px-4 py-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors text-left no-underline flex items-center justify-between" onClick={() => setIsOpen(false)}>
              Home <ChevronDown size={16} className="-rotate-90 text-gray-300" />
            </Link>
            <Link to="/shop" className="text-lg font-black text-gray-900 px-4 py-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors text-left no-underline flex items-center justify-between" onClick={() => setIsOpen(false)}>
              Shop All Products <ChevronDown size={16} className="-rotate-90 text-gray-300" />
            </Link>
            <div className="px-4 py-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block">Categories</span>
              <div className="grid grid-cols-1 gap-2">
                {categories.slice(0, 4).map(cat => (
                  <Link key={cat.id} to={`/shop?category=${encodeURIComponent(cat.name)}`} className="text-sm font-bold text-gray-600 hover:text-blue-600 no-underline py-2" onClick={() => setIsOpen(false)}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link to="/blog" className="text-lg font-black text-gray-900 px-4 py-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors text-left no-underline flex items-center justify-between" onClick={() => setIsOpen(false)}>
              Safety Guide <ChevronDown size={16} className="-rotate-90 text-gray-300" />
            </Link>
            <Link to="/hire-electrician" className="text-lg font-black text-gray-900 px-4 py-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors text-left no-underline flex items-center justify-between" onClick={() => setIsOpen(false)}>
              Services <ChevronDown size={16} className="-rotate-90 text-gray-300" />
            </Link>
          </div>
          {!user ? (
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 no-underline" onClick={() => setIsOpen(false)}>Client Login</Link>
          ) : (
            <button onClick={() => { logout(); setIsOpen(false); navigate('/'); }} className="block w-full text-center bg-red-50 text-red-600 py-5 rounded-[2rem] font-black text-xl border border-red-100">Terminate Session</button>
          )}
        </div>
      )}
    </nav>
  );
};