import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Electrician } from '../../types';
import { Search, Star, ShieldCheck, User as UserIcon, Filter, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ElectricianDirectoryPage: React.FC = () => {
    const [electricians, setElectricians] = useState<Electrician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('');
    const navigate = useNavigate();

    // Mock specializations for filter
    const [userMap, setUserMap] = useState<Record<string, any>>({});
    const specializations = [
        "Residential Wiring",
        "Industrial Systems",
        "Solar Panel Installation",
        "Smart Home Setup",
        "Appliance Repair",
        "Generator Setup"
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const qUsers = query(collection(db, 'users'), where('role', '==', 'electrician'));
                const userSnap = await getDocs(qUsers);
                const map: Record<string, any> = {};
                userSnap.forEach(d => {
                    map[d.id] = d.data();
                });
                setUserMap(map);
            } catch (err) {
                console.error("User fetch error:", err);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'electricians'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const electricianData: Electrician[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const uData = userMap[data.userId || doc.id] || {};

                // Super-robust fallback chain inclusive of user collection data
                const name =
                    data.fullName ||
                    data.name ||
                    uData.name ||
                    uData.fullName ||
                    data.displayName ||
                    data.personalInfo?.fullName ||
                    data.personalInfo?.name ||
                    data.businessInfo?.companyName ||
                    data.companyName ||
                    data.businessName ||
                    'Approved Professional';

                electricianData.push({
                    id: doc.id,
                    electricianId: data.electricianId || doc.id,
                    ...data,
                    fullName: name,
                    specializations: Array.isArray(data.specializations) ? data.specializations :
                        (Array.isArray(data.specialization) ? data.specialization :
                            (data.specializations ? [data.specializations] : []))
                } as any);
            });
            setElectricians(electricianData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching electricians:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userMap]);

    const filteredElectricians = electricians.filter(electrician => {
        const name = (electrician.fullName || '').toLowerCase();
        const business = (electrician.businessName || '').toLowerCase();
        const search = searchTerm.toLowerCase().trim();
        const specFilter = specializationFilter.toLowerCase().trim();

        const matchesSearch = search === '' || name.includes(search) || business.includes(search);

        const matchesSpec = specFilter === '' ||
            (electrician.specializations || []).some(s => s.toLowerCase().includes(specFilter));

        return matchesSearch && matchesSpec;
    });

    const handleSelectElectrician = (electricianId: string) => {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');

        if (orderId) {
            navigate(`/service-request/${orderId}?pro=${electricianId}`);
        } else {
            navigate(`/service-request?pro=${electricianId}`);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20 text-left pt-32">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">Choose Your Pro</h1>
                    <p className="text-gray-500 font-medium max-w-2xl mx-auto">
                        Browse our directory of BrightSwitch Certified Professionals. Filter by specialization and select the expert that perfectly matches your job requirements.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or business..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-gray-900 transition-all"
                        />
                    </div>

                    <div className="w-full md:w-64 relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={specializationFilter}
                            onChange={(e) => setSpecializationFilter(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold text-gray-900 appearance-none cursor-pointer transition-all"
                        >
                            <option value="">All Specializations</option>
                            {specializations.map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm animate-pulse h-80"></div>
                        ))}
                    </div>
                ) : filteredElectricians.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-16 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserIcon size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">No Professionals Found</h3>
                        <p className="text-gray-500 font-medium mb-4">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredElectricians.map((pro) => (
                            <div key={pro.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all flex flex-col group">
                                <div className="p-8 flex-1">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
                                                {pro.avatar ? (
                                                    <img src={pro.avatar} alt={pro.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                                                        <UserIcon size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 leading-tight">{pro.fullName}</h3>
                                                {pro.businessName && (
                                                    <p className="text-xs font-bold text-gray-500 mt-1">{pro.businessName}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 mb-6">
                                        <div className="flex items-center space-x-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                                            <Star size={14} fill="currentColor" />
                                            <span className="text-xs font-black">{pro.averageRating || '4.9'}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">({pro.totalJobs || 0} Jobs)</span>
                                        <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg flex items-center space-x-1">
                                            <ShieldCheck size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                                        </div>
                                    </div>

                                    {/* Specializations Tags */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {pro.specializations?.slice(0, 3).map((spec, idx) => (
                                            <span key={idx} className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100">
                                                {spec}
                                            </span>
                                        ))}
                                        {pro.specializations && pro.specializations.length > 3 && (
                                            <span className="bg-gray-50 text-gray-400 px-2 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                +{pro.specializations.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-start space-x-2 text-sm text-gray-500 mb-6">
                                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="font-medium line-clamp-1">{pro.serviceAreas?.[0] || 'Peshawar Div.'} covering {pro.serviceAreas?.length || 1} areas</span>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Rate</p>
                                        <div className="flex items-baseline space-x-1">
                                            <span className="text-xl font-black text-gray-900">Rs. {pro.perDayCharge?.toLocaleString() || 'N/A'}</span>
                                            <span className="text-xs font-bold text-gray-500 uppercase">/ Day</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 pt-0">
                                    <button
                                        onClick={() => handleSelectElectrician(pro.id)}
                                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group-hover:scale-[1.02]"
                                    >
                                        Request Service from Pro
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
