
import React, { useState } from 'react';
import {
    Search,
    BookOpen,
    PlayCircle,
    FileText,
    Download,
    ChevronRight,
    Zap,
    Info,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';

export const TechnicalResources: React.FC = () => {
    const [activeTab, setActiveTab] = useState('guides');

    const resources = {
        guides: [
            { id: 1, title: "DB Box Wiring Standard (IEC)", type: "PDF", size: "2.4 MB", date: "Jan 2024" },
            { id: 2, title: "Solar Inverter Configuration Guide", type: "PDF", size: "4.1 MB", date: "Dec 2023" },
            { id: 3, title: "RCCB Selection Matrix", type: "PDF", size: "1.1 MB", date: "Feb 2024" },
            { id: 4, title: "Standard Load Calculation Sheet", type: "XLSX", size: "0.5 MB", date: "Nov 2023" }
        ],
        videoTraining: [
            { id: 1, title: "Smart Meter Integration Tutorial", duration: "12:45", level: "Advanced" },
            { id: 2, title: "Troubleshooting DC Surge Protectors", duration: "08:20", level: "Intermediate" },
            { id: 3, title: "New SOGO Inverter WiFi Setup", duration: "05:30", level: "Beginner" }
        ],
        standards: [
            { id: 1, title: "NEPRA Electrical Safety Code 2024", type: "Official Document" },
            { id: 2, title: "Wiring Regulations for High-Rise Buildings", type: "Standard" }
        ]
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Technical Resources</h2>
                    <p className="text-gray-500 font-bold mt-1">Installation guides, spec sheets, and training videos</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        className="pl-12 pr-6 py-3 rounded-xl bg-white border border-gray-100 focus:ring-4 focus:ring-blue-100 font-bold transition-all outline-none text-sm"
                    />
                </div>
            </div>

            {/* Featured Resource */}
            <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                <div className="md:w-1/2 relative z-10">
                    <span className="inline-block px-4 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500 shadow-xl shadow-blue-900/40">
                        Featured Training
                    </span>
                    <h3 className="text-3xl font-black mb-6 tracking-tight leading-tight">Mastering Industrial Switchgear Installation</h3>
                    <p className="text-gray-400 font-medium text-lg leading-relaxed mb-8">
                        Complete certification course covering load balancing, fault detection, and secondary protection systems.
                    </p>
                    <div className="flex gap-4">
                        <button className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                            Watch Module 1
                        </button>
                        <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                            Download Syllabus
                        </button>
                    </div>
                </div>
                <div className="md:w-1/2 flex justify-center relative z-10">
                    <div className="relative group cursor-pointer">
                        <img
                            src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400"
                            className="rounded-[2rem] shadow-2xl brightness-75 group-hover:brightness-100 transition-all duration-500"
                            alt="Training"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <PlayCircle size={64} className="text-white drop-shadow-2xl group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                </div>
                <Zap className="absolute right-[-10%] bottom-[-10%] w-96 h-96 text-white/5 -rotate-12" />
            </div>

            {/* Resource Tabs */}
            <div className="flex border-b border-gray-100">
                {[
                    { id: 'guides', label: 'Installation Guides', icon: FileText },
                    { id: 'training', label: 'Video Training', icon: PlayCircle },
                    { id: 'standards', label: 'Compliance Standards', icon: ShieldCheck }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-3 px-8 py-6 font-black text-xs uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Resource List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'guides' && resources.guides.map(guide => (
                    <div key={guide.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-blue-100 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                <FileText size={24} />
                            </div>
                            <button className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                <Download size={20} />
                            </button>
                        </div>
                        <h4 className="font-black text-gray-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors uppercase text-sm">
                            {guide.title}
                        </h4>
                        <div className="flex items-center space-x-3 mt-4">
                            <span className="px-3 py-1 bg-gray-50 text-[10px] font-black text-gray-400 rounded-lg uppercase tracking-widest">{guide.type}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{guide.size} • {guide.date}</span>
                        </div>
                    </div>
                ))}

                {activeTab === 'training' && resources.videoTraining.map(video => (
                    <div key={video.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-blue-100 transition-all group">
                        <div className="relative h-40 bg-gray-900 rounded-2xl overflow-hidden mb-6 flex items-center justify-center">
                            <PlayCircle className="text-white/40 group-hover:text-white transition-all z-10" size={48} />
                            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-black text-white">
                                {video.duration}
                            </div>
                        </div>
                        <h4 className="font-black text-gray-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors uppercase text-sm">
                            {video.title}
                        </h4>
                        <div className="flex items-center space-x-3 mt-4">
                            <span className="px-3 py-1 bg-blue-50 text-[10px] font-black text-blue-600 rounded-lg uppercase tracking-widest">{video.level}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                <CheckCircle2 size={10} className="mr-1 text-green-500" /> Completed
                            </span>
                        </div>
                    </div>
                ))}

                {activeTab === 'standards' && resources.standards.map(std => (
                    <div key={std.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-blue-100 transition-all group">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                            <ShieldCheck size={24} />
                        </div>
                        <h4 className="font-black text-gray-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors uppercase text-sm">
                            {std.title}
                        </h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
                            {std.type}
                        </p>
                        <button className="mt-6 w-full py-3 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center">
                            View Online <ChevronRight className="ml-2" size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Support Section */}
            <div className="bg-blue-50/50 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between border border-blue-100 border-dashed">
                <div className="flex items-center space-x-6 mb-6 md:mb-0">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                        <Info size={28} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-gray-900 tracking-tight uppercase">Technical Help Desk</h4>
                        <p className="text-gray-500 font-medium">Stuck on a specific project or product selection? Talk to our engineers.</p>
                    </div>
                </div>
                <button className="px-10 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-900/5 border border-blue-100">
                    Chat with Engineer
                </button>
            </div>
        </div>
    );
};
