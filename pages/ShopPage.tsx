
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Search, Filter, Loader2, PackageX, Eye, FolderTree } from 'lucide-react';
import { Product, Category } from '../types';
import { Link, useSearchParams } from 'react-router-dom';

export const ShopPage: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setIsLoading(false);
    }, (err) => {
      console.error("Firestore Fetch Error:", err);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('displayOrder'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [searchParams]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isB2B = user?.role === 'buyer' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 space-y-4 md:space-y-0 text-left">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-500 mt-1 uppercase text-[10px] font-black tracking-widest">High-performance electrical distribution components</p>
        </div>

        <div className="flex w-full md:w-auto space-x-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search components or SKUs..."
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl border shadow-sm sticky top-24 text-left">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Categories</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setActiveCategory('All')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-bold ${activeCategory === 'All' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Products
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors text-sm font-bold flex items-center space-x-2 ${activeCategory === cat.name ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <FolderTree size={14} className={activeCategory === cat.name ? 'text-blue-600' : 'text-gray-400'} />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
              <p className="font-black text-xs uppercase tracking-widest">Synchronizing Product Hub...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white group rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col text-left">
                  <Link to={`/product/${p.slug || p.id}`} className="aspect-[4/3] relative overflow-hidden bg-gray-100 block">
                    <img src={p.images?.main} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {isB2B && (
                      <div className="absolute top-4 left-4 bg-green-600 text-white px-2 py-1 rounded-md text-[10px] font-black shadow-lg uppercase tracking-widest">
                        Wholesale Tier
                      </div>
                    )}
                  </Link>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[10px] text-blue-600 font-black uppercase tracking-wider mb-2">{p.category}</div>
                    <Link to={`/product/${p.slug || p.id}`} className="block">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight h-12 line-clamp-2 hover:text-blue-600 transition-colors">{p.name}</h3>
                    </Link>
                    <div className="flex flex-wrap gap-2 mb-4 mt-2">
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase">{p.specs?.currentRating || 'N/A'}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase">{p.specs?.voltageRating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t">
                      <div>
                        {isB2B ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-lg w-fit mb-1">Wholesale</span>
                            <span className="text-xl font-black text-green-600">Rs. {p.price?.b2b?.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-xl font-black text-gray-900">Rs. {p.price?.base?.toLocaleString()}</span>
                        )}
                      </div>
                      <button onClick={() => addToCart(p)} disabled={isAdmin} className="bg-gray-900 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-gray-900">
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <PackageX className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No products found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
