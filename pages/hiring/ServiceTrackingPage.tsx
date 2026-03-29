import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    doc, onSnapshot, collection, query,
    where, orderBy, updateDoc, writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ServiceRequest, ServiceOffer, ServiceJob } from '../../types';
import {
    Search, Star, ShieldCheck, Clock,
    ArrowRight, Loader2, Sparkles, User,
    CheckCircle2, X, Wrench, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ServiceTrackingPage: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [request, setRequest] = useState<ServiceRequest | null>(null);
    const [offers, setOffers] = useState<ServiceOffer[]>([]);
    const [targetedElectrician, setTargetedElectrician] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!requestId) return;

        // Listen to request
        const unsubRequest = onSnapshot(doc(db, 'serviceRequests', requestId), async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as ServiceRequest;
                setRequest(data);

                // Fetch targeted electrician if exists
                if (data.targetedElectricianId && !targetedElectrician) {
                    try {
                        const { getDoc, getDocs, doc, collection, query, where } = await import('firebase/firestore');

                        // Try fetching by Document ID first (standard)
                        const proSnap = await getDoc(doc(db, 'electricians', data.targetedElectricianId));
                        if (proSnap.exists()) {
                            setTargetedElectrician(proSnap.data());
                        } else {
                            // Fallback: Search by userId field (critical for linked accounts)
                            const qPro = query(collection(db, 'electricians'), where('userId', '==', data.targetedElectricianId));
                            const proQuerySnap = await getDocs(qPro);
                            if (!proQuerySnap.empty) {
                                setTargetedElectrician(proQuerySnap.docs[0].data());
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching targeted electrician:", err);
                    }
                }
            }
            setLoading(false);
        });

        // Listen to offers
        const offersQuery = query(
            collection(db, 'serviceOffers'),
            where('requestId', '==', requestId),
            orderBy('createdAt', 'desc')
        );

        const unsubOffers = onSnapshot(offersQuery, (snapshot) => {
            setOffers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServiceOffer)));
        });

        return () => {
            unsubRequest();
            unsubOffers();
        };
    }, [requestId]);

    const handleAcceptOffer = async (offer: ServiceOffer) => {
        if (!request) return;

        if (!user) {
            toast.error("Please log in to hire this professional");
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }

        const confirmAccept = window.confirm(`Accept ${offer.electricianName}'s offer for Rs. ${offer.quotedPrice.toLocaleString()}?`);
        if (!confirmAccept) return;

        try {
            const batch = writeBatch(db);

            // 1. Create Job
            const jobRef = doc(collection(db, 'serviceJobs'));
            const newJob: Partial<ServiceJob> = {
                jobId: jobRef.id.slice(-8).toUpperCase(),
                requestId: requestId,
                orderId: request.orderId,
                customerId: request.customerId,
                customerName: request.customerName,
                customerPhone: request.customerPhone,
                electricianId: offer.electricianId,
                electricianName: offer.electricianName,
                serviceType: request.serviceType,
                description: request.description,
                products: request.products.map(p => ({
                    productId: p.productId,
                    name: p.name,
                    quantity: p.quantity,
                    status: 'pending'
                })),
                productTotal: 0, // Product prices are calculated during the job or later
                serviceFee: offer.quotedPrice,
                totalAmount: offer.quotedPrice, // the quoted price is the total service cost
                payment: {
                    customerPaid: offer.quotedPrice,
                    platformFee: offer.quotedPrice * 0.1,
                    electricianEarns: offer.quotedPrice * 0.9,
                    status: 'held'
                },
                location: {
                    address: request.location.address,
                    instructions: request.location.instructions
                },
                scheduledDate: offer.startDate,
                scheduledTime: offer.startTime,
                status: 'confirmed',
                statusHistory: [{ status: 'confirmed', timestamp: Date.now() }],
                messages: [],
                completionPhotos: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            batch.set(jobRef, newJob);

            // 2. Update Request status
            batch.update(doc(db, 'serviceRequests', requestId!), {
                status: 'confirmed',
                selectedElectricianId: offer.electricianId,
                confirmedAt: serverTimestamp()
            });

            // 3. Update all offers
            offers.forEach(o => {
                const oRef = doc(db, 'serviceOffers', o.id);
                batch.update(oRef, { status: o.id === offer.id ? 'accepted' : 'rejected' });
            });

            await batch.commit();
            toast.success("Professional hired! Redirecting to job tracker...");
            navigate(`/job-tracking/${jobRef.id}`);
        } catch (err) {
            toast.error("Failed to confirm offer. Please try again.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
    if (!request) return <div className="min-h-screen flex items-center justify-center">Request Not Found</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-20 text-left">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <span className={`text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg italic ${request.status === 'confirmed' ? 'bg-green-600 shadow-green-100' : 'bg-blue-600 shadow-blue-100'}`}>
                                {request.status === 'confirmed' ? 'Professional Confirmed' : request.targetedElectricianId ? 'Direct Request Sent' : 'Matching Active'}
                            </span>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">REQ ID: #{requestId?.slice(-8).toUpperCase()}</p>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            {request.status === 'confirmed' ? 'Service Deployment Active' : request.targetedElectricianId ? 'Awaiting Professional Response' : 'Review Professional Responses'}
                        </h1>
                    </div>

                    <div className="flex space-x-2">
                        {request.status !== 'confirmed' && !request.targetedElectricianId && (
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Search size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900">{offers.length} Responses</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live matching engine</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {request.status === 'confirmed' ? (
                    <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-blue-100 relative overflow-hidden text-center max-w-2xl mx-auto">
                        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Engagement Initialized!</h2>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                            Your service request has been accepted by a professional. The deployment protocol is now in effect.
                        </p>
                        <div className="bg-gray-50 rounded-[2rem] p-8 mb-8 border border-gray-100">
                            <div className="flex justify-between items-center text-left">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="font-black text-green-600 uppercase">Confirmed & Scheduled</p>
                                </div>
                                <button
                                    onClick={() => navigate('/my-account#orders')}
                                    className="px-8 py-4 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                                >
                                    Track Job Ops
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Main Content - Offers */}
                        <div className="lg:col-span-8 space-y-6">
                            {offers.length === 0 ? (
                                <div className="bg-white rounded-[3rem] p-16 text-center shadow-xl border border-gray-100">
                                    <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                        <Sparkles size={40} />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 mb-4">
                                        {request.targetedElectricianId ? `Request Sent to ${targetedElectrician?.fullName || 'Professional'}...` : 'Finding Your Match...'}
                                    </h2>
                                    <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mb-8">
                                        {request.targetedElectricianId
                                            ? `We've successfully transmitted your service requirements to ${targetedElectrician?.fullName || 'the professional'}. You'll be notified as soon as they accept.`
                                            : 'We are broadcasting your request to the top-rated professionals in your vicinity using our proximity scoring.'}
                                    </p>
                                    <div className="flex justify-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {offers.map((offer) => (
                                        <div key={offer.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden hover:border-blue-200 transition-all flex flex-col md:flex-row">
                                            <div className="w-full md:w-72 bg-gray-50/50 p-8 border-r border-gray-50 flex flex-col items-center">
                                                <div className="w-32 h-32 rounded-[2rem] bg-white border-4 border-white shadow-xl overflow-hidden mb-6">
                                                    <img
                                                        src={offer.electricianAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${offer.electricianId}`}
                                                        className="w-full h-full object-cover" alt=""
                                                    />
                                                </div>
                                                <h4 className="text-xl font-black text-gray-900 mb-1">{offer.electricianName || 'Trade Electrician'}</h4>
                                                <div className="flex items-center space-x-1 text-orange-500 mb-4">
                                                    <Star size={16} fill="currentColor" />
                                                    <span className="text-sm font-black text-gray-900">{offer.electricianRating || '4.8'}</span>
                                                    <span className="text-xs text-gray-400 font-black">({offer.completedJobs || '150'}+ Jobs)</span>
                                                </div>
                                                {offer.verifiedBadge && (
                                                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center">
                                                        <ShieldCheck size={14} className="mr-2" /> Verified Pro
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 p-8 md:p-10 flex flex-col justify-between text-left">
                                                <div>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Message Summary</p>
                                                            <p className="text-gray-900 font-bold leading-relaxed text-lg italic">"{offer.message}"</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Professional Bid</p>
                                                            <p className="text-3xl font-black text-gray-900 tracking-tighter">Rs. {offer.quotedPrice?.toLocaleString()}</p>
                                                            {offer.perDayCharge !== undefined && offer.perDayCharge > 0 && (
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                                    (Rs. {offer.perDayCharge.toLocaleString()} / Day)
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 pt-8 border-t border-gray-50">
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Time</p>
                                                            <div className="flex items-center space-x-2 text-gray-900 font-black">
                                                                <Clock size={16} className="text-blue-600" />
                                                                <span>{offer.estimatedHours} Days</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deployment Date</p>
                                                            <div className="flex items-center space-x-2 text-gray-900 font-black">
                                                                <CheckCircle2 size={16} className="text-blue-600" />
                                                                <span>{offer.startDate}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-4 pt-6">
                                                    <button
                                                        onClick={() => handleAcceptOffer(offer)}
                                                        className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center space-x-3"
                                                    >
                                                        <span>Confirm Selection</span>
                                                        <ArrowRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Request Summary */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                                <h4 className="text-xl font-black mb-6 relative z-10">Your Service Requirement</h4>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shadow-sm">
                                            <Wrench size={24} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Service Objective</p>
                                            <p className="text-sm font-black uppercase">{request.serviceType}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shadow-sm">
                                            <Clock size={24} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Timeline</p>
                                            <p className="text-sm font-black">{request.preferredDate} ({request.preferredTimeSlot})</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shadow-sm">
                                            <MapPin size={24} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Terminal Location</p>
                                            <p className="text-sm font-black line-clamp-2">{request.location.address}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Job Narrative</p>
                                    <p className="text-sm font-medium text-gray-400 italic leading-relaxed">"{request.description}"</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                                <h5 className="font-black text-gray-900 uppercase tracking-[0.2em] text-[10px] mb-4">Safety Standard</h5>
                                <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase">
                                    Matching experts are filtered based on their verification status and professional rating history within the Peshawar division.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
