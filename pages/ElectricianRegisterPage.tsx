
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    UserPlus,
    ShieldCheck,
    Briefcase,
    FileText,
    ChevronRight,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    Zap,
    X
} from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const ElectricianRegisterPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        // Personal Info
        fullName: '',
        cnic: '',
        phone: '',
        email: '',
        password: '',

        // Credentials
        pecNumber: '',
        licenseNumber: '',
        licenseExpiry: '',
        specializations: [] as string[],

        // Business Info
        companyName: '',
        businessAddress: '',
        yearsExperience: '',
        teamSize: '',
        perDayCharge: '',
        serviceAreas: [] as string[],
    });

    const [documents, setDocuments] = useState({
        cnicFront: '',
        cnicBack: '',
        licenseImage: '',
        pecCertificate: '',
    });

    const specializationsList = [
        'Residential Wiring',
        'Commercial Installations',
        'Industrial Automation',
        'Solar Panel Installation',
        'Smart Home Systems',
        'EV Charging Stations',
        'HVAC Control',
        'Maintenance & Repair'
    ];

    const handleCheckboxChange = (list: 'specializations' | 'serviceAreas', value: string) => {
        setFormData(prev => ({
            ...prev,
            [list]: prev[list].includes(value)
                ? prev[list].filter(i => i !== value)
                : [...prev[list], value]
        }));
    };

    const validateStep = () => {
        if (step === 1) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!formData.fullName.trim()) {
                toast.error('Full Name is required');
                return false;
            }
            if (formData.cnic.length !== 13) {
                toast.error('CNIC must be exactly 13 digits');
                return false;
            }
            if (formData.phone.length !== 11) {
                toast.error('Phone number must be exactly 11 digits');
                return false;
            }
            if (!emailRegex.test(formData.email)) {
                toast.error('Please enter a valid email address');
                return false;
            }
            if (formData.password.length < 6) {
                toast.error('Password must be at least 6 characters');
                return false;
            }
        }
        if (step === 2) {
            if (!formData.pecNumber.trim()) {
                toast.error('PEC Certification No. is required');
                return false;
            }
            if (!formData.licenseNumber.trim()) {
                toast.error('License Number is required');
                return false;
            }
            if (!formData.licenseExpiry) {
                toast.error('License Expiry Date is required');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(prev => prev + 1);
        }
    };
    const handlePrev = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        // Basic validation for documents
        if (!documents.cnicFront || !documents.licenseImage) {
            toast.error('Please upload all required identification documents');
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'electricianApplications'), {
                userId: auth.currentUser?.uid || null,
                personalInfo: {
                    fullName: formData.fullName,
                    cnic: formData.cnic,
                    phone: formData.phone,
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                },
                credentials: {
                    pecNumber: formData.pecNumber,
                    licenseNumber: formData.licenseNumber,
                    licenseExpiry: formData.licenseExpiry,
                    specialization: formData.specializations,
                },
                documents: documents,
                businessInfo: {
                    companyName: formData.companyName,
                    businessAddress: formData.businessAddress,
                    yearsExperience: parseInt(formData.yearsExperience),
                    teamSize: parseInt(formData.teamSize),
                    perDayCharge: parseInt(formData.perDayCharge) || 0,
                    serviceAreas: formData.serviceAreas,
                },
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            toast.success('Application submitted successfully!');
            setStep(5); // Success Step
        } catch (error: any) {
            console.error('Application error:', error);
            toast.error('Failed to submit application: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepIcon = (s: number, icon: any) => (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-400'
            }`}>
            {React.createElement(icon, { size: 20 })}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 text-left">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="bg-blue-600 w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-100">
                        <Zap className="h-8 w-8 text-white fill-current" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Join as Electrician</h1>
                    <p className="text-gray-500 mt-3 font-medium text-lg">Join BrightSwitch's network of professional electricians</p>
                </div>

                {/* Multi-step indicator */}
                <div className="flex items-center justify-center space-x-4 mb-12">
                    {renderStepIcon(1, UserPlus)}
                    <div className={`h-1 w-8 rounded-full ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    {renderStepIcon(2, ShieldCheck)}
                    <div className={`h-1 w-8 rounded-full ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    {renderStepIcon(3, Briefcase)}
                    <div className={`h-1 w-8 rounded-full ${step > 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    {renderStepIcon(4, FileText)}
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-8 md:p-12">

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm mr-3">1</span>
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name (As per CNIC/ID)</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="Muhammad Ali"
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CNIC Number</label>
                                    <input
                                        type="text"
                                        value={formData.cnic}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 13) {
                                                setFormData({ ...formData, cnic: val });
                                            }
                                        }}
                                        maxLength={13}
                                        placeholder="13 digits (no dashes)"
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                        {formData.cnic.length}/13 Digits
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 11) {
                                                setFormData({ ...formData, phone: val });
                                            }
                                        }}
                                        maxLength={11}
                                        placeholder="11 digits (e.g. 03001234567)"
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                        {formData.phone.length}/11 Digits
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="ali@example.com"
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min. 6 characters"
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter italic">This password will be used for your dashboard access after approval.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm mr-3">2</span>
                                Professional Credentials
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">PEC Certification No.</label>
                                    <input
                                        type="text"
                                        value={formData.pecNumber}
                                        onChange={(e) => setFormData({ ...formData, pecNumber: e.target.value })}
                                        placeholder="ELEC-12345"
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">License Number</label>
                                    <input
                                        type="text"
                                        value={formData.licenseNumber}
                                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                        placeholder="L-2024-001"
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">License Expiry Date</label>
                                    <input
                                        type="date"
                                        value={formData.licenseExpiry}
                                        onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-4">Areas of Specialization</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {specializationsList.map(spec => (
                                        <label key={spec} className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.specializations.includes(spec) ? 'border-blue-600 bg-blue-50/50' : 'border-gray-50 bg-gray-50 hover:border-gray-100'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.specializations.includes(spec)}
                                                onChange={() => handleCheckboxChange('specializations', spec)}
                                            />
                                            <span className={`text-sm font-bold ${formData.specializations.includes(spec) ? 'text-blue-700' : 'text-gray-600'}`}>{spec}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm mr-3">3</span>
                                Business Information
                            </h2>
                            <div className="grid grid-cols-1 gap-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Company/Business Name</label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            placeholder="Ali Electrical Services"
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Years of Experience</label>
                                        <input
                                            type="number"
                                            value={formData.yearsExperience}
                                            onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                                            placeholder="8"
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Daily Service Rate (Rs.)</label>
                                        <input
                                            type="number"
                                            value={formData.perDayCharge}
                                            onChange={(e) => setFormData({ ...formData, perDayCharge: e.target.value })}
                                            placeholder="/Day (e.g. 5000)"
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Team Size</label>
                                        <input
                                            type="number"
                                            value={formData.teamSize}
                                            onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                                            placeholder="1"
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Business Address</label>
                                    <textarea
                                        value={formData.businessAddress}
                                        onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                        placeholder="Shop 5, Main Bazar, Peshawar"
                                        rows={3}
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Service Areas (Cities)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Peshawar, Charsadda, Nowshera (Press Enter)"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if (val && !formData.serviceAreas.includes(val)) {
                                                    setFormData({ ...formData, serviceAreas: [...formData.serviceAreas, val] });
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                                    />
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {formData.serviceAreas.map(area => (
                                            <span key={area} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black flex items-center">
                                                {area}
                                                <button onClick={() => setFormData({ ...formData, serviceAreas: formData.serviceAreas.filter(a => a !== area) })} className="ml-2 hover:text-red-500">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm mr-3">4</span>
                                Identification Documents
                            </h2>
                            <p className="text-gray-500 mb-10 font-medium">Please upload clear photos of your credentials for verification. Max file size: 5MB.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                <ImageUploader
                                    onUploadSuccess={(res) => setDocuments({ ...documents, cnicFront: res.imageUrl })}
                                    label="CNIC Front"
                                    previewUrl={documents.cnicFront}
                                />
                                <ImageUploader
                                    onUploadSuccess={(res) => setDocuments({ ...documents, cnicBack: res.imageUrl })}
                                    label="CNIC Back"
                                    previewUrl={documents.cnicBack}
                                />
                                <ImageUploader
                                    onUploadSuccess={(res) => setDocuments({ ...documents, licenseImage: res.imageUrl })}
                                    label="Trade License"
                                    previewUrl={documents.licenseImage}
                                />
                                <ImageUploader
                                    onUploadSuccess={(res) => setDocuments({ ...documents, pecCertificate: res.imageUrl })}
                                    label="PEC Certificate (Optional)"
                                    previewUrl={documents.pecCertificate}
                                />
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="text-center py-12 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-100">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Application Submitted!</h2>
                            <p className="text-gray-600 font-medium text-lg max-w-md mx-auto leading-relaxed">
                                Thank you for applying. Our team will review your documents and credentials within 2-3 business days.
                            </p>
                            <div className="mt-12 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
                                <Link to="/" className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                                    Return to Home
                                </Link>
                                <Link to="/my-account" className="w-full md:w-auto px-10 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black hover:bg-gray-50 transition-all">
                                    View Account Status
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step < 5 && (
                        <div className="mt-16 flex items-center justify-between border-t border-gray-50 pt-10">
                            <button
                                onClick={handlePrev}
                                disabled={step === 1}
                                className={`flex items-center font-black uppercase tracking-widest text-xs transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-gray-900'
                                    }`}
                            >
                                <ChevronLeft className="mr-2" size={16} /> Previous
                            </button>

                            {step < 4 ? (
                                <button
                                    onClick={handleNext}
                                    className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-sm flex items-center hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 group"
                                >
                                    Next Step <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-sm flex items-center hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 disabled:opacity-70"
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
                                    Submit Application
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Support Note */}
                <p className="text-center text-sm text-gray-400 mt-10 font-bold">
                    Need help with your application? Contact our trade support at <span className="text-blue-600">03009591658</span>
                </p>
            </div>
        </div>
    );
};
