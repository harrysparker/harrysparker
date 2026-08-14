import React, { useState, useMemo } from 'react';
import { Livreur, Order, CityNode, RouteWaypoint } from '../types';
import { formatFCFA } from '../services/pricingService';
import { optimizeDeliveryTour } from '../services/routeOptimizationService';
import { MapComponent } from './MapComponent';
import {
  Navigation,
  Zap,
  MapPin,
  CheckCircle2,
  Clock,
  TrendingDown,
  Fuel,
  Share2,
  ExternalLink,
  Bike,
  ListOrdered,
  Sparkles,
  Phone,
  Store,
  Home,
  Check,
  AlertCircle
} from 'lucide-react';

interface RouteOptimizerProps {
  currentLivreur: Livreur;
  orders: Order[];
  cities: CityNode[];
  onAcceptTour: (orderIds: string[]) => void;
}

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  currentLivreur,
  orders,
  cities,
  onAcceptTour,
}) => {
  // Orders in courier's hub or assigned to courier
  const candidateOrders = useMemo(() => {
    return orders.filter(o =>
      (o.status === 'ready_for_pickup' || o.status === 'pending' || o.status === 'in_transit') &&
      (!o.assignedLivreur || o.assignedLivreur.id === currentLivreur.id)
    );
  }, [orders, currentLivreur]);

  // Selected orders for the multi-stop tour
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(
    candidateOrders.map(o => o.id)
  );

  // Track completed steps during active tour execution
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Filter selected Order objects
  const selectedOrders = useMemo(() => {
    return candidateOrders.filter(o => selectedOrderIds.includes(o.id));
  }, [candidateOrders, selectedOrderIds]);

  // Run TSP optimization algorithm
  const tourResult = useMemo(() => {
    return optimizeDeliveryTour(selectedOrders, currentLivreur, cities);
  }, [selectedOrders, currentLivreur, cities]);

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedOrderIds(candidateOrders.map(o => o.id));
  };

  const deselectAll = () => {
    setSelectedOrderIds([]);
  };

  const toggleStepCompleted = (stepId: string) => {
    setCompletedStepIds(prev =>
      prev.includes(stepId) ? prev.filter(s => s !== stepId) : [...prev, stepId]
    );
  };

  // Open external navigation app (Google Maps with waypoints)
  const openExternalGoogleMaps = () => {
    if (tourResult.waypoints.length <= 1) return;

    const origin = `${tourResult.waypoints[0].lat},${tourResult.waypoints[0].lng}`;
    const destination = `${tourResult.waypoints[tourResult.waypoints.length - 1].lat},${tourResult.waypoints[tourResult.waypoints.length - 1].lng}`;

    const intermediateWaypoints = tourResult.waypoints
      .slice(1, -1)
      .map(wp => `${wp.lat},${wp.lng}`)
      .join('|');

    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (intermediateWaypoints) {
      mapsUrl += `&waypoints=${intermediateWaypoints}`;
    }

    window.open(mapsUrl, '_blank');
  };

  const copyItinerarySummary = () => {
    const text = `🛵 Feuille de Route Optimisée (${currentLivreur.cityName})\n` +
      `----------------------------------------\n` +
      `📍 Total Étapes: ${tourResult.waypoints.length - 1}\n` +
      `🚗 Distance: ${tourResult.totalDistanceKm} km (-${tourResult.savingsPercentage}% d'économie)\n` +
      `⏱️ Durée Estimée: ~${tourResult.totalDurationMins} min\n` +
      `💰 Gains Estimés: ${formatFCFA(tourResult.totalEarningsFCFA)}\n\n` +
      `ITINÉRAIRE SÉQUENTIEL:\n` +
      tourResult.waypoints.map(wp =>
        `Step ${wp.stepNumber}: ${wp.title} (${wp.address})`
      ).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 text-white flex items-center justify-center font-black text-xl shadow-md">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-sky-600 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Algorithme TSP GPS • Côte d'Ivoire</span>
            </div>
            <h3 className="text-xl font-bold font-['Outfit'] text-gray-900">
              Optimiseur d'Itinéraire de Tournée Multi-Colis
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Calcule le trajet le plus rapide et économique entre plusieurs points de pick-up et de livraison.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openExternalGoogleMaps}
            disabled={tourResult.waypoints.length <= 1}
            className="bg-sky-50 hover:bg-sky-100 text-sky-800 font-black text-xs px-3.5 py-2 rounded-xl border border-sky-200 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4 text-sky-600" />
            <span>Ouvrir Google Maps</span>
          </button>

          <button
            type="button"
            onClick={copyItinerarySummary}
            className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-extrabold text-xs px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
            <span>Partager / Copier</span>
          </button>
        </div>
      </div>

      {copiedToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Feuille de route optimisée copiée dans le presse-papier !</span>
        </div>
      )}

      {/* Order Selection Panel */}
      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
        <div className="flex items-center justify-between text-xs font-extrabold text-gray-800">
          <span className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-sky-600" />
            <span>Sélectionner les commandes pour la tournée ({candidateOrders.length} disponibles)</span>
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={selectAll}
              className="text-sky-600 hover:underline font-black cursor-pointer"
            >
              Tout cocher
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={deselectAll}
              className="text-gray-500 hover:underline font-bold cursor-pointer"
            >
              Tout décocher
            </button>
          </div>
        </div>

        {candidateOrders.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400 font-medium">
            Aucune commande disponible actuellement dans votre hub ({currentLivreur.cityName}).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidateOrders.map(order => {
              const isSelected = selectedOrderIds.includes(order.id);
              const earnings = Math.round(order.deliveryFeeFCFA * 0.75);

              return (
                <div
                  key={order.id}
                  onClick={() => toggleOrderSelection(order.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isSelected
                      ? 'bg-white border-[#009E49] shadow-sm'
                      : 'bg-white/60 border-gray-200 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 rounded text-[#009E49] focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="space-y-1 text-xs w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-gray-900">{order.trackingNumber}</span>
                      <span className="font-black text-[#009E49] text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        +{formatFCFA(earnings)}
                      </span>
                    </div>
                    <div className="text-gray-600 text-[11px] font-medium truncate">
                      🏬 {order.items[0]?.merchantName || 'Boutique'} ➔ 🏠 {order.clientName}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      📍 {order.originCityName} ➔ {order.destinationCityName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KPI Optimization Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4 rounded-2xl space-y-1">
          <div className="text-[10px] text-emerald-800 uppercase font-black tracking-wider flex items-center justify-between">
            <span>Distance Optimisée</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-950 font-['Outfit']">
            {tourResult.totalDistanceKm} km
          </div>
          <div className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1">
            <span>-{tourResult.savingsPercentage}% vs direct</span>
            <span className="text-[10px] text-emerald-600">({tourResult.savedDistanceKm} km évités)</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-200 p-4 rounded-2xl space-y-1">
          <div className="text-[10px] text-sky-800 uppercase font-black tracking-wider flex items-center justify-between">
            <span>Durée Estimée</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-black text-sky-950 font-['Outfit']">
            ~{tourResult.totalDurationMins} min
          </div>
          <div className="text-[11px] text-sky-700 font-bold">
            {tourResult.waypoints.length - 1} arrêt(s) au total
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-100/50 border border-amber-200 p-4 rounded-2xl space-y-1">
          <div className="text-[10px] text-amber-900 uppercase font-black tracking-wider flex items-center justify-between">
            <span>Gains Livreur</span>
            <Bike className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-950 font-['Outfit']">
            {formatFCFA(tourResult.totalEarningsFCFA)}
          </div>
          <div className="text-[11px] text-amber-800 font-bold">
            75% des frais de livraison
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-emerald-100/50 border border-teal-200 p-4 rounded-2xl space-y-1">
          <div className="text-[10px] text-teal-900 uppercase font-black tracking-wider flex items-center justify-between">
            <span>Économie Essence</span>
            <Fuel className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-black text-teal-950 font-['Outfit']">
            {tourResult.fuelSavedLiters} L
          </div>
          <div className="text-[11px] text-teal-800 font-bold">
            🍃 Moins de CO₂ émis
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left Map, Right Itinerary Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Map View */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>Carte Interactive de la Tournée GPS (Séquence Numérotée)</span>
            </span>
            <span className="text-gray-400 font-mono">
              {tourResult.waypoints.length} waypoints
            </span>
          </div>

          <MapComponent
            cities={cities}
            routeWaypoints={tourResult.waypoints}
            height="460px"
          />
        </div>

        {/* Step-by-Step Itinerary Checklist */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-800">
            <span>Feuille de Route Séquentielle ({tourResult.waypoints.length - 1} étapes)</span>
            {selectedOrders.length > 0 && (
              <button
                type="button"
                onClick={() => onAcceptTour(selectedOrderIds)}
                className="bg-[#009E49] hover:bg-emerald-600 text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Démarrer cette Tournée</span>
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {tourResult.waypoints.map((wp, index) => {
              const isCompleted = completedStepIds.includes(wp.id);

              return (
                <div
                  key={wp.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-gray-50 border-gray-200 opacity-60 line-through'
                      : wp.type === 'start'
                      ? 'bg-sky-50/70 border-sky-200'
                      : wp.type === 'pickup'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                          wp.type === 'start'
                            ? 'bg-sky-600 text-white border-sky-700'
                            : wp.type === 'pickup'
                            ? 'bg-[#FF8C00] text-white border-amber-600'
                            : 'bg-[#009E49] text-white border-emerald-700'
                        }`}
                      >
                        {wp.stepNumber === 0 ? '🛵' : wp.stepNumber}
                      </div>

                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{wp.title}</span>
                        </div>
                        <p className="text-gray-600 text-[11px] font-medium leading-tight">{wp.subtitle}</p>
                        <p className="text-[10px] text-gray-400 font-mono">📍 {wp.address}</p>

                        {wp.legDistanceKm !== undefined && wp.legDistanceKm > 0 && (
                          <div className="text-[10px] font-bold text-gray-500 pt-0.5">
                            + {wp.legDistanceKm} km (~{wp.legEstimatedMins} min)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {wp.type !== 'start' && (
                        <button
                          type="button"
                          onClick={() => toggleStepCompleted(wp.id)}
                          className={`p-1.5 rounded-xl border text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Fait' : 'Valider'}</span>
                        </button>
                      )}

                      {wp.phone && (
                        <a
                          href={`tel:${wp.phone}`}
                          className="text-[10px] text-sky-700 bg-sky-100 hover:bg-sky-200 px-2 py-0.5 rounded-lg font-bold transition-colors"
                        >
                          📞 Appel
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
