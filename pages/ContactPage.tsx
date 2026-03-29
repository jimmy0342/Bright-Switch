
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Mail, Phone, MapPin, Send, Loader2,
  CheckCircle2, AlertCircle, MessageSquare,
  Clock, Shield, Facebook, Twitter, Linkedin,
  Instagram, Plus, Minus, ChevronRight, Zap, Globe, ExternalLink
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { SystemSettings } from '../types';

const FAQ_DATA = [
  {
    q: "How can I order electrical products?",
    a: "You can browse our full catalog online, add items to cart, and checkout directly. For bulk orders or specific requirements, contact our sales team at 03009591658."
  },
  {
    q: "What types of electrical products do you sell?",
    a: "We offer a complete range including circuit breakers, wiring accessories, lighting solutions, power tools, industrial components, home appliances, and safety equipment."
  },
  {
    q: "Do you provide technical specifications and installation guidance?",
    a: "Yes! Each product page has detailed specifications. For complex installations, our electrical engineers provide free guidance via phone or email."
  },
  {
    q: "Do you deliver across Pakistan?",
    a: "We offer nationwide delivery. Shipping costs and times vary by location. Express delivery is available for urgent project needs."
  },
  {
    q: "What is your return and warranty policy?",
    a: "Most products come with manufacturer warranty. Defective items can be returned within 7 days with original packaging. Contact support for warranty claims."
  },
  {
    q: "Do you offer discounts for contractors or bulk orders?",
    a: "Yes! Contractors and businesses get special pricing. Contact our sales team for volume quotes and contractor registration."
  }
];

export const ContactPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: 'General Query',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<any[]>([]);

  // Fetch corporate settings and FAQs
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'contact'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as SystemSettings);
    });

    const unsubFaqs = onSnapshot(query(collection(db, 'faqs'), orderBy('order', 'asc')), (snap) => {
      setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSettings(); unsubFaqs(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'contactSubmissions'), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent
      });
      setIsSuccess(true);
      toast.success('Message sent! Our engineers will contact you shortly.');
      setFormData({ name: '', email: '', phone: '', company: '', subject: 'General Query', message: '' });
    } catch (err: any) {
      toast.error('Failed to send message: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMaps = () => {
    if (!settings) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${settings.mapLat},${settings.mapLng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white min-h-screen pb-20 text-left">
      <Toaster position="top-right" />

      {/* Hero Section */}
      <section className="relative bg-gray-900 py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-none">
              GET IN <span className="text-blue-500">TOUCH</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Have a question about our products or need technical support? Our team of experts is ready to help you power up your next project.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* LEFT: Contact Form */}
          <div className="lg:w-[60%] bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-10 md:p-16">
            {isSuccess ? (
              <div className="py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Transmission Successful</h2>
                <p className="text-gray-500 text-lg font-medium mb-10 max-w-md mx-auto leading-relaxed">
                  Your query has been indexed. A technical representative will review your request and reach out within 24 hours.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Full Identity Name</label>
                    <input
                      required type="text" value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Email Access Point</label>
                    <input
                      required type="email" value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Contact Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="Digits only (e.g. 3001234567)"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Company Entity</label>
                    <input
                      type="text" value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      placeholder="ACME Engineering"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Query Category</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none appearance-none focus:bg-white transition-all"
                  >
                    <option>General Query</option>
                    <option>Technical Support</option>
                    <option>B2B/Wholesale Quote</option>
                    <option>Order Tracking</option>
                    <option>Product Specification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Message Body</label>
                  <textarea
                    required rows={6} value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide technical details or your specific requirements..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center disabled:opacity-70 group"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>
                      Transmit Message <Send className="ml-3 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: Contact Info & Action */}
          <aside className="lg:w-[40%] space-y-8">
            {/* Location Card */}
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-2xl font-black mb-8 flex items-center">
                <MapPin className="mr-3 text-blue-500" /> Operational Hub
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Corporate Address</p>
                  <p className="text-lg font-medium leading-relaxed whitespace-pre-line">
                    {settings?.corporateAddress || 'Chowk Yadgar, Dakhanna Market\nPeshawar, KP, Pakistan'}
                  </p>
                </div>

                <button
                  onClick={handleOpenMaps}
                  className="w-full py-6 bg-blue-600 border border-blue-500 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center justify-center shadow-xl shadow-blue-900/50 group"
                >
                  <Globe className="mr-3 group-hover:animate-pulse" size={18} />
                  <span>See on Google Map</span>
                  <ExternalLink className="ml-2 opacity-50" size={14} />
                </button>
              </div>
            </div>

            {/* Support Metrics */}
            <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8 text-left">
              <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-6">Complete Electrical Support</h4>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600"><Clock size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Office Hours</p>
                    <p className="font-bold text-blue-900">{settings?.officeHours || 'Mon - Fri: 09:00 - 18:00'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600"><MessageSquare size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Digital Direct</p>
                    <p className="font-bold text-blue-900">{settings?.supportEmail || 'sales@brightswitch.pro'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600"><Phone size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Critical Hotline</p>
                    <p className="font-bold text-blue-900">{settings?.supportPhone || '+92 (300) 123 4567'}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-500 font-medium">Quick answers about our electrical products and services</p>
        </div>

        <div className="space-y-4">
          {(faqs.length > 0 ? faqs : FAQ_DATA.map((f, i) => ({ id: String(i), question: f.q, answer: f.a }))).map((faq, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-8 text-left hover:bg-gray-50 transition-colors group"
              >
                <span className="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{faq.question || faq.q}</span>
                <div className={`p-2 rounded-xl transition-all ${openFaq === idx ? 'bg-blue-600 text-white rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                  {openFaq === idx ? <Minus size={20} /> : <Plus size={20} />}
                </div>
              </button>
              {openFaq === idx && (
                <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="pt-4 border-t border-gray-50 text-gray-600 leading-relaxed font-medium text-lg">
                    {faq.answer || faq.a}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
