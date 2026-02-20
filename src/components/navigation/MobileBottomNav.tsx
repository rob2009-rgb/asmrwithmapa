import React from 'react';
import { Compass, Book, Trophy, Users, Moon } from 'lucide-react';

interface MobileBottomNavProps {
    isNightMode: boolean;
    isPremium: boolean;
    onOpenDiscovery: () => void;
    onOpenGuide: () => void;
    onOpenChallenges: () => void;
    onOpenCommunity: () => void;
    onOpenZen: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    isNightMode,
    isPremium,
    onOpenDiscovery,
    onOpenGuide,
    onOpenChallenges,
    onOpenCommunity,
    onOpenZen
}) => {
    return (
        <div className={`fixed bottom-0 w-full lg:hidden z-50 border-t pb-safe transition-colors duration-500
            ${isNightMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-pink-200'} 
            backdrop-blur-lg shadow-[0_-10px_40px_rgba(0,0,0,0.05)]`}
        >
            <div className="flex justify-around items-center px-2 py-3">
                <NavButton
                    icon={<Compass size={22} />}
                    label="Explore"
                    onClick={onOpenDiscovery}
                    isNightMode={isNightMode}
                />
                <NavButton
                    icon={<Book size={22} />}
                    label="Guide"
                    onClick={onOpenGuide}
                    isNightMode={isNightMode}
                />
                <div className="relative -top-5">
                    <button
                        onClick={onOpenZen}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 border-4
                            ${isNightMode
                                ? 'bg-pink-600 border-slate-900 text-white shadow-pink-900/50'
                                : 'bg-pink-500 border-white text-white shadow-pink-500/30'}`}
                    >
                        <Moon size={24} />
                        {!isPremium && (
                            <span className="absolute -bottom-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-600 shadow-sm">
                                PRO
                            </span>
                        )}
                    </button>
                </div>
                <NavButton
                    icon={<Trophy size={22} />}
                    label="Challenges"
                    onClick={onOpenChallenges}
                    isNightMode={isNightMode}
                />
                <NavButton
                    icon={<Users size={22} />}
                    label="Community"
                    onClick={onOpenCommunity}
                    isNightMode={isNightMode}
                />
            </div>
        </div>
    );
};

function NavButton({ icon, label, onClick, isNightMode }: { icon: React.ReactNode, label: string, onClick: () => void, isNightMode: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-16 gap-1 transition-all active:scale-90
                ${isNightMode ? 'text-slate-400 hover:text-pink-400' : 'text-slate-500 hover:text-pink-500'}`}
        >
            {icon}
            <span className="text-[9px] font-bold tracking-wider">{label}</span>
        </button>
    );
}
