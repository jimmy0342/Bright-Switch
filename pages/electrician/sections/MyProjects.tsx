import React, { useState, useEffect } from 'react';
import {
    FolderKanban,
    MoreVertical,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    Users,
    Plus
} from 'lucide-react';
import { db } from '../../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { ServiceJob } from '../../../types';

export const MyProjects: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'serviceJobs'),
            where('electricianId', '==', user.uid)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const jobData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceJob));

            setProjects(jobData.map(job => ({
                id: job.id,
                name: job.serviceType,
                client: job.customerName || "Valued Client",
                progress: job.status === 'completed' ? 100 : job.status === 'in_progress' ? 50 : 10,
                status: job.status,
                budget: job.totalAmount,
                deadline: job.scheduledDate
            })));

            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const getProgressColor = (progress: number) => {
        if (progress === 100) return 'bg-green-600';
        if (progress >= 50) return 'bg-blue-600';
        return 'bg-orange-600';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">My Projects</h2>
                    <p className="text-gray-500 font-bold mt-1">Timeline and financial tracking for major contracts</p>
                </div>
                <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                    <Plus className="mr-2" size={18} /> New Project Folder
                </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 gap-8">
                {loading ? (
                    <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Synchronizing Portfolio Data...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <FolderKanban size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">No Active Projects Registered</p>
                    </div>
                ) : projects.map(project => (
                    <div key={project.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:border-blue-200 transition-all group lg:flex text-left">
                        {/* Left: Project Stats */}
                        <div className="p-8 lg:w-1/3 bg-gray-50/50 border-b lg:border-b-0 lg:border-r border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${project.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    {project.status.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{project.id.slice(-6).toUpperCase()}</span>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors uppercase">
                                {project.name}
                            </h3>
                            <p className="text-gray-500 font-bold text-sm mb-8 flex items-center">
                                Client Node: <span className="text-gray-900 ml-1 italic">Active Contract</span>
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Execution Progress</span>
                                        <span className="text-sm font-black text-blue-600">{project.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contract</p>
                                        <p className="text-base font-black text-gray-900">PKR {project.budget.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-base font-black text-gray-900 uppercase text-[10px]">{project.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Milestones & Actions */}
                        <div className="p-8 lg:flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center">
                                    <Calendar className="mr-2 text-blue-600" size={18} /> Operational Timeline
                                </h4>
                                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Full Audit Log</button>
                            </div>

                            <div className="flex-1 space-y-8">
                                <div className="relative pl-8 border-l-2 border-dashed border-gray-100 space-y-10">
                                    <div className="relative">
                                        <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm shadow-green-100"></div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Deployment Start</p>
                                                <p className="text-sm font-bold text-gray-900">Contract Signed & Site Surveyed</p>
                                            </div>
                                            <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-bold self-start">{project.deadline}</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm shadow-blue-100 animate-pulse"></div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Current State</p>
                                                <p className="text-sm font-bold text-gray-900 uppercase">{project.status.replace('_', ' ')} Phase</p>
                                            </div>
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold self-start">{project.deadline}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-4">
                                <button className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                                    Update Progress
                                </button>
                                <button className="px-6 py-3 bg-white border border-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                                    Upload Documentation
                                </button>
                                <button className="px-6 py-3 bg-white border border-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center">
                                    Invoice Electrician <ChevronRight className="ml-1" size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
