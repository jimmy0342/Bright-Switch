import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    doc, getDoc, setDoc, collection,
    serverTimestamp, updateDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Order, ServiceRequest } from '../../types';
import {
    Loader2, AlertCircle, CheckCircle2,
    Plus, Trash2, User, Mail, Phone,
    ShieldCheck, DollarSign, HelpCircle,
    Building2, MapPinned, Zap, ArrowRight,
    Calendar, Clock, Hammer, Wrench, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ServiceRequestPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [order, setOrder] = useState<Order | null>(null);
    const [targetedPro, setTargetedPro] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        // Section 1: Information
        customerName: user?.name || '',
        customerPhone: '',
        customerEmail: user?.email || '',

        // Section 2: Service Details
        serviceType: 'Installation' as ServiceRequest['serviceType'],
        otherServiceType: '',
        urgency: 'Normal (Within 1 week)' as ServiceRequest['urgency'],
        title: '',
        description: '',

        // Section 3: Products (Repeater)
        products: [] as ServiceRequest['products'],

        // Section 4: Location
        location: {
            fullAddress: '',
            landmark: '',
            instructions: ''
        },

        // Section 5: Schedule
        preferredDate: '',
        preferredTimeSlot: '',
        flexibility: false,

        // Section 6: Budget/Time
        budgetMin: 0,
        budgetMax: 0,
        daysRequired: 1,

        // Section 7: Extra
        questions: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Order if exists
                if (orderId) {
                    const orderSnap = await getDoc(doc(db, 'orders', orderId));
                    if (orderSnap.exists()) {
                        const orderData = orderSnap.data() as Order;
                        setOrder(orderData);
                        setFormData(prev => ({
                            ...prev,
                            customerName: orderData.customerName || orderData.shippingAddress?.split('\n')[0] || user?.name || prev.customerName,
                            customerPhone: orderData.customerPhone || prev.customerPhone,
                            customerEmail: orderData.customerEmail || user?.email || prev.customerEmail,
                            location: {
                                ...prev.location,
                                fullAddress: orderData.shippingAddress || '',
                            },
                            products: orderData.items.map(item => ({
                                name: item.name,
                                quantity: item.qty,
                                brand: '',
                                customerWillProvide: false,
                                productId: item.productId
                            }))
                        }));
                    }
                } else {
                    // Start with one empty product row if no order context
                    setFormData(prev => ({
                        ...prev,
                        products: [{ name: '', quantity: 1, brand: '', customerWillProvide: false }]
                    }));
                }

                // 2. Fetch targeted pro if exists in URL (regardless of order)
                const proId = searchParams.get('pro');
                if (proId) {
                    // Try direct doc lookup first
                    const proSnap = await getDoc(doc(db, 'electricians', proId));
                    if (proSnap.exists()) {
                        const proData = { id: proSnap.id, ...proSnap.data() } as any;
                        setTargetedPro(proData);
                    } else {
                        // Fallback: query by electricianId or userId field
                        const { getDocs, query: fsQuery, where } = await import('firebase/firestore');
                        let fallback = null;

                        const byElecId = await getDocs(fsQuery(collection(db, 'electricians'), where('electricianId', '==', proId)));
                        if (!byElecId.empty) {
                            const d = byElecId.docs[0];
                            fallback = { id: d.id, ...d.data() };
                        } else {
                            const byUserId = await getDocs(fsQuery(collection(db, 'electricians'), where('userId', '==', proId)));
                            if (!byUserId.empty) {
                                const d = byUserId.docs[0];
                                fallback = { id: d.id, ...d.data() };
                            }
                        }

                        if (fallback) {
                            setTargetedPro(fallback);
                        } else {
                            console.warn("Targeted pro not found for ID:", proId);
                        }
                    }
                }
            } catch (err) {
                console.error("Fetch context error:", err);
                toast.error("Failed to load request context");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [orderId, searchParams]);

    const addProductRow = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { name: '', quantity: 1, brand: '', customerWillProvide: false }]
        }));
    };

    const removeProductRow = (index: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index)
        }));
    };

    const updateProduct = (index: number, field: string, value: any) => {
        const newProducts = [...formData.products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        setFormData({ ...formData, products: newProducts });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerName || !formData.customerPhone) {
            toast.error("Contact information is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const proId = urlParams.get('pro');

            const requestRef = doc(collection(db, 'serviceRequests'));

            // Strict sanitization for Firestore
            const sanitizedProducts = formData.products.map(p => ({
                name: String(p.name || ''),
                quantity: Number(p.quantity) || 1,
                brand: String(p.brand || ''),
                customerWillProvide: Boolean(p.customerWillProvide),
                status: 'pending'
            }));

            // Calculate strict budget boundaries if targeted pro
            const projectedTotal = targetedPro ? formData.daysRequired * (targetedPro.perDayCharge || 0) : 0;

            const newRequest: ServiceRequest = {
                id: requestRef.id,
                requestId: `REQ-${Math.random().toString(36).toUpperCase().slice(2, 8)}`,
                customerId: user?.uid || null,
                orderId: orderId || null,

                customerName: String(formData.customerName),
                customerPhone: String(formData.customerPhone),
                customerEmail: String(formData.customerEmail),

                title: String(formData.title),
                serviceType: formData.serviceType,
                otherServiceType: formData.otherServiceType ? String(formData.otherServiceType) : null,
                urgency: formData.urgency,
                description: String(formData.description),

                products: sanitizedProducts,
                location: {
                    fullAddress: String(formData.location.fullAddress),
                    landmark: String(formData.location.landmark || ''),
                    instructions: String(formData.location.instructions || '')
                },

                preferredDate: String(formData.preferredDate || ''),
                preferredTimeSlot: String(formData.preferredTimeSlot || ''),
                flexibility: Boolean(formData.flexibility),

                budgetMin: targetedPro ? projectedTotal : Number(formData.budgetMin) || 0,
                budgetMax: targetedPro ? projectedTotal : Number(formData.budgetMax) || 0,
                daysRequired: Number(formData.daysRequired) || 1,

                questions: String(formData.questions || ''),

                status: targetedPro ? 'pending' : 'matching', // Targeted requests go to 'pending' for the pro
                matchedElectricians: targetedPro ? [targetedPro.id] : [],
                rejectedElectricians: [],
                targetedElectricianId: targetedPro ? (targetedPro.userId || targetedPro.id) : null,
                assignmentType: targetedPro ? 'direct' : 'broadcast',
                createdAt: serverTimestamp()
            };

            console.log("Submitting Request Payload:", newRequest);
            await setDoc(requestRef, newRequest);

            // AUTO-ACCEPT: If targeted to a specific electrician, immediately create a confirmed job
            if (targetedPro) {
                const jobRef = doc(collection(db, 'serviceJobs'));
                const autoJob = {
                    id: jobRef.id,
                    jobId: `JOB-${Math.random().toString(36).toUpperCase().slice(2, 8)}`,
                    requestId: requestRef.id,
                    orderId: orderId || `DIR-${Date.now()}`,
                    customerId: user?.uid || null,
                    customerName: String(formData.customerName),
                    customerPhone: String(formData.customerPhone),
                    electricianId: targetedPro.userId || targetedPro.id,
                    electricianName: targetedPro.fullName || 'Pro Electrician',
                    serviceType: formData.serviceType,
                    description: String(formData.description),
                    location: {
                        fullAddress: String(formData.location.fullAddress),
                        landmark: String(formData.location.landmark || ''),
                        instructions: String(formData.location.instructions || '')
                    },
                    products: sanitizedProducts,
                    productTotal: 0,
                    perDayCharge: targetedPro.perDayCharge || 0,
                    daysRequired: Number(formData.daysRequired) || 1,
                    serviceFee: projectedTotal,
                    totalAmount: projectedTotal,
                    status: 'confirmed',
                    paymentStatus: 'pending',
                    scheduledDate: String(formData.preferredDate || ''),
                    scheduledTime: String(formData.preferredTimeSlot || ''),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                await setDoc(jobRef, autoJob);

                // Mark the service request as confirmed
                await updateDoc(requestRef, {
                    status: 'confirmed',
                    selectedElectricianId: targetedPro.userId || targetedPro.id,
                    confirmedAt: serverTimestamp()
                });

                toast.success(`Request confirmed & sent to ${targetedPro.fullName.split(' ')[0]}!`);
                navigate('/');
            } else {
                toast.success("Request transmitted successfully! Our matching experts will connect with you shortly.");
                navigate('/');
            }
        } catch (err: any) {
            console.error("Submission error details:", err);
            toast.error(`Failed to submit: ${err.message || 'Unknown Error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-20 text-left">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            {targetedPro ? `Deploy ${targetedPro.fullName.split(' ')[0]}` : 'Schedule Installation'}
                        </h1>
                        <p className="text-gray-500 font-medium mt-2">
                            {targetedPro
                                ? `Initializing direct service protocol with ${targetedPro.fullName}`
                                : 'Connect with verified experts for your BrightSwitch components'}
                        </p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
                        <CheckCircle2 className="text-green-500" size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-900">Order confirmed</span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden text-left">
                            <div className="p-8 md:p-12 space-y-12">
                                {/* Section 1: Your Information */}
                                <section className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">1</div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Your Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={formData.customerName}
                                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                                    placeholder="Full Name"
                                                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="tel"
                                                    value={formData.customerPhone}
                                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                                    placeholder="03XX-XXXXXXX"
                                                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Email Address (Optional)</label>
                                            <div className="relative">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="email"
                                                    value={formData.customerEmail}
                                                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                                    placeholder="email@example.com"
                                                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-gray-50" />

                                {/* Section 2: Service Details */}
                                <section className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">2</div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Service Details</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Service Type</label>
                                            <select
                                                value={formData.serviceType}
                                                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                                                className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="Installation">Installation</option>
                                                <option value="Repair">Repair</option>
                                                <option value="Maintenance">Maintenance</option>
                                                <option value="Inspection">Inspection</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        {formData.serviceType === 'Other' && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Specify Service</label>
                                                <input
                                                    type="text"
                                                    value={formData.otherServiceType}
                                                    onChange={(e) => setFormData({ ...formData, otherServiceType: e.target.value })}
                                                    placeholder="Please specify service"
                                                    className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Urgency</label>
                                            <select
                                                value={formData.urgency}
                                                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                                                className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="Normal (Within 1 week)">Normal (Within 1 week)</option>
                                                <option value="Urgent (Within 2-3 days)">Urgent (Within 2-3 days)</option>
                                                <option value="Emergency (Within 24 hours)">Emergency (Within 24 hours)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Short Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Install MCB in New Home"
                                            className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Detailed Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe the work needed in detail..."
                                            rows={4}
                                            className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold resize-none"
                                            required
                                        />
                                    </div>
                                </section>

                                <hr className="border-gray-50" />

                                {/* Section 3: Products */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">3</div>
                                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Products to Install</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addProductRow}
                                            className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center space-x-2"
                                        >
                                            <Plus size={14} />
                                            <span>Add Product</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.products.map((product, index) => (
                                            <div key={index} className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-6 relative group animate-in fade-in slide-in-from-top-4">
                                                {formData.products.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProductRow(index)}
                                                        className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                    <div className="md:col-span-12 space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Product Name</label>
                                                        <input
                                                            type="text"
                                                            value={product.name}
                                                            onChange={(e) => updateProduct(index, 'name', e.target.value)}
                                                            placeholder="e.g., 18-Way Distribution Board"
                                                            className="w-full px-6 py-4 rounded-xl bg-white border border-transparent outline-none focus:border-blue-600 font-bold"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4 space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Quantity</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={product.quantity}
                                                            onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || '')}
                                                            className="w-full px-6 py-4 rounded-xl bg-white border border-transparent outline-none focus:border-blue-600 font-bold"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="md:col-span-8 space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Brand Preference (Optional)</label>
                                                        <input
                                                            type="text"
                                                            value={product.brand}
                                                            onChange={(e) => updateProduct(index, 'brand', e.target.value)}
                                                            placeholder="e.g., Schneider, ABB, Local"
                                                            className="w-full px-6 py-4 rounded-xl bg-white border border-transparent outline-none focus:border-blue-600 font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                <label className="flex items-center space-x-3 cursor-pointer select-none pl-2">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={product.customerWillProvide}
                                                            onChange={(e) => updateProduct(index, 'customerWillProvide', e.target.checked)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${product.customerWillProvide ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'}`}>
                                                            {product.customerWillProvide && <CheckCircle2 size={14} className="text-white" />}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-black text-gray-600 uppercase tracking-tight">I will provide this product (Install-only)</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <hr className="border-gray-50" />

                                {/* Section 4: Service Location */}
                                <section className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">4</div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Service Location</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Full Address</label>
                                            <div className="relative">
                                                <MapPinned className="absolute left-6 top-5 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={formData.location.fullAddress}
                                                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, fullAddress: e.target.value } })}
                                                    placeholder="House/Shop number, Street, Area, City"
                                                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Landmark (Optional)</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={formData.location.landmark}
                                                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, landmark: e.target.value } })}
                                                    placeholder="Near City Hospital"
                                                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Deployment Terminal Instructions</label>
                                            <textarea
                                                value={formData.location.instructions}
                                                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, instructions: e.target.value } })}
                                                placeholder="Gate code, floor, building details..."
                                                rows={2}
                                                className="w-full px-8 py-5 rounded-[1.5rem] bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold resize-none"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-gray-50" />

                                {/* Section 5: Preferred Schedule */}
                                <section className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">5</div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Preferred Schedule</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest text-left">Ideal Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="date"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={formData.preferredDate}
                                                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                                                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest text-left">Time Slot</label>
                                            <div className="relative">
                                                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <select
                                                    value={formData.preferredTimeSlot}
                                                    onChange={(e) => setFormData({ ...formData, preferredTimeSlot: e.target.value })}
                                                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-600 font-bold appearance-none cursor-pointer"
                                                    required
                                                >
                                                    <option value="">Select preferences</option>
                                                    <option value="Morning (9AM - 12PM)">Morning (9AM - 12PM)</option>
                                                    <option value="Afternoon (12PM - 3PM)">Afternoon (12PM - 3PM)</option>
                                                    <option value="Evening (3PM - 6PM)">Evening (3PM - 6PM)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.flexibility}
                                                onChange={(e) => setFormData({ ...formData, flexibility: e.target.checked })}
                                                className="sr-only"
                                            />
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.flexibility ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'}`}>
                                                {formData.flexibility && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Days are flexible (Increases matching speed)</span>
                                    </label>
                                </section>

                                <hr className="border-gray-50" />

                                {/* Section 6: Pricing Configuration */}
                                <section className="space-y-6">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200">6</div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Time & Pricing Estimate</h3>
                                    </div>
                                    <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-8">
                                        <div className="grid md:grid-cols-2 gap-8 items-center border-b border-gray-200 pb-8">
                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest text-left mb-4">Estimated Days Required</label>
                                                <div className="flex items-center space-x-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, daysRequired: Math.max(1, prev.daysRequired - 1) }))}
                                                        className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all font-black text-2xl shadow-sm"
                                                    >
                                                        -
                                                    </button>
                                                    <div className="w-20 text-center">
                                                        <span className="text-4xl font-black text-gray-900">{formData.daysRequired}</span>
                                                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{formData.daysRequired === 1 ? 'Day' : 'Days'}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, daysRequired: prev.daysRequired + 1 }))}
                                                        className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all font-black text-2xl shadow-sm"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {targetedPro && (
                                                <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-100/50 relative overflow-hidden text-right flex flex-col justify-center h-full">
                                                    <Zap className="absolute top-[-20%] left-[-10%] w-32 h-32 text-blue-50 -rotate-12 opacity-50 pointer-events-none" />
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 relative z-10">Estimated Total Cost</p>
                                                    <p className="text-4xl font-black text-gray-900 relative z-10 tracking-tight">
                                                        PKR {(formData.daysRequired * (targetedPro.perDayCharge || 0)).toLocaleString()}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest relative z-10">Based on {targetedPro.fullName}'s daily rate of PKR {(targetedPro.perDayCharge || 0).toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-start space-x-3 text-left">
                                            <ShieldCheck className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                                            <p className="text-xs font-bold text-gray-600 leading-relaxed max-w-2xl">
                                                {targetedPro
                                                    ? "This total is calculated automatically based on the professional's fixed daily rate. You only pay for the time required to complete your project."
                                                    : "Your request will be sent to our network of certified professionals. You only pay for the time required."}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-gray-50" />

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gray-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl flex items-center justify-center space-x-4"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            <span>
                                                {targetedPro ? `Submit Request to ${targetedPro.fullName.split(' ')[0]}` : 'Submit Service Request'}
                                            </span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                            <Zap size={120} className="absolute -bottom-10 -right-10 text-white/5" />

                            {/* If targetedPro: Show rich electrician card */}
                            {targetedPro ? (
                                <div className="relative z-10 space-y-6">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Your Selected Professional</p>

                                    {/* Avatar + Name */}
                                    <div className="flex items-center space-x-5">
                                        <div className="w-20 h-20 rounded-2xl bg-white/10 overflow-hidden flex-shrink-0 border border-white/10 relative">
                                            {targetedPro.avatar ? (
                                                <img
                                                    src={targetedPro.avatar}
                                                    className="w-full h-full object-cover"
                                                    alt={targetedPro.fullName}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
                                                    <User size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-white leading-tight">{targetedPro.fullName}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <ShieldCheck size={13} className="text-green-400" />
                                                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Verified Electrician</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rate */}
                                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-5">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Daily Service Rate</p>
                                        <p className="text-3xl font-black text-white">Rs. {(targetedPro.perDayCharge || 0).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Per Day · Fixed Rate</p>
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                                            <p className="text-lg font-black text-white">{targetedPro.yearsExperience || '—'} <span className="text-xs text-gray-400 font-bold">yrs</span></p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rating</p>
                                            <p className="text-lg font-black text-yellow-400">★ {targetedPro.averageRating > 0 ? targetedPro.averageRating.toFixed(1) : 'New'}</p>
                                        </div>
                                    </div>

                                    {/* Specializations */}
                                    {targetedPro.specializations?.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Specializations</p>
                                            <div className="flex flex-wrap gap-2">
                                                {targetedPro.specializations.map((s: string) => (
                                                    <span key={s} className="px-3 py-1 bg-white/10 text-white rounded-lg text-[10px] font-black uppercase border border-white/10">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Process note */}
                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                            Your request will be sent directly to <span className="text-white font-black">{targetedPro.fullName.split(' ')[0]}</span> and auto-confirmed. No waiting required.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* No targetedPro: Show order items or generic summary */
                                <>
                                    <h4 className="text-xl font-black mb-8 relative z-10">{order ? 'Job Manifest' : 'Service Summary'}</h4>
                                    <div className="space-y-6 relative z-10">
                                        {order ? order.items.map((item, i) => (
                                            <div key={i} className="flex items-center space-x-4">
                                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/5 overflow-hidden">
                                                    <img src={item.image} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black line-clamp-1">{item.name}</p>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Qty: {item.qty}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-4 px-6 bg-white/5 rounded-3xl border border-white/5">
                                                <p className="text-sm font-medium text-gray-400">Requesting specialized service from the directory.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
                                        <div className="bg-blue-600/20 p-6 rounded-3xl border border-blue-500/20">
                                            <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Our Process</p>
                                            <p className="text-xs text-gray-300 font-medium leading-relaxed">
                                                Your request will be signalled to our network. Electricians within range will review and confirm.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <HelpCircle size={32} />
                            </div>
                            <h5 className="font-black text-gray-900 uppercase tracking-tight mb-2">Secure Matching</h5>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed italic">Your encryption keys protect all communications. Service parameters are only visible to matched professionals.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
