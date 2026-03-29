
import React, { useState, useEffect } from 'react';
import {
    collection, query, onSnapshot, doc, updateDoc,
    runTransaction, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import {
    Loader2, CheckCircle2, XCircle, X, ExternalLink, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ElectricianApplication } from '../../../types';

export const ElectricianAppsTab: React.FC = () => {
    const [apps, setApps] = useState<ElectricianApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<ElectricianApplication | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'electricianApplications'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => {
            setApps(snap.docs.map(d => ({ id: d.id, ...d.data() } as ElectricianApplication)));
            setLoading(false);
        });
    }, []);

    const handleUpdateStatus = async (appId: string, userId: string | null, status: 'approved' | 'rejected') => {
        try {
            if (status === 'approved') {
                const app = apps.find(a => a.id === appId);
                if (!app) return;

                const normalizedEmail = app.personalInfo.email.trim().toLowerCase();

                await runTransaction(db, async (transaction) => {
                    // 1. Update Application Status
                    transaction.update(doc(db, 'electricianApplications', appId), { status: 'approved' });

                    // 2. Update User Role if user exists
                    if (userId) {
                        transaction.update(doc(db, 'users', userId), { role: 'electrician' });
                    }

                    // 3. Create or Update Electrician Profile
                    const profileId = userId || appId;
                    const electricianRef = doc(db, 'electricians', profileId);

                    // 4. Create placeholder user document for Guests to ensure role exists on first login
                    if (!userId) {
                        const placeholderUserRef = doc(db, 'users', `approved_pro_${normalizedEmail}`);
                        transaction.set(placeholderUserRef, {
                            uid: `approved_pro_${normalizedEmail}`,
                            email: normalizedEmail,
                            fullName: app.personalInfo.fullName,
                            password: app.personalInfo.password || null, // Preserve the chosen password
                            role: 'electrician',
                            status: 'approved',
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        }, { merge: true });
                    }

                    transaction.set(electricianRef, {
                        electricianId: profileId,
                        userId: userId || null,
                        fullName: app.personalInfo.fullName,
                        phone: app.personalInfo.phone,
                        email: normalizedEmail, // Use normalized email
                        cnic: app.personalInfo.cnic,
                        pecNumber: app.credentials.pecNumber,
                        licenseNumber: app.credentials.licenseNumber,
                        licenseExpiry: app.credentials.licenseExpiry,
                        specializations: app.credentials.specialization,
                        perDayCharge: app.businessInfo.perDayCharge || 0,
                        yearsExperience: app.businessInfo.yearsExperience || 0,
                        teamSize: app.businessInfo.teamSize || 1,
                        businessName: app.businessInfo.companyName || null,
                        businessAddress: app.businessInfo.businessAddress || null,
                        verified: true,
                        verifiedAt: Date.now(),
                        status: 'active',
                        serviceAreas: app.businessInfo.serviceAreas,
                        totalJobs: 0,
                        averageRating: 0,
                        earnings: { totalEarned: 0, pendingPayments: 0, availableBalance: 0 },
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    }, { merge: true });
                });

                toast.success(userId ? 'Electrician approved and profile created!' : 'Guest electrician approved and directory profile created!');
            } else {
                await updateDoc(doc(db, 'electricianApplications', appId), { status: 'rejected' });
                toast.success('Application rejected');
            }
            setSelectedApp(null);
        } catch (err: any) {
            console.error("Approval error:", err);
            toast.error('Operation failed: ' + err.message);
        }
    };

    const handleSyncProfile = async (app: ElectricianApplication) => {
        const loadingToast = toast.loading('Syncing profile to directory...');
        try {
            const profileId = app.userId || app.id;
            const electricianRef = doc(db, 'electricians', profileId);

            await updateDoc(doc(db, 'electricianApplications', app.id), { status: 'approved' });

            await runTransaction(db, async (transaction) => {
                transaction.set(electricianRef, {
                    electricianId: profileId,
                    userId: app.userId || null,
                    fullName: app.personalInfo.fullName,
                    phone: app.personalInfo.phone,
                    email: app.personalInfo.email,
                    cnic: app.personalInfo.cnic,
                    pecNumber: app.credentials.pecNumber,
                    licenseNumber: app.credentials.licenseNumber,
                    licenseExpiry: app.credentials.licenseExpiry,
                    specializations: app.credentials.specialization,
                    verified: true,
                    verifiedAt: app.createdAt || Date.now(),
                    status: 'active',
                    serviceAreas: app.businessInfo.serviceAreas,
                    perDayCharge: app.businessInfo.perDayCharge || 0,
                    yearsExperience: app.businessInfo.yearsExperience || 0,
                    teamSize: app.businessInfo.teamSize || 1,
                    businessName: app.businessInfo.companyName || null,
                    businessAddress: app.businessInfo.businessAddress || null,
                    updatedAt: Date.now()
                }, { merge: true });
            });

            toast.dismiss(loadingToast);
            toast.success('Profile synced to directory!');
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error('Sync failed: ' + err.message);
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Electrician Applications</h2>
                    <p className="text-gray-500 font-bold mt-1">Review and verify professional electrician credentials</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {apps.map(app => (
                    <div key={app.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 hover:border-blue-100 transition-all group flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl uppercase">
                                {app.personalInfo.fullName.substring(0, 2)}
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-gray-900 tracking-tight">{app.personalInfo.fullName}</h4>
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${app.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                                        app.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {app.status}
                                    </span>
                                    {!app.userId && (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            Guest Applicant
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {app.credentials.pecNumber}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="text-center lg:text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience</p>
                                <p className="text-sm font-bold text-gray-900">{app.businessInfo.yearsExperience} Years</p>
                            </div>
                            <div className="w-px h-8 bg-gray-100 hidden lg:block"></div>
                            <div className="text-center lg:text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialization</p>
                                <p className="text-sm font-bold text-gray-900">{app.credentials.specialization?.[0] || 'General'}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {app.status === 'approved' && (
                                <button
                                    onClick={() => handleSyncProfile(app)}
                                    className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center space-x-2"
                                    title="Force Sync to Directory"
                                >
                                    <Zap size={14} className="animate-pulse" />
                                    <span>Sync Pro</span>
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedApp(app)}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                            >
                                Review Docs
                            </button>
                            {app.status === 'pending' && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleUpdateStatus(app.id, app.userId || null, 'approved')}
                                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(app.id, app.userId || null, 'rejected')}
                                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {apps.length === 0 && (
                    <div className="text-center p-20 bg-white rounded-[3rem] border border-gray-100">
                        <Zap size={48} className="mx-auto text-gray-200 mb-6" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest">No applications found</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6 text-left">
                    <div className="bg-white rounded-[3rem] p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <button onClick={() => setSelectedApp(null)} className="absolute top-8 right-8 p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight uppercase">Credential Verification</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PEC Number</p>
                                            <p className="font-bold text-gray-900">{selectedApp.credentials.pecNumber}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">License Number</p>
                                            <p className="font-bold text-gray-900">{selectedApp.credentials.licenseNumber}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight uppercase">Business Profile</h3>
                                    <p className="text-sm font-medium text-gray-500 mb-4">{selectedApp.businessInfo.companyName}</p>
                                    <p className="text-sm font-medium text-gray-500">{selectedApp.businessInfo.businessAddress}</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight uppercase">Uploaded Documents</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(selectedApp.documents).map(([key, url]) => (
                                        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                                            <div className="relative h-32 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                                                <img src={url} alt={key} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ExternalLink size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase text-center mt-2 tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</p>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
