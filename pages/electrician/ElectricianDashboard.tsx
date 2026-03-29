
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Wrench,
    ShoppingCart,
    FolderKanban,
    BookOpen,
    CircleDollarSign,
    Users,
    Settings,
    Star,
    Zap,
    Bell,
    LogOut,
    Menu,
    X,
    Sparkles,
    Globe,
    AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MyAccountPage } from '../MyAccountPage';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Electrician } from '../../types';

import { DashboardHome } from './sections/DashboardHome';
import { JobManagement } from './sections/JobManagement';
import { CustomerManagement } from './sections/CustomerManagement';

export const ElectricianDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [activePage, setActivePage] = useState('dashboard');
    const [electrician, setElectrician] = useState<Electrician | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // 1. Fetch Electrician Profile
    useEffect(() => {
        if (!user) return;

        // Robust profile fetching: Try UID document first, then secondary fields
        const fetchProfile = async () => {
            // 1. Try Direct Doc ID match (Permanent promotion)
            const directDoc = await getDoc(doc(db, 'electricians', user.uid));
            if (directDoc.exists()) {
                setElectrician({ id: directDoc.id, ...directDoc.data() } as unknown as Electrician);
                return;
            }

            // 2. Fallback to userId field query
            const q = query(collection(db, 'electricians'), where('userId', '==', user.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setElectrician({ id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as Electrician);
                return;
            }

            // 3. Last fallback: email match (for guest migrations)
            if (user.email) {
                const eq = query(collection(db, 'electricians'), where('email', '==', user.email.toLowerCase()));
                const emailSnap = await getDocs(eq);
                if (!emailSnap.empty) {
                    setElectrician({ id: emailSnap.docs[0].id, ...emailSnap.docs[0].data() } as unknown as Electrician);
                }
            }
        };

        fetchProfile();
    }, [user?.uid]);

    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'jobs', label: 'Job Management', icon: Wrench },
    ];

    const renderContent = () => {
        try {
            switch (activePage) {
                case 'dashboard':
                    return <DashboardHome setActivePage={setActivePage} />;
                case 'jobs':
                    return <JobManagement />;
                case 'settings': return <MyAccountPage />;
                default: return <DashboardHome electrician={electrician} />;
            }
        } catch (err) {
            console.error("Dashboard Render Error:", err);
            return (
                <div className="p-20 text-center bg-white rounded-[3rem] border border-red-50">
                    <AlertTriangle className="mx-auto text-red-500 mb-6" size={48} />
                    <h3 className="text-xl font-black text-gray-900 mb-2">Panel Malfunction</h3>
                    <p className="text-gray-500 font-bold mb-8">A technical fault occurred while loading this section.</p>
                    <button
                        onClick={() => setActivePage('dashboard')}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
                    >
                        Return to Base
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Sidebar Overlay for Mobile */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed top-24 left-4 z-[60] bg-white p-3 rounded-2xl shadow-xl border border-gray-100 lg:hidden"
                >
                    <Menu className="h-6 w-6 text-gray-900" />
                </button>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-gray-100 transition-transform duration-300 transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center justify-between mb-10">
                        <Link to="/" className="flex items-center space-x-2 group no-underline">
                            <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-100">
                                <Zap className="h-5 w-5 text-white fill-current" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tighter text-gray-900 leading-none">
                                    BRIGHT<span className="text-blue-600">SWITCH</span>
                                </span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Powering Protection</span>
                            </div>
                        </Link>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Back to Site Link */}
                    <div className="mb-6">
                        <Link to="/" className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm no-underline">
                            <Globe size={16} />
                            <span>Return to Website</span>
                        </Link>
                    </div>

                    {/* Profile Card removed per user request */}

                    {/* Navigation */}
                    <nav className="flex-1 flex flex-col space-y-2 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActivePage(item.id);
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm group ${activePage === item.id
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <item.icon size={20} className={activePage === item.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-600 transition-colors'} />
                                    <span>{item.label}</span>
                                </div>
                            </button>
                        ))}
                    </nav>

                    {/* Footer Actions */}
                    <div className="pt-4 mt-auto border-t border-gray-100 space-y-2 flex-shrink-0">
                        <button
                            onClick={() => setActivePage('settings')}
                            className="w-full flex items-center space-x-3 p-4 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-bold text-sm transition-all"
                        >
                            <Settings size={20} className="text-gray-400" />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={logout}
                            className="w-full flex items-center space-x-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm transition-all"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : ''}`}>
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">
                            {navItems.find(item => item.id === activePage)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors relative">
                            <Bell size={20} />
                        </button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
