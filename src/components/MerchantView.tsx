import React, { useState, useRef } from 'react';
import { Merchant, Product, Order, OrderStatus, CityNode } from '../types';
import { formatFCFA } from '../services/pricingService';
import { 
  Store, 
  Package, 
  Plus, 
  CheckCircle2, 
  Wallet, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Award, 
  ShoppingBag, 
  PieChart, 
  Camera, 
  Upload, 
  Smartphone, 
  MapPin, 
  Phone, 
  Tag, 
  X, 
  Sparkles,
  Building2,
  Check,
  RefreshCw,
  Eye,
  Share2,
  QrCode,
  MessageSquare,
  Car,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  Settings,
  Clock,
  Power,
  DollarSign,
  Copy,
  ExternalLink,
  Sliders,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface MerchantViewProps {
  merchants: Merchant[];
  products: Product[];
  orders: Order[];
  cities: CityNode[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAddProduct: (newProduct: Product) => void;
  onAddMerchant: (newMerchant: Merchant) => void;
}

// Preset Category Avatars for Shops
const CATEGORY_AVATARS: Record<string, string> = {
  chaussures: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80',
  parfum: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80',
  telephone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80',
  repas: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80',
  general: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
};

// Preset Category Images for Products
const PRESET_PRODUCT_IMAGES: Record<string, string[]> = {
  chaussures: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
  ],
  parfum: [
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80',
  ],
  telephone: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80',
  ],
  repas: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  ],
  general: [
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  ]
};

export interface YangoTransaction {
  id: string;
  type: 'sale_recharge' | 'pool_topup' | 'yango_express_dispatch';
  driverName: string;
  driverPhone: string;
  amountFCFA: number;
  commissionFCFA: number;
  voucherCode?: string;
  date: string;
  status: 'completed' | 'pending';
  paymentMethod: string;
}

export const MerchantView: React.FC<MerchantViewProps> = ({
  merchants,
  products,
  orders,
  cities,
  onUpdateOrderStatus,
  onAddProduct,
  onAddMerchant,
}) => {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(merchants[0]?.id || 'm1');
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'orders' | 'yango' | 'wallet' | 'settings'>('overview');
  
  // Modals & Panels State
  const [isCreatingShop, setIsCreatingShop] = useState<boolean>(false);
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [isStorefrontPreviewOpen, setIsStorefrontPreviewOpen] = useState<boolean>(false);
  const [showQrCodeModal, setShowQrCodeModal] = useState<boolean>(false);
  const [copiedLinkToast, setCopiedLinkToast] = useState<boolean>(false);
  const [creationSuccessNotice, setCreationSuccessNotice] = useState<string | null>(null);

  // --- NEW SHOP FORM STATE ---
  const [shopName, setShopName] = useState<string>('');
  const [shopCategory, setShopCategory] = useState<'chaussures' | 'parfum' | 'telephone' | 'repas' | 'general'>('general');
  const [shopCityId, setShopCityId] = useState<string>(cities[0]?.id || 'abidjan');
  const [shopAddress, setShopAddress] = useState<string>('');
  const [shopPhone, setShopPhone] = useState<string>('+225 ');
  const [shopAvatar, setShopAvatar] = useState<string>(CATEGORY_AVATARS.general);
  const [shopAvatarFileName, setShopAvatarFileName] = useState<string>('');
  
  const shopLogoInputRef = useRef<HTMLInputElement>(null);

  // --- NEW PRODUCT FORM STATE ---
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'chaussures' | 'parfum' | 'telephone' | 'repas' | 'general'>('chaussures');
  const [newPriceFCFA, setNewPriceFCFA] = useState<number>(15000);
  const [newWeightKg, setNewWeightKg] = useState<number>(0.8);
  const [newDescription, setNewDescription] = useState<string>('');
  const [newImage, setNewImage] = useState<string>(PRESET_PRODUCT_IMAGES.chaussures[0]);
  const [productFileName, setProductFileName] = useState<string>('');
  
  const productPhotoInputRef = useRef<HTMLInputElement>(null);

  // --- PRODUCT STOCK INTERACTIVE STATE ---
  const [stockMap, setStockMap] = useState<Record<string, boolean>>({});

  // --- YANGO POINT OF SALE STATE ---
  const [yangoPoolFCFA, setYangoPoolFCFA] = useState<number>(150000);
  const [yangoCommissionsFCFA, setYangoCommissionsFCFA] = useState<number>(18500);
  const [yangoDriverName, setYangoDriverName] = useState<string>('');
  const [yangoDriverPhone, setYangoDriverPhone] = useState<string>('+225 07 ');
  const [yangoRechargeAmountFCFA, setYangoRechargeAmountFCFA] = useState<number>(5000);
  const [yangoPaymentMethod, setYangoPaymentMethod] = useState<'cash' | 'wave' | 'orange_money' | 'mtn_money'>('cash');
  const [lastVoucherGenerated, setLastVoucherGenerated] = useState<{ code: string; driver: string; amount: number; commission: number } | null>(null);

  // Yango Pool Top-up
  const [yangoTopUpAmount, setYangoTopUpAmount] = useState<number>(50000);
  const [yangoTopUpMethod, setYangoTopUpMethod] = useState<'wave' | 'orange_money' | 'mtn_money'>('wave');

  // Yango Express Courier Dispatch
  const [yangoExpressAddress, setYangoExpressAddress] = useState<string>('');
  const [yangoExpressCustomerPhone, setYangoExpressCustomerPhone] = useState<string>('+225 ');
  const [yangoExpressNotice, setYangoExpressNotice] = useState<string | null>(null);

  // Mock Yango Transactions History
  const [yangoTransactions, setYangoTransactions] = useState<YangoTransaction[]>([
    {
      id: 'yt-101',
      type: 'sale_recharge',
      driverName: 'Traoré Mamadou (Chauffeur Yango Pro)',
      driverPhone: '+225 07 44 11 22 33',
      amountFCFA: 10000,
      commissionFCFA: 500,
      voucherCode: 'YANGO-8821-4401',
      date: 'Aujourd\'hui, 11:15',
      status: 'completed',
      paymentMethod: 'cash',
    },
    {
      id: 'yt-102',
      type: 'sale_recharge',
      driverName: 'Kouassi Jean (Chauffeur Yango Express)',
      driverPhone: '+225 05 99 88 77 66',
      amountFCFA: 5000,
      commissionFCFA: 250,
      voucherCode: 'YANGO-9912-3382',
      date: 'Aujourd\'hui, 09:40',
      status: 'completed',
      paymentMethod: 'wave',
    },
    {
      id: 'yt-103',
      type: 'pool_topup',
      driverName: 'Approvisionnement Pool Guichet',
      driverPhone: '+225 07 00 00 00 00',
      amountFCFA: 100000,
      commissionFCFA: 0,
      date: 'Hier, 18:00',
      status: 'completed',
      paymentMethod: 'wave',
    }
  ]);

  // --- STORE SETTINGS STATE ---
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  const [editStoreName, setEditStoreName] = useState<string>('');
  const [editStoreAddress, setEditStoreAddress] = useState<string>('');
  const [editStorePhone, setEditStorePhone] = useState<string>('');
  const [editStoreNotice, setEditStoreNotice] = useState<string | null>(null);

  // --- WALLET WITHDRAWAL STATE ---
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(25000);
  const [withdrawalMethod, setWithdrawalMethod] = useState<'wave' | 'orange_money' | 'mtn_money'>('wave');
  const [withdrawalPhone, setWithdrawalPhone] = useState<string>('+225 07 ');
  const [withdrawalSuccessNotice, setWithdrawalSuccessNotice] = useState<string | null>(null);

  // Active Selected Merchant
  const currentMerchant = merchants.find(m => m.id === selectedMerchantId) || merchants[0] || {
    id: 'm1',
    name: 'Ma Boutique Ivoire',
    category: 'general',
    cityId: 'abidjan',
    cityName: 'Abidjan',
    address: 'Centre Ville',
    rating: 5.0,
    avatar: CATEGORY_AVATARS.general,
    phone: '+225 07 00 00 00 00',
  };

  // Merchant products & orders
  const merchantProducts = products.filter(p => p.merchantId === selectedMerchantId);
  const merchantOrders = orders.filter(o => o.items.some(i => i.merchantId === selectedMerchantId));

  // Total Wallet Revenue Sum
  const totalRevenueFCFA = merchantOrders.reduce((sum, o) => {
    const myItems = o.items.filter(i => i.merchantId === selectedMerchantId);
    return sum + myItems.reduce((s, i) => s + (i.priceFCFA * i.quantity), 0);
  }, 0);

  // Current week date threshold (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklyOrders = merchantOrders.filter(o => {
    const d = new Date(o.createdAt);
    return !isNaN(d.getTime()) && d >= sevenDaysAgo;
  });

  const weeklyRevenueFCFA = weeklyOrders.reduce((sum, o) => {
    const myItems = o.items.filter(i => i.merchantId === selectedMerchantId);
    return sum + myItems.reduce((s, i) => s + (i.priceFCFA * i.quantity), 0);
  }, 0);

  const weeklyUnitsSold = weeklyOrders.reduce((sum, o) => {
    const myItems = o.items.filter(i => i.merchantId === selectedMerchantId);
    return sum + myItems.reduce((s, i) => s + i.quantity, 0);
  }, 0);

  // Map of product sales for this merchant
  const productSalesMap = new Map<string, {
    productId: string;
    productName: string;
    image?: string;
    priceFCFA: number;
    weeklyQty: number;
    weeklyRevenueFCFA: number;
    totalQty: number;
    totalRevenueFCFA: number;
  }>();

  merchantProducts.forEach(p => {
    productSalesMap.set(p.id, {
      productId: p.id,
      productName: p.name,
      image: p.image,
      priceFCFA: p.priceFCFA,
      weeklyQty: 0,
      weeklyRevenueFCFA: 0,
      totalQty: 0,
      totalRevenueFCFA: 0,
    });
  });

  merchantOrders.forEach(o => {
    const orderDate = new Date(o.createdAt);
    const isWeekly = !isNaN(orderDate.getTime()) && orderDate >= sevenDaysAgo;

    o.items.forEach(item => {
      if (item.merchantId === selectedMerchantId) {
        let entry = productSalesMap.get(item.productId);
        if (!entry) {
          const matchedProd = merchantProducts.find(p => p.name === item.productName);
          if (matchedProd) {
            entry = productSalesMap.get(matchedProd.id);
          }
        }
        if (!entry) {
          entry = {
            productId: item.productId,
            productName: item.productName,
            priceFCFA: item.priceFCFA,
            weeklyQty: 0,
            weeklyRevenueFCFA: 0,
            totalQty: 0,
            totalRevenueFCFA: 0,
          };
          productSalesMap.set(item.productId, entry);
        }

        entry.totalQty += item.quantity;
        entry.totalRevenueFCFA += item.priceFCFA * item.quantity;

        if (isWeekly) {
          entry.weeklyQty += item.quantity;
          entry.weeklyRevenueFCFA += item.priceFCFA * item.quantity;
        }
      }
    });
  });

  const productSalesList = Array.from(productSalesMap.values()).sort((a, b) => b.totalRevenueFCFA - a.totalRevenueFCFA);
  const topSellingProduct = productSalesList[0];

  // --- HANDLER: Upload Shop Logo ---
  const handleShopLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShopAvatarFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) setShopAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- HANDLER: Upload Product Photo ---
  const handleProductPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- HANDLER: Create Shop Submit & Auto-Preview ---
  const handleCreateShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    const targetCity = cities.find(c => c.id === shopCityId) || cities[0];

    const newMerchant: Merchant = {
      id: `m_${Date.now()}`,
      name: shopName.trim(),
      category: shopCategory,
      cityId: targetCity?.id || 'abidjan',
      cityName: targetCity?.name || 'Abidjan',
      address: shopAddress.trim() || 'Centre Ville',
      rating: 5.0,
      avatar: shopAvatar || CATEGORY_AVATARS[shopCategory] || CATEGORY_AVATARS.general,
      phone: shopPhone.trim() || '+225 07 00 00 00 00',
    };

    onAddMerchant(newMerchant);
    setSelectedMerchantId(newMerchant.id);
    setIsCreatingShop(false);

    // Set success banner & trigger Storefront Preview
    setCreationSuccessNotice(`Félicitations ! La boutique "${newMerchant.name}" est créée et en ligne.`);
    setIsStorefrontPreviewOpen(true);

    // Reset Form
    setShopName('');
    setShopAddress('');
    setShopPhone('+225 ');
    setShopAvatarFileName('');
    setShopAvatar(CATEGORY_AVATARS.general);
  };

  // --- HANDLER: Create Product Submit ---
  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProd: Product = {
      id: `p-${Date.now()}`,
      merchantId: currentMerchant.id,
      merchantName: currentMerchant.name,
      name: newName.trim(),
      category: newCategory,
      priceFCFA: Number(newPriceFCFA) || 1000,
      weightKg: Number(newWeightKg) || 0.5,
      image: newImage || PRESET_PRODUCT_IMAGES[newCategory][0],
      description: newDescription.trim() || 'Produit authentique disponible immédiatement en stock.',
      cityId: currentMerchant.cityId,
      cityName: currentMerchant.cityName,
      inStock: true
    };

    onAddProduct(newProd);
    setIsAddingProduct(false);

    // Reset Form
    setNewName('');
    setNewDescription('');
    setProductFileName('');
    setNewPriceFCFA(15000);
    setNewWeightKg(0.8);
  };

  // --- HANDLER: Toggle Stock Availability ---
  const handleToggleStock = (productId: string, currentInStock: boolean) => {
    setStockMap(prev => ({
      ...prev,
      [productId]: !(prev[productId] ?? currentInStock)
    }));
  };

  // --- HANDLER: Sell Yango Recharge Voucher ---
  const handleSellYangoRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (yangoPoolFCFA < yangoRechargeAmountFCFA) {
      alert("Solde du pool Yango insuffisant ! Veuillez réapprovisionner le coffre-fort de la boutique.");
      return;
    }

    const commission = Math.round(yangoRechargeAmountFCFA * 0.05); // 5% commission
    const randomVoucherCode = `YANGO-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: YangoTransaction = {
      id: `yt-${Date.now()}`,
      type: 'sale_recharge',
      driverName: yangoDriverName.trim() || 'Chauffeur / Client Yango',
      driverPhone: yangoDriverPhone.trim() || '+225 07 00 00 00 00',
      amountFCFA: yangoRechargeAmountFCFA,
      commissionFCFA: commission,
      voucherCode: randomVoucherCode,
      date: 'À l\'instant',
      status: 'completed',
      paymentMethod: yangoPaymentMethod,
    };

    setYangoPoolFCFA(prev => prev - yangoRechargeAmountFCFA);
    setYangoCommissionsFCFA(prev => prev + commission);
    setYangoTransactions(prev => [newTx, ...prev]);
    setLastVoucherGenerated({
      code: randomVoucherCode,
      driver: newTx.driverName,
      amount: yangoRechargeAmountFCFA,
      commission,
    });

    setYangoDriverName('');
    setYangoDriverPhone('+225 07 ');
  };

  // --- HANDLER: Top-up Yango Wholesale Pool ---
  const handleTopUpYangoPool = (e: React.FormEvent) => {
    e.preventDefault();
    setYangoPoolFCFA(prev => prev + yangoTopUpAmount);
    
    const newTx: YangoTransaction = {
      id: `yt-top-${Date.now()}`,
      type: 'pool_topup',
      driverName: 'Recharge Coffre-Fort Yango',
      driverPhone: currentMerchant.phone,
      amountFCFA: yangoTopUpAmount,
      commissionFCFA: 0,
      date: 'À l\'instant',
      status: 'completed',
      paymentMethod: yangoTopUpMethod,
    };
    setYangoTransactions(prev => [newTx, ...prev]);
  };

  // --- HANDLER: Dispatch Yango Express Courier ---
  const handleDispatchYangoCourier = (e: React.FormEvent) => {
    e.preventDefault();
    setYangoExpressNotice(`Chauffeur Yango Express demandé pour ${yangoExpressAddress}. Arrivée estimée au guichet : 8 mins.`);
    setTimeout(() => setYangoExpressNotice(null), 6000);
    setYangoExpressAddress('');
    setYangoExpressCustomerPhone('+225 ');
  };

  // --- HANDLER: Save Store Settings ---
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setEditStoreNotice('Modifications enregistrées avec succès ! La boutique est à jour.');
    setTimeout(() => setEditStoreNotice(null), 4000);
  };

  // --- HANDLER: Withdraw Wallet Money ---
  const handleWithdrawWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalSuccessNotice(`Demande de retrait de ${formatFCFA(withdrawalAmount)} transmise vers ${withdrawalMethod.toUpperCase()} (${withdrawalPhone}). Payout instantané en cours.`);
    setTimeout(() => setWithdrawalSuccessNotice(null), 5000);
  };

  // Copy Store Link Simulator
  const handleCopyStoreLink = () => {
    setCopiedLinkToast(true);
    setTimeout(() => setCopiedLinkToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Creation Notice Banner */}
      {creationSuccessNotice && (
        <div className="bg-[#ECFDF5] border border-emerald-300 p-4 rounded-3xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#009E49] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-emerald-950">{creationSuccessNotice}</h4>
              <p className="text-xs text-emerald-800 font-medium">Votre vitrine est immédiatement accessible pour tous les clients du réseau national.</p>
            </div>
          </div>
          <button
            onClick={() => setIsStorefrontPreviewOpen(true)}
            className="bg-[#009E49] hover:bg-emerald-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0"
          >
            <Eye className="w-4 h-4" />
            <span>Voir Vitrine</span>
          </button>
        </div>
      )}

      {/* Merchant Header & Switcher / Create Shop Banner */}
      <div className="bg-white border border-gray-100 p-4 sm:p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={currentMerchant.avatar}
              alt={currentMerchant.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#009E49] shadow-sm shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-[#009E49] font-black uppercase tracking-wider">Boutique Officielle</span>
                <span className="bg-emerald-50 text-[#009E49] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  {currentMerchant.cityName}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isStoreOpen ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-red-100 text-red-900 border-red-300'
                }`}>
                  {isStoreOpen ? '🟢 Ouverte' : '🔴 Fermée'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#111827]">{currentMerchant.name}</h2>
              <div className="text-[11px] sm:text-xs text-gray-500 flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 font-medium">
                <span>📍 {currentMerchant.address}</span>
                <span>•</span>
                <span>📞 {currentMerchant.phone}</span>
                <span>•</span>
                <span className="text-[#FF8C00] font-black">⭐ {currentMerchant.rating}</span>
              </div>
            </div>
          </div>

          {/* Actions: Selector, Storefront Preview & Create Shop */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 sm:p-2 rounded-2xl border border-gray-200 text-xs w-full sm:w-auto">
              <Store className="w-4 h-4 text-[#009E49] shrink-0" />
              <span className="text-gray-500 font-bold shrink-0 hidden sm:inline">Mes Boutiques :</span>
              <select
                value={selectedMerchantId}
                onChange={e => setSelectedMerchantId(e.target.value)}
                className="bg-white text-gray-800 font-bold px-2.5 py-1.5 rounded-xl border border-gray-200 cursor-pointer focus:outline-none w-full sm:w-auto text-xs"
              >
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.cityName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* BUTTON: STOREFRONT PREVIEW */}
              <button
                onClick={() => setIsStorefrontPreviewOpen(true)}
                className="bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 font-black px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
                <span className="truncate">Vitrine Publique</span>
              </button>

              {/* BUTTON: CREATE NEW SHOP */}
              <button
                onClick={() => setIsCreatingShop(true)}
                className="bg-gradient-to-r from-[#009E49] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-md transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">+ Créer Boutique</span>
              </button>
            </div>
          </div>
        </div>

        {/* SHOP CONTROL TABS */}
        <div className="flex items-center gap-1.5 border-t border-gray-100 pt-3 overflow-x-auto text-xs font-bold scrollbar-none pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#009E49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Tableau de Bord</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer ${
              activeTab === 'catalog' ? 'bg-[#009E49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Catalogue ({merchantProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer ${
              activeTab === 'orders' ? 'bg-[#009E49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Commandes ({merchantOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('yango')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer ${
              activeTab === 'yango' ? 'bg-[#FF8C00] text-white shadow-sm' : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Car className="w-4 h-4 shrink-0" />
            <span>Guichet Yango</span>
            <span className="bg-amber-900 text-amber-100 text-[10px] px-1.5 py-0.2 rounded-md font-black">5%</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer ${
              activeTab === 'wallet' ? 'bg-[#009E49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>Portefeuille ({formatFCFA(totalRevenueFCFA)})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-200 ease-out transform hover:scale-105 cursor-pointer ${
              activeTab === 'settings' ? 'bg-[#009E49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Paramètres</span>
          </button>
        </div>

      </div>

      {/* --- MODAL: STOREFRONT PUBLIC PREVIEW --- */}
      {isStorefrontPreviewOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-2xl border border-gray-100 my-auto animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-800 via-[#009E49] to-teal-700 p-4 sm:p-6 text-white space-y-4">
              <button
                onClick={() => setIsStorefrontPreviewOpen(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left pt-2 sm:pt-0">
                <img
                  src={currentMerchant.avatar}
                  alt={currentMerchant.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white/90 shadow-lg shrink-0 bg-white"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Award className="w-3 h-3" /> Boutique Vérifiée
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full">
                      📍 {currentMerchant.cityName}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">{currentMerchant.name}</h2>
                  <p className="text-xs text-emerald-100 font-medium">
                    {currentMerchant.address} • Contact WhatsApp : {currentMerchant.phone}
                  </p>
                </div>
              </div>

              {/* Share & QR Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-extrabold">⭐ {currentMerchant.rating} / 5.0</span>
                  <span>•</span>
                  <span>{merchantProducts.length} article(s) disponibles</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyStoreLink}
                    className="bg-white text-[#009E49] hover:bg-emerald-50 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Lien Boutique</span>
                  </button>

                  <button
                    onClick={() => setShowQrCodeModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                  </button>

                  <a
                    href={`https://wa.me/${currentMerchant.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {copiedLinkToast && (
                <div className="bg-white text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-xl text-center shadow-md animate-in fade-in">
                  ✅ Lien de la boutique copié ! Prêt à partager sur WhatsApp & Réseaux Sociaux.
                </div>
              )}
            </div>

            {/* Public Catalog View for Clients */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-gray-900 font-['Outfit']">
                  Articles en Vitrine ({merchantProducts.length})
                </h3>
                <span className="text-xs text-gray-500 font-medium">Vue telle qu'affichée pour vos clients</span>
              </div>

              {merchantProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  Votre boutique n'a pas encore d'article. Cliquez sur <strong>"Ajouter un Article"</strong> dans votre espace commerçant pour garnir votre vitrine !
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {merchantProducts.map(product => {
                    const isInStock = stockMap[product.id] ?? product.inStock;

                    return (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between transition-all duration-300 ease-out transform hover:scale-[1.03] hover:-translate-y-1 hover:shadow-lg group">
                        <div className="space-y-2">
                          <div className="relative rounded-xl overflow-hidden bg-gray-100 h-36">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                            <span className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isInStock ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {isInStock ? 'En Stock' : 'Rupture'}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{product.description}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div className="text-[#009E49] font-black text-base font-['Outfit']">
                            {formatFCFA(product.priceFCFA)}
                          </div>

                          <button
                            disabled={!isInStock}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs ${
                              isInStock ? 'bg-[#009E49] hover:bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{isInStock ? 'Commander' : 'Indisponible'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setIsStorefrontPreviewOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold px-6 py-2.5 rounded-2xl text-xs"
              >
                Fermer l'Aperçu Vitrine
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL: QR CODE GENERATOR --- */}
      {showQrCodeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-[#009E49] rounded-2xl flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-900">QR Code de {currentMerchant.name}</h3>
            <p className="text-xs text-gray-500">Imprimez ce QR Code et collez-le dans votre magasin pour permettre à vos clients de commander instantanément sur leur smartphone.</p>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 inline-block">
              <div className="w-40 h-40 bg-white p-2 border-2 border-emerald-500 rounded-xl flex items-center justify-center font-mono text-xs text-gray-400 text-center font-bold">
                [ QR CODE CLIENT ]<br />{currentMerchant.name}
              </div>
            </div>

            <button
              onClick={() => setShowQrCodeModal(false)}
              className="w-full bg-[#009E49] text-white font-extrabold py-2.5 rounded-xl text-xs"
            >
              Fermer & Imprimer
            </button>
          </div>
        </div>
      )}

      {/* --- CREATE CUSTOM SHOP MODAL --- */}
      {isCreatingShop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-2xl border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#009E49] to-emerald-700 text-white flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-[#111827] font-['Outfit']">
                    Créer Votre Boutique Personnalisée
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Configurez votre espace commerçant et commencez à vendre dans toute la Côte d'Ivoire.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreatingShop(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShopSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Shop Name */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-extrabold mb-1">
                    Nom de la Boutique *
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="Ex: Tendance Ivoire, Maison du Pagne, Électronique Express..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-semibold focus:outline-none focus:border-[#009E49] focus:bg-white transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">
                    Catégorie Principale *
                  </label>
                  <select
                    value={shopCategory}
                    onChange={e => {
                      const cat = e.target.value as any;
                      setShopCategory(cat);
                      if (!shopAvatarFileName) {
                        setShopAvatar(CATEGORY_AVATARS[cat] || CATEGORY_AVATARS.general);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-[#009E49] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="general">Commerce Général & Artisanal</option>
                    <option value="chaussures">Chaussures, Cuir & Mode</option>
                    <option value="parfum">Parfums, Beauté & Cosmétique</option>
                    <option value="telephone">Téléphones, High-Tech & Électronique</option>
                    <option value="repas">Gastronomie, Fast-Food & Restauration</option>
                  </select>
                </div>

                {/* City Location */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">
                    Ville / District d'Implantation *
                  </label>
                  <select
                    value={shopCityId}
                    onChange={e => setShopCityId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-[#009E49] focus:bg-white transition-all cursor-pointer"
                  >
                    {cities.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.region})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">
                    Adresse / Quartier / Repère *
                  </label>
                  <input
                    type="text"
                    required
                    value={shopAddress}
                    onChange={e => setShopAddress(e.target.value)}
                    placeholder="Ex: Cocody Angré 8ème Tranche, Quartier Commerce..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:outline-none focus:border-[#009E49] focus:bg-white transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">
                    Téléphone / WhatsApp Commercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={shopPhone}
                    onChange={e => setShopPhone(e.target.value)}
                    placeholder="+225 07 01 02 03 04"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-[#009E49] focus:bg-white transition-all"
                  />
                </div>

                {/* Logo / Avatar Upload From Device */}
                <div className="sm:col-span-2 space-y-2 pt-2 border-t border-gray-100">
                  <label className="block text-gray-800 font-extrabold">
                    Logo / Image de Couverture de la Boutique
                  </label>
                  
                  <input
                    type="file"
                    ref={shopLogoInputRef}
                    accept="image/*"
                    onChange={handleShopLogoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300">
                    <img
                      src={shopAvatar}
                      alt="Aperçu Logo"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#009E49] shadow-sm shrink-0 bg-white"
                    />

                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <div className="text-xs font-bold text-gray-800">
                        {shopAvatarFileName ? (
                          <span className="text-[#009E49] flex items-center justify-center sm:justify-start gap-1 font-extrabold">
                            <Check className="w-4 h-4" /> Fichier chargé : {shopAvatarFileName}
                          </span>
                        ) : (
                          'Importer un logo depuis votre appareil ou smartphone'
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Formats acceptés : PNG, JPG, WEBP.
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => shopLogoInputRef.current?.click()}
                          className="bg-[#009E49] hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choisir Fichier Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShopAvatar(CATEGORY_AVATARS[shopCategory] || CATEGORY_AVATARS.general);
                            setShopAvatarFileName('');
                          }}
                          className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Logo Prédéfini</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingShop(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#009E49] hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Activer Ma Boutique</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- TAB 1: OVERVIEW & DASHBOARD --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            <div className="bg-white border border-gray-100 p-5 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-gray-500 font-bold">Revenu Total Ventes</div>
                <div className="text-2xl font-black text-[#009E49] font-['Outfit']">{formatFCFA(totalRevenueFCFA)}</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#ECFDF5] text-[#009E49] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-gray-500 font-bold">Commandes Reçues</div>
                <div className="text-2xl font-black text-[#FF8C00] font-['Outfit']">{merchantOrders.length}</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#FF8C00] flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-3xl flex items-center justify-between shadow-sm col-span-2 sm:col-span-1">
              <div>
                <div className="text-xs text-gray-500 font-bold">Articles en Vitrine</div>
                <div className="text-2xl font-black text-sky-600 font-['Outfit']">{merchantProducts.length}</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Tableau de Bord des Ventes Hebdomadaires */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#009E49] to-emerald-700 text-white flex items-center justify-center shadow-md">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#111827] font-['Outfit']">
                    Tableau de Bord des Ventes Hebdomadaires
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Analyse des revenus générés et du volume de ventes par produit pour la semaine en cours.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs px-3 py-1.5 rounded-2xl font-extrabold">
                <Calendar className="w-3.5 h-3.5 text-[#009E49]" />
                <span>Semaine en Cours (7 Derniers Jours)</span>
              </div>
            </div>

            {/* Weekly Performance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-200/80 p-4 rounded-2xl space-y-1">
                <div className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Revenus Semaine</span>
                  <Wallet className="w-4 h-4 text-[#009E49]" />
                </div>
                <div className="text-2xl font-black text-emerald-950 font-['Outfit']">
                  {formatFCFA(weeklyRevenueFCFA)}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  Chiffre d'affaires 7 derniers jours
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100/40 border border-amber-200/80 p-4 rounded-2xl space-y-1">
                <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Volume Ventes</span>
                  <ShoppingBag className="w-4 h-4 text-[#FF8C00]" />
                </div>
                <div className="text-2xl font-black text-amber-950 font-['Outfit']">
                  {weeklyUnitsSold} <span className="text-xs font-bold text-amber-800">unités</span>
                </div>
                <div className="text-[10px] text-amber-800 font-bold">
                  {weeklyOrders.length} commande(s) validée(s)
                </div>
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-sky-100/40 border border-sky-200/80 p-4 rounded-2xl space-y-1">
                <div className="text-[11px] font-black text-sky-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Panier Moyen</span>
                  <PieChart className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-sky-950 font-['Outfit']">
                  {weeklyOrders.length > 0 ? formatFCFA(Math.round(weeklyRevenueFCFA / weeklyOrders.length)) : '0 FCFA'}
                </div>
                <div className="text-[10px] text-sky-700 font-bold">
                  Valeur moyenne par commande
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-100/40 border border-purple-200/80 p-4 rounded-2xl space-y-1">
                <div className="text-[11px] font-black text-purple-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Top Vente Semaine</span>
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-sm font-black text-purple-950 truncate font-['Outfit']">
                  {topSellingProduct ? topSellingProduct.productName : 'Aucun produit'}
                </div>
                <div className="text-[10px] text-purple-700 font-bold">
                  {topSellingProduct && (topSellingProduct.weeklyQty > 0 || topSellingProduct.totalQty > 0)
                    ? `${topSellingProduct.weeklyQty || topSellingProduct.totalQty} unité(s) • ${formatFCFA(topSellingProduct.weeklyRevenueFCFA || topSellingProduct.totalRevenueFCFA)}`
                    : 'Pas encore de vente'}
                </div>
              </div>
            </div>

            {/* Sales Volume by Product Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-gray-800">
                <span>Détail des Ventes par Produit (Volume & Revenus)</span>
                <span className="text-gray-400 font-medium">{productSalesList.length} référence(s)</span>
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
                {productSalesList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 font-medium">
                    Aucun produit dans le catalogue de cette boutique.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {productSalesList.map((item, index) => {
                      const maxRevenue = productSalesList[0]?.weeklyRevenueFCFA || productSalesList[0]?.totalRevenueFCFA || 1;
                      const currentRevenue = item.weeklyRevenueFCFA || item.totalRevenueFCFA;
                      const percentage = Math.min(100, Math.round((currentRevenue / (weeklyRevenueFCFA || totalRevenueFCFA || 1)) * 100));
                      const barWidth = Math.min(100, Math.round((currentRevenue / maxRevenue) * 100));

                      return (
                        <div key={item.productId || index} className="p-3.5 bg-white hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          
                          <div className="flex items-center gap-3 min-w-[220px]">
                            {item.image ? (
                              <img src={item.image} alt={item.productName} className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#009E49] flex items-center justify-center font-black text-sm shrink-0">
                                📦
                              </div>
                            )}
                            <div>
                              <h4 className="font-extrabold text-gray-900 text-xs line-clamp-1">{item.productName}</h4>
                              <div className="text-gray-500 text-[11px] font-medium">
                                Prix : <span className="font-bold text-gray-800">{formatFCFA(item.priceFCFA)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 max-w-md space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-gray-600">
                              <span>Part C.A. : <strong className="text-[#009E49]">{percentage}%</strong></span>
                              <span>{formatFCFA(item.weeklyRevenueFCFA || item.totalRevenueFCFA)}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#009E49] to-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(4, barWidth)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-right">
                            <div className="bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                              <div className="text-[10px] text-emerald-800 font-bold uppercase">Volume Semaine</div>
                              <div className="text-xs font-black text-[#009E49]">
                                {item.weeklyQty} {item.weeklyQty > 1 ? 'unités' : 'unité'}
                              </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-100 px-3 py-1 rounded-xl">
                              <div className="text-[10px] text-amber-800 font-bold uppercase">Total Cumulé</div>
                              <div className="text-xs font-black text-[#FF8C00]">
                                {item.totalQty} vendus
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CATALOG & STOCK MANAGEMENT --- */}
      {activeTab === 'catalog' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-bold text-lg text-[#111827] font-['Outfit'] flex items-center gap-2">
                <span>Gestion du Catalogue & Disponibilité Stock ({merchantProducts.length})</span>
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Gérez l'état des stocks, les prix, et ajoutez des articles depuis votre smartphone.
              </p>
            </div>

            <button
              onClick={() => setIsAddingProduct(!isAddingProduct)}
              className="bg-[#FF8C00] hover:bg-orange-600 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              {isAddingProduct ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isAddingProduct ? 'Fermer le formulaire' : 'Ajouter un Article (Appareil)'}</span>
            </button>
          </div>

          {/* --- ADD PRODUCT FORM (WITH DEVICE FILE & CAMERA UPLOAD) --- */}
          {isAddingProduct && (
            <form onSubmit={handleCreateProductSubmit} className="bg-gradient-to-br from-amber-50/40 via-gray-50 to-emerald-50/30 p-6 rounded-3xl border border-amber-200/60 space-y-5 animate-in fade-in duration-200 shadow-sm">
              
              <div className="flex items-center justify-between border-b border-amber-200/50 pb-3">
                <div className="flex items-center gap-2 text-[#FF8C00]">
                  <Smartphone className="w-5 h-5" />
                  <h4 className="font-black text-sm">Nouveau Produit en Vitrine pour {currentMerchant.name}</h4>
                </div>

                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  📱 Importation Appareil & Galerie
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Product Name */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Nom de l'Article *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Basket Running Cuir, Parfum Oud Luxe, iPhone 15 Pro..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 font-semibold focus:outline-none focus:border-[#FF8C00] shadow-xs"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Catégorie *</label>
                  <select
                    value={newCategory}
                    onChange={e => {
                      const cat = e.target.value as any;
                      setNewCategory(cat);
                      if (!productFileName) {
                        setNewImage(PRESET_PRODUCT_IMAGES[cat]?.[0] || PRESET_PRODUCT_IMAGES.general[0]);
                      }
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 font-bold focus:outline-none focus:border-[#FF8C00] cursor-pointer shadow-xs"
                  >
                    <option value="chaussures">Chaussures & Cuir</option>
                    <option value="parfum">Parfums & Beauté</option>
                    <option value="telephone">Téléphones & Électronique</option>
                    <option value="repas">Repas & Gastronomie</option>
                    <option value="general">Articles Divers & Artisanat</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Prix de Vente (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="500"
                    value={newPriceFCFA}
                    onChange={e => setNewPriceFCFA(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-black focus:outline-none focus:border-[#FF8C00] shadow-xs"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Poids Estimé Colis (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newWeightKg}
                    onChange={e => setNewWeightKg(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 font-bold focus:outline-none focus:border-[#FF8C00] shadow-xs"
                  />
                </div>

                {/* DEVICE PHOTO UPLOAD & PREVIEW SECTION */}
                <div className="sm:col-span-2 space-y-2 pt-2 border-t border-gray-200/60">
                  <label className="block text-gray-800 font-extrabold">
                    Photo de l'Article depuis votre Smartphone ou Appareil
                  </label>

                  <input
                    type="file"
                    ref={productPhotoInputRef}
                    accept="image/*"
                    onChange={handleProductPhotoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                    
                    <img
                      src={newImage}
                      alt="Aperçu Produit"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#FF8C00] shadow-sm shrink-0 bg-gray-100"
                    />

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <div className="text-xs font-bold text-gray-800">
                        {productFileName ? (
                          <span className="text-[#009E49] flex items-center justify-center sm:justify-start gap-1 font-extrabold">
                            <Check className="w-4 h-4" /> Photo importée : {productFileName}
                          </span>
                        ) : (
                          'Prenez une photo en direct ou choisissez dans votre galerie'
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium">
                        📱 Compatible avec appareil photo smartphone, tablette et fichiers image.
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => productPhotoInputRef.current?.click()}
                          className="bg-[#FF8C00] hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Prendre Photo / Galerie</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const presets = PRESET_PRODUCT_IMAGES[newCategory] || PRESET_PRODUCT_IMAGES.general;
                            const nextImg = presets[(presets.indexOf(newImage) + 1) % presets.length] || presets[0];
                            setNewImage(nextImg);
                            setProductFileName('');
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Autre image modèle</span>
                        </button>

                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-extrabold mb-1">Description & Spécifications</label>
                  <textarea
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Ex: Produit en cuir véritable fait main, disponible en plusieurs tailles avec garantie..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 font-medium focus:outline-none focus:border-[#FF8C00] h-20 shadow-xs"
                  />
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-[#009E49] hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publier l'Article dans {currentMerchant.name}</span>
                </button>
              </div>

            </form>
          )}

          {/* Interactive Products & Stock Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchantProducts.length === 0 ? (
              <div className="sm:col-span-3 text-center py-8 text-gray-400 text-xs font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Aucun produit dans le catalogue de cette boutique. Cliquez sur <strong>"Ajouter un Article"</strong> pour publier votre premier produit.
              </div>
            ) : (
              merchantProducts.map(p => {
                const isInStock = stockMap[p.id] ?? p.inStock;

                return (
                  <div key={p.id} className="bg-[#FAFAFA] hover:bg-white p-4 rounded-2xl border border-gray-200 transition-all shadow-xs space-y-3 flex flex-col justify-between">
                    
                    <div className="flex items-start gap-3">
                      <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-white shrink-0 border border-gray-200" />
                      <div className="space-y-0.5 overflow-hidden flex-1">
                        <h4 className="font-extrabold text-xs text-gray-900 truncate">{p.name}</h4>
                        <div className="text-[#009E49] font-black text-sm">{formatFCFA(p.priceFCFA)}</div>
                        <div className="text-[10px] text-gray-500 font-bold flex items-center gap-2">
                          <span>📍 {p.cityName}</span>
                          <span>•</span>
                          <span>{p.weightKg} kg</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Interactive Controls */}
                    <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-bold text-[11px]">Disponibilité :</span>
                        <button
                          onClick={() => handleToggleStock(p.id, p.inStock)}
                          className={`px-2.5 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                            isInStock ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
                          }`}
                        >
                          {isInStock ? '🟢 En Stock' : '🔴 Rupture'}
                        </button>
                      </div>

                      <span className="text-[10px] text-gray-400 font-medium">Modifier</span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: CLIENT ORDERS --- */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] font-['Outfit'] flex items-center justify-between">
            <span>Commandes Clients Entrantes pour {currentMerchant.name}</span>
            <span className="text-xs font-bold text-gray-400">
              {merchantOrders.length} commande(s)
            </span>
          </h3>

          {merchantOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm font-medium">
              Aucune commande reçue pour le moment dans cette boutique.
            </div>
          ) : (
            <div className="space-y-3">
              {merchantOrders.map(order => {
                const myItems = order.items.filter(i => i.merchantId === currentMerchant.id);
                const subtotal = myItems.reduce((s, i) => s + (i.priceFCFA * i.quantity), 0);

                return (
                  <div
                    key={order.id}
                    className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[#FF8C00] text-sm">{order.trackingNumber}</span>
                        <span className="text-xs bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 text-gray-700 font-semibold">
                          Client : {order.clientName} ({order.clientPhone})
                        </span>
                      </div>

                      <div className="text-xs text-gray-700 space-y-0.5">
                        {myItems.map((item, idx) => (
                          <div key={idx}>
                            • {item.quantity}x <span className="font-extrabold text-gray-900">{item.productName}</span> ({formatFCFA(item.priceFCFA)})
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-gray-500 pt-1">
                        Livraison vers : <span className="text-gray-800 font-medium">{order.deliveryAddress} ({order.destinationCityName})</span>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="font-black text-[#009E49] text-base">
                        {formatFCFA(subtotal)}
                      </div>

                      {order.status === 'pending' || order.status === 'preparing' ? (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'ready_for_pickup')}
                          className="bg-[#009E49] hover:bg-emerald-600 text-white font-black px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Prêt pour Enlèvement</span>
                        </button>
                      ) : (
                        <span className="inline-block bg-white text-gray-700 text-xs px-3 py-1 rounded-xl border border-gray-200 capitalize font-bold">
                          Statut : {order.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: YANGO POINT OF SALE & RECHARGE SERVICE --- */}
      {activeTab === 'yango' && (
        <div className="space-y-6">
          
          {/* Yango Header Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black text-amber-400 font-black text-xl rounded-2xl flex items-center justify-center border-2 border-amber-300 shadow-sm shrink-0 font-mono">
                  Y
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-black/30 backdrop-blur-md text-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      🚖 Guichet Agréé Partenaire Yango
                    </span>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      5% Commission Net
                    </span>
                  </div>
                  <h3 className="text-2xl font-black font-['Outfit']">Vente de Recharges & Services Yango</h3>
                  <p className="text-xs text-amber-100 font-medium">
                    Revendez du crédit de recharge Yango aux chauffeurs VTC et passagers directement au comptoir de votre boutique.
                  </p>
                </div>
              </div>

              {/* Pool Balance KPI */}
              <div className="bg-black/30 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-right space-y-0.5">
                <div className="text-[10px] text-amber-200 font-bold uppercase">Coffre-Fort Crédit Yango</div>
                <div className="text-2xl font-black text-white font-['Outfit']">{formatFCFA(yangoPoolFCFA)}</div>
                <div className="text-[10px] text-amber-300 font-bold">Disponible pour recharges</div>
              </div>
            </div>
          </div>

          {/* Yango KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 p-5 rounded-3xl space-y-1 shadow-sm">
              <div className="text-xs text-gray-500 font-bold flex items-center justify-between">
                <span>Commissions Accumulées</span>
                <DollarSign className="w-4 h-4 text-[#009E49]" />
              </div>
              <div className="text-2xl font-black text-[#009E49] font-['Outfit']">{formatFCFA(yangoCommissionsFCFA)}</div>
              <div className="text-[11px] text-emerald-800 font-bold">Gains nets générés au guichet</div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-3xl space-y-1 shadow-sm">
              <div className="text-xs text-gray-500 font-bold flex items-center justify-between">
                <span>Recharges Vendues</span>
                <Car className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-600 font-['Outfit']">{yangoTransactions.filter(t => t.type === 'sale_recharge').length}</div>
              <div className="text-[11px] text-amber-800 font-bold">Chauffeurs & passagers servis</div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-3xl space-y-1 shadow-sm">
              <div className="text-xs text-gray-500 font-bold flex items-center justify-between">
                <span>Taux de Commission</span>
                <Zap className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-sky-600 font-['Outfit']">5.0%</div>
              <div className="text-[11px] text-sky-800 font-bold">Sur chaque ticket imprimé</div>
            </div>
          </div>

          {/* Main Yango Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form 1: Sell Yango Recharge */}
            <form onSubmit={handleSellYangoRecharge} className="bg-white border border-gray-100 p-6 rounded-3xl space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  🚖
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-gray-900">Vendre une Recharge Yango</h4>
                  <p className="text-xs text-gray-500">Impression instantanée du ticket de recharge pour le chauffeur.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Chauffeur / Client Bénéficiaire *</label>
                  <input
                    type="text"
                    required
                    value={yangoDriverName}
                    onChange={e => setYangoDriverName(e.target.value)}
                    placeholder="Ex: Koné Seydou (Chauffeur Yango Taxi)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Numéro de Téléphone Chauffeur (+225) *</label>
                  <input
                    type="text"
                    required
                    value={yangoDriverPhone}
                    onChange={e => setYangoDriverPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-2">Choisir le Montant de Recharge FCFA *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2000, 5000, 10000, 20000, 30000, 50000].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setYangoRechargeAmountFCFA(amt)}
                        className={`py-2 rounded-xl font-black text-xs transition-all border ${
                          yangoRechargeAmountFCFA === amt
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {formatFCFA(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Mode d'Encaissement au Guichet *</label>
                  <select
                    value={yangoPaymentMethod}
                    onChange={e => setYangoPaymentMethod(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="cash">Espèces au Guichet</option>
                    <option value="wave">Wave Mobile Money</option>
                    <option value="orange_money">Orange Money CI</option>
                    <option value="mtn_money">MTN Mobile Money</option>
                  </select>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between font-bold text-emerald-900">
                  <span>Commission Boutique (5%) :</span>
                  <span className="text-base font-black text-[#009E49]">+{formatFCFA(Math.round(yangoRechargeAmountFCFA * 0.05))}</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Valider & Imprimer Ticket Yango ({formatFCFA(yangoRechargeAmountFCFA)})</span>
                </button>
              </div>

              {/* Generated Ticket Receipt Display */}
              {lastVoucherGenerated && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-300 p-4 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-black text-amber-950">
                    <span>🎟️ Ticket Recharge Généré !</span>
                    <span className="bg-amber-200 px-2 py-0.5 rounded text-[10px]">{lastVoucherGenerated.code}</span>
                  </div>
                  <div className="text-xs text-amber-900 space-y-0.5 font-medium">
                    <div>Bénéficiaire : <strong>{lastVoucherGenerated.driver}</strong></div>
                    <div>Montant crédité : <strong>{formatFCFA(lastVoucherGenerated.amount)}</strong></div>
                    <div className="text-emerald-800 font-bold">Commission boutique : +{formatFCFA(lastVoucherGenerated.commission)}</div>
                  </div>
                </div>
              )}
            </form>

            {/* Form 2: Yango Express Courier Dispatch & Wholesale Pool Top-up */}
            <div className="space-y-6">
              
              {/* Top up wholesale pool */}
              <form onSubmit={handleTopUpYangoPool} className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Wallet className="w-5 h-5 text-[#009E49]" />
                  <h4 className="font-extrabold text-base text-gray-900">Approvisionner le Coffre-Fort Yango</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-700 font-extrabold mb-1">Montant d'Achat Grossiste FCFA</label>
                    <select
                      value={yangoTopUpAmount}
                      onChange={e => setYangoTopUpAmount(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-[#009E49]"
                    >
                      <option value={25000}>25 000 FCFA</option>
                      <option value={50000}>50 000 FCFA</option>
                      <option value={100000}>100 000 FCFA</option>
                      <option value={200000}>200 000 FCFA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-extrabold mb-1">Moyen de Paiement Grossiste</label>
                    <select
                      value={yangoTopUpMethod}
                      onChange={e => setYangoTopUpMethod(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-[#009E49]"
                    >
                      <option value="wave">Wave Mobile Money</option>
                      <option value="orange_money">Orange Money CI</option>
                      <option value="mtn_money">MTN Mobile Money</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#009E49] hover:bg-emerald-600 text-white font-extrabold py-2.5 rounded-2xl text-xs shadow-sm transition-all"
                  >
                    Recharger Solde Grossiste Yango ({formatFCFA(yangoTopUpAmount)})
                  </button>
                </div>
              </form>

              {/* Dispatch Yango Express Taxi */}
              <form onSubmit={handleDispatchYangoCourier} className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Car className="w-5 h-5 text-sky-600" />
                  <h4 className="font-extrabold text-base text-gray-900">Demander un Yango Express au Guichet</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-700 font-extrabold mb-1">Adresse de Livrasion du Client *</label>
                    <input
                      type="text"
                      required
                      value={yangoExpressAddress}
                      onChange={e => setYangoExpressAddress(e.target.value)}
                      placeholder="Ex: Cocody Riviera 3, face pharmacie"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-medium focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-extrabold mb-1">Téléphone Destinataire (+225) *</label>
                    <input
                      type="text"
                      required
                      value={yangoExpressCustomerPhone}
                      onChange={e => setYangoExpressCustomerPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {yangoExpressNotice && (
                    <div className="bg-sky-50 border border-sky-200 text-sky-900 p-3 rounded-xl font-bold animate-in fade-in">
                      ✅ {yangoExpressNotice}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-2.5 rounded-2xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Car className="w-4 h-4" />
                    <span>Appeler Chauffeur Yango Express au Comptoir</span>
                  </button>
                </div>
              </form>

            </div>

          </div>

          {/* Yango Transactions Ledger */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-[#111827] text-base font-['Outfit']">
              Historique des Ventes & Transactions Yango au Guichet
            </h4>

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden text-xs">
              {yangoTransactions.map(tx => (
                <div key={tx.id} className="p-3.5 bg-white flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-gray-900">{tx.driverName}</div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      {tx.driverPhone} • {tx.date} • Mode : {tx.paymentMethod.toUpperCase()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-gray-900 text-sm">{formatFCFA(tx.amountFCFA)}</div>
                    {tx.commissionFCFA > 0 && (
                      <div className="text-[#009E49] font-extrabold text-[11px]">
                        Comm. : +{formatFCFA(tx.commissionFCFA)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 5: WALLET & MOBILE MONEY PAYOUTS --- */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="bg-gradient-to-br from-[#009E49] to-emerald-800 text-white p-6 rounded-3xl space-y-3 shadow-md md:col-span-1">
              <div className="text-xs text-emerald-100 font-bold uppercase tracking-wider">Solde Disponible aux Retraits</div>
              <div className="text-3xl font-black font-['Outfit']">{formatFCFA(totalRevenueFCFA)}</div>
              <p className="text-xs text-emerald-100">
                Encaissement direct de vos ventes d'articles et commissions guichet vers vos comptes Mobile Money.
              </p>
            </div>

            <form onSubmit={handleWithdrawWalletSubmit} className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4 shadow-sm md:col-span-2">
              <h4 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-2">
                Demander un Payout Instantané Mobile Money
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Montant à Retirer (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={withdrawalAmount}
                    onChange={e => setWithdrawalAmount(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-black focus:outline-none focus:border-[#009E49]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-extrabold mb-1">Opérateur de Réception *</label>
                  <select
                    value={withdrawalMethod}
                    onChange={e => setWithdrawalMethod(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-[#009E49] cursor-pointer"
                  >
                    <option value="wave">Wave Côte d'Ivoire</option>
                    <option value="orange_money">Orange Money CI</option>
                    <option value="mtn_money">MTN Mobile Money CI</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-extrabold mb-1">Numéro Mobile Money du Commerçant *</label>
                  <input
                    type="text"
                    required
                    value={withdrawalPhone}
                    onChange={e => setWithdrawalPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 font-bold focus:outline-none focus:border-[#009E49]"
                  />
                </div>
              </div>

              {withdrawalSuccessNotice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl font-bold text-xs animate-in fade-in">
                  ✅ {withdrawalSuccessNotice}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#009E49] hover:bg-emerald-600 text-white font-extrabold py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95"
              >
                Transférer vers {withdrawalMethod.toUpperCase()} ({formatFCFA(withdrawalAmount)})
              </button>
            </form>

          </div>
        </div>
      )}

      {/* --- TAB 6: STORE PARAMETERS & PROFILE --- */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveStoreSettings} className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Paramètres & Profil de {currentMerchant.name}</h3>
              <p className="text-xs text-gray-500">Modifiez les horaires, le numéro WhatsApp pro et l'état d'ouverture de la boutique.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsStoreOpen(!isStoreOpen)}
              className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 border transition-all ${
                isStoreOpen ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-red-100 text-red-900 border-red-300'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isStoreOpen ? 'Boutique Ouverte' : 'Boutique Fermée'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-700 font-extrabold mb-1">Nom de la Boutique</label>
              <input
                type="text"
                defaultValue={currentMerchant.name}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-extrabold mb-1">Téléphone Commercial WhatsApp</label>
              <input
                type="text"
                defaultValue={currentMerchant.phone}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-extrabold mb-1">Ville d'Implantation</label>
              <input
                type="text"
                readOnly
                value={currentMerchant.cityName}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 font-bold text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-extrabold mb-1">Adresse Quartier Repère</label>
              <input
                type="text"
                defaultValue={currentMerchant.address}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 font-bold text-gray-900"
              />
            </div>
          </div>

          {editStoreNotice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl font-bold text-xs animate-in fade-in">
              ✅ {editStoreNotice}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-[#009E49] hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-md transition-all active:scale-95"
            >
              Enregistrer les Modifications
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
