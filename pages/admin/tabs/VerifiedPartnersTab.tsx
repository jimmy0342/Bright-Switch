import React, { useState, useEffect } from 'react';
import {
    collection, query, onSnapshot, doc,
    updateDoc, deleteDoc, orderBy, where
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import {
    Loader2, ShieldCheck, UserX, Trash2,
    Search, MapPin, Zap, Star, Phone,
    FileText, X, ChevronRight, CheckCircle2, AlertCircle, ImageIcon, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Electrician, ServiceJob } from '../../../types';

export const VerifiedElectriciansTab: React.FC = () => {
    const [electricians, setElectricians] = useState<Electrician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedElectrician, setSelectedElectrician] = useState<Electrician | null>(null);
    const [electricianJobs, setElectricianJobs] = useState<ServiceJob[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'electricians'));
        return onSnapshot(q, (snap) => {
            const electriciansData = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data
                } as any as Electrician;
            }).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
            setElectricians(electriciansData);
            setLoading(false);
        }, (err) => {
            console.error("Firestore Subscribe Error:", err);
            toast.error("Failed to load electricians data.");
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedElectrician) {
            setElectricianJobs([]);
            return;
        }

        setLoadingJobs(true);
        const q = query(
            collection(db, 'serviceJobs'),
            where('electricianId', '==', selectedElectrician.userId)
        );

        const unsub = onSnapshot(q, (snap) => {
            const jobsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceJob));
            // Sort client-side to avoid composite index requirement
            jobsData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setElectricianJobs(jobsData);
            setLoadingJobs(false);
        }, (err) => {
            console.error("Failed to load jobs:", err);
            // Log the code or message specifically if it contains a required index link
            toast.error(`Failed to load jobs: ${err.message}`);
            setLoadingJobs(false);
        });

        return () => unsub();
    }, [selectedElectrician]);

    const toggleSuspension = async (electrician: Electrician) => {
        try {
            const newStatus = electrician.status === 'suspended' ? 'active' : 'suspended';
            const docId = electrician.id; // Correct Firestore Document ID
            await updateDoc(doc(db, 'electricians', docId), {
                status: newStatus,
                updatedAt: Date.now()
            });

            if (electrician.userId) {
                await updateDoc(doc(db, 'users', electrician.userId), {
                    isSuspended: newStatus === 'suspended'
                });
            }
            toast.success(`Electrician ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
        } catch (err: any) {
            toast.error('Failed to update status: ' + err.message);
        }
    };

    const handleDeleteElectrician = async (electrician: Electrician) => {
        if (!window.confirm(`Are you sure you want to delete ${electrician.fullName}? This will remove their professional profile.`)) return;

        try {
            await deleteDoc(doc(db, 'electricians', electrician.id));
            if (electrician.userId) {
                await updateDoc(doc(db, 'users', electrician.userId), {
                    role: 'buyer'
                });
            }
            toast.success('Professional profile removed. User role reverted to buyer.');
        } catch (err: any) {
            toast.error('Delete failed: ' + err.message);
        }
    };

    const handleMarkCommissionPaid = async (jobId: string, currentStatus: boolean | undefined) => {
        try {
            await updateDoc(doc(db, 'serviceJobs', jobId), {
                commissionPaid: !currentStatus
            });
            toast.success(`Commission marked as ${!currentStatus ? 'Paid' : 'Pending'}`);
        } catch (error: any) {
            toast.error('Failed to update commission status: ' + error.message);
        }
    };

    const filteredElectricians = electricians.filter(e => {
        const search = searchTerm.toLowerCase();
        return (
            (e.fullName || '').toLowerCase().includes(search) ||
            (e.email || '').toLowerCase().includes(search) ||
            (e.pecNumber || '').toLowerCase().includes(search)
        );
    });

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Verified Electricians</h2>
                    <p className="text-gray-500 font-bold mt-1">Manage approved professional electricians and service providers</p>
                </div>
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or PEC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredElectricians.map(electrician => (
                    <div key={electrician.id} className={`bg-white rounded-[2.5rem] border ${electrician.status === 'suspended' ? 'border-red-100 bg-red-50/10' : 'border-gray-100'} p-8 hover:border-blue-100 transition-all group flex flex-col lg:flex-row items-center justify-between gap-8 text-left`}>
                        <div className="flex items-center space-x-6">
                            <div className={`w-16 h-16 ${electrician.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} rounded-2xl flex items-center justify-center font-black text-2xl uppercase relative`}>
                                {(electrician.fullName || '??').substring(0, 2)}
                                {electrician.verified && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full border-2 border-white">
                                        <ShieldCheck size={12} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-gray-900 tracking-tight">{electrician.fullName || 'Unnamed Electrician'}</h4>
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${electrician.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {electrician.status || 'active'}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                        <Star size={10} className="mr-1 text-yellow-500 fill-yellow-500" /> {(electrician.averageRating || 0).toFixed(1)} ({electrician.totalJobs || 0} Jobs)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 items-center flex-1 lg:px-10">
                            <div className="text-center lg:text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PEC / License</p>
                                <p className="text-sm font-bold text-gray-900 font-mono">{electrician.pecNumber}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-100 hidden lg:block"></div>
                            <div className="text-center lg:text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</p>
                                <div className="flex items-center space-x-2 text-sm font-bold text-gray-900">
                                    <Phone size={12} className="text-gray-400" />
                                    <span>{electrician.phone}</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-gray-100 hidden lg:block"></div>
                            <div className="text-center lg:text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Area</p>
                                <div className="flex items-center space-x-1 text-sm font-bold text-gray-700">
                                    <MapPin size={12} className="text-blue-500" />
                                    <span>{electrician.serviceAreas?.[0] || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setSelectedElectrician(electrician)}
                                className="p-4 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center space-x-2 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all w-full"
                            >
                                <FileText size={18} />
                                <span>View Services</span>
                            </button>
                            <div className="flex items-center space-x-3 w-full">
                                <button
                                    onClick={() => toggleSuspension(electrician)}
                                    className={`p-4 rounded-2xl flex items-center space-x-2 font-black text-[10px] uppercase tracking-widest transition-all ${electrician.status === 'suspended'
                                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-100'
                                        : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white'
                                        }`}
                                    title={electrician.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                                >
                                    <UserX size={18} />
                                    <span>{electrician.status === 'suspended' ? 'Activate' : 'Suspend'}</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteElectrician(electrician)}
                                    className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all transition-all"
                                    title="Delete Professional Profile"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredElectricians.length === 0 && (
                    <div className="text-center p-20 bg-white rounded-[3rem] border border-gray-100">
                        <Zap size={48} className="mx-auto text-gray-200 mb-6" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest">No verified electricians found</p>
                    </div>
                )}
            </div>

            {/* View Services Modal */}
            {selectedElectrician && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedElectrician(null)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-8 border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Electrician Service History</h2>
                                <p className="text-sm text-gray-400 font-bold mt-1">Jobs handled by {selectedElectrician.fullName}</p>
                            </div>
                            <button onClick={() => setSelectedElectrician(null)} className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                            {loadingJobs ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Service Details...</p>
                                </div>
                            ) : electricianJobs.length === 0 ? (
                                <div className="text-center p-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                    <FileText size={48} className="mx-auto text-gray-200 mb-6" />
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Services Found</p>
                                    <p className="text-xs text-gray-400 font-medium mt-2">This electrician has not been assigned any jobs yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {electricianJobs.map(job => {
                                        const adminCommission = (job.totalAmount || 0) * 0.10;
                                        return (
                                            <div key={job.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                                <div className="flex items-center space-x-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 ${job.status === 'completed' ? 'bg-green-50 border-green-100 text-green-600' :
                                                        job.status === 'in_progress' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'
                                                        }`}>
                                                        <FileText size={20} className="mb-0.5" />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">{job.jobId?.slice(-4)}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {job.status.replace('_', ' ')}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                • {new Date(job.createdAt?.seconds * 1000).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-base font-black text-gray-900 tracking-tight">{job.serviceType}</h4>
                                                        <p className="text-xs text-gray-500 font-bold mt-1">Customer: <span className="text-gray-900">{job.customerName}</span> ({job.customerPhone})</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row items-end md:items-center gap-6 w-full md:w-auto">
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Total</p>
                                                            <p className="text-lg font-black text-gray-900 mt-0.5">Rs. {(job.totalAmount || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="w-px h-8 bg-gray-100 hidden md:block"></div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">10% Commission</p>
                                                            <p className="text-lg font-black text-blue-600 mt-0.5">Rs. {adminCommission.toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    {job.status === 'completed' && (
                                                        <div className="md:ml-4 flex items-center gap-2 shrink-0 flex-wrap">
                                                            {/* Receipt Viewer Button */}
                                                            {job.commissionReceiptUrl && (
                                                                <button
                                                                    onClick={() => setViewingReceipt(job.commissionReceiptUrl!)}
                                                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 transition-colors shadow-sm"
                                                                    title="View Easypaisa Receipt"
                                                                >
                                                                    <ImageIcon size={14} /> <span>Receipt</span>
                                                                </button>
                                                            )}
                                                            {/* Commission Paid Status */}
                                                            {job.commissionPaid ? (
                                                                <button
                                                                    onClick={() => handleMarkCommissionPaid(job.id, job.commissionPaid)}
                                                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 transition-colors"
                                                                    title="Click to revert to Pending"
                                                                >
                                                                    <CheckCircle2 size={14} /> <span>Settled</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleMarkCommissionPaid(job.id, job.commissionPaid)}
                                                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-100 transition-colors shadow-sm"
                                                                >
                                                                    <AlertCircle size={14} /> <span>Mark Paid</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Full-Screen Receipt Lightbox */}
            {viewingReceipt && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-lg">
                    <div className="relative max-w-3xl w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={16} /> Easypaisa Payment Receipt
                            </h3>
                            <div className="flex items-center gap-3">
                                <a
                                    href={viewingReceipt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                                >
                                    <ExternalLink size={12} /> Open Full Size
                                </a>
                                <button
                                    onClick={() => setViewingReceipt(null)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <img
                            src={viewingReceipt}
                            alt="Payment Receipt"
                            className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

