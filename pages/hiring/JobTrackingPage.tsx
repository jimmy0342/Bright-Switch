import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    doc, onSnapshot, collection, query,
    orderBy, addDoc, updateDoc, serverTimestamp, increment
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ServiceJob, SystemSettings } from '../../types';
import {
    Truck, Clock, MapPin, Send,
    CheckCircle2, AlertCircle, Calendar,
    MessageSquare, User, Wrench, ShieldCheck,
    Zap, ArrowRight, Loader2, ArrowLeft, Phone, X, CreditCard, Upload, ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uploadToImgbb } from '../../services/imgbbService';

export const JobTrackingPage: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [job, setJob] = useState<ServiceJob | null>(null);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isReceiptValid, setIsReceiptValid] = useState<boolean | null>(null);
    const receiptInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubSettings = onSnapshot(doc(db, 'settings', 'contact'), (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as SystemSettings);
            }
        });
        if (!jobId) return;

        const unsubJob = onSnapshot(doc(db, 'serviceJobs', jobId), (docSnap) => {
            if (docSnap.exists()) {
                setJob({ id: docSnap.id, ...docSnap.data() } as ServiceJob);
            }
            setLoading(false);
        });

        return () => {
            unsubJob();
            unsubSettings();
        };
    }, [jobId]);

    const handleUpdateStatus = async (newStatus: ServiceJob['status'], receiptUrl?: string) => {
        if (!jobId) return;

        if (newStatus === 'completed' && !showCommissionModal) {
            setShowCommissionModal(true);
            return;
        }
        try {
            const updateData: any = {
                status: newStatus,
                updatedAt: serverTimestamp(),
                [`${newStatus}At`]: serverTimestamp(),
                statusHistory: [...(job?.statusHistory || []), { status: newStatus, timestamp: Date.now() }]
            };
            if (receiptUrl) {
                updateData.commissionReceiptUrl = receiptUrl;
            }
            await updateDoc(doc(db, 'serviceJobs', jobId), updateData);

            if (newStatus === 'completed' && job?.electricianId) {
                const earningsToAdd = job.payment?.electricianEarns || job.totalAmount || 0;
                if (earningsToAdd > 0) {
                    await updateDoc(doc(db, 'electricians', job.electricianId), {
                        'earnings.totalEarned': increment(earningsToAdd),
                        'earnings.availableBalance': increment(earningsToAdd)
                    });
                }
            }

            if (newStatus === 'completed') {
                setShowCommissionModal(false);
                setReceiptFile(null);
                setReceiptPreview(null);
                setIsReceiptValid(null);
            }
            toast.success(`Job marked as ${newStatus}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const validateReceipt = async (file: File) => {
        setIsValidating(true);
        setIsReceiptValid(null);
        const loadingToast = toast.loading("Validating screenshot...");
        try {
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const normalizedText = text.toLowerCase();
            const hasEasyPaisa = normalizedText.includes('easypaisa') || normalizedText.includes('easy paisa');
            const hasSuccess = normalizedText.includes('transaction successful') || normalizedText.includes('successful') || normalizedText.includes('sent');
            
            const isValid = hasEasyPaisa && hasSuccess;
            
            setIsReceiptValid(isValid);
            
            if (isValid) {
                toast.success("Valid EasyPaisa receipt detected!", { id: loadingToast });
            } else {
                toast.error("Invalid screenshot. Please upload a valid EasyPaisa transaction success screen.", { id: loadingToast, duration: 5000 });
                setReceiptFile(null);
                setReceiptPreview(null);
            }
        } catch (err) {
            console.error("OCR Error:", err);
            toast.error("Failed to validate screenshot. Please try again.", { id: loadingToast });
            setIsReceiptValid(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview immediately
        setReceiptFile(file);
        const reader = new FileReader();
        reader.onload = () => setReceiptPreview(reader.result as string);
        reader.readAsDataURL(file);

        // Validate
        await validateReceipt(file);
    };

    const handleConfirmAndComplete = async () => {
        if (!receiptFile || !isReceiptValid) {
            toast.error('Please upload a valid Easypaisa payment screenshot.');
            return;
        }
        setUploading(true);
        try {
            const imgbbResult = await uploadToImgbb(receiptFile);
            await handleUpdateStatus('completed', imgbbResult.imageUrl);
        } catch (err) {
            toast.error('Failed to upload receipt. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
    if (!job) return <div className="min-h-screen flex items-center justify-center">Job Archive Unavailable</div>;

    const isElectrician = user?.role === 'electrician';

    return (
        <div className="bg-gray-50 min-h-screen pb-20 text-left">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex flex-col space-y-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Back to Management</span>
                        </button>
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${job.status === 'completed' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white animate-pulse'
                                    }`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Job Node: #{job.jobId}</p>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Deployment Operations Center</h1>
                            {job.customerPhone && (
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <div className="flex items-center space-x-3 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl w-fit">
                                        <Phone size={14} />
                                        <span className="text-xs font-black uppercase tracking-widest">Customer Contact: {job.customerPhone}</span>
                                    </div>
                                    {job.location?.address && (
                                        <div className="flex items-center space-x-3 text-gray-600 bg-gray-50 px-4 py-2 rounded-xl w-fit border border-gray-100 italic">
                                            <MapPin size={14} />
                                            <span className="text-xs font-black uppercase tracking-widest leading-tight">Deployment Location: {job.location.address}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        {isElectrician && job.status === 'confirmed' && (
                            <button
                                onClick={() => handleUpdateStatus('in_progress')}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center space-x-3"
                            >
                                <Zap size={18} />
                                <span>Initialize On-Site</span>
                            </button>
                        )}
                        {isElectrician && job.status === 'in_progress' && (
                            <button
                                onClick={() => handleUpdateStatus('completed')}
                                className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center space-x-3"
                            >
                                <CheckCircle2 size={18} />
                                <span>Mark Operations Complete</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="max-w-5xl mx-auto">
                    {/* Timeline & Details */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100">
                            <div className="flex items-center space-x-4 mb-10">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Truck size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Deployment Lifecycle</h3>
                            </div>

                            <div className="relative space-y-12 pl-10">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-50 border-l-2 border-dashed border-gray-100"></div>

                                {/* Step 1: Confirmed */}
                                <div className="relative">
                                    <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-black shadow-lg">✓</div>
                                    <div className="text-left">
                                        <p className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">Contract Finalized</p>
                                        <p className="text-sm text-gray-400 font-bold mb-4">{new Date(job.createdAt?.seconds * 1000).toLocaleString()}</p>
                                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                            <p className="text-xs font-medium text-gray-600 italic">"The professional engagement has been locked. Both terminal nodes are synchronized."</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Scheduled */}
                                <div className="relative">
                                    <div className={`absolute -left-10 top-0 w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg ${job.status !== 'confirmed' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                        }`}>
                                        <Calendar size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">On-Site Scheduling</p>
                                        <p className="text-sm text-gray-400 font-bold mb-4">{job.scheduledDate} at {job.scheduledTime}</p>
                                    </div>
                                </div>

                                {/* Step 3: In Progress */}
                                <div className="relative">
                                    <div className={`absolute -left-10 top-0 w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg ${job.status === 'completed' ? 'bg-green-600 text-white' :
                                        (job.status === 'in_progress' ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-100 text-gray-300')
                                        }`}>
                                        <Wrench size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-black uppercase text-xs tracking-widest mb-1 ${job.status === 'in_progress' || job.status === 'completed' ? 'text-gray-900' : 'text-gray-300'
                                            }`}>Operation Execution</p>
                                        {job.actualStartTime && (
                                            <p className="text-sm text-gray-400 font-bold">{new Date(job.actualStartTime.seconds * 1000).toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Step 4: Completion */}
                                <div className="relative">
                                    <div className={`absolute -left-10 top-0 w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg ${job.status === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-300'
                                        }`}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-black uppercase text-xs tracking-widest mb-1 ${job.status === 'completed' ? 'text-gray-900' : 'text-gray-300'
                                            }`}>Mission Zero (Complete)</p>
                                        {job.completedAt && (
                                            <p className="text-sm text-gray-400 font-bold">{new Date(job.completedAt.seconds * 1000).toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Dispatch Objective</h4>
                                <p className="text-gray-900 font-bold leading-relaxed mb-4 italic">"{job.description}"</p>
                                <div className="space-y-3">
                                    {job.products.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs font-black uppercase tracking-tight bg-gray-50 px-4 py-2 rounded-xl">
                                            <span className="text-gray-500">{p.name}</span>
                                            <span className="text-blue-600">x{p.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left relative overflow-hidden">
                                <Zap size={80} className="absolute -bottom-6 -right-6 text-blue-50/50" />
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Settlement Summary</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Service Fee</span>
                                        <span className="text-lg font-black text-gray-900">Rs. {job.serviceFee.toLocaleString()}</span>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-center space-x-2">
                                        <ShieldCheck className="text-blue-600" size={16} />
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest underline decoration-2 underline-offset-4">Secured Deployment</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Commission Reminder Modal */}
            {showCommissionModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 sm:p-6 sm:pt-28 md:p-8 md:pt-32">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCommissionModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl p-8 mb-8 animate-in slide-in-from-top-4 zoom-in-95 duration-200 max-h-[calc(100vh-8rem)] overflow-y-auto">
                        <button onClick={() => setShowCommissionModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-all">
                            <X size={20} />
                        </button>

                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 border-2 border-blue-100 shadow-inner">
                            <CreditCard size={28} />
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Job Completion &amp; Settlement</h2>
                        <p className="text-gray-500 font-bold text-sm mb-6">Mission Zero ready. Please review the commission settlement details below.</p>

                        <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-4 mb-8">
                            <div className="flex justify-between items-center pb-4 border-b border-blue-100/50">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Job Value</span>
                                <span className="text-lg font-black text-gray-900">PKR {(job.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Platform Fee (10%)</span>
                                <span className="text-2xl font-black text-blue-600">PKR {((job.totalAmount || 0) * 0.10).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 flex items-start space-x-4">
                            <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest mb-1">Action Required</h4>
                                <p className="text-sm text-gray-600 font-medium">Please remit the platform fee via Easypaisa to the following number to clear the balance for this job.</p>
                                <div className="mt-3 inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Easypaisa:</span>
                                    <span className="font-black font-mono text-gray-900 tracking-wider select-all">
                                        {(settings?.easypaisaNumber && settings.easypaisaNumber !== 'Not Configured') ? settings.easypaisaNumber : '0300 1234567'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Receipt Upload Section */}
                        <div className="mb-8">
                            <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ImageIcon size={14} className="text-blue-600" />
                                Upload Payment Receipt <span className="text-red-500">*</span>
                            </h4>
                            <p className="text-xs text-gray-500 font-medium mb-4">A screenshot of your Easypaisa confirmation is required to complete this job.</p>

                            <input
                                ref={receiptInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleReceiptFileChange}
                                className="hidden"
                            />

                            {isValidating ? (
                                <div className="w-full border-2 border-dashed border-blue-200 rounded-2xl p-8 flex flex-col items-center gap-3 bg-blue-50/10">
                                    <Loader2 size={24} className="animate-spin text-blue-600" />
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Validating Screenshot...</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Please wait while we check the receipt authenticity</p>
                                </div>
                            ) : receiptPreview ? (
                                <div className="relative group">
                                    <img
                                        src={receiptPreview}
                                        alt="Receipt Preview"
                                        className={`w-full h-48 object-cover rounded-2xl border-2 shadow-sm transition-colors ${isReceiptValid === true ? 'border-green-200' : isReceiptValid === false ? 'border-red-200' : 'border-blue-200'}`}
                                    />
                                    <button
                                        onClick={() => { setReceiptFile(null); setReceiptPreview(null); setIsReceiptValid(null); }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    >
                                        <X size={12} />
                                    </button>
                                    <div className="mt-2 flex items-center gap-2">
                                        {isReceiptValid === true ? (
                                            <>
                                                <CheckCircle2 size={14} className="text-green-600" />
                                                <span className="text-xs font-black uppercase tracking-widest text-green-600">Valid EasyPaisa Receipt</span>
                                            </>
                                        ) : isReceiptValid === false ? (
                                            <>
                                                <AlertCircle size={14} className="text-red-600" />
                                                <span className="text-xs font-black uppercase tracking-widest text-red-600">Invalid Screenshot - Please upload a valid one</span>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon size={14} className="text-blue-600" />
                                                <span className="text-xs font-black uppercase tracking-widest text-blue-600">Receipt Ready</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => receiptInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-2xl p-8 flex flex-col items-center gap-3 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-gray-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-colors">
                                        <Upload size={20} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Click to Upload Screenshot</p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">JPG, PNG or WEBP accepted</p>
                                    </div>
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowCommissionModal(false)}
                                className="flex-1 py-4 px-6 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-all text-center"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAndComplete}
                                disabled={!receiptFile || !isReceiptValid || uploading || isValidating}
                                className="flex-1 py-4 px-6 rounded-2xl font-black uppercase text-xs tracking-widest text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : 
                                 isValidating ? 'Validating...' : 'Confirm & Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
