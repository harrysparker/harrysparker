import React, { useState } from 'react';
import { UserRole, CityNode } from '../types';
import { 
  ShoppingBag, 
  Store, 
  Bike, 
  LayoutDashboard, 
  Sparkles, 
  MapPin, 
  Wallet, 
  Bell, 
  ChevronDown, 
  SlidersHorizontal, 
  Clock, 
  CheckCircle2,
  Award,
  X
} from 'lucide-react';
import { formatFCFA } from '../services/pricingService';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedCity: string;
  onCityChange: (cityId: string) => void;
  cities: CityNode[];
  cartCount: number;
  onOpenCart: () => void;
  walletFCFA: number;
  loyaltyPoints?: number;
  onOpenAiAssistant: () => void;
  activeOrdersCount: number;
  unreadNotificationsCount?: number;
  onToggleNotificationCenter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  selectedCity,
  onCityChange,
  cities,
  cartCount,
  onOpenCart,
  walletFCFA,
  loyaltyPoints,
  onOpenAiAssistant,
  activeOrdersCount,
  unreadNotificationsCount = 0,
  onToggleNotificationCenter
}) => {
  const [isSecondaryMenuOpen, setIsSecondaryMenuOpen] = useState(false);

  const currentCityObj = cities.find(c => c.id === selectedCity);
  const selectedCityName = selectedCity === 'all' ? 'Toutes villes' : (currentCityObj?.name || selectedCity);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 text-[#1F2937] shadow-xs">
      {/* Top Expansion Roadmap Ticker - Clean, single-line or collapsible */}
      <div className="bg-[#ECFDF5] px-3 sm:px-6 py-1 text-xs border-b border-[#D1FAE5] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[#065F46] font-semibold text-[11px] sm:text-xs truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-[#009E49] animate-pulse shrink-0"></span>
          <span className="font-extrabold text-[#065F46] shrink-0">Réseau National :</span>
          <span className="text-gray-700 font-medium truncate">
            Bouaké • Korhogo • Yamoussoukro • Daloa • San-Pédro • Man • Abidjan
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[#059669] text-[11px] font-bold shrink-0">
          <span>🇨🇮 8 Hubs Inter-connectés</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & Brand Tagline */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF8C00] rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-2xl font-black tracking-tight text-[#111827] font-['Outfit']">
                  IVOIRE<span className="text-[#FF8C00]">DELIVERY</span>
                </span>
                <span className="bg-[#FFEDD5] text-[#9A3412] text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full border border-orange-200 hidden sm:inline-block">
                  National
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden lg:block font-medium">
                Livraison nationale intelligente (Client ↔ Commerçant ↔ Livreur)
              </p>
            </div>
          </div>

          {/* Desktop Role Switcher Tabs (md+ screens) */}
          <div className="hidden md:flex bg-[#F3F4F6] p-1 rounded-2xl border border-gray-200 items-center gap-1">
            <button
              onClick={() => onRoleChange('client')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'client'
                  ? 'bg-[#FF8C00] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Client</span>
            </button>

            <button
              onClick={() => onRoleChange('merchant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'merchant'
                  ? 'bg-[#009E49] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Commerçant</span>
            </button>

            <button
              onClick={() => onRoleChange('livreur')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'livreur'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Livreur</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dispatch AI</span>
            </button>
          </div>

          {/* Right Primary Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Desktop City Selector */}
            <div className="hidden lg:flex items-center gap-1.5 bg-[#F3F4F6] rounded-full px-3 py-1.5 border border-gray-200 text-xs font-semibold text-gray-700">
              <div className="w-2 h-2 rounded-full bg-[#009E49] shrink-0"></div>
              <select
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                className="bg-transparent text-gray-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white text-gray-800">Zone Active: TOUTES (National)</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="bg-white text-gray-800">
                    Zone Active: {city.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Wallet & Loyalty Points Quick Stats */}
            <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs shadow-xs">
              <div className="text-right">
                <p className="text-[9px] text-gray-400 font-bold uppercase">Solde</p>
                <p className="text-[11px] font-black text-[#009E49]">{formatFCFA(walletFCFA)}</p>
              </div>
              {loyaltyPoints !== undefined && (
                <div className="border-l border-gray-200 pl-2 text-right">
                  <p className="text-[9px] text-amber-600 font-bold uppercase">Fidélité</p>
                  <p className="text-[11px] font-black text-[#FF8C00]">{loyaltyPoints} pts</p>
                </div>
              )}
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1 bg-[#FF8C00] hover:bg-orange-600 text-white font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              title="Poser une question à l'assistant AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline">Assistant AI</span>
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={onToggleNotificationCenter}
              className="relative bg-amber-50 hover:bg-amber-100 text-[#FF8C00] border border-amber-200 p-1.5 sm:p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
              title="Notifications & Alertes"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Cart Button (Client role) */}
            {currentRole === 'client' && (
              <button
                onClick={onOpenCart}
                className="relative bg-orange-50 hover:bg-orange-100 text-[#FF8C00] border border-orange-200 p-1.5 sm:p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                title="Mon Panier"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF8C00] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Desktop Active Orders Indicator */}
            {activeOrdersCount > 0 && (
              <div className="hidden lg:flex items-center gap-1 bg-[#ECFDF5] text-[#065F46] border border-[#D1FAE5] text-[11px] font-bold px-2 py-1.5 rounded-xl shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#009E49] animate-ping"></span>
                <span>{activeOrdersCount} en cours</span>
              </div>
            )}

            {/* Mobile Dropdown Trigger for Secondary Options (City, Wallet, Orders) */}
            <div className="relative lg:hidden">
              <button
                onClick={() => setIsSecondaryMenuOpen(prev => !prev)}
                className={`flex items-center gap-1 border px-2 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer shrink-0 ${
                  isSecondaryMenuOpen 
                    ? 'bg-gray-800 text-white border-gray-800' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                }`}
                title="Options secondaires (Ville, Wallet, Stats)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">{selectedCityName}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isSecondaryMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile Secondary Options Popover / Dropdown Menu */}
              {isSecondaryMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF8C00]" />
                      Options & Préférences
                    </span>
                    <button 
                      onClick={() => setIsSecondaryMenuOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Zone/City Selector */}
                  <div className="mb-3">
                    <label className="block text-[10px] uppercase font-extrabold text-gray-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF8C00]" />
                      Zone / Ville Active
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        onCityChange(e.target.value);
                        setIsSecondaryMenuOpen(false);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00] cursor-pointer"
                    >
                      <option value="all">Toutes les villes (National)</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name} ({city.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Wallet & Loyalty Points Summary */}
                  <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl border border-emerald-100/80 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-bold flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-[#009E49]" />
                        Solde Wallet :
                      </span>
                      <span className="font-black text-[#009E49]">{formatFCFA(walletFCFA)}</span>
                    </div>
                    {loyaltyPoints !== undefined && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-100">
                        <span className="text-amber-800 font-bold flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          Points Fidélité :
                        </span>
                        <span className="font-black text-[#FF8C00]">{loyaltyPoints} pts</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Active Orders Status Badge */}
                  {activeOrdersCount > 0 ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-[#065F46] border border-emerald-200 rounded-xl text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#009E49] animate-ping"></span>
                        Commandes en cours :
                      </span>
                      <span className="bg-[#009E49] text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                        {activeOrdersCount}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-50 text-gray-500 rounded-xl text-[11px] font-semibold text-center flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                      Aucune commande active en cours
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile & Tablet Role Bar: Flexible 4-Column Grid fitting 100% of width with NO scrolling */}
        <div className="mt-2 pt-1.5 border-t border-gray-100 md:hidden">
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-gray-100 rounded-xl text-center">
            <button
              onClick={() => onRoleChange('client')}
              className={`py-1.5 px-0.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                currentRole === 'client'
                  ? 'bg-[#FF8C00] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Client</span>
            </button>
            <button
              onClick={() => onRoleChange('merchant')}
              className={`py-1.5 px-0.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                currentRole === 'merchant'
                  ? 'bg-[#009E49] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Vendeur</span>
            </button>
            <button
              onClick={() => onRoleChange('livreur')}
              className={`py-1.5 px-0.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                currentRole === 'livreur'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Livreur</span>
            </button>
            <button
              onClick={() => onRoleChange('admin')}
              className={`py-1.5 px-0.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Dispatch</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};


