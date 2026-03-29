
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Zap, Globe, Target, Eye, Heart,
  Award, CheckCircle2, ChevronRight, Phone,
  Users, Building, History, Sparkles, ArrowRight
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export const AboutPage: React.FC = () => {
  const [experts, setExperts] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'experts'), orderBy('order', 'asc')), (snap) => {
      setExperts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Default experts for fallback
  const defaultExperts = [
    { name: "Ali Raza", role: "Chief Electrical Engineer", experience: "15+ Years", specialization: "Protection Systems", icon: Shield },
    { name: "Sarah Khan", role: "Technical Director", experience: "10+ Years", specialization: "Industrial Applications", icon: Zap },
    { name: "Zubair Ahmed", role: "Safety Compliance Lead", experience: "12+ Years", specialization: "IEC Standards", icon: Award },
    { name: "Maria Jan", role: "B2B Success Manager", experience: "8+ Years", specialization: "Supply Chain Logistics", icon: Globe }
  ];

  return (
    <div className="bg-white min-h-screen text-left">

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-start overflow-hidden pt-[80px]">
        <div className="absolute inset-0">
          <img
            src="/hero.jpg"
            alt="Engineering Facility"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 px-4 py-2 rounded-full mb-8">
              <Target size={16} className="text-blue-400" />
              <span className="text-blue-200 text-xs font-black uppercase tracking-widest">Our Legacy & Mission</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
              ILLUMINATING <span className="text-blue-500">EVERY</span> CONNECTION
            </h1>
            <p className="text-xl text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Founded on the principles of engineering excellence and unwavering safety, BrightSwitch is redefining the electrical wholesale landscape.
            </p>
          </div>
        </div>
      </section>

      {/* Main Narrative */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1 space-y-8 text-xl text-gray-600 font-medium leading-relaxed">
              <div className="bg-blue-600 w-16 h-1.5 rounded-full mb-10"></div>
              <p>
                BrightSwitch has evolved from Pakistan's trusted specialists to a comprehensive electrical solutions provider. We now offer everything from advanced circuit protection and wiring accessories to lighting solutions, power tools, industrial automation, home appliances, and renewable energy systems.
              </p>
              <p>
                Our expanded product range maintains the same commitment to safety, quality, and reliability that established our reputation in circuit protection. Every product in our catalog—whether a precision tool, energy-efficient lighting solution, or smart home appliance—is selected and tested to meet international safety standards and deliver exceptional performance.
              </p>
              <p>
                Serving residential, commercial, industrial, and solar applications, BrightSwitch provides complete electrical solutions for every need, backed by expert technical support and nationwide delivery.
              </p>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-square bg-gray-50 rounded-[5rem] overflow-hidden shadow-2xl relative border-8 border-white">
                <img src="https://images.unsplash.com/photo-1581094794329-c8112a89af12" className="w-full h-full object-cover" alt="Product Engineering" />
                <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision Cards */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm text-left group hover:shadow-2xl transition-all duration-500">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                <Target size={36} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Our Mission</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                To provide innovative, reliable electrical solutions that power progress while safeguarding lives, property, and infrastructure across Pakistan. We make quality electrical products and advanced safety technology accessible to everyone—from homeowners to industrial contractors.
              </p>
            </div>
            <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm text-left group hover:shadow-2xl transition-all duration-500 md:-mt-8 md:mb-8">
              <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner group-hover:bg-orange-600 group-hover:text-white transition-colors duration-500">
                <Eye size={36} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Our Vision</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                To become Pakistan's most trusted electrical solutions brand, setting new standards for product quality, safety innovation, and customer service while contributing to the nation's sustainable development and energy efficiency.
              </p>
            </div>
            <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm text-left group hover:shadow-2xl transition-all duration-500">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner group-hover:bg-green-600 group-hover:text-white transition-colors duration-500">
                <Heart size={36} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Our Promise</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Every BrightSwitch product—from circuit breakers to lighting to tools—is backed by expert technical support, comprehensive warranties, and our unwavering commitment to safety and satisfaction. We power what matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Our Journey</h2>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">A Decade of Protecting Infrastructure</p>
          </div>

          <div className="space-y-12 relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gray-100 hidden md:block"></div>

            {[
              { year: '2015', title: 'BrightSwitch Founded', desc: 'Started as a small electrical supply shop in Peshawar with a focus on quality circuit protection.', align: 'left' },
              { year: '2018', title: 'ISO Certification', desc: 'Achieved ISO 9001:2015 quality management certification for our expanding product range and supply chain.', align: 'right' },
              { year: '2020', title: 'Digital Transformation', desc: 'Launched e-commerce platform serving nationwide residential, commercial, and industrial clients.', align: 'left' },
              { year: '2023', title: 'AI Integration', desc: 'Introduced AI-powered electrical solutions assistant to help customers find the right products for any application.', align: 'right' },
              { year: '2024', title: 'Complete Electrical Solutions', desc: "Expanded from circuit protection specialists to Pakistan's complete electrical solutions provider, adding lighting, tools, appliances, and renewable energy products.", align: 'left' },
              { year: '2025', title: 'Future Expansion', desc: 'Expanding to Middle East markets and introducing a smart IoT-connected line.', align: 'right', future: true }
            ].map((item, i) => (
              <div key={i} className={`flex flex-col md:flex-row items-center gap-12 ${item.align === 'right' ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-1 text-center md:text-left space-y-4">
                  <span className={`inline-block px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.future ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {item.year}
                  </span>
                  <h4 className="text-2xl font-black text-gray-900">{item.title}</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
                <div className="hidden md:flex w-10 h-10 rounded-full bg-white border-4 border-blue-600 items-center justify-center z-10 shadow-xl shadow-blue-100">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-32 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:32px_32px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black text-white tracking-tight mb-4">Meet Our Experts</h2>
            <p className="text-blue-400 font-bold uppercase text-xs tracking-widest">Certified Electrical Engineers With 50+ Years Combined Experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(experts.length > 0 ? experts : defaultExperts).map((m, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] backdrop-blur-md group hover:bg-white/10 transition-all duration-500 text-center">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-900/40 group-hover:scale-110 transition-transform overflow-hidden">
                  {m.image ? <img src={m.image} className="w-full h-full object-cover" /> : (m.icon ? <m.icon size={32} /> : <Shield size={32} />)}
                </div>
                <h4 className="text-xl font-black mb-1">{m.name}</h4>
                <p className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-6">{m.role}</p>
                <div className="space-y-2 pt-6 border-t border-white/10">
                  <p className="text-xs text-gray-400 font-medium">Experience: <span className="text-white font-bold">{m.experience || m.exp}</span></p>
                  <p className="text-xs text-gray-400 font-medium">Specialization: <span className="text-white font-bold">{m.specialization || m.spec}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Our Core Principles</h2>
            <p className="text-gray-500 font-medium">What guides our engineering and business decisions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Safety First", icon: Shield, desc: "Every product in our expanded range—from circuit breakers to appliances—undergoes rigorous testing to ensure it meets our strict safety standards before reaching our customers." },
              { title: "Technical Excellence", icon: Sparkles, desc: "Our entire product catalog is engineered to international standards including IEC, CE, and PSQCA, whether it's protection devices, lighting, or power tools." },
              { title: "Customer Electrician", icon: Users, desc: "We support you beyond the sale with free technical guides, project planning assistance, and personalized recommendations for any electrical application." },
              { title: "Sustainable Solutions", icon: Globe, desc: "Focusing on energy-efficient products, durable construction, and environmentally responsible solutions that reduce waste and energy consumption." },
              { title: "Innovation Driven", icon: Zap, desc: "Constantly expanding our product range with smart technologies, energy-efficient solutions, and modern electrical innovations for homes and businesses." },
              { title: "Open Logistics", icon: History, desc: "Transparent tracking and swift nationwide delivery for everything from small wiring accessories to complete industrial electrical systems." }
            ].map((v, i) => (
              <div key={i} className="flex space-x-6 p-8 rounded-3xl hover:bg-gray-50 transition-colors">
                <div className="bg-blue-600 p-4 rounded-2xl h-fit text-white shadow-xl shadow-blue-100">
                  <v.icon size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 mb-2">{v.title}</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-left max-w-lg">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-6">Verified Compliance</h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              We take certification seriously. Every product category in our expanded range—from protection devices to appliances to tools—is sourced from manufacturers with verified compliance to leading international safety and quality standards.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-12">
            {['ISO 9001', 'CE CERTIFIED', 'PSQCA', 'IEC STD'].map((c, i) => (
              <div key={i} className="flex flex-col items-center group">
                <div className="w-24 h-24 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-xl transition-all duration-500">
                  <Shield className="text-blue-600" size={32} />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-[4rem] p-12 md:p-24 text-white text-center relative overflow-hidden shadow-2xl shadow-blue-100">
            <Zap size={200} className="absolute -left-20 -bottom-20 text-white/10 rotate-12" />
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight relative z-10">
              Ready to Power Your<br />Next Project?
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto relative z-10">
              Join thousands of homeowners, contractors, and businesses who trust BrightSwitch for complete electrical solutions. From circuit protection to complete electrical installations, we have everything you need.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link to="/shop" className="bg-white text-blue-600 px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">
                BROWSE ALL CATEGORIES
              </Link>
              <Link to="/contact" className="bg-blue-900/40 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-blue-900/60 transition-all">
                CONSULT AN EXPERT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Small Footer Detail */}
      <div className="py-12 bg-white text-center border-t border-gray-50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2024 BrightSwitch Global | Complete Electrical Solutions Provider</p>
      </div>
    </div>
  );
};
