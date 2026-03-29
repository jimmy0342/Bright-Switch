import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    CreditCard,
    DollarSign,
    ChevronRight,
    Search,
    Download,
    Filter,
    Clock,
    Zap
} from 'lucide-react';
import { db } from '../../../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { ServiceJob } from '../../../types';

export const EarningsPage: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlyEarnings: 0,
        pendingPayouts: 0,
        completedJobs: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'serviceJobs'),
            where('electricianId', '==', user.uid),
            where('status', '==', 'completed'),
            orderBy('completedAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const completedJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceJob));

            const total = completedJobs.reduce((sum, job) => sum + (job.payment?.electricianEarns || 0), 0);

            // Calculate monthly
            const now = new Date();
            const thisMonthJobs = completedJobs.filter(job => {
                const date = job.completedAt?.toDate() || new Date(job.completedAt);
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            });
            const monthly = thisMonthJobs.reduce((sum, job) => sum + (job.payment?.electricianEarns || 0), 0);

            setStats({
                totalBalance: total,
                monthlyEarnings: monthly,
                pendingPayouts: 0, // Future: link to withdrawal requests
                completedJobs: completedJobs.length
            });

            setTransactions(completedJobs.map(job => ({
                id: job.id,
                type: 'credit',
                label: job.serviceType,
                customerName: job.customerName || "Valued Client",
                amount: job.payment?.electricianEarns || 0,
                date: job.completedAt?.toDate() ? job.completedAt.toDate().toLocaleDateString() : new Date(job.completedAt).toLocaleDateString(),
                status: 'completed'
            })));

            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Earnings & Payments</h2>
                    <p className="text-gray-500 font-bold mt-1">Manage your wallet and withdrawal requests</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                        <DollarSign className="mr-2" size={18} /> Withdraw Funds
                    </button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-50">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Synchronizing Financial Records...</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Available Balance</p>
                                <h3 className="text-4xl font-black mb-1 tracking-tight">PKR {stats.totalBalance.toLocaleString()}</h3>
                                <p className="text-gray-400 text-xs font-medium">Ready for withdrawal</p>
                            </div>
                            <Wallet className="absolute right-[-10%] bottom-[-10%] w-32 h-32 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">+0% vs last month</span>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Earnings</p>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">PKR {stats.monthlyEarnings.toLocaleString()}</h3>
                            <p className="text-gray-400 text-xs font-medium mt-1">From {stats.completedJobs} completed jobs</p>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                                    <Clock size={20} />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Clearance</p>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">PKR {stats.pendingPayouts.toLocaleString()}</h3>
                            <p className="text-gray-400 text-xs font-medium mt-1">Available soon</p>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Transaction History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Recent Activities</h3>
                        <div className="flex space-x-2">
                            <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all">
                                <Filter size={18} />
                            </button>
                            <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden">
                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="p-20 text-center">
                                    <Clock size={48} className="mx-auto mb-4 text-gray-300 animate-spin" />
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="p-20 text-center grayscale opacity-50">
                                    <p className="text-xs font-black uppercase tracking-[0.2em]">No Transactional History</p>
                                </div>
                            ) : transactions.map(txn => (
                                <div key={txn.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all">
                                    <div className="flex items-center space-x-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${txn.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {txn.type === 'credit' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 text-sm uppercase">{txn.label}</h4>
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{txn.customerName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{txn.id.slice(-6).toUpperCase()} • {txn.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-lg ${txn.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                            {txn.type === 'credit' ? '+' : '-'} PKR {txn.amount.toLocaleString()}
                                        </p>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${txn.status === 'completed' ? 'text-green-500' : 'text-gray-400 animate-pulse'
                                            }`}>{txn.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment Methods & Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight flex items-center uppercase">
                            <CreditCard className="mr-3 text-blue-600" size={20} /> Withdrawal Account
                        </h3>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100/50 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Bank</span>
                                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded">Verified</span>
                            </div>
                            <h5 className="font-black text-gray-900 text-sm uppercase mb-1">United Bank Limited (UBL)</h5>
                            <p className="text-xs text-gray-500 font-bold tracking-widest">**** **** **** 8892</p>
                            <button className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Change Account</button>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <div className="flex justify-between text-xs font-bold text-gray-500">
                                <span>Monthly Limit</span>
                                <span className="text-gray-900 italic">500,000 / 1,000,000 PKR</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: '50%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-lg font-black mb-2 tracking-tight">Need Earlier Payment?</h4>
                            <p className="text-blue-100 text-xs font-medium mb-6 leading-relaxed">
                                Switch to <span className="text-white font-black">Express Payout</span> and receive funds within 2 hours of job completion.
                            </p>
                            <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">
                                Enable Express
                            </button>
                        </div>
                        <Zap className="absolute bottom-[-20%] right-[-10%] w-1/2 h-1/2 text-white/10 -rotate-12" />
                    </div>
                </div>
            </div>
        </div>
    );
};
