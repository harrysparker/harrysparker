import React, { useState, useEffect } from 'react';
import { UserRole, CityNode, Merchant, Product, CartItem, Order, Livreur, ZoneTariff, OrderStatus, ProofOfDelivery, LoyaltyAccount, AppNotification } from './types';
import { IVOIRIAN_CITIES, INITIAL_MERCHANTS, INITIAL_PRODUCTS, INITIAL_LIVREURS, INITIAL_TARIFFS, INITIAL_ORDERS } from './data/mockData';
import { formatFCFA } from './services/pricingService';
import { Header } from './components/Header';
import { ClientView } from './components/ClientView';
import { MerchantView } from './components/MerchantView';
import { LivreurView } from './components/LivreurView';
import { DispatchAdminView } from './components/DispatchAdminView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { SupportChatWidget } from './components/SupportChatWidget';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function App() {
  const [role, setRole] = useState<UserRole>('client');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  
  // State Collections
  const [cities, setCities] = useState<CityNode[]>(IVOIRIAN_CITIES);
  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [livreurs, setLivreurs] = useState<Livreur[]>(INITIAL_LIVREURS);
  const [tariffs, setTariffs] = useState<ZoneTariff[]>(INITIAL_TARIFFS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [walletFCFA, setWalletFCFA] = useState<number>(45000); // Client / Shared Wallet balance in FCFA
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);

  // Notification System State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n_init_1',
      title: '⚡ Système Dispatch Opérationnel',
      message: 'Réseau national d\'expédition connecté entre Bouaké, Korhogo, Yamoussoukro et Abidjan.',
      type: 'system',
      timestamp: 'Récemment',
      read: false,
      targetRole: 'all',
    },
    {
      id: 'n_init_2',
      title: '🚚 Colis IVR-YAM-9102 En Route',
      message: 'La commande a été attribuée au livreur Traoré Mamadou à Yamoussoukro.',
      type: 'order_status_change',
      timestamp: '15:30',
      read: false,
      targetRole: 'client',
      trackingNumber: 'IVR-YAM-9102',
      status: 'in_transit'
    }
  ]);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [isOpenNotificationCenter, setIsOpenNotificationCenter] = useState<boolean>(false);

  // Helper function to send notification & trigger toast popup
  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToasts(prev => [newNotif, ...prev]);

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 6000);
  };

  const handleDismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setActiveToasts([]);
  };

  // Loyalty System State
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount>({
    pointsBalance: 480,
    totalEarnedPoints: 1250,
    tier: 'argent',
    discountThresholdFCFA: 10000, // Threshold: orders >= 10 000 FCFA qualify for delivery fee discounts!
    pointsPerFCFA: 200, // 1 point per 200 FCFA spent
    transactions: [
      {
        id: 'tx1',
        date: '2026-08-11',
        points: 100,
        type: 'bonus_signup',
        description: 'Cadeau de Bienvenue Programme Fidélité Ivoire Points'
      },
      {
        id: 'tx2',
        date: '2026-08-11',
        points: 180,
        type: 'earn_order',
        description: 'Achat Chaussures Cuir & Repas Maquis (IVR-BOU-4821)',
        orderTrackingNumber: 'IVR-BOU-4821'
      },
      {
        id: 'tx3',
        date: '2026-08-12',
        points: -100,
        type: 'redeem_discount',
        description: 'Réduction 1 000 FCFA sur Frais de Livraison Inter-ville (IVR-YAM-9102)',
        orderTrackingNumber: 'IVR-YAM-9102'
      },
      {
        id: 'tx4',
        date: '2026-08-12',
        points: 300,
        type: 'bonus_threshold',
        description: 'Bonus Seuil Commande > 10 000 FCFA + Points de commande (IVR-YAM-9102)',
        orderTrackingNumber: 'IVR-YAM-9102'
      }
    ]
  });

  // Sync state with backend server
  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
        }
      })
      .catch(err => console.log('Loaded initial local orders state'));

    fetch('/api/livreurs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLivreurs(data);
        }
      })
      .catch(err => console.log('Loaded initial local livreurs state'));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(err => console.log('Loaded initial local products state'));

    fetch('/api/merchants')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMerchants(data);
        }
      })
      .catch(err => console.log('Loaded initial local merchants state'));
  }, []);

  // Cart Operations
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Create Order
  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    setWalletFCFA(prev => Math.max(0, prev - newOrder.totalFCFA));

    // Notify Administrators of New Order Placed
    addNotification({
      title: '⚡ Nouvelle Commande Passée !',
      message: `Commande #${newOrder.trackingNumber} passée par ${newOrder.clientName} (${newOrder.originCityName} ➔ ${newOrder.destinationCityName}) - Montant: ${formatFCFA(newOrder.totalFCFA)}`,
      type: 'new_order',
      targetRole: 'admin',
      orderId: newOrder.id,
      trackingNumber: newOrder.trackingNumber,
    });

    // Notify Client Confirmation
    addNotification({
      title: '🎉 Commande Enregistrée !',
      message: `Votre commande #${newOrder.trackingNumber} (${formatFCFA(newOrder.totalFCFA)}) a été transmise avec succès au commerçant.`,
      type: 'order_status_change',
      targetRole: 'client',
      orderId: newOrder.id,
      trackingNumber: newOrder.trackingNumber,
      status: 'pending',
    });

    // Update Loyalty Points Account
    setLoyaltyAccount(prev => {
      let newBalance = prev.pointsBalance;
      let newTotalEarned = prev.totalEarnedPoints;
      const newTxs = [...prev.transactions];

      // If points were redeemed for a discount
      if (newOrder.loyaltyPointsUsed && newOrder.loyaltyPointsUsed > 0) {
        newBalance = Math.max(0, newBalance - newOrder.loyaltyPointsUsed);
        newTxs.unshift({
          id: 'tx_' + Date.now() + '_use',
          date: new Date().toISOString().split('T')[0],
          points: -newOrder.loyaltyPointsUsed,
          type: 'redeem_discount',
          description: `Réduction de ${newOrder.loyaltyDiscountFCFA} FCFA sur livraison (${newOrder.trackingNumber})`,
          orderTrackingNumber: newOrder.trackingNumber
        });
      }

      // If new points were earned
      if (newOrder.loyaltyPointsEarned && newOrder.loyaltyPointsEarned > 0) {
        newBalance += newOrder.loyaltyPointsEarned;
        newTotalEarned += newOrder.loyaltyPointsEarned;
        newTxs.unshift({
          id: 'tx_' + Date.now() + '_earn',
          date: new Date().toISOString().split('T')[0],
          points: newOrder.loyaltyPointsEarned,
          type: 'earn_order',
          description: `Points gagnés sur commande (${newOrder.trackingNumber})`,
          orderTrackingNumber: newOrder.trackingNumber
        });
      }

      let newTier = prev.tier;
      if (newTotalEarned >= 2500) newTier = 'diamant';
      else if (newTotalEarned >= 1000) newTier = 'or';
      else if (newTotalEarned >= 500) newTier = 'argent';

      return {
        ...prev,
        pointsBalance: newBalance,
        totalEarnedPoints: newTotalEarned,
        tier: newTier,
        transactions: newTxs
      };
    });

    // Post to backend
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch(err => console.log('Saved order locally'));
  };

  // Wallet Recharge Handler
  const handleRechargeWallet = (amountFCFA: number) => {
    setWalletFCFA(prev => prev + amountFCFA);
  };

  // Order Review Handler
  const handleSaveOrderReview = (orderId: string, review: any) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, review } : o));
  };

  // Update Order Status
  const handleUpdateOrderStatus = (
    orderId: string, 
    status: OrderStatus, 
    proof?: ProofOfDelivery, 
    assignedLivreur?: Livreur
  ) => {
    const existingOrder = orders.find(o => o.id === orderId);
    const trackingNum = existingOrder?.trackingNumber || 'IVR-CMD';

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, status };
        if (proof) updated.proof = { ...o.proof, ...proof };
        if (assignedLivreur) updated.assignedLivreur = assignedLivreur;
        return updated;
      }
      return o;
    }));

    // Trigger Notification & Toast for Client
    let clientTitle = '📦 Statut de Commande Mis à Jour';
    let clientMsg = `Votre commande #${trackingNum} a changé de statut. Nouveau statut : ${status}`;

    if (status === 'ready_for_pickup') {
      clientTitle = '📦 Colis Prêt chez le Commerçant';
      clientMsg = `Votre commande #${trackingNum} est emballée et prête chez ${existingOrder?.merchantName || 'le vendeur'} à ${existingOrder?.originCityName}.`;
    } else if (status === 'in_transit') {
      const driverName = assignedLivreur?.name || existingOrder?.assignedLivreur?.name || 'Kouassi Jean';
      clientTitle = '🚚 En Cours de Livraison (Out for delivery)';
      clientMsg = `Le livreur ${driverName} a récupéré votre colis #${trackingNum} et fait route vers ${existingOrder?.destinationCityName}.`;
    } else if (status === 'delivered') {
      clientTitle = '🎉 Commande Livrée avec Succès !';
      clientMsg = `Votre commande #${trackingNum} à destination de ${existingOrder?.destinationCityName} a été remise. Code OTP validé.`;
    } else if (status === 'cancelled') {
      clientTitle = '❌ Commande Annulée';
      clientMsg = `La commande #${trackingNum} a été annulée.`;
    }

    addNotification({
      title: clientTitle,
      message: clientMsg,
      type: 'order_status_change',
      targetRole: 'client',
      orderId,
      trackingNumber: trackingNum,
      status,
    });

    // Trigger Notification for Admin
    addNotification({
      title: `Changement Statut: #${trackingNum}`,
      message: `Statut mis à jour -> [${status.toUpperCase()}] pour ${existingOrder?.clientName || 'Client'} (${existingOrder?.originCityName} ➔ ${existingOrder?.destinationCityName})`,
      type: 'system',
      targetRole: 'admin',
      orderId,
      trackingNumber: trackingNum,
      status,
    });

    // Post update to backend
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, proof, assignedLivreur }),
    }).catch(err => console.log('Updated order locally'));
  };

  // Update Livreur Wallet & State
  const handleUpdateLivreurWallet = (livreurId: string, addedFCFA: number) => {
    setLivreurs(prev => prev.map(l => {
      if (l.id === livreurId) {
        const updatedWallet = l.walletFCFA + addedFCFA;
        
        fetch(`/api/livreurs/${livreurId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletFCFA: updatedWallet }),
        }).catch(err => console.log('Updated livreur wallet locally'));

        return { ...l, walletFCFA: updatedWallet, totalDeliveries: l.totalDeliveries + 1 };
      }
      return l;
    }));
  };

  // Add New Product
  const handleAddProduct = (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);

    addNotification({
      title: '📦 Nouveau Produit Ajouté !',
      message: `Le produit "${newProd.name}" (${formatFCFA(newProd.priceFCFA)}) est désormais en vitrine pour ${newProd.cityName}.`,
      type: 'system',
      targetRole: 'all',
    });

    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProd),
    }).catch(err => console.log('Added product locally'));
  };

  // Add New Custom Merchant Shop
  const handleAddMerchant = (newMerchant: Merchant) => {
    setMerchants(prev => [newMerchant, ...prev]);

    addNotification({
      title: '🏪 Nouvelle Boutique Officielle !',
      message: `La boutique "${newMerchant.name}" à ${newMerchant.cityName} a ouvert ses portes sur Ivoire Delivery.`,
      type: 'system',
      targetRole: 'all',
    });

    fetch('/api/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMerchant),
    }).catch(err => console.log('Added merchant locally'));
  };

  // Admin Actions
  const handleToggleHubStatus = (cityId: string) => {
    setCities(prev => prev.map(c => c.id === cityId ? { ...c, isHubActive: !c.isHubActive } : c));
  };

  const handleUpdateTariff = (cityId: string, updated: Partial<ZoneTariff>) => {
    setTariffs(prev => prev.map(t => t.cityId === cityId ? { ...t, ...updated } : t));
  };

  const handleRunAutoDispatch = () => {
    // Automatically assign available orders to nearest available livreur
    setOrders(prev => prev.map(o => {
      if (o.status === 'pending' || o.status === 'ready_for_pickup') {
        const matchingLivreur = livreurs.find(l => l.cityId === o.originCityId) || livreurs[0];
        return {
          ...o,
          status: 'in_transit',
          assignedLivreur: matchingLivreur
        };
      }
      return o;
    }));

    addNotification({
      title: '⚡ Dispatch Automatique Exécuté',
      message: 'Attribution automatique des livreurs GPS effectuée pour toutes les commandes en attente.',
      type: 'new_order',
      targetRole: 'admin',
    });
  };

  const cartTotalCount = cart.reduce((s, i) => s + i.quantity, 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  const relevantNotifications = notifications.filter(n => 
    !n.targetRole || n.targetRole === 'all' || n.targetRole === role
  );
  const unreadNotificationsCount = relevantNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Toast Notification Floating Container & Center Drawer */}
      <NotificationToastContainer
        notifications={notifications}
        activeToasts={activeToasts}
        onDismissToast={handleDismissToast}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAllNotifications={handleClearAllNotifications}
        currentRole={role}
        isOpenNotificationCenter={isOpenNotificationCenter}
        onToggleNotificationCenter={() => setIsOpenNotificationCenter(prev => !prev)}
      />

      {/* Header Bar */}
      <Header
        currentRole={role}
        onRoleChange={setRole}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        cities={cities}
        cartCount={cartTotalCount}
        onOpenCart={() => {
          setRole('client');
        }}
        walletFCFA={walletFCFA}
        loyaltyPoints={loyaltyAccount.pointsBalance}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        activeOrdersCount={activeOrdersCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onToggleNotificationCenter={() => setIsOpenNotificationCenter(prev => !prev)}
      />

      {/* Sticky Mobile Bottom Navigation Bar (Android & iOS Smartphones) */}
      <MobileBottomNav
        currentRole={role}
        onRoleChange={setRole}
        cartCount={cartTotalCount}
        onOpenCart={() => setRole('client')}
        unreadNotificationsCount={unreadNotificationsCount}
        onToggleNotificationCenter={() => setIsOpenNotificationCenter(prev => !prev)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
      />

      {/* Main Perspective Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        
        {role === 'client' && (
          <ClientView
            products={products}
            cities={cities}
            merchants={merchants}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            orders={orders}
            onCreateOrder={handleCreateOrder}
            selectedCity={selectedCity}
            loyaltyAccount={loyaltyAccount}
            walletFCFA={walletFCFA}
            onRechargeWallet={handleRechargeWallet}
            onSaveOrderReview={handleSaveOrderReview}
          />
        )}

        {role === 'merchant' && (
          <MerchantView
            merchants={merchants}
            products={products}
            orders={orders}
            cities={cities}
            onUpdateOrderStatus={(id, status) => handleUpdateOrderStatus(id, status)}
            onAddProduct={handleAddProduct}
            onAddMerchant={handleAddMerchant}
          />
        )}

        {role === 'livreur' && (
          <LivreurView
            livreurs={livreurs}
            orders={orders}
            cities={cities}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateLivreurWallet={handleUpdateLivreurWallet}
          />
        )}

        {role === 'admin' && (
          <DispatchAdminView
            cities={cities}
            orders={orders}
            livreurs={livreurs}
            tariffs={tariffs}
            onToggleHubStatus={handleToggleHubStatus}
            onUpdateTariff={handleUpdateTariff}
            onRunAutoDispatch={handleRunAutoDispatch}
          />
        )}

      </main>

      {/* Footer Bar */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-black text-gray-800">
          <span>IVOIRE DELIVERY</span>
          <span>•</span>
          <span className="text-[#FF8C00]">Livraison Nationale Intelligente</span>
        </div>
        <p className="text-gray-500">
          Connecte Clients ↔ Commerçants ↔ Livreurs à Bouaké, Korhogo, Yamoussoukro, Daloa, San-Pédro, Man et Abidjan.
        </p>
      </footer>

      {/* Gemini AI Support Modal */}
      {isAiAssistantOpen && (
        <AiAssistantModal onClose={() => setIsAiAssistantOpen(false)} />
      )}

      {/* Floating Customer Support Live Chat Widget */}
      <SupportChatWidget orders={orders} />

    </div>
  );
}

