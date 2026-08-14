import React from 'react';
import { UserRole } from '../types';
import { ShoppingBag, Store, Bike, LayoutDashboard, Sparkles, Bell } from 'lucide-react';

interface MobileBottomNavProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  cartCount: number;
  onOpenCart: () => void;
  unreadNotificationsCount?: number;
  onToggleNotificationCenter?: () => void;
  onOpenAiAssistant: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRole,
  onRoleChange,
  cartCount,
  onOpenCart,
  unreadNotificationsCount = 0,
  onToggleNotificationCenter,
  onOpenAiAssistant,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 shadow-2xl safe-bottom font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="grid grid-cols-6 items-center text-center gap-1">
        
        {/* Client Role Tab */}
        <button
          onClick={() => onRoleChange('client')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 cursor-pointer relative ${
            currentRole === 'client'
              ? 'text-[#FF8C00] font-black'
              : 'text-gray-400 hover:text-gray-600 font-semibold'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Client</span>
          {currentRole === 'client' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C00] mt-0.5"></span>
          )}
        </button>

        {/* Merchant Role Tab */}
        <button
          onClick={() => onRoleChange('merchant')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 cursor-pointer relative ${
            currentRole === 'merchant'
              ? 'text-[#009E49] font-black'
              : 'text-gray-400 hover:text-gray-600 font-semibold'
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Vendeur</span>
          {currentRole === 'merchant' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#009E49] mt-0.5"></span>
          )}
        </button>

        {/* Livreur Role Tab */}
        <button
          onClick={() => onRoleChange('livreur')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 cursor-pointer relative ${
            currentRole === 'livreur'
              ? 'text-sky-600 font-black'
              : 'text-gray-400 hover:text-gray-600 font-semibold'
          }`}
        >
          <Bike className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Livreur</span>
          {currentRole === 'livreur' && (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-0.5"></span>
          )}
        </button>

        {/* Dispatch Admin Tab */}
        <button
          onClick={() => onRoleChange('admin')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 cursor-pointer relative ${
            currentRole === 'admin'
              ? 'text-purple-600 font-black'
              : 'text-gray-400 hover:text-gray-600 font-semibold'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Dispatch</span>
          {currentRole === 'admin' && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5"></span>
          )}
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onOpenAiAssistant}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-amber-500 hover:text-amber-600 font-bold transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-amber-500 animate-pulse" />
          <span className="text-[10px] leading-tight">Assistant</span>
        </button>

        {/* Cart / Notifications Button */}
        <button
          onClick={currentRole === 'client' ? onOpenCart : onToggleNotificationCenter}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-gray-500 hover:text-gray-800 font-bold transition-all active:scale-95 cursor-pointer relative"
        >
          {currentRole === 'client' ? (
            <>
              <div className="relative">
                <ShoppingBag className="w-5 h-5 mb-0.5 text-[#FF8C00]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF8C00] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight text-[#FF8C00]">Panier</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Bell className="w-5 h-5 mb-0.5 text-amber-600" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight text-amber-600">Alertes</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
