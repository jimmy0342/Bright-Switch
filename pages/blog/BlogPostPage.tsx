
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, increment, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Blog } from '../../types';
import { Calendar, User, Clock, Eye, ChevronLeft, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, Loader2 } from 'lucide-react';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<Blog[]>([]);

  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      const q = query(collection(db, 'blogs'), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        setIsLoading(false);
        return;
      }

      const blogData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Blog;
      setBlog(blogData);
      setIsLoading(false);

      // Increment view count
      const blogRef = doc(db, 'blogs', blogData.id);
      await updateDoc(blogRef, { views: increment(1) });

      // Fetch related posts
      const relatedQ = query(
        collection(db, 'blogs'),
        where('category', '==', blogData.category),
        where('status', '==', 'published'),
        limit(4)
      );
      const relatedSnap = await getDocs(relatedQ);
      setRelatedPosts(relatedSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Blog))
        .filter(b => b.id !== blogData.id)
        .slice(0, 3));
    };

    fetchBlog();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Guide Not Found</h2>
        <p className="text-gray-500 mb-8">The electrical guide you're looking for might have been moved.</p>
        <Link to="/blog" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Back to Insights</Link>
      </div>
    );
  }

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this electrical guide from BrightSwitch: ${blog.title}`;

    switch (platform) {
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`); break;
      case 'linkedin': window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`); break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
    }
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Blog Post Hero */}
      <div className="relative h-[600px] overflow-hidden">
        <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-10 md:p-20 text-left">
          <div className="max-w-4xl mx-auto">
            <Link to="/blog" className="inline-flex items-center text-blue-400 font-black uppercase text-xs tracking-widest mb-8 hover:text-white transition-colors">
              <ChevronLeft size={16} className="mr-2" /> Library
            </Link>
            <span className="block text-blue-500 font-black uppercase text-xs tracking-[0.4em] mb-4">{blog.category}</span>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-8">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-8 text-gray-300">
              <div className="flex items-center space-x-2 text-sm font-bold">
                <Calendar size={16} /> <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold">
                <Clock size={16} /> <span>{blog.readTime} Read</span>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold">
                <Eye size={16} /> <span>{blog.views} Views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row gap-20">
          {/* Main Content Area */}
          <div className="lg:w-[65%] text-left">
            <article className="prose prose-xl max-w-none prose-blue prose-headings:font-black prose-headings:tracking-tighter prose-p:text-gray-600 prose-p:leading-relaxed prose-img:rounded-[2rem]">
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: blog.content }} />
            </article>

            {/* Tags */}
            <div className="mt-20 pt-10 border-t flex flex-wrap gap-3">
              {blog.tags.map(tag => (
                <span key={tag} className="bg-gray-50 text-gray-500 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-[35%] space-y-12">
            {/* Share Widget */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 text-left sticky top-28">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
                <Share2 size={16} className="mr-2 text-blue-600" /> Share This Insight
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleShare('facebook')} className="flex items-center justify-center space-x-3 p-4 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group">
                  <Facebook size={20} /> <span className="font-bold text-xs uppercase tracking-widest">Facebook</span>
                </button>
                <button onClick={() => handleShare('twitter')} className="flex items-center justify-center space-x-3 p-4 bg-blue-50 text-blue-400 rounded-2xl hover:bg-blue-400 hover:text-white transition-all group">
                  <Twitter size={20} /> <span className="font-bold text-xs uppercase tracking-widest">Twitter</span>
                </button>
                <button onClick={() => handleShare('linkedin')} className="flex items-center justify-center space-x-3 p-4 bg-blue-50 text-blue-800 rounded-2xl hover:bg-blue-800 hover:text-white transition-all group">
                  <Linkedin size={20} /> <span className="font-bold text-xs uppercase tracking-widest">LinkedIn</span>
                </button>
                <button onClick={() => handleShare('copy')} className="flex items-center justify-center space-x-3 p-4 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-900 hover:text-white transition-all group">
                  <LinkIcon size={20} /> <span className="font-bold text-xs uppercase tracking-widest">Copy</span>
                </button>
              </div>

              {/* Related Posts */}
              <div className="mt-12">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-8">Related Guides</h4>
                <div className="space-y-6">
                  {relatedPosts.map(post => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="flex space-x-4 group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={post.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h5 className="text-xs font-black text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                          {post.title}
                        </h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{post.readTime} Read</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
