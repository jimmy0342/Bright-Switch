import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Wrench,
    ShoppingCart,
    Star,
    ChevronRight,
    Clock,
    MapPin,
    Calendar,
    Zap,
    Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Electrician, ServiceJob, ServiceRequest } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

interface DashboardHomeProps {
    electrician: Electrician | null;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ electrician }) => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<ServiceJob[]>([]);
    const [stats, setStats] = useState([
        { label: "Monthly Earnings", value: "PKR 0", change: "+0%", icon: TrendingUp, color: "blue" },
        { label: "Active Jobs", value: "0", detail: "0 pending, 0 in progress", icon: Wrench, color: "orange" },
        { label: "Material Orders", value: "PKR 0", detail: "0 orders", icon: ShoppingCart, color: "purple" },
        { label: "Success Rate", value: "0%", detail: "Based on 0 jobs", icon: Star, color: "green" }
    ]);

    useEffect(() => {
        if (!user) return;

        // 1. Fetch Service Jobs
        const jobsQuery = query(
            collection(db, 'serviceJobs'),
            where('electricianId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
            const jobData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceJob));
            setJobs(jobData);

            // Calculate Stats
            const active = jobData.filter(j => j.status === 'confirmed' || j.status === 'in_progress').length;
            const completed = jobData.filter(j => j.status === 'completed').length;
            const pending = jobData.filter(j => j.status === 'confirmed').length;
            const ip = jobData.filter(j => j.status === 'in_progress').length;

            const totalEarnings = jobData
                .filter(j => j.status === 'completed')
                .reduce((sum, j) => sum + (j.payment?.electricianEarns || (j.totalAmount * 0.9) || 0), 0);

            const successRate = jobData.length > 0 ? Math.round((completed / jobData.length) * 100) : 0;

            setStats([
                {
                    label: "Total Earnings",
                    value: `PKR ${totalEarnings.toLocaleString()}`,
                    change: "+0%", // Future: calculate vs last month
                    icon: TrendingUp,
                    color: "blue"
                },
                {
                    label: "Active Jobs",
                    value: active.toString(),
                    detail: `${pending} pending, ${ip} in progress`,
                    icon: Wrench,
                    color: "orange"
                },
                {
                    label: "Order Balance", // Material orders placeholder until linked
                    value: `PKR 0`,
                    detail: "0 in transit",
                    icon: ShoppingCart,
                    color: "purple"
                },
                {
                    label: "Success Rate",
                    value: `${successRate}%`,
                    detail: `Based on ${jobData.length} jobs`,
                    icon: Star,
                    color: "green"
                }
            ]);
        });


        return () => {
            unsubJobs();
        };
    }, [user]);

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-50 text-blue-600';
            case 'orange': return 'bg-orange-50 text-orange-600';
            case 'purple': return 'bg-purple-50 text-purple-600';
            case 'green': return 'bg-green-50 text-green-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-800 rounded-[2.5rem] p-10 md:p-14 text-white">
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-6">
                        Electrician Portal Dashboard
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                        Welcome Back,<br />
                        {user?.name || electrician?.businessName || electrician?.fullName || 'Electrician'}!
                    </h1>
                    <p className="text-blue-100 text-lg font-medium leading-relaxed opacity-90">
                        You have <span className="text-white font-black underline underline-offset-4 decoration-2">{jobs.filter(j => j.status === 'confirmed').length} new confirmed jobs</span> ready for action. Your trade discount is automatically applied to all orders.
                    </p>
                </div>

                {/* Abstract Background Design */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                    <Zap className="w-full h-full -mr-10 -mt-10 stroke-[1px]" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.04)] transition-all">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${getColorClasses(stat.color)}`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
                        <div className="mt-4 flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${stat.change?.includes('+') && stat.change !== '+0%' ? 'text-green-500' : 'text-gray-400'}`}>
                                {stat.change || stat.detail}
                            </span>
                            <button className="text-gray-300 hover:text-blue-600 transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Recent Jobs Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Job Requests</h2>
                            <p className="text-sm text-gray-400 font-bold mt-1">Based on your service areas</p>
                        </div>
                        <button onClick={() => window.location.hash = '#jobs'} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All Jobs</button>
                    </div>

                    <div className="space-y-4">
                        {jobs.length === 0 ? (
                            <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed border-gray-200 grayscale opacity-50">
                                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-xs font-black uppercase tracking-[0.2em]">No Recent Deployment Records</p>
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 hover:border-blue-100 transition-all group overflow-hidden relative">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start space-x-5">
                                            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 transition-colors ${job.status === 'in_progress' ? 'border-orange-100 bg-orange-50 text-orange-600' : 'border-gray-50 bg-gray-50 text-gray-400'
                                                }`}>
                                                <Calendar size={20} className="mb-0.5" />
                                                <span className="text-[10px] font-black uppercase tracking-tighter">{job.jobId?.slice(-4) || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${job.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {job.status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">• {new Date(job.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="text-lg font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{job.serviceType}</h4>
                                                <div className="flex flex-col space-y-1 mt-1">
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center">
                                                        <Users size={12} className="mr-1" /> {job.customerName || 'Valued Client'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 font-medium flex items-center">
                                                        <MapPin size={14} className="mr-1 text-gray-300" /> {job.location?.address || 'Location Pending'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Estimate</p>
                                                <p className="text-xl font-black text-gray-900 mt-1">PKR {(job.payment?.electricianEarns || (job.totalAmount * 0.9)).toLocaleString()}</p>
                                            </div>
                                            <Link to={`/job-tracking/${job.id}`} className="px-6 py-2.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg no-underline text-center">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Order Sidebar Section */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                                <ShoppingCart size={20} />
                            </div>
                            <h3 className="text-xl font-black mb-2 tracking-tight">Quick Material Order</h3>
                            <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed">
                                Order project materials with your trade discount applied instantly.
                            </p>

                            <div className="space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all cursor-pointer group/item">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold">Recommended for Projects</span>
                                        <ChevronRight size={14} className="text-gray-500 group-hover/item:translate-x-1 transition-transform" />
                                    </div>
                                    <div className="mt-3 flex items-center space-x-2">
                                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-lg">MCB 63A</span>
                                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-lg">RCCB 40A</span>
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20">
                                    Bulk Order Tool
                                </button>
                            </div>
                        </div>

                        <Zap className="absolute bottom-[-20%] right-[-10%] w-1/2 h-1/2 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight flex items-center">
                            <Clock className="mr-2 text-blue-600" size={20} /> Upcoming Appointments
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                    <span className="font-black text-sm">24</span>
                                </div>
                                <div>
                                    <h5 className="text-sm font-black text-gray-900">Commercial Inspection</h5>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">D-Ground Bazar • 10:00 AM</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 opacity-50">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                                    <span className="font-black text-sm">25</span>
                                </div>
                                <div>
                                    <h5 className="text-sm font-black text-gray-900">Residential Wiring</h5>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Gulberg Phase 2 • 02:30 PM</p>
                                </div>
                            </div>
                            <button className="w-full py-4 text-xs font-black text-blue-600 uppercase tracking-widest border-2 border-dashed border-gray-100 rounded-2xl hover:border-blue-100 transition-all mt-4">
                                Open Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
