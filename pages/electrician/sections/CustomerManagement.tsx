import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Mail,
    Phone,
    MapPin,
    MoreVertical,
    Star,
    ChevronRight,
    Users,
    Clock
} from 'lucide-react';
import { db } from '../../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { ServiceJob } from '../../../types';

export const CustomerManagement: React.FC = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'serviceJobs'),
            where('electricianId', '==', user.uid)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const jobs = snapshot.docs.map(doc => doc.data() as ServiceJob);

            // Group by customer
            const customerMap = new Map();
            jobs.forEach(job => {
                const customerId = job.customerId;
                if (!customerMap.has(customerId)) {
                    customerMap.set(customerId, {
                        id: customerId,
                        name: job.customerName || "Valued Client",
                        type: "Residential",
                        phone: job.customerPhone || "N/A",
                        location: job.location?.address || "N/A",
                        totalJobs: 0,
                        totalSpend: 0,
                        lastJob: job.scheduledDate,
                        rating: 0
                    });
                }
                const c = customerMap.get(customerId);
                c.totalJobs += 1;
                c.totalSpend += job.totalAmount || 0;
                if (new Date(job.scheduledDate) > new Date(c.lastJob || 0)) {
                    c.lastJob = job.scheduledDate;
                    c.name = job.customerName || c.name;
                    c.phone = job.customerPhone || c.phone;
                    c.location = job.location?.address || c.location;
                }
            });

            setCustomers(Array.from(customerMap.values()));
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Customer Management</h2>
                    <p className="text-gray-500 font-bold mt-1">Manage your client list and interaction history</p>
                </div>
                <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                    <Users className="mr-2" size={18} /> Import Contacts
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search customers by name, phone, or company..."
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <select className="px-6 py-4 rounded-2xl bg-gray-50 border-none font-black text-xs uppercase tracking-widest focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer">
                        <option>All Types</option>
                        <option>Residential</option>
                        <option>Commercial</option>
                        <option>Industrial</option>
                    </select>
                    <select className="px-6 py-4 rounded-2xl bg-gray-50 border-none font-black text-xs uppercase tracking-widest focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer">
                        <option>Latest First</option>
                        <option>Highest Spend</option>
                        <option>Most Jobs</option>
                    </select>
                </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Synchronizing Electrician Records...</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="col-span-3 p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <Users size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">No Linked Electrician Nodes</p>
                    </div>
                ) : customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(customer => (
                    <div key={customer.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 relative group hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all text-left">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 tracking-tight text-lg group-hover:text-blue-600 transition-colors uppercase leading-tight">
                                        {customer.name}
                                    </h3>
                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 inline-block text-blue-600`}>
                                        {customer.type} Electrician
                                    </span>
                                </div>
                            </div>
                            <button className="text-gray-300 hover:text-gray-900 transition-colors"><MoreVertical size={20} /></button>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            <div className="flex items-center text-sm font-medium text-gray-500">
                                <Phone size={14} className="mr-3 text-gray-300" /> {customer.phone}
                            </div>
                            <div className="flex items-center text-sm font-medium text-gray-500">
                                <MapPin size={14} className="mr-3 text-gray-300" /> {customer.location}
                            </div>
                            <div className="flex items-center text-sm font-medium text-gray-500">
                                <Clock size={14} className="mr-3 text-gray-300" />
                                <span className="flex-1 truncate">
                                    Last Job: <span className="text-gray-900 font-bold italic">{customer.lastJob}</span>
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Jobs</p>
                                <p className="text-lg font-black text-gray-900 mt-1">{customer.totalJobs}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Value</p>
                                <p className="text-lg font-black text-gray-900 mt-1">PKR {customer.totalSpend.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button className="w-full flex items-center justify-center p-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200">
                                View Interaction History
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
