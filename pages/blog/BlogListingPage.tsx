
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Blog } from '../../types';
import { Search, ChevronRight, Calendar, Clock, Loader2, ArrowRight, Newspaper } from 'lucide-react';

export const BlogListingPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // Removed orderBy to avoid the requirement for a composite index (status + publishedAt)
    // We will sort client-side instead.
    const q = query(
      collection(db, 'blogs'),
      where('status', '==', 'published')
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetchedBlogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Blog));

      // Sort client-side: Published date descending
      const sortedBlogs = fetchedBlogs.sort((a, b) => b.publishedAt - a.publishedAt);

      setBlogs(sortedBlogs);
      setIsLoading(false);
    }, (err) => {
      console.error("Blog fetch error:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredBlogs = blogs.filter(b => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogs.find(b => b.isFeatured) || blogs[0];
  const categories = ['All', ...new Set(blogs.map(b => b.category))];
  const popularPosts = [...blogs].sort((a, b) => b.views - a.views).slice(0, 4);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-6">
            BrightSwitch <span className="text-blue-500">Insights</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Expert electrical guides, safety tips, and industry knowledge to empower your power systems.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <div className="lg:w-[70%] space-y-20">
            {/* Featured Post */}
            {!searchTerm && featuredPost && (
              <div className="group relative bg-white rounded-[3rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 text-left">
                <div className="aspect-[21/9] overflow-hidden">
                  <img src={featuredPost.featuredImage} alt={featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-10 md:p-14">
                  <div className="flex items-center space-x-4 mb-6">
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">Featured</span>
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">{featuredPost.category}</span>
                  </div>
                  <Link to={`/blog/${featuredPost.slug}`}>
                    <h2 className="text-4xl font-black text-gray-900 mb-6 group-hover:text-blue-600 transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>
                  </Link>
                  <p className="text-lg text-gray-500 font-medium mb-10 leading-relaxed line-clamp-2 whitespace-pre-wrap">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> {new Date(featuredPost.publishedAt).toLocaleDateString()}</span>
                      <span className="flex items-center"><Clock size={14} className="mr-1.5" /> {featuredPost.readTime}</span>
                    </div>
                    <Link to={`/blog/${featuredPost.slug}`} className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm flex items-center hover:bg-blue-600 transition-all">
                      Read Full Guide <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {isLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                  <p className="font-black uppercase tracking-widest text-xs">Loading Insights...</p>
                </div>
              ) : filteredBlogs.length > 0 ? (
                filteredBlogs.filter(b => b.id !== featuredPost?.id || searchTerm).map((blog) => (
                  <div key={blog.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col text-left">
                    <div className="h-64 overflow-hidden relative">
                      <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-6 left-6">
                        <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-lg">
                          {blog.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center text-[10px] text-gray-400 font-black uppercase tracking-widest space-x-4 mb-4">
                        <span className="flex items-center"><Calendar size={12} className="mr-1.5" /> {new Date(blog.publishedAt).toLocaleDateString()}</span>
                        <span className="flex items-center"><Clock size={12} className="mr-1.5" /> {blog.readTime} Read</span>
                      </div>
                      <Link to={`/blog/${blog.slug}`}>
                        <h3 className="text-xl font-black text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                          {blog.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 font-medium mb-8 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                        {blog.excerpt}
                      </p>
                      <div className="mt-auto pt-6 border-t flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Guide</span>
                        <Link to={`/blog/${blog.slug}`} className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center hover:translate-x-1 transition-transform">
                          Details <ArrowRight size={14} className="ml-1.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed">
                  <p className="text-gray-400 font-black uppercase tracking-widest">No articles found matching your criteria</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-[30%] space-y-12 text-left">
            {/* Search */}
            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Search Library</h4>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Amps, Volts, Safety..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-600 outline-none font-bold text-gray-900"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Expert Categories</h4>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-5 py-3 rounded-xl font-bold text-sm transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Posts */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Popular Reads</h4>
              <div className="space-y-6">
                {popularPosts.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="flex space-x-4 group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={post.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h5 className="text-xs font-black text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                        {post.title}
                      </h5>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{post.views} Views</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-blue-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100">
              <Newspaper size={32} className="mb-6" />
              <h4 className="text-2xl font-black mb-4 tracking-tight">Stay Informed</h4>
              <p className="text-blue-100 text-sm font-medium leading-relaxed mb-8">
                Subscribe to our monthly briefing for safety updates and engineering insights.
              </p>
              <form className="space-y-4">
                <input
                  type="email"
                  placeholder="engineer@company.com"
                  className="w-full px-6 py-4 rounded-2xl border-none bg-blue-500/50 backdrop-blur-md placeholder:text-blue-200 outline-none font-bold"
                />
                <button className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors shadow-xl">
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
