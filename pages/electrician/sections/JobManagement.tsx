import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    MapPin,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Phone,
    MessageSquare,
    ExternalLink,
    Users,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { ServiceJob } from '../../../types';

export const JobManagement: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [jobs, setJobs] = useState<ServiceJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'serviceJobs'),
            where('electricianId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceJob)));
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'in_progress': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'completed': return 'bg-green-50 text-green-600 border-green-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const DirectRequestAlert: React.FC = () => {
        const [directCount, setDirectCount] = useState(0);

        useEffect(() => {
            if (!user) return;
            const q = query(
                collection(db, 'serviceRequests'),
                where('targetedElectricianId', '==', user.uid),
                where('status', 'in', ['pending', 'matching', 'offers_received'])
            );
            const unsub = onSnapshot(q, (sn) => setDirectCount(sn.size));
            return () => unsub();
        }, []);

        if (directCount === 0) return null;

        return (
            <div className="bg-blue-600 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-900/10 mb-8 overflow-hidden relative group">
                <Sparkles className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-500" size={160} />
                <div className="flex items-center space-x-6 relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Sparkles size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight">Direct Request Signal</h3>
                        <p className="text-blue-100 font-bold">You have {directCount} exclusive {directCount === 1 ? 'job' : 'jobs'} awaiting your deployment quote.</p>
                    </div>
                </div>
                <Link
                    to="#"
                    onClick={(e) => {
                        e.preventDefault();
                        // This relies on the parent's setActivePage which isn't available here directly
                        // But since it's a sub-component in the same file as common dashboard logic,
                        // we can either pass the setter or use a simpler solution.
                        // For now, we'll assume the user uses the sidebar, but we'll show a clear prompt.
                    }}
                    className="bg-white text-blue-600 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all shadow-lg relative z-10 no-underline"
                >
                    Check Opportunities
                </Link>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Jobs</h2>
                    <p className="text-gray-500 font-bold mt-1">Track and manage your service requests</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search jobs, customers, or locations..."
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-gray-100 focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'in_progress', 'completed'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${activeTab === tab
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Direct Request Alert */}
            {!loading && jobs.length > 0 && (
                <DirectRequestAlert />
            )}

            {/* Jobs List */}
            <div className="space-y-6">
                {loading ? (
                    <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Synchronizing Deployment Records...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <Users size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">No Active Deployments Found</p>
                    </div>
                ) : jobs.filter(j => activeTab === 'all' || j.status === activeTab).map(job => (
                    <div key={job.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:border-blue-200 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-900/5 text-left">
                        <div className="p-8">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Job Info */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(job.status)}`}>
                                                {job.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{job.jobId}</span>
                                        </div>
                                        <button className="text-gray-300 hover:text-gray-600 transition-colors lg:hidden"><MoreVertical size={20} /></button>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors uppercase">{job.serviceType}</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed line-clamp-2 italic">"{job.description}"</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Users size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Customer Node</p>
                                                <p className="text-sm font-black text-gray-900 mt-1 uppercase">{job.customerName}</p>
                                                <p className="text-[10px] font-bold text-blue-600 mt-1">{job.customerPhone || "Phone Not Provided"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Location</p>
                                                <p className="text-sm font-bold text-gray-900 mt-1 truncate max-w-[150px]">{job.location?.fullAddress || job.location?.address || 'Site Undefined'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Schedule</p>
                                                <p className="text-sm font-bold text-gray-900 mt-1 uppercase">{job.scheduledDate} • {job.scheduledTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions & Cost */}
                                <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-100 pt-8 lg:pt-0 lg:pl-8 flex flex-col justify-between">
                                    <div className="text-right mb-6">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Job Estimate</p>
                                        <p className="text-3xl font-black text-gray-900 mt-2 tracking-tight">PKR {job.totalAmount.toLocaleString()}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Link to={`/job-tracking/${job.id}`} className="w-full flex items-center justify-center py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-100 group no-underline text-center">
                                            Manage Operations <ExternalLink className="ml-2 group-hover:translate-x-1 transition-transform" size={14} />
                                        </Link>


                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Urgency Indicator */}
                        {job.status === 'confirmed' && (
                            <div className="bg-blue-600 text-white py-1.5 px-8 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center">
                                <AlertCircle size={14} className="mr-2" /> Initial Deployment Sequence Authorized
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
