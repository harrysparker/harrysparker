import React, { useState, useMemo } from 'react';
import { Product, CartItem, Order, CityNode, Merchant, DeliveryMode, SmartGroupingRecommendation, LoyaltyAccount, OrderReview } from '../types';
import { formatFCFA, calculateDeliveryFee, simulateSmartGrouping, calculateDeliveryETA } from '../services/pricingService';
import { ShoppingBag, Plus, Minus, Trash2, Sparkles, MapPin, ShieldCheck, ArrowRight, Truck, CheckCircle2, Phone, Clock, QrCode, Award, Gift, Wallet, TrendingUp, Zap, Star, Crown, Info, Check, ArrowUpRight, ArrowDownRight, Send, ThumbsUp, MessageSquare, Search, X, Filter, Navigation, Compass, Store } from 'lucide-react';
import { MapComponent } from './MapComponent';

interface ClientViewProps {
  products: Product[];
  cities: CityNode[];
  merchants: Merchant[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  orders: Order[];
  onCreateOrder: (newOrder: Order) => void;
  selectedCity: string;
  loyaltyAccount?: LoyaltyAccount;
  walletFCFA?: number;
  onRechargeWallet?: (amountFCFA: number) => void;
  onSaveOrderReview?: (orderId: string, review: OrderReview) => void;
}

const StarRatingInput: React.FC<{
  rating: number;
  setRating: (r: number) => void;
  label?: string;
}> = ({ rating, setRating, label }) => {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-extrabold text-gray-700">{label}</p>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-200 fill-gray-100'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-black text-amber-600 ml-2 font-['Outfit']">
          {rating === 5 && '😍 Excellent (5/5)'}
          {rating === 4 && '😃 Très bon (4/5)'}
          {rating === 3 && '🙂 Correct (3/5)'}
          {rating === 2 && '😐 Moyen (2/5)'}
          {rating === 1 && '😞 Mauvais (1/5)'}
        </span>
      </div>
    </div>
  );
};

export const ClientView: React.FC<ClientViewProps> = ({
  products,
  cities,
  merchants,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  orders,
  onCreateOrder,
  selectedCity,
  loyaltyAccount,
  walletFCFA = 45000,
  onRechargeWallet,
  onSaveOrderReview,
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'cart' | 'loyalty' | 'tracking'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('grouped');
  const [isGroupedActive, setIsGroupedActive] = useState<boolean>(true);
  const [destinationCityId, setDestinationCityId] = useState<string>('bouake');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Bouaké, Quartier Commerce Villa 14');
  const [clientName, setClientName] = useState<string>('Koffi Marie-Claire');
  const [clientPhone, setClientPhone] = useState<string>('+225 07 88 11 22 33');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange_money' | 'mtn_money' | 'cash'>('wave');
  const [aiGroupingResult, setAiGroupingResult] = useState<SmartGroupingRecommendation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(orders.length > 0 ? orders[0].id : null);

  // Loyalty System state
  const [selectedPointsToUse, setSelectedPointsToUse] = useState<number>(0);
  const [rechargeAmount, setRechargeAmount] = useState<number>(10000);
  const [rechargeMethod, setRechargeMethod] = useState<'wave' | 'orange_money' | 'mtn_money'>('wave');
  const [rechargeToast, setRechargeToast] = useState<string | null>(null);

  // Review & Rating State
  const [livreurRating, setLivreurRating] = useState<number>(5);
  const [livreurComment, setLivreurComment] = useState<string>('');
  const [merchantRating, setMerchantRating] = useState<number>(5);
  const [merchantComment, setMerchantComment] = useState<string>('');
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  // Build available categories with product counts
  const categoryOptions = useMemo(() => {
    const predefined = [
      { id: 'all', label: 'Tous les articles', icon: '🛍️' },
      { id: 'chaussures', label: 'Chaussures & Cuir', icon: '👟' },
      { id: 'parfum', label: 'Parfums & Cosmétiques', icon: '🌸' },
      { id: 'telephone', label: 'Téléphones & Tech', icon: '📱' },
      { id: 'repas', label: 'Repas Maquis Chauds', icon: '🍲' },
      { id: 'epicerie', label: 'Épicerie & Vivriers', icon: '🌾' },
    ];

    const existingCatIds = new Set(predefined.map(c => c.id));
    const extraCategories: { id: string; label: string; icon: string }[] = [];

    products.forEach(p => {
      if (p.category && !existingCatIds.has(p.category)) {
        existingCatIds.add(p.category);
        extraCategories.push({
          id: p.category,
          label: p.category.charAt(0).toUpperCase() + p.category.slice(1),
          icon: '📦',
        });
      }
    });

    const allCats = [...predefined, ...extraCategories];

    // Compute counts based on selected city, merchant & search query
    return allCats.map(cat => {
      const count = products.filter(p => {
        const matchCity = selectedCity === 'all' || p.cityId === selectedCity;
        const matchCat = cat.id === 'all' || p.category === cat.id;
        const matchMerchant = !selectedMerchantFilter || p.merchantId === selectedMerchantFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchQuery = !q ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.merchantName.toLowerCase().includes(q) ||
          p.cityName.toLowerCase().includes(q);
        return matchCity && matchCat && matchMerchant && matchQuery;
      }).length;

      return { ...cat, count };
    });
  }, [products, selectedCity, searchQuery, selectedMerchantFilter]);

  // Filter products by city, category, merchant & search query
  const filteredProducts = products.filter(p => {
    const matchCity = selectedCity === 'all' || p.cityId === selectedCity;
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchMerchant = !selectedMerchantFilter || p.merchantId === selectedMerchantFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.merchantName.toLowerCase().includes(q) ||
      p.cityName.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q));

    return matchCity && matchCategory && matchMerchant && matchSearch;
  });

  const cartSubtotalFCFA = cart.reduce((sum, item) => sum + item.product.priceFCFA * item.quantity, 0);
  const cartTotalWeightKg = cart.reduce((sum, item) => sum + item.product.weightKg * item.quantity, 0);

  // Calculate base delivery fee
  const primaryOriginCity = cart.length > 0 ? cart[0].product.cityId : destinationCityId;

  // Calculate automatic ETA based on GPS hub coordinates and road distance
  const etaEstimate = useMemo(() => {
    return calculateDeliveryETA(
      primaryOriginCity,
      destinationCityId,
      deliveryMode,
      isGroupedActive
    );
  }, [primaryOriginCity, destinationCityId, deliveryMode, isGroupedActive]);

  const rawDeliveryFeeFCFA = calculateDeliveryFee(
    primaryOriginCity,
    destinationCityId,
    cartTotalWeightKg,
    deliveryMode,
    isGroupedActive
  );

  // Loyalty System Threshold & Discounts
  const discountThresholdFCFA = loyaltyAccount?.discountThresholdFCFA || 10000;
  const isThresholdMet = cartSubtotalFCFA >= discountThresholdFCFA;

  // Conversion: 10 points = 100 FCFA discount (1 pt = 10 FCFA)
  const pointsRateFCFA = 10;
  const rawLoyaltyDiscount = isThresholdMet ? selectedPointsToUse * pointsRateFCFA : 0;
  const loyaltyDiscountFCFA = Math.min(rawDeliveryFeeFCFA, rawLoyaltyDiscount);
  const deliveryFeeFCFA = Math.max(0, rawDeliveryFeeFCFA - loyaltyDiscountFCFA);
  const cartTotalFCFA = cartSubtotalFCFA + deliveryFeeFCFA;

  // New Points Earned Calculation
  const basePointsEarned = Math.floor(cartSubtotalFCFA / (loyaltyAccount?.pointsPerFCFA || 200));
  const thresholdBonusEarned = isThresholdMet ? 100 : 0;
  const totalNewPointsEarned = basePointsEarned + thresholdBonusEarned;

  // Handle AI Smart Grouping call
  const handleRunAiGrouping = async () => {
    setIsAiLoading(true);
    const localResult = simulateSmartGrouping(cart);
    
    try {
      const res = await fetch('/api/gemini/smart-grouping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ name: i.product.name, merchant: i.product.merchantName, city: i.product.cityName })),
          destinationCity: cities.find(c => c.id === destinationCityId)?.name || 'Bouaké'
        })
      });
      const data = await res.json();
      if (data.aiAnalysis) {
        localResult.explanation = data.aiAnalysis;
      }
    } catch (e) {
      console.log('Gemini request fallback to local smart grouping');
    }

    setAiGroupingResult(localResult);
    setIsGroupedActive(true);
    setIsAiLoading(false);
  };

  // Submit Order
  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Generate random 4-digit OTP code e.g. "8492"
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const trackingNumber = `IVR-${destinationCityId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const destCityObj = cities.find(c => c.id === destinationCityId);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      trackingNumber,
      clientId: 'c1',
      clientName,
      clientPhone,
      deliveryAddress,
      originCityId: primaryOriginCity,
      originCityName: cities.find(c => c.id === primaryOriginCity)?.name || 'Bouaké',
      destinationCityId,
      destinationCityName: destCityObj?.name || 'Bouaké',
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        merchantId: item.product.merchantId,
        merchantName: item.product.merchantName,
        cityName: item.product.cityName,
        priceFCFA: item.product.priceFCFA,
        quantity: item.quantity,
        weightKg: item.product.weightKg
      })),
      itemsSubtotalFCFA: cartSubtotalFCFA,
      deliveryFeeFCFA,
      totalFCFA: cartTotalFCFA,
      deliveryMode,
      isGrouped: isGroupedActive,
      groupedSavingsFCFA: aiGroupingResult?.savingsFCFA || Math.round(deliveryFeeFCFA * 0.3),
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: etaEstimate.estimatedArrivalRange,
      roadDistanceKm: etaEstimate.roadDistanceKm,
      haversineKm: etaEstimate.haversineKm,
      paymentMethod,
      proof: {
        otpCode,
        isOtpVerified: false,
      },
      currentLat: destCityObj?.lat ? destCityObj.lat + 0.005 : 7.6939,
      currentLng: destCityObj?.lng ? destCityObj.lng + 0.005 : -5.0303,
      loyaltyPointsEarned: totalNewPointsEarned,
      loyaltyPointsUsed: isThresholdMet ? selectedPointsToUse : 0,
      loyaltyDiscountFCFA: loyaltyDiscountFCFA
    };

    onCreateOrder(newOrder);
    onClearCart();
    setSelectedPointsToUse(0);
    setActiveTrackingOrderId(newOrder.id);
    setActiveTab('tracking');
  };

  const activeTrackingOrder = orders.find(o => o.id === activeTrackingOrderId) || orders[0];

  return (
    <div className="space-y-6">
      
      {/* Client View Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-['Outfit'] text-[#111827] flex items-center gap-2">
            <span>Marketplace Nationale</span>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
              {filteredProducts.length} articles
            </span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Commandez parmi nos commerçants à Bouaké, Korhogo, Yamoussoukro, Daloa, San-Pédro, Man et Abidjan.
          </p>
        </div>

        {/* View Tabs - Flex Wrap so all options are directly visible without horizontal scrolling */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F3F4F6] p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'shop'
                ? 'bg-[#FF8C00] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Boutique & Articles
          </button>
          
          <button
            onClick={() => setActiveTab('cart')}
            className={`relative px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'cart'
                ? 'bg-[#FF8C00] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Mon Panier</span>
            {cart.length > 0 && (
              <span className="bg-white text-[#FF8C00] text-[10px] px-2 py-0.2 rounded-full font-black">
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('loyalty')}
            className={`relative px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'loyalty'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Fidélité & Portefeuille</span>
            {loyaltyAccount && (
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                {loyaltyAccount.pointsBalance} pts
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'tracking'
                ? 'bg-[#009E49] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Suivi GPS en direct</span>
            {orders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* SHOP TAB */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          
          {/* Search Bar & Category Filter Header */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 shadow-sm">
            
            {/* Main Search Input */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit, marque, commerçant ou ville (ex: Mocassins, Parfum, Bouaké...)"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009E49] focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4 bg-gray-200 hover:bg-gray-300 rounded-full p-0.5" />
                  </button>
                )}
              </div>

              {/* Active Filter Indicators / Clear All */}
              <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
                <span className="text-xs font-extrabold text-gray-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-2xl">
                  <span className="text-[#009E49]">{filteredProducts.length}</span> {filteredProducts.length > 1 ? 'articles trouvés' : 'article trouvé'}
                </span>

                {(searchQuery || selectedCategory !== 'all' || selectedMerchantFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedMerchantFilter(null);
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-2xl transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Search Tag Suggestions - Flex Wrap with Hover Scale-Up */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 font-semibold pb-1">
              <span className="shrink-0 font-bold text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Suggestions :
              </span>
              {['Mocassins', 'Parfum', 'iPhone', 'Tricycle', 'Pagne', 'Koutoukou', 'Bouaké'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className={`px-2.5 py-1 rounded-xl transition-all duration-200 ease-out transform hover:scale-105 hover:-translate-y-0.5 cursor-pointer border shrink-0 ${
                    searchQuery.toLowerCase() === tag.toLowerCase()
                      ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200 shadow-2xs'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Boutiques & Commerçants Certifiés - Interactive Shop Badges with Scale-Up on Hover */}
            {merchants.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-900 font-['Outfit'] uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#FF8C00]" />
                      <span>Boutiques & Commerçants Certifiés</span>
                    </span>
                    <span className="text-[10px] font-black bg-orange-100 text-[#EA580C] px-2 py-0.5 rounded-full border border-orange-200">
                      {merchants.length}
                    </span>
                  </div>

                  {selectedMerchantFilter && (
                    <button
                      onClick={() => setSelectedMerchantFilter(null)}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Toutes les boutiques</span>
                    </button>
                  )}
                </div>

                {/* Shop Badges List with Smooth Scale-Up Transitions */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none">
                  {merchants.map(m => {
                    const isSelected = selectedMerchantFilter === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMerchantFilter(isSelected ? null : m.id)}
                        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-extrabold shrink-0 transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white border-orange-500 shadow-md ring-2 ring-orange-300/50 scale-105'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 shadow-2xs'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-7 h-7 rounded-xl object-cover border border-white/80 shadow-xs"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" title="Boutique Ouverte"></span>
                        </div>
                        <div className="text-left">
                          <div className="line-clamp-1 font-extrabold text-xs leading-snug">{m.name}</div>
                          <div className={`text-[10px] font-semibold flex items-center gap-1 ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
                            <span>📍 {m.cityName}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-extrabold">⭐ {m.rating}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category Filter Pills - Flex Wrap with Scale-Up Transitions */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {categoryOptions.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-[#009E49] text-white shadow-md ring-2 ring-emerald-300/50'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-emerald-200 shadow-2xs'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Products Grid or Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-2xl border border-amber-100">
                🔍
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-gray-900 font-['Outfit']">
                  Aucun article ne correspond à votre recherche
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto font-medium">
                  Nous n'avons trouvé aucun résultat pour "{searchQuery}" dans la catégorie sélectionnée ({selectedCategory === 'all' ? 'Toutes catégories' : selectedCategory}).
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedMerchantFilter(null);
                }}
                className="bg-[#009E49] hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-2xl text-xs shadow-sm transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Effacer tous les filtres</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map(product => {
                const inCartCount = cart.find(i => i.product.id === product.id)?.quantity || 0;
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-out transform hover:scale-[1.03] hover:-translate-y-1.5 flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur border border-gray-200 text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm transition-all duration-300 group-hover:scale-105">
                        <MapPin className="w-3 h-3 text-[#FF8C00]" />
                        <span>{product.cityName}</span>
                      </div>
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-[#009E49] to-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-xl shadow-md transition-all duration-300 group-hover:scale-105">
                        {formatFCFA(product.priceFCFA)}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {/* Interactive Shop / Merchant Badge with Scale-Up on Hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMerchantFilter(selectedMerchantFilter === product.merchantId ? null : product.merchantId);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold mb-1.5 transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-0.5 cursor-pointer shadow-2xs ${
                            selectedMerchantFilter === product.merchantId
                              ? 'bg-[#FF8C00] text-white border border-orange-600 shadow-sm'
                              : 'bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-[#EA580C]'
                          }`}
                          title={`Filtrer par la boutique ${product.merchantName}`}
                        >
                          <Store className="w-3 h-3 text-[#FF8C00]" />
                          <span>{product.merchantName}</span>
                        </button>

                        <h3 className="font-extrabold text-[#111827] text-sm line-clamp-1 group-hover:text-[#FF8C00] transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 font-mono">Poids: {product.weightKg} kg</span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm ${
                            inCartCount > 0
                              ? 'bg-[#009E49] hover:bg-emerald-700 text-white'
                              : 'bg-[#FF8C00] hover:bg-orange-600 text-white'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{inCartCount > 0 ? `Ajouté (${inCartCount})` : 'Ajouter au Panier'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CART & CHECKOUT TAB */}
      {activeTab === 'cart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-lg text-[#111827] font-['Outfit'] flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#FF8C00]" />
                  <span>Articles dans votre Panier ({cart.length})</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider le panier</span>
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-xl">
                    🛍️
                  </div>
                  <p className="text-gray-500 text-sm font-semibold">Votre panier est actuellement vide.</p>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="bg-[#FF8C00] text-white font-black px-5 py-2.5 rounded-2xl text-xs shadow-sm"
                  >
                    Découvrir les articles disponibles
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-[#111827] truncate">{item.product.name}</h4>
                        <div className="text-[11px] text-[#EA580C] font-bold">
                          {item.product.merchantName} ({item.product.cityName})
                        </div>
                        <div className="text-xs text-gray-700 font-extrabold mt-0.5">
                          {formatFCFA(item.product.priceFCFA)} / unité
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-gray-200">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="text-gray-500 hover:text-gray-900 p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-gray-800 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="text-gray-500 hover:text-gray-900 p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-[#009E49] text-sm">
                          {formatFCFA(item.product.priceFCFA * item.quantity)}
                        </div>
                        <button
                          onClick={() => onRemoveFromCart(item.product.id)}
                          className="text-gray-400 hover:text-rose-500 text-[10px] mt-1 font-semibold"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart AI Grouping Banner */}
            {cart.length > 0 && (
              <div className="bg-[#ECFDF5] border border-[#D1FAE5] p-5 rounded-3xl space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-[#065F46] font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 text-[#059669]" />
                    <span>Regroupement Intelligent AI Ivoire Delivery</span>
                  </div>
                  <button
                    onClick={handleRunAiGrouping}
                    disabled={isAiLoading}
                    className="bg-[#009E49] hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isAiLoading ? 'Analyse AI...' : 'Calculer le Regroupement'}
                  </button>
                </div>

                <p className="text-xs text-[#047857] leading-relaxed font-medium">
                  {aiGroupingResult ? aiGroupingResult.explanation : "Le système regroupe intelligemment vos chaussures, parfums, téléphones et repas en une seule tournée logistique pour réduire le coût de livraison."}
                </p>

                {aiGroupingResult && aiGroupingResult.canGroup && (
                  <div className="bg-white border border-[#A7F3D0] p-3 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-600 font-semibold">Économie de Regroupement :</span>
                      <span className="text-[#059669] font-black ml-1.5">{formatFCFA(aiGroupingResult.savingsFCFA)}</span>
                    </div>
                    <span className="bg-[#D1FAE5] text-[#065F46] text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                      -30% Appliqué
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout & Summary Panel */}
          {cart.length > 0 && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-base text-[#111827] border-b border-gray-100 pb-2 font-['Outfit']">
                  Destination & Paiement
                </h3>

                {/* Client Info */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">Nom du Client</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-gray-800 font-medium focus:outline-none focus:border-[#FF8C00]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-500 font-bold mb-1">Téléphone Client</label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-gray-800 font-medium focus:outline-none focus:border-[#FF8C00]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-500 font-bold mb-1">Ville de Destination</label>
                    <select
                      value={destinationCityId}
                      onChange={e => setDestinationCityId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-gray-800 font-bold focus:outline-none focus:border-[#FF8C00] cursor-pointer"
                    >
                      {cities.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.region})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-500 font-bold mb-1">Adresse Précise de Livraison</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-gray-800 font-medium focus:outline-none focus:border-[#FF8C00]"
                      placeholder="Quartier, Rue, Repère..."
                    />
                  </div>
                </div>

                {/* Delivery Mode Selection */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="block text-xs text-gray-500 font-bold">Mode de Livraison</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setDeliveryMode('express')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        deliveryMode === 'express'
                          ? 'bg-[#FFF7ED] border-[#FFEDD5] text-[#9A3412] font-black'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="font-extrabold text-xs">🚀 Express</div>
                      <div className="text-[10px] text-gray-500">Livreur dédié rapide</div>
                    </button>

                    <button
                      onClick={() => setDeliveryMode('grouped')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        deliveryMode === 'grouped'
                          ? 'bg-[#ECFDF5] border-[#D1FAE5] text-[#065F46] font-black'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="font-extrabold text-xs">📦 Regroupée</div>
                      <div className="text-[10px] text-[#059669]">Économique (-30%)</div>
                    </button>
                  </div>
                </div>

                {/* Automatic ETA & GPS Distance Hubs Estimation Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl space-y-3 border border-slate-700 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-400">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Estimation Temps de Trajet (ETA GPS)</span>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Compass className="w-3 h-3 text-emerald-400" />
                      GPS Direct
                    </span>
                  </div>

                  {/* Hub GPS Origin -> Destination */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">1. Hub Origine</span>
                      <div className="font-black text-white truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                        <span>{etaEstimate.originCityName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {etaEstimate.originCoords.lat.toFixed(3)}°N, {etaEstimate.originCoords.lng.toFixed(3)}°W
                      </div>
                    </div>

                    <div className="space-y-0.5 border-l border-slate-700 pl-2.5">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">2. Hub Destination</span>
                      <div className="font-black text-white truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{etaEstimate.destinationCityName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {etaEstimate.destinationCoords.lat.toFixed(3)}°N, {etaEstimate.destinationCoords.lng.toFixed(3)}°W
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics: Duration & Distances */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold block">Durée Estimée (ETA)</span>
                      <span className="text-sm font-black text-emerald-400">{etaEstimate.formattedDuration}</span>
                    </div>
                    <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold block">Distance Routière</span>
                      <span className="text-sm font-black text-sky-400">{etaEstimate.roadDistanceKm} km</span>
                      <span className="text-[9px] text-slate-400 block font-mono">({etaEstimate.haversineKm} km GPS direct)</span>
                    </div>
                  </div>

                  {/* Delivery Arrival Window */}
                  <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-amber-200 font-medium text-[11px]">Arrivée estimée :</span>
                    <span className="text-amber-300 font-black text-[11px]">{etaEstimate.estimatedArrivalRange}</span>
                  </div>

                  {/* Detailed Stage Breakdown */}
                  <div className="space-y-1 pt-1 text-[10px] text-slate-300 border-t border-slate-700/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Préparation Hub:</span>
                      <span className="font-bold">{etaEstimate.preparationMin} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Transit Routier ({etaEstimate.averageSpeedKmh} km/h):</span>
                      <span className="font-bold">{etaEstimate.transitMin} min</span>
                    </div>
                    {etaEstimate.groupingDelayMin > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>• Regroupement Intelligent:</span>
                        <span>+{etaEstimate.groupingDelayMin} min</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">• Dernier Kilomètre (Livreur):</span>
                      <span className="font-bold">{etaEstimate.lastMileMin} min</span>
                    </div>
                  </div>
                </div>

                {/* Payment Mobile Money Selection */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="block text-xs text-gray-500 font-bold">Paiement Sécurisé</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'wave', label: '🌊 Wave', color: 'border-sky-300 text-sky-700 bg-sky-50' },
                      { id: 'orange_money', label: '🟧 Orange Money', color: 'border-orange-300 text-orange-700 bg-orange-50' },
                      { id: 'mtn_money', label: '🟨 MTN Money', color: 'border-yellow-300 text-yellow-800 bg-yellow-50' },
                      { id: 'cash', label: '💵 Espèces', color: 'border-emerald-300 text-emerald-800 bg-emerald-50' },
                    ].map(pay => (
                      <button
                        key={pay.id}
                        onClick={() => setPaymentMethod(pay.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          paymentMethod === pay.id
                            ? `${pay.color} font-black shadow-sm`
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {pay.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loyalty Points Threshold & Discount Block */}
                <div className="pt-2 border-t border-gray-100">
                  {isThresholdMet ? (
                    <div className="bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200 p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-600" />
                          <span>Seuil Fidélité 10 000 FCFA Débloqué !</span>
                        </span>
                        <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full border border-amber-300 font-black">
                          {loyaltyAccount?.pointsBalance || 0} pts dispo
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        Utilisez vos points Ivoire pour obtenir une réduction immédiate sur les frais de livraison inter-villes :
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedPointsToUse(0)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            selectedPointsToUse === 0
                              ? 'bg-white border-amber-500 font-bold text-amber-900 shadow-sm'
                              : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white'
                          }`}
                        >
                          <div className="font-extrabold text-[11px]">⚪ Aucun point</div>
                          <div className="text-[10px] text-gray-500">Tarif normal</div>
                        </button>

                        <button
                          type="button"
                          disabled={(loyaltyAccount?.pointsBalance || 0) < 50}
                          onClick={() => setSelectedPointsToUse(50)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            selectedPointsToUse === 50
                              ? 'bg-amber-100 border-amber-500 font-bold text-amber-900 shadow-sm'
                              : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40'
                          }`}
                        >
                          <div className="font-extrabold text-[11px]">🎟️ 50 pts (-500 FCFA)</div>
                          <div className="text-[10px] text-amber-700">Réduction légère</div>
                        </button>

                        <button
                          type="button"
                          disabled={(loyaltyAccount?.pointsBalance || 0) < 100}
                          onClick={() => setSelectedPointsToUse(100)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            selectedPointsToUse === 100
                              ? 'bg-amber-100 border-amber-500 font-bold text-amber-900 shadow-sm'
                              : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40'
                          }`}
                        >
                          <div className="font-extrabold text-[11px]">🎟️ 100 pts (-1 000 F)</div>
                          <div className="text-[10px] text-amber-700">Grosse réduction</div>
                        </button>

                        <button
                          type="button"
                          disabled={(loyaltyAccount?.pointsBalance || 0) < 150}
                          onClick={() => setSelectedPointsToUse(150)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            selectedPointsToUse === 150
                              ? 'bg-emerald-100 border-emerald-500 font-bold text-emerald-900 shadow-sm'
                              : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40'
                          }`}
                        >
                          <div className="font-extrabold text-[11px]">🚀 150 pts (GRATUIT)</div>
                          <div className="text-[10px] text-emerald-700">Livraison offerte</div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>Seuil Fidélité : 10 000 FCFA</span>
                        </span>
                        <span className="text-[11px] font-black text-[#FF8C00]">
                          {formatFCFA(discountThresholdFCFA - cartSubtotalFCFA)} restants
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#FF8C00] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (cartSubtotalFCFA / discountThresholdFCFA) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight font-medium">
                        Atteignez 10 000 FCFA d'achat pour convertir vos points en réduction de livraison et recevoir <span className="font-extrabold text-[#009E49]">+100 points bonus</span> !
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary Totals */}
                <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Sous-total Articles :</span>
                    <span className="font-bold text-gray-800">{formatFCFA(cartSubtotalFCFA)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Frais de Livraison Bruts :</span>
                    <span className="font-extrabold text-gray-700">{formatFCFA(rawDeliveryFeeFCFA)}</span>
                  </div>

                  {loyaltyDiscountFCFA > 0 && (
                    <div className="flex justify-between text-emerald-700 font-extrabold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Réduction Fidélité ({selectedPointsToUse} pts) :</span>
                      </span>
                      <span>-{formatFCFA(loyaltyDiscountFCFA)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#111827] font-black text-base pt-2 border-t border-gray-100">
                    <span>Total Net à Payer :</span>
                    <span className="text-[#FF8C00]">{formatFCFA(cartTotalFCFA)}</span>
                  </div>

                  <div className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between mt-1">
                    <span>⭐ Points à gagner sur cette commande :</span>
                    <span className="font-black text-[#FF8C00]">+{totalNewPointsEarned} pts</span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#FF8C00] hover:bg-orange-600 text-white font-black py-3.5 rounded-2xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer & Obtenir Code OTP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOYALTY & WALLET PROFILE TAB */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">

          {/* Customer Profile Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-wrap items-center justify-between gap-6">
            <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
              <Award className="w-64 h-64 text-white" />
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-2xl font-black shadow-inner">
                👩🏾‍💼
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold font-['Outfit']">{clientName}</h3>
                  <span className="bg-amber-300 text-amber-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3 text-amber-900" />
                    <span>Statut VIP {loyaltyAccount?.tier.toUpperCase() || 'ARGENT'}</span>
                  </span>
                </div>
                <p className="text-xs text-amber-100 font-medium mt-0.5">
                  Client Privilège Ivoire Delivery • {clientPhone} • Bouaké, Côte d'Ivoire
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-3 px-4 text-center">
                <p className="text-[10px] text-amber-200 uppercase font-extrabold">Solde Points</p>
                <p className="text-2xl font-black text-amber-300">{loyaltyAccount?.pointsBalance || 0} pts</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-3 px-4 text-center">
                <p className="text-[10px] text-amber-200 uppercase font-extrabold">Solde Wallet</p>
                <p className="text-2xl font-black text-emerald-300">{formatFCFA(walletFCFA)}</p>
              </div>
            </div>
          </div>

          {/* Cards Grid: Points Card & Mobile Money Wallet Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Loyalty Points Overview Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 font-extrabold text-[#111827] text-base font-['Outfit']">
                  <Award className="w-5 h-5 text-[#FF8C00]" />
                  <span>Mon Compte Fidélité Ivoire Points</span>
                </div>
                <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                  1 pt = 10 FCFA
                </span>
              </div>

              {/* Main Balance Hero Box */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-100 uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>Points de Réduction Disponibles</span>
                  </span>
                  <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
                    Seuil Actif : {formatFCFA(loyaltyAccount?.discountThresholdFCFA || 10000)}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black font-['Outfit']">{loyaltyAccount?.pointsBalance || 0}</span>
                  <span className="text-lg font-bold text-amber-200">Points Ivoire</span>
                </div>

                <div className="bg-black/15 backdrop-blur rounded-xl p-3 flex items-center justify-between text-xs font-bold text-amber-100">
                  <span>Valeur en Réduction Livraison :</span>
                  <span className="text-amber-300 text-sm font-black">
                    {formatFCFA((loyaltyAccount?.pointsBalance || 0) * 10)}
                  </span>
                </div>
              </div>

              {/* Tier Progress Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-600">Progression Rang VIP ({loyaltyAccount?.tier.toUpperCase()})</span>
                  <span className="text-[#FF8C00]">
                    {loyaltyAccount?.totalEarnedPoints || 0} / 2 500 pts cumulés
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((loyaltyAccount?.totalEarnedPoints || 0) / 2500) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  🥉 Bronze (0) → 🥈 Argent (500) → 🥇 Or (1 000) → 💎 Diamant (2 500 pts). Cumulez encore {Math.max(0, 2500 - (loyaltyAccount?.totalEarnedPoints || 0))} pts pour atteindre le grade Diamant !
                </p>
              </div>

              {/* Rule Card */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 text-xs">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Règles d'Obtention & Réductions sur Livraison</span>
                </div>
                <ul className="space-y-1.5 text-amber-800 font-medium list-disc list-inside leading-relaxed text-[11px]">
                  <li><strong className="text-amber-950">Gains standard :</strong> 1 point gagné tous les 200 FCFA d'achats sur la Marketplace.</li>
                  <li><strong className="text-amber-950">Seuil de Réduction (10 000 FCFA) :</strong> Pour toute commande ≥ 10 000 FCFA, vous débloquez la conversion de vos points en réductions directes sur les frais de livraison.</li>
                  <li><strong className="text-amber-950">Bonus Seuil de Commande :</strong> +100 Points bonus offerts pour chaque commande validée supérieure à 10 000 FCFA !</li>
                </ul>
              </div>
            </div>

            {/* Mobile Money Wallet & Recharge Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 font-extrabold text-[#111827] text-base font-['Outfit']">
                    <Wallet className="w-5 h-5 text-[#009E49]" />
                    <span>Mon Portefeuille Mobile Money</span>
                  </div>
                  <span className="bg-emerald-50 text-[#009E49] text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    Paiement Instantané
                  </span>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white space-y-2 shadow-sm">
                  <p className="text-xs font-extrabold text-emerald-100 uppercase tracking-wider">
                    Solde Wallet Disponible
                  </p>
                  <p className="text-3xl font-black font-['Outfit'] text-white">{formatFCFA(walletFCFA)}</p>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Utilisé pour régler vos achats d'articles et vos frais de livraison sans frais supplémentaires.
                  </p>
                </div>

                {/* Recharge Module */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs text-gray-700 font-bold">
                    Recharger le Solde avec Mobile Money
                  </label>

                  {/* Operator Toggle */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'wave', label: '🌊 Wave' },
                      { id: 'orange_money', label: '🟧 Orange' },
                      { id: 'mtn_money', label: '🟨 MTN' },
                    ].map(op => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setRechargeMethod(op.id as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                          rechargeMethod === op.id
                            ? 'bg-[#009E49] text-white border-[#009E49] shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="grid grid-cols-4 gap-2">
                    {[5000, 10000, 25000, 50000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRechargeAmount(amt)}
                        className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          rechargeAmount === amt
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {amt / 1000}k FCFA
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={rechargeAmount}
                      onChange={e => setRechargeAmount(Number(e.target.value))}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#009E49]"
                      placeholder="Montant personnalise FCFA"
                      step={1000}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (onRechargeWallet && rechargeAmount > 0) {
                          onRechargeWallet(rechargeAmount);
                          setRechargeToast(`Recharge de +${formatFCFA(rechargeAmount)} effectuée avec succès via ${rechargeMethod.toUpperCase()} !`);
                          setTimeout(() => setRechargeToast(null), 4000);
                        }
                      }}
                      className="bg-[#009E49] hover:bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
                    >
                      Recharger
                    </button>
                  </div>

                  {rechargeToast && (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{rechargeToast}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-gray-400 font-medium text-center pt-3 border-t border-gray-100">
                🔒 Recharges sécurisées par API directe Mobile Money Côte d'Ivoire.
              </div>
            </div>

          </div>

          {/* Interactive Vouchers / Perks Catalog */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#111827] font-['Outfit'] flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#FF8C00]" />
                  <span>Catalogue de Coupons Réduction Frais de Livraison</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Ces coupons s'activent automatiquement au panier dès que votre commande d'articles atteint 10 000 FCFA.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Voucher 1 */}
              <div className="border border-amber-200 bg-amber-50/50 p-4 rounded-2xl space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="bg-amber-100 text-amber-900 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                    Coupon Débutant
                  </span>
                  <h4 className="font-extrabold text-amber-950 text-sm pt-1">🎟️ -500 FCFA sur la Livraison</h4>
                  <p className="text-xs text-amber-800 font-medium">
                    Réduit de 500 FCFA les frais de livraison sur toutes les destinations.
                  </p>
                </div>
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-900">Coût: 50 Points</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-lg">
                    Disponible
                  </span>
                </div>
              </div>

              {/* Voucher 2 */}
              <div className="border border-orange-200 bg-orange-50/50 p-4 rounded-2xl space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="bg-orange-100 text-orange-900 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border border-orange-300">
                    Coupon Populaire
                  </span>
                  <h4 className="font-extrabold text-orange-950 text-sm pt-1">🎟️ -1 000 FCFA sur la Livraison</h4>
                  <p className="text-xs text-orange-800 font-medium">
                    Réduction majeure sur les expéditions inter-villes (ex: Bouaké → Korhogo).
                  </p>
                </div>
                <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-orange-900">Coût: 100 Points</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-lg">
                    Disponible
                  </span>
                </div>
              </div>

              {/* Voucher 3 */}
              <div className="border border-emerald-300 bg-emerald-50/60 p-4 rounded-2xl space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="bg-emerald-200 text-emerald-950 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Privilège VIP
                  </span>
                  <h4 className="font-extrabold text-emerald-950 text-sm pt-1">🚀 LIVRAISON 100% GRATUITE</h4>
                  <p className="text-xs text-emerald-800 font-medium">
                    Supprime entièrement les frais de livraison inter-villes (jusqu'à 1 500 FCFA).
                  </p>
                </div>
                <div className="pt-2 border-t border-emerald-300/60 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-950">Coût: 150 Points</span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-200 px-2 py-0.5 rounded-lg">
                    Actif au Panier
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Points Transaction History Table */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-[#111827] font-['Outfit'] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span>Historique des Mouvements de Points Fidélité</span>
              </h3>
              <span className="text-xs text-gray-500 font-semibold">
                {loyaltyAccount?.transactions.length || 0} opérations
              </span>
            </div>

            <div className="divide-y divide-gray-100 overflow-x-auto">
              {(loyaltyAccount?.transactions || []).map(tx => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-gray-50 px-2 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                      tx.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tx.points > 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900">{tx.description}</div>
                      <div className="text-[10px] text-gray-400 font-medium">Date: {tx.date}</div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    {tx.orderTrackingNumber && (
                      <span className="bg-gray-100 text-gray-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md hidden sm:inline">
                        {tx.orderTrackingNumber}
                      </span>
                    )}
                    <span className={`text-sm font-black ${tx.points > 0 ? 'text-[#009E49]' : 'text-rose-600'}`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TRACKING TAB */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-500 font-semibold shadow-sm">
              Aucune commande active pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Order Selector Pills if multiple orders exist */}
              {orders.length > 1 && (
                <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <span className="text-xs font-black text-gray-500 whitespace-nowrap px-1">Vos Commandes ({orders.length}) :</span>
                  {orders.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setActiveTrackingOrderId(o.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                        o.id === activeTrackingOrder.id
                          ? 'bg-[#FF8C00] text-white shadow-sm'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {o.trackingNumber} • {o.destinationCityName}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Order Details Panel */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">N° Suivi National</div>
                        <div className="font-black text-base text-[#FF8C00] font-mono">{activeTrackingOrder.trackingNumber}</div>
                      </div>
                      <span className="bg-[#ECFDF5] text-[#065F46] text-xs font-black px-3 py-1 rounded-full border border-[#D1FAE5] capitalize">
                        {activeTrackingOrder.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Order ETA & Route Distance Card */}
                    {activeTrackingOrder.estimatedDeliveryTime && (
                      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 rounded-2xl space-y-1.5 shadow-sm border border-slate-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 font-bold text-amber-400">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Arrivée Estimée (ETA)</span>
                          </span>
                          {activeTrackingOrder.roadDistanceKm && (
                            <span className="bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-sky-500/30">
                              {activeTrackingOrder.roadDistanceKm} km routiers
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-white text-sm">
                          {activeTrackingOrder.estimatedDeliveryTime}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Trajet Hubs: <span className="text-slate-200 font-bold">{activeTrackingOrder.originCityName}</span> ➔ <span className="text-slate-200 font-bold">{activeTrackingOrder.destinationCityName}</span>
                          {activeTrackingOrder.haversineKm && ` (${activeTrackingOrder.haversineKm} km GPS direct)`}
                        </div>
                      </div>
                    )}

                    {/* OTP Code Card for Client */}
                    {activeTrackingOrder.proof?.otpCode && (
                      <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-5 rounded-2xl text-center space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#9A3412] font-black uppercase">
                          <QrCode className="w-4 h-4" />
                          <span>Code OTP de Sécurité Client</span>
                        </div>
                        <div className="font-black text-3xl tracking-widest text-[#EA580C] font-mono bg-white py-2 rounded-xl border border-[#FFEDD5] shadow-sm">
                          {activeTrackingOrder.proof.otpCode}
                        </div>
                        <p className="text-[11px] text-[#9A3412] font-medium">
                          Fournissez ce code 4 chiffres au livreur pour valider la livraison.
                        </p>
                      </div>
                    )}

                    {/* Order Progress Step Tracker */}
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-bold text-gray-700">Étapes de Livraison :</div>
                      {[
                        { statusKey: 'pending', label: 'Commande enregistrée' },
                        { statusKey: 'preparing', label: 'Préparation chez le commerçant' },
                        { statusKey: 'ready_for_pickup', label: 'Prêt pour enlèvement par le livreur' },
                        { statusKey: 'in_transit', label: 'En cours d\'acheminement GPS' },
                        { statusKey: 'delivered', label: 'Livré & Validé par OTP' },
                      ].map((step, idx) => {
                        const isCompleted = activeTrackingOrder.status === 'delivered' || 
                          (step.statusKey === 'pending') ||
                          (step.statusKey === 'in_transit' && (activeTrackingOrder.status === 'in_transit' || activeTrackingOrder.status === 'delivered'));
                        return (
                          <div key={step.statusKey} className="flex items-center gap-3 text-xs">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isCompleted ? 'bg-[#009E49] text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className={isCompleted ? 'text-gray-900 font-extrabold' : 'text-gray-400 font-medium'}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Assigned Livreur Info */}
                    {activeTrackingOrder.assignedLivreur && (
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                        <div className="text-[11px] text-gray-400 font-bold">Votre Livreur Dédié</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={activeTrackingOrder.assignedLivreur.avatar}
                              alt={activeTrackingOrder.assignedLivreur.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            <div>
                              <div className="font-extrabold text-xs text-gray-900">{activeTrackingOrder.assignedLivreur.name}</div>
                              <div className="text-[10px] text-sky-600 font-bold">
                                {activeTrackingOrder.assignedLivreur.vehicle} | ⭐ {activeTrackingOrder.assignedLivreur.rating}
                              </div>
                            </div>
                          </div>
                          <a
                            href={`tel:${activeTrackingOrder.assignedLivreur.phone}`}
                            className="bg-[#009E49] hover:bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm"
                            title="Appeler le livreur"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Order Items List */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                      <div className="text-gray-500 font-bold">Contenu du Colis :</div>
                      {activeTrackingOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-gray-700">
                          <span>{item.quantity}x {item.productName}</span>
                          <span className="font-bold text-gray-900">{formatFCFA(item.priceFCFA * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-between text-xs font-black text-[#111827]">
                      <span>Total Payé :</span>
                      <span className="text-[#FF8C00]">{formatFCFA(activeTrackingOrder.totalFCFA)}</span>
                    </div>

                    {/* RATING & REVIEW MODULE FOR DELIVERED ORDERS */}
                    {activeTrackingOrder.status === 'delivered' && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-3 pt-3">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                          <span className="font-extrabold text-xs text-amber-950 font-['Outfit'] flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                            <span>Évaluer cette livraison</span>
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                            Livré
                          </span>
                        </div>

                        {activeTrackingOrder.review ? (
                          <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold border-b border-gray-100 pb-1.5">
                              <span className="flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Avis transmis</span>
                              </span>
                              <span className="text-gray-400 text-[10px]">{activeTrackingOrder.review.createdAt}</span>
                            </div>

                            <div className="space-y-2 text-[11px]">
                              <div className="bg-amber-50/60 p-2 rounded-lg space-y-0.5">
                                <div className="font-extrabold text-amber-950 flex justify-between">
                                  <span>🏍️ Livreur : {activeTrackingOrder.assignedLivreur?.name || 'Livreur'}</span>
                                  <span className="text-amber-600 font-black">⭐ {activeTrackingOrder.review.livreurRating}/5</span>
                                </div>
                                {activeTrackingOrder.review.livreurComment && (
                                  <p className="text-gray-600 italic text-[10px]">"{activeTrackingOrder.review.livreurComment}"</p>
                                )}
                              </div>

                              <div className="bg-orange-50/60 p-2 rounded-lg space-y-0.5">
                                <div className="font-extrabold text-orange-950 flex justify-between">
                                  <span>🏪 Commerçant : {activeTrackingOrder.items[0]?.merchantName || 'Boutique'}</span>
                                  <span className="text-amber-600 font-black">⭐ {activeTrackingOrder.review.merchantRating}/5</span>
                                </div>
                                {activeTrackingOrder.review.merchantComment && (
                                  <p className="text-gray-600 italic text-[10px]">"{activeTrackingOrder.review.merchantComment}"</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl p-3.5 border border-amber-200 space-y-3.5 text-xs">
                            <p className="text-[11px] text-amber-900 font-medium leading-tight">
                              Votre commande a été livrée ! Notez le livreur et le commerçant pour leur attribuer votre évaluation.
                            </p>

                            {/* Livreur Rating */}
                            <div className="space-y-1.5 pt-1">
                              <StarRatingInput
                                label={`🏍️ Notez le Livreur (${activeTrackingOrder.assignedLivreur?.name || 'Livreur'})`}
                                rating={livreurRating}
                                setRating={setLivreurRating}
                              />
                              <textarea
                                value={livreurComment}
                                onChange={e => setLivreurComment(e.target.value)}
                                placeholder="Avis sur le livreur (ponctualité, amabilité...)"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500 font-medium h-16 resize-none"
                              />
                            </div>

                            {/* Merchant Rating */}
                            <div className="space-y-1.5 pt-2 border-t border-gray-100">
                              <StarRatingInput
                                label={`🏪 Notez le Commerçant (${activeTrackingOrder.items[0]?.merchantName || 'Commerçant'})`}
                                rating={merchantRating}
                                setRating={setMerchantRating}
                              />
                              <textarea
                                value={merchantComment}
                                onChange={e => setMerchantComment(e.target.value)}
                                placeholder="Avis sur le commerçant (qualité du produit, emballage...)"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500 font-medium h-16 resize-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (onSaveOrderReview) {
                                  const newReview: OrderReview = {
                                    livreurRating,
                                    livreurComment,
                                    merchantRating,
                                    merchantComment,
                                    createdAt: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                  };
                                  onSaveOrderReview(activeTrackingOrder.id, newReview);
                                  setReviewToast('Merci pour votre évaluation ⭐ !');
                                  setTimeout(() => setReviewToast(null), 4000);
                                }
                              }}
                              className="w-full bg-[#FF8C00] hover:bg-orange-600 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Soumettre mon Avis</span>
                            </button>

                            {reviewToast && (
                              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span>{reviewToast}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time Interactive Leaflet Map Panel */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#009E49] animate-ping"></span>
                        <span className="font-black text-gray-900">Suivi GPS interactif en direct (Leaflet)</span>
                      </span>
                      <span className="text-gray-500 font-mono">
                        {activeTrackingOrder.originCityName} ➔ {activeTrackingOrder.destinationCityName}
                      </span>
                    </div>

                    <MapComponent
                      cities={cities}
                      selectedCityId={activeTrackingOrder.destinationCityId}
                      activeOrderTrack={activeTrackingOrder}
                      livreurs={activeTrackingOrder.assignedLivreur ? [activeTrackingOrder.assignedLivreur] : []}
                      height="480px"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
