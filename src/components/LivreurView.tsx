import React, { useState } from 'react';
import { Livreur, Order, ProofOfDelivery, CityNode } from '../types';
import { formatFCFA } from '../services/pricingService';
import { Bike, MapPin, CheckCircle2, ShieldCheck, Wallet, Phone, Navigation, ArrowUpRight, Award, RefreshCw, Zap, Route } from 'lucide-react';
import { MapComponent } from './MapComponent';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { RouteOptimizer } from './RouteOptimizer';

interface LivreurViewProps {
  livreurs: Livreur[];
  orders: Order[];
  cities?: CityNode[];
  onUpdateOrderStatus: (orderId: string, status: any, proof?: ProofOfDelivery, assignedLivreur?: Livreur) => void;
  onUpdateLivreurWallet: (livreurId: string, addedFCFA: number) => void;
}

export const LivreurView: React.FC<LivreurViewProps> = ({
  livreurs,
  orders,
  cities = [],
  onUpdateOrderStatus,
  onUpdateLivreurWallet,
}) => {
  const [selectedLivreurId, setSelectedLivreurId] = useState<string>(livreurs[0]?.id || 'l1');
  const [activeProofModalOrder, setActiveProofModalOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'optimizer'>('courses');
  const [tourAcceptedToast, setTourAcceptedToast] = useState<string | null>(null);

  const currentLivreur = livreurs.find(l => l.id === selectedLivreurId) || livreurs[0];

  // Available jobs in current driver's city or matching region
  const availableOrders = orders.filter(o => 
    (o.status === 'ready_for_pickup' || o.status === 'pending') &&
    (!o.assignedLivreur || o.assignedLivreur.id === currentLivreur.id)
  );

  // Active delivery assigned to current livreur
  const activeDelivery = orders.find(o => 
    o.assignedLivreur?.id === currentLivreur.id && o.status !== 'delivered' && o.status !== 'cancelled'
  );

  // Completed deliveries for this livreur
  const completedOrders = orders.filter(o => 
    o.assignedLivreur?.id === currentLivreur.id && o.status === 'delivered'
  );

  const handleAcceptJob = (order: Order) => {
    onUpdateOrderStatus(order.id, 'in_transit', undefined, currentLivreur);
  };

  const handleAcceptTour = (orderIds: string[]) => {
    orderIds.forEach(id => {
      onUpdateOrderStatus(id, 'in_transit', undefined, currentLivreur);
    });
    setTourAcceptedToast(`Tournée démarrée avec succès ! ${orderIds.length} commande(s) assignée(s) à votre feuille de route.`);
    setTimeout(() => setTourAcceptedToast(null), 5000);
    setActiveTab('courses');
  };

  const handleConfirmDeliveryFromModal = (orderId: string, proof: ProofOfDelivery) => {
    onUpdateOrderStatus(orderId, 'delivered', proof);
    
    // Calculate driver earnings (75% of delivery fee)
    const targetOrder = orders.find(o => o.id === orderId);
    const earnings = targetOrder ? Math.round(targetOrder.deliveryFeeFCFA * 0.75) : 1000;
    
    onUpdateLivreurWallet(currentLivreur.id, earnings);
  };

  return (
    <div className="space-y-6">
      
      {/* Livreur Profile & Vehicle Banner */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentLivreur.avatar}
            alt={currentLivreur.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-sky-500 shadow-sm"
          />
          <div>
            <div className="text-xs text-sky-600 font-black uppercase tracking-wider flex items-center gap-1.5">
              <Bike className="w-4 h-4" />
              <span>Espace Livreur GPS</span>
            </div>
            <h2 className="text-xl font-bold font-['Outfit'] text-[#111827]">{currentLivreur.name}</h2>
            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 font-medium">
              <span>📍 Hub: {currentLivreur.cityName}</span>
              <span>•</span>
              <span className="text-[#009E49] font-bold">🛵 {currentLivreur.vehicle}</span>
              <span>•</span>
              <span className="text-[#FF8C00] font-black">⭐ {currentLivreur.rating}</span>
            </div>
          </div>
        </div>

        {/* Driver Selector & Wallet */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-emerald-50 px-3.5 py-1.5 rounded-2xl border border-emerald-100 text-xs">
            <span className="text-gray-500 block text-[10px] font-bold">Gain Wallet FCFA</span>
            <span className="font-black text-[#009E49] text-sm">{formatFCFA(currentLivreur.walletFCFA)}</span>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 text-xs">
            <span className="text-gray-500 font-bold">Changer Livreur :</span>
            <select
              value={selectedLivreurId}
              onChange={e => setSelectedLivreurId(e.target.value)}
              className="bg-white text-gray-800 font-bold px-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer focus:outline-none"
            >
              {livreurs.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.cityName} - {l.vehicle})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Courses vs Route Optimizer) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bike className="w-4 h-4 text-sky-600" />
            <span>Mes Missions & Livraisons</span>
            {availableOrders.length > 0 && (
              <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {availableOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('optimizer')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'optimizer'
                ? 'bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-md'
                : 'text-gray-700 bg-white/70 hover:bg-white border border-gray-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Optimiseur d'Itinéraire Tournée (GPS TSP)</span>
            <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase">
              Pro
            </span>
          </button>
        </div>

        {activeDelivery && (
          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>1 Course active en cours de guidage</span>
          </div>
        )}
      </div>

      {tourAcceptedToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{tourAcceptedToast}</span>
        </div>
      )}

      {/* VIEW A: ROUTE OPTIMIZER */}
      {activeTab === 'optimizer' ? (
        <RouteOptimizer
          currentLivreur={currentLivreur}
          orders={orders}
          cities={cities}
          onAcceptTour={handleAcceptTour}
        />
      ) : (
        /* VIEW B: ACTIVE COURSE & AVAILABLE MISSIONS FEED */
        <>
          {activeDelivery ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-sky-200 rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-sky-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-2xl">
                Course En Cours GPS
              </div>

              <div>
                <div className="text-xs text-gray-400 font-mono font-bold">{activeDelivery.trackingNumber}</div>
                <h3 className="font-bold text-lg text-[#111827] font-['Outfit']">
                  Livraison vers {activeDelivery.destinationCityName}
                </h3>
              </div>

              {/* Addresses */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <div className="text-[10px] text-[#FF8C00] uppercase font-black">1. Enlèvement chez Commerçant</div>
                  <div className="font-bold text-gray-900 mt-0.5">{activeDelivery.items[0]?.merchantName || 'Commerçant'}</div>
                  <div className="text-gray-500 text-[11px] font-medium">{activeDelivery.originCityName}</div>
                </div>

                <div className="border-t border-gray-200 pt-2">
                  <div className="text-[10px] text-[#009E49] uppercase font-black">2. Adresse Client Destinataire</div>
                  <div className="font-bold text-gray-900 mt-0.5">{activeDelivery.clientName} ({activeDelivery.clientPhone})</div>
                  <div className="text-gray-500 text-[11px] font-medium">{activeDelivery.deliveryAddress}</div>
                </div>
              </div>

              {/* Earnings for driver */}
              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-gray-600 font-bold">Votre Gain Course :</span>
                <span className="text-[#009E49] font-black text-base">
                  {formatFCFA(Math.round(activeDelivery.deliveryFeeFCFA * 0.75))}
                </span>
              </div>

              {/* OTP Proof Trigger Button */}
              <button
                onClick={() => setActiveProofModalOrder(activeDelivery)}
                className="w-full bg-[#009E49] hover:bg-emerald-600 text-white font-black py-3 rounded-2xl text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Terminer avec Code OTP & Signature</span>
              </button>
            </div>
          </div>

          {/* Active Job GPS Map */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-sky-600 animate-spin" />
                  <span>Itinéraire GPS & Guidage en Temps Réel</span>
                </span>
                <span className="text-gray-400">
                  Destination : {activeDelivery.destinationCityName}
                </span>
              </div>

              <MapComponent
                cities={[]}
                activeOrderTrack={activeDelivery}
                livreurs={[currentLivreur]}
                height="420px"
              />
            </div>
          </div>

        </div>
      ) : (
        /* Available Deliveries Feed */
        <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] font-['Outfit'] flex items-center justify-between">
            <span>Missions de Livraison Disponibles à {currentLivreur.cityName}</span>
            <span className="text-xs text-gray-400 font-bold">
              {availableOrders.length} disponible(s)
            </span>
          </h3>

          {availableOrders.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-gray-400 text-sm font-medium">
              <div className="text-2xl">🛵</div>
              <p>Aucune course disponible en ce moment dans la zone {currentLivreur.cityName}.</p>
              <p className="text-xs text-gray-400">Restez en ligne, les nouvelles commandes s'afficheront automatiquement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map(order => {
                const driverEarnings = Math.round(order.deliveryFeeFCFA * 0.75);
                return (
                  <div
                    key={order.id}
                    className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3 shadow-sm hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <span className="font-mono font-black text-[#FF8C00] text-xs">{order.trackingNumber}</span>
                      <span className="bg-emerald-100 text-[#009E49] font-black text-sm px-2.5 py-0.5 rounded-full">
                        + {formatFCFA(driverEarnings)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-700 space-y-1">
                      <div>
                        <span className="text-gray-400 font-bold">De :</span>{' '}
                        <span className="font-bold text-gray-900">{order.items[0]?.merchantName}</span> ({order.originCityName})
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold">Vers :</span>{' '}
                        <span className="font-bold text-gray-900">{order.deliveryAddress}</span> ({order.destinationCityName})
                      </div>
                      <div className="text-[11px] text-gray-500 pt-1">
                        Mode : <span className="text-[#FF8C00] font-black uppercase">{order.deliveryMode}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptJob(order)}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Accepter la Course ({formatFCFA(driverEarnings)})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed Deliveries History */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-[#111827] font-['Outfit']">
          Historique de vos Livraisons Effectuées ({completedOrders.length})
        </h3>

        {completedOrders.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium">Aucune livraison encore complétée.</p>
        ) : (
          <div className="space-y-2">
            {completedOrders.map(order => (
              <div key={order.id} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-black text-gray-800">{order.trackingNumber}</span>
                  <span className="text-gray-500 ml-2 font-medium">Livré à {order.clientName} ({order.destinationCityName})</span>
                </div>
                <div className="text-[#009E49] font-black">
                  + {formatFCFA(Math.round(order.deliveryFeeFCFA * 0.75))} (OTP Validé)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* Proof Modal */}
      {activeProofModalOrder && (
        <ProofOfDeliveryModal
          order={activeProofModalOrder}
          onClose={() => setActiveProofModalOrder(null)}
          onConfirmDelivery={handleConfirmDeliveryFromModal}
        />
      )}

    </div>
  );
};
