import React, { useState, useEffect } from 'react';
import {
    onSnapshot, collection, query,
    where, orderBy, doc, setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { ServiceRequest, ServiceOffer } from '../../../types';
import {
    Sparkles, MapPin, Clock, Wrench,
    ArrowRight, ShieldCheck, Loader2,
    AlertTriangle, DollarSign, MessageSquare, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export const NewOpportunities: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myPerDayCharge, setMyPerDayCharge] = useState<number>(0);

    // Fetch electrician's own per-day charge once
    useEffect(() => {
        if (!user?.uid) return;
        import('firebase/firestore').then(({ getDoc, doc }) => {
            getDoc(doc(db, 'electricians', user.uid)).then(snap => {
                if (snap.exists()) setMyPerDayCharge(snap.data().perDayCharge || 0);
            });
        });
    }, [user?.uid]);

    const handleAcceptRequest = async (request: ServiceRequest) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            // 1. Fetch electrician info for the job record
            const { getDoc, updateDoc } = await import('firebase/firestore');
            const eDocRef = doc(db, 'electricians', user.uid);
            const eDocSnap = await getDoc(eDocRef);
            const eData = eDocSnap.exists() ? eDocSnap.data() : {};

            const jobRef = doc(collection(db, 'serviceJobs'));

            // 2. Prepare the Service Job document
            const newJob = {
                id: jobRef.id,
                jobId: `JOB-${Math.random().toString(36).toUpperCase().slice(2, 8)}`,
                requestId: request.id,
                orderId: request.orderId || `DIR-${Date.now()}`,
                customerId: request.customerId,
                customerName: request.customerName,
                customerPhone: request.customerPhone,
                electricianId: user.uid,
                electricianName: eData.fullName || user.name || 'Pro Electrician',
                serviceType: request.serviceType,
                description: request.description,
                location: request.location,
                products: request.products.map(p => ({
                    productId: p.productId || 'N/A',
                    name: p.name || 'Custom Product',
                    quantity: p.quantity || 1,
                    status: 'pending'
                })),
                productTotal: 0, // Calculated later
                serviceFee: (eData.perDayCharge || 0) * (request.daysRequired || 1),
                totalAmount: (eData.perDayCharge || 0) * (request.daysRequired || 1),
                perDayCharge: eData.perDayCharge || 0,
                daysRequired: request.daysRequired || 1,
                status: 'confirmed',
                paymentStatus: 'pending',
                scheduledDate: request.preferredDate,
                scheduledTime: request.preferredTimeSlot,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // 3. Create Job and Update Request in a batch-like sequence
            await setDoc(jobRef, newJob);
            await updateDoc(doc(db, 'serviceRequests', request.id), {
                status: 'confirmed',
                selectedElectricianId: user.uid,
                confirmedAt: serverTimestamp()
            });

            toast.success("Project accepted successfully! Job added to management desk.");
            setSelectedRequest(null);
        } catch (err: any) {
            console.error("Acceptance error:", err);
            toast.error(`Acceptance failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeclineRequest = async (request: ServiceRequest) => {
        if (!user) return;
        const confirmDecline = window.confirm("Are you sure you want to decline this job request? It will be removed from your dashboard.");
        if (!confirmDecline) return;

        try {
            const { updateDoc, arrayUnion } = await import('firebase/firestore');
            await updateDoc(doc(db, 'serviceRequests', request.id), {
                rejectedElectricians: arrayUnion(user.uid)
            });
            toast.success("Opportunity dismissed.");
        } catch (err: any) {
            console.error("Decline error:", err);
            toast.error("Failed to decline request.");
        }
    };

    const [electrician, setElectrician] = useState<any>(null);

    // 1. Fetch Electrician Profile robustly
    useEffect(() => {
        if (!user) return;

        const unsubPro = onSnapshot(query(collection(db, 'electricians'), where('userId', '==', user.uid)), (snap) => {
            if (!snap.empty) {
                setElectrician({ id: snap.docs[0].id, ...snap.docs[0].data() });
            } else if (user.email) {
                const unsubEmail = onSnapshot(query(collection(db, 'electricians'), where('email', '==', user.email.toLowerCase())), (eSnap) => {
                    if (!eSnap.empty) {
                        setElectrician({ id: eSnap.docs[0].id, ...eSnap.docs[0].data() });
                    }
                });
                return unsubEmail;
            }
        });

        return () => unsubPro();
    }, [user?.uid]);

    // 2. Fetch Requests
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'serviceRequests'),
            where('status', 'in', ['pending', 'matching', 'offers_received'])
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const allRequests = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as ServiceRequest))
                .sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                });

            const filtered = allRequests.filter(req => {
                // Never show requests that are already assigned or confirmed
                if (req.selectedElectricianId) return false;
                if (req.status === 'confirmed') return false;
                if (req.rejectedElectricians?.includes(user?.uid || '')) return false;

                // No broadcast — only show jobs explicitly targeted to THIS electrician
                if (!req.targetedElectricianId) return false;

                // Targeted jobs: Only show if explicitly targeted to THIS electrician (by UID or Profile ID)
                const targetId = String(req.targetedElectricianId || '');
                const isTargetedToMe = targetId === String(user?.uid) ||
                    (electrician?.id && targetId === String(electrician.id)) ||
                    (electrician?.electricianId && targetId === String(electrician.electricianId));

                return isTargetedToMe;
            });

            setRequests(filtered);
            setLoading(false);
        }, (error) => {
            console.error("NewOpportunities Snapshot Error:", error);
            setLoading(false);
        });

        return () => unsub();
    }, [user?.uid, electrician?.id]);

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">New Jobs</h2>
                    <p className="text-gray-500 font-medium">Direct requests specifically targeted to your profile</p>
                </div>
                <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 shadow-xl shadow-blue-100">
                    <Sparkles size={20} className="animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">{requests.length} New Jobs Found</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12 space-y-6">
                    {requests.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-gray-100 grayscale opacity-50">
                            <Wrench size={48} className="mx-auto mb-6 text-gray-300" />
                            <p className="font-black text-gray-400 uppercase tracking-[0.3em]">Scanners Clear. No active signals detected.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.map((req) => (
                                <div
                                    key={req.id}
                                    className={`bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:border-blue-100 group relative overflow-hidden ${selectedRequest?.id === req.id ? 'ring-2 ring-blue-600 shadow-blue-50' : ''}`}
                                >
                                    <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${req.urgency?.toLowerCase().includes('urgent') ? 'bg-orange-100 text-orange-600' :
                                        (req.urgency?.toLowerCase().includes('emergency') ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600')
                                        }`}>
                                        {req.urgency}
                                    </div>

                                    {req.targetedElectricianId === user?.uid && (
                                        <div className="absolute top-0 left-0 px-4 py-2 bg-blue-600 text-white rounded-br-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg">
                                            <Sparkles size={12} className="mr-2 animate-pulse" /> Direct Request
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="w-12 h-12 bg-gray-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Wrench size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Type</p>
                                            <h4 className="font-black text-gray-900 uppercase">{req.serviceType}</h4>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-start space-x-3 text-sm">
                                            <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                                            <span className="font-bold text-gray-700 line-clamp-2">{req.location.fullAddress || (req.location as any).address}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 text-sm">
                                            <Clock className="text-gray-400 flex-shrink-0" size={16} />
                                            <span className="font-black text-gray-900">{req.preferredDate} • {req.preferredTimeSlot}</span>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <p className="text-xs font-medium text-gray-500 line-clamp-2 italic">"{req.description}"</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 gap-3">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Duration</p>
                                            <p className="text-lg font-black text-green-600">{req.daysRequired || 1} Day{(req.daysRequired || 1) > 1 ? 's' : ''} <span className="text-gray-400 font-bold text-sm">× Your Rate</span></p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDeclineRequest(req)}
                                                className="bg-gray-100 text-gray-400 p-4 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
                                                title="Decline Opportunity"
                                            >
                                                <X size={20} />
                                            </button>
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center"
                                                title="Accept Opportunity"
                                            >
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Acceptance Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                                    <Sparkles size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-black tracking-tight">Accept Direct Project</h3>
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Ref: {selectedRequest.id.slice(-6)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-3 hover:bg-white/10 rounded-xl transition-colors">
                                <ArrowRight size={20} className="rotate-180" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8 overflow-y-auto text-left">
                            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                                        <p className="font-black text-gray-900">{selectedRequest.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service Type</p>
                                        <p className="font-black text-blue-600 uppercase">{selectedRequest.serviceType}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deployment Location</p>
                                    <p className="font-bold text-gray-700">{selectedRequest.location.fullAddress}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Estimated Earnings</p>
                                    <p className="text-2xl font-black text-green-600">Rs. {(myPerDayCharge * (selectedRequest.daysRequired || 1)).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1">{selectedRequest.daysRequired || 1} day{(selectedRequest.daysRequired || 1) > 1 ? 's' : ''} × Rs. {myPerDayCharge.toLocaleString()} / day</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start space-x-4">
                                <ShieldCheck className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                                <p className="text-[10px] font-black text-blue-700/80 uppercase tracking-widest leading-relaxed">
                                    By accepting this project, you agree to fulfill the service requirements within the specified budget range. A direct job record will be created instantly.
                                </p>
                            </div>

                            <button
                                onClick={() => handleAcceptRequest(selectedRequest)}
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center space-x-3"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <span>Confirm Acceptance</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
