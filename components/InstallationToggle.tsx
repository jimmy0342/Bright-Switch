import React, { useState, useEffect } from 'react';
import { Wrench, ShieldCheck, Zap, Info } from 'lucide-react';
import { CartItem } from '../types';

interface InstallationToggleProps {
    cartItems: CartItem[];
    onServiceRequested: (requested: boolean) => void;
    className?: string;
}

export const InstallationToggle: React.FC<InstallationToggleProps> = ({
    cartItems,
    onServiceRequested,
    className = ""
}) => {
    const [needsInstallation, setNeedsInstallation] = useState(false);
    const [installableItems, setInstallableItems] = useState<CartItem[]>([]);

    useEffect(() => {
        // Filter items that can be installed based on category names or existing tags
        const installable = cartItems.filter(item => {
            const cat = item.category?.toLowerCase() || '';
            return (
                cat.includes('breaker') ||
                cat.includes('panel') ||
                cat.includes('switchgear') ||
                cat.includes('protection')
            );
        });
        setInstallableItems(installable);
    }, [cartItems]);

    if (installableItems.length === 0) return null;

    return (
        <div className={`bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm transition-all hover:border-blue-100 ${className}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                    <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <Wrench size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Need Professional Installation?</h3>
                        <p className="text-sm text-gray-500 font-medium">
                            We have certified electricians available to install your
                            <span className="text-blue-600 font-bold mx-1">{installableItems.length} professional item(s)</span>.
                        </p>
                    </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={needsInstallation}
                        onChange={(e) => {
                            setNeedsInstallation(e.target.checked);
                            onServiceRequested(e.target.checked);
                        }}
                    />
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {needsInstallation && (
                <div className="mt-8 pt-8 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start space-x-4 mb-6">
                        <div className="bg-orange-50 p-2 rounded-lg text-orange-600 mt-1">
                            <Zap size={16} />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed text-left">
                            ⚡ You will select specific service details and schedule your appointment immediately after placing this order.
                        </p>
                    </div>

                    <div className="mt-4 flex items-center justify-center space-x-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        <Info size={14} />
                        <span>All electricians are BrightSwitch Certified Professionals</span>
                    </div>
                </div>
            )}
        </div>
    );
};
