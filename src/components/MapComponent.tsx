import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CityNode, Order, Livreur, Merchant, RouteWaypoint } from '../types';
import { Navigation, MapPin, User, Home, Phone, Shield, Play, Pause, Maximize2, Crosshair } from 'lucide-react';

interface MapComponentProps {
  cities: CityNode[];
  selectedCityId?: string;
  orders?: Order[];
  livreurs?: Livreur[];
  merchants?: Merchant[];
  activeOrderTrack?: Order | null;
  routeWaypoints?: RouteWaypoint[];
  height?: string;
}

// Helper: Haversine distance in kilometers
function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Helper: Deterministic hash offset for local address coordinates
function getHashOffset(seed: string, scale = 0.02) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const norm = (Math.abs(hash) % 1000) / 1000;
  return (norm - 0.5) * scale;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  cities,
  selectedCityId,
  orders = [],
  livreurs = [],
  merchants = [],
  activeOrderTrack,
  routeWaypoints = [],
  height = '460px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Live GPS simulation progress state (0.0 to 1.0)
  const [simProgress, setSimProgress] = useState<number>(0.55);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Live interval animation for delivery agent movement when tracking order
  useEffect(() => {
    if (!activeOrderTrack || !isSimulating) return;

    const interval = setInterval(() => {
      setSimProgress(prev => {
        if (prev >= 0.95) return 0.15; // Loop back
        return prev + 0.02; // Increment position smoothly
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [activeOrderTrack, isSimulating]);

  // Compute key coordinates for active tracking order
  const getTrackingPositions = () => {
    if (!activeOrderTrack) return null;

    const defaultCity = (cities && cities.length > 0) ? cities[0] : { id: 'abidjan', name: 'Abidjan', lat: 5.36, lng: -4.0083 };
    const destCity = (cities && cities.length > 0 ? cities.find(c => c.id === activeOrderTrack.destinationCityId) : null) || defaultCity;
    const originCity = (cities && cities.length > 0 ? cities.find(c => c.id === activeOrderTrack.originCityId) : null) || defaultCity;

    const destLat = destCity?.lat ?? 5.36;
    const destLng = destCity?.lng ?? -4.0083;
    const originLat = originCity?.lat ?? 5.36;
    const originLng = originCity?.lng ?? -4.0083;

    // 1. Client Address Coordinates
    const clientLat = activeOrderTrack.currentLat && activeOrderTrack.status === 'delivered' 
      ? activeOrderTrack.currentLat 
      : destLat + getHashOffset(activeOrderTrack.id + 'client_lat', 0.024);
    const clientLng = activeOrderTrack.currentLng && activeOrderTrack.status === 'delivered' 
      ? activeOrderTrack.currentLng 
      : destLng + getHashOffset(activeOrderTrack.id + 'client_lng', 0.024);

    // 2. Merchant Store Coordinates
    const merchantLat = originLat + getHashOffset((activeOrderTrack.items[0]?.merchantId || 'm1') + 'm_lat', 0.018);
    const merchantLng = originLng + getHashOffset((activeOrderTrack.items[0]?.merchantId || 'm1') + 'm_lng', 0.018);

    // 3. Live Delivery Agent Coordinates (Interpolated along route based on status / simProgress)
    let agentLat = merchantLat;
    let agentLng = merchantLng;

    if (activeOrderTrack.status === 'delivered') {
      agentLat = clientLat;
      agentLng = clientLng;
    } else if (activeOrderTrack.status === 'in_transit' || activeOrderTrack.status === 'picked_up') {
      agentLat = merchantLat + (clientLat - merchantLat) * simProgress;
      agentLng = merchantLng + (clientLng - merchantLng) * simProgress;
    } else if (activeOrderTrack.status === 'ready_for_pickup' || activeOrderTrack.status === 'preparing') {
      agentLat = merchantLat + (clientLat - merchantLat) * 0.08;
      agentLng = merchantLng + (clientLng - merchantLng) * 0.08;
    }

    // Distance remaining to client
    const distanceToClientKm = getHaversineDistanceKm(agentLat, agentLng, clientLat, clientLng);
    const estimatedMinutes = Math.max(2, Math.ceil((distanceToClientKm / 22) * 60)); // Assumes ~22km/h city delivery speed

    return {
      destCity,
      originCity,
      clientPos: [clientLat, clientLng] as [number, number],
      merchantPos: [merchantLat, merchantLng] as [number, number],
      agentPos: [agentLat, agentLng] as [number, number],
      distanceToClientKm,
      estimatedMinutes,
    };
  };

  const positions = getTrackingPositions();

  // Initialize and render map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [7.3, -5.4],
        zoom: 7,
        zoomControl: false, // Custom zoom control or clean interface
      });

      // CartoDB Voyager Light Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    if (!map || !layerGroup) return;

    // Handle container resize (e.g., orientation change on Android/iOS/Tablet)
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    layerGroup.clearLayers();

    // MODE A: ORDER TRACKING MODE
    if (activeOrderTrack && positions) {
      const { clientPos, merchantPos, agentPos, distanceToClientKm, estimatedMinutes } = positions;
      const livreur = activeOrderTrack.assignedLivreur;
      const driverName = livreur ? livreur.name : 'Livreur Ivoire Delivery';
      const driverPhone = livreur ? livreur.phone : '+225 07 00 00 00 00';
      const driverVehicle = livreur ? livreur.vehicle : 'Moto Express';

      // 1. CLIENT ADDRESS MARKER
      const clientIcon = L.divIcon({
        className: 'custom-client-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute -inset-2 rounded-full bg-[#009E49]/30 animate-ping"></div>
            <div class="w-10 h-10 rounded-2xl bg-[#009E49] text-white flex items-center justify-center border-2 border-white shadow-xl text-lg font-black z-10">
              🏠
            </div>
            <div class="absolute top-11 bg-white/95 text-gray-900 text-[11px] font-black px-2.5 py-1 rounded-xl border border-gray-200 shadow-md whitespace-nowrap flex items-center gap-1 z-20">
              <span class="w-2 h-2 rounded-full bg-[#009E49]"></span>
              <span>Client: ${activeOrderTrack.clientName}</span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const clientMarker = L.marker(clientPos, { icon: clientIcon }).addTo(layerGroup);
      clientMarker.bindPopup(`
        <div class="p-3 text-gray-900 font-sans max-w-xs space-y-1.5">
          <div class="flex items-center gap-1.5 text-[#009E49] font-black text-xs uppercase">
            <span>📍 Destination Client</span>
          </div>
          <div class="font-extrabold text-sm text-gray-900">${activeOrderTrack.clientName}</div>
          <div class="text-xs text-gray-600 font-medium">🏠 ${activeOrderTrack.deliveryAddress}</div>
          <div class="text-[11px] text-gray-500">📞 ${activeOrderTrack.clientPhone}</div>
          ${activeOrderTrack.proof?.otpCode ? `
            <div class="mt-2 bg-orange-50 border border-orange-200 p-2 rounded-xl text-center">
              <span class="text-[10px] text-orange-800 font-bold uppercase block">Code OTP Sécurité Client</span>
              <span class="text-lg font-black text-[#FF8C00] font-mono">${activeOrderTrack.proof.otpCode}</span>
            </div>
          ` : ''}
        </div>
      `);

      // 2. DELIVERY AGENT REAL-TIME MARKER
      const agentIcon = L.divIcon({
        className: 'custom-agent-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute -inset-3 rounded-full bg-sky-500/30 animate-pulse"></div>
            <div class="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center border-2 border-white shadow-xl text-xl font-black z-10">
              🛵
            </div>
            <div class="absolute top-12 bg-gray-900 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap flex items-center gap-1.5 z-20">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>${driverName}</span>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const agentMarker = L.marker(agentPos, { icon: agentIcon }).addTo(layerGroup);
      agentMarker.bindPopup(`
        <div class="p-3 text-gray-900 font-sans max-w-xs space-y-2">
          <div class="flex items-center gap-1.5 text-sky-600 font-black text-xs uppercase">
            <span>🛵 Livreur GPS en Direct</span>
          </div>
          <div class="font-extrabold text-sm text-gray-900">${driverName}</div>
          <div class="text-xs text-gray-600 font-medium">${driverVehicle} | ⭐ 4.9 (180+ courses)</div>
          <div class="bg-sky-50 border border-sky-100 p-2 rounded-xl text-xs space-y-1">
            <div class="flex justify-between text-gray-700">
              <span>Distance client :</span>
              <span class="font-black text-sky-700">${distanceToClientKm} km</span>
            </div>
            <div class="flex justify-between text-gray-700">
              <span>Arrivée estimée :</span>
              <span class="font-black text-[#009E49]">~${estimatedMinutes} min</span>
            </div>
          </div>
          <a href="tel:${driverPhone}" class="block w-full bg-[#009E49] hover:bg-emerald-600 text-white text-center font-bold py-1.5 rounded-xl text-xs transition-colors">
            📞 Appeler ${driverName}
          </a>
        </div>
      `);

      // 3. MERCHANT PICKUP MARKER
      const merchantName = activeOrderTrack.items[0]?.merchantName || 'Boutique Partenaire';
      const merchantIcon = L.divIcon({
        className: 'custom-merchant-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="w-9 h-9 rounded-2xl bg-[#FF8C00] text-white flex items-center justify-center border-2 border-white shadow-lg text-base font-black z-10">
              🏬
            </div>
            <div class="absolute top-10 bg-white/95 text-gray-800 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-gray-200 shadow-sm whitespace-nowrap z-20">
              ${merchantName}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const merchantMarker = L.marker(merchantPos, { icon: merchantIcon }).addTo(layerGroup);
      merchantMarker.bindPopup(`
        <div class="p-3 text-gray-900 font-sans">
          <div class="text-[10px] text-[#FF8C00] font-black uppercase">Point d'Enlèvement Commerçant</div>
          <div class="font-extrabold text-xs text-gray-900 mt-0.5">${merchantName}</div>
          <div class="text-[11px] text-gray-500">Ville: ${activeOrderTrack.originCityName}</div>
        </div>
      `);

      // 4. POLYLINES
      // Path 1: Merchant -> Agent (Completed path in green)
      L.polyline([merchantPos, agentPos], {
        color: '#009E49',
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);

      // Path 2: Agent -> Client (Remaining path in dashed orange)
      L.polyline([agentPos, clientPos], {
        color: '#FF8C00',
        weight: 5,
        dashArray: '8, 8',
        opacity: 0.85,
      }).addTo(layerGroup);

      // Fit map bounds to encompass Merchant, Agent, and Client
      const bounds = L.latLngBounds([merchantPos, agentPos, clientPos]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });

    } else if (routeWaypoints && routeWaypoints.length > 0) {
      // MODE B: MULTI-STOP OPTIMIZED ROUTE TOUR
      const latLngs: [number, number][] = [];

      routeWaypoints.forEach(wp => {
        const pos: [number, number] = [wp.lat, wp.lng];
        latLngs.push(pos);

        let iconHtml = '';
        if (wp.type === 'start') {
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center border-2 border-white shadow-xl text-lg font-black z-10">
                🛵
              </div>
              <div class="absolute top-11 bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap shadow-md">
                DÉPART
              </div>
            </div>
          `;
        } else if (wp.type === 'pickup') {
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="w-9 h-9 rounded-2xl bg-[#FF8C00] text-white flex items-center justify-center border-2 border-white shadow-xl text-sm font-black z-10">
                🏬
              </div>
              <div class="absolute -top-2 -right-2 bg-gray-900 text-amber-300 text-[11px] font-black w-5 h-5 rounded-full border border-amber-400 flex items-center justify-center shadow-md z-20">
                ${wp.stepNumber}
              </div>
              <div class="absolute top-10 bg-white/95 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-200 shadow-sm whitespace-nowrap z-20 max-w-[120px] truncate">
                ${wp.stepNumber}. ${wp.title.replace('Pick-up: ', '')}
              </div>
            </div>
          `;
        } else {
          // Delivery
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="w-9 h-9 rounded-2xl bg-[#009E49] text-white flex items-center justify-center border-2 border-white shadow-xl text-sm font-black z-10">
                🏠
              </div>
              <div class="absolute -top-2 -right-2 bg-gray-900 text-emerald-300 text-[11px] font-black w-5 h-5 rounded-full border border-emerald-400 flex items-center justify-center shadow-md z-20">
                ${wp.stepNumber}
              </div>
              <div class="absolute top-10 bg-white/95 text-emerald-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 shadow-sm whitespace-nowrap z-20 max-w-[120px] truncate">
                ${wp.stepNumber}. ${wp.title.replace('Livraison: ', '')}
              </div>
            </div>
          `;
        }

        const markerIcon = L.divIcon({
          className: `custom-route-wp-${wp.id}`,
          html: iconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker(pos, { icon: markerIcon }).addTo(layerGroup);
        marker.bindPopup(`
          <div class="p-3 text-gray-900 font-sans max-w-xs space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                wp.type === 'start' ? 'bg-sky-100 text-sky-800' :
                wp.type === 'pickup' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }">
                Étape ${wp.stepNumber === 0 ? 'Départ' : wp.stepNumber}
              </span>
              ${wp.legDistanceKm ? `<span class="text-xs font-bold text-gray-500">+${wp.legDistanceKm} km (${wp.legEstimatedMins} min)</span>` : ''}
            </div>
            <div class="font-extrabold text-xs text-gray-900">${wp.title}</div>
            <div class="text-[11px] text-gray-600 font-medium">${wp.subtitle}</div>
            <div class="text-[10px] text-gray-400">📍 ${wp.address}</div>
            ${wp.phone ? `<a href="tel:${wp.phone}" class="mt-2 block w-full text-center bg-gray-900 text-white font-bold text-[11px] py-1 rounded-lg">📞 ${wp.phone}</a>` : ''}
          </div>
        `);
      });

      // Draw polyline connecting optimized tour route
      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: '#009E49',
          weight: 5,
          opacity: 0.95,
          dashArray: '1, 2',
        }).addTo(layerGroup);
      }

      // Fit bounds
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }

    } else {
      // MODE C: GENERAL REGIONAL HUB / OVERVIEW MAP
      cities.forEach(city => {
        if (!city || typeof city.lat !== 'number' || typeof city.lng !== 'number') return;
        const isSelected = selectedCityId === city.id;
        const isAgnibilekro = city.id === 'agnibilekro';

        const cityIcon = L.divIcon({
          className: 'custom-city-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="absolute -inset-2 rounded-full ${
                isAgnibilekro ? 'bg-amber-500/30 ring-2 ring-amber-400/50' : 'bg-[#009E49]/20'
              } animate-pulse"></div>
              <div class="w-9 h-9 rounded-2xl ${
                isAgnibilekro
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-200'
                  : city.isHubActive ? 'bg-[#009E49] text-white border-white' : 'bg-gray-400 text-white border-white'
              } font-black text-xs flex items-center justify-center border-2 shadow-lg z-10 transition-transform hover:scale-110">
                ${isAgnibilekro ? '👑' : city.name.substring(0, 3).toUpperCase()}
              </div>
              <div class="absolute top-10 bg-white/95 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-xl border border-gray-200 shadow-md whitespace-nowrap z-20 flex items-center gap-1">
                ${isAgnibilekro ? '<span class="text-amber-500 font-bold">Djuablin</span>' : ''}
                <span>${city.name}</span>
                <span class="text-[9px] text-gray-500 font-bold bg-gray-100 px-1 rounded">${city.couriersCount} livreurs</span>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([city.lat, city.lng], { icon: cityIcon }).addTo(layerGroup);
        marker.bindPopup(`
          <div class="p-3 text-gray-900 font-sans max-w-xs space-y-1">
            <div class="flex items-center gap-1.5 text-[#009E49] font-black text-xs uppercase">
              <span>📍 Hub Logistique ${isAgnibilekro ? 'Régional du Djuablin' : 'National'}</span>
            </div>
            <h4 class="font-extrabold text-sm text-gray-900">${city.name}</h4>
            <div class="text-xs text-gray-600 font-medium">Région : ${city.region}</div>
            <div class="bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-xs space-y-0.5 mt-2">
              <div class="flex justify-between font-bold text-emerald-900">
                <span>Statut Hub :</span>
                <span class="text-[#009E49]">${city.isHubActive ? 'Actif & Opérationnel' : 'En Déploiement'}</span>
              </div>
              <div class="flex justify-between text-gray-700">
                <span>Flotte GPS :</span>
                <span class="font-extrabold text-gray-900">${city.couriersCount} livreurs enregistrés</span>
              </div>
            </div>
          </div>
        `);
      });

      // Render Active Livreurs
      livreurs.forEach(l => {
        if (l.status === 'online' || l.status === 'busy') {
          const livreurIcon = L.divIcon({
            className: 'custom-livreur-marker',
            html: `
              <div class="relative">
                <div class="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center border-2 border-white shadow-md text-xs font-bold">
                  🛵
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const m = L.marker([l.currentLat, l.currentLng], { icon: livreurIcon }).addTo(layerGroup);
          m.bindPopup(`
            <div class="p-2 text-gray-900 font-sans">
              <div class="font-bold text-xs">${l.name} (${l.vehicle})</div>
              <div class="text-[11px] text-gray-600">Ville: ${l.cityName}</div>
            </div>
          `);
        }
      });

      if (selectedCityId && selectedCityId !== 'all') {
        const city = cities.find(c => c.id === selectedCityId);
        if (city && typeof city.lat === 'number' && typeof city.lng === 'number') map.setView([city.lat, city.lng], 11);
      } else {
        map.setView([7.3, -5.4], 7);
      }
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [cities, selectedCityId, livreurs, orders, activeOrderTrack, positions, routeWaypoints]);

  // Recenter controls
  const handleRecenterAgent = () => {
    if (mapInstanceRef.current && positions) {
      mapInstanceRef.current.setView(positions.agentPos, 15);
    }
  };

  const handleRecenterClient = () => {
    if (mapInstanceRef.current && positions) {
      mapInstanceRef.current.setView(positions.clientPos, 15);
    }
  };

  const handleFitRouteBounds = () => {
    if (mapInstanceRef.current && positions) {
      const bounds = L.latLngBounds([positions.merchantPos, positions.agentPos, positions.clientPos]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
      
      {/* Real-time Order Tracking HUD Banner */}
      {activeOrderTrack && positions && (
        <div className="absolute top-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md border border-gray-200/80 p-3.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-gray-900">
                <span>{activeOrderTrack.assignedLivreur?.name || 'Livreur Ivoire Delivery'}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#009E49] animate-ping"></span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                {activeOrderTrack.assignedLivreur?.vehicle || 'Moto Express'} • En route vers votre adresse
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-gray-500 block font-bold">Dist. Client</span>
              <span className="font-black text-[#009E49] text-sm">{positions.distanceToClientKm} km</span>
            </div>

            <div className="bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 text-center">
              <span className="text-[10px] text-gray-500 block font-bold">Arrivée estimée</span>
              <span className="font-black text-[#FF8C00] text-sm">~{positions.estimatedMinutes} min</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Interactive Map Action Controls */}
      {activeOrderTrack && positions && (
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
          <button
            onClick={handleRecenterAgent}
            className="bg-white/95 hover:bg-white text-gray-800 font-extrabold px-3 py-2 rounded-xl text-xs border border-gray-200 shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Recentrer sur la position du livreur"
          >
            <Crosshair className="w-4 h-4 text-sky-600" />
            <span>Suivre Livreur</span>
          </button>

          <button
            onClick={handleRecenterClient}
            className="bg-white/95 hover:bg-white text-gray-800 font-extrabold px-3 py-2 rounded-xl text-xs border border-gray-200 shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Centrer sur mon adresse client"
          >
            <Home className="w-4 h-4 text-[#009E49]" />
            <span>Mon Adresse</span>
          </button>

          <button
            onClick={handleFitRouteBounds}
            className="bg-white/95 hover:bg-white text-gray-800 font-extrabold px-3 py-2 rounded-xl text-xs border border-gray-200 shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Ajuster l'affichage du trajet complet"
          >
            <Maximize2 className="w-4 h-4 text-purple-600" />
            <span>Vue globale</span>
          </button>

          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`font-black px-3 py-2 rounded-xl text-xs border shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              isSimulating
                ? 'bg-[#009E49] text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
            title="Activer ou mettre en pause la simulation de trajet GPS"
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? 'GPS en Direct' : 'Reprendre GPS'}</span>
          </button>
        </div>
      )}

      {/* Map Legend Bar when not tracking */}
      {!activeOrderTrack && (
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur border border-gray-200 text-gray-800 text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-3 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#009E49]"></span>
            <span>Hubs Villes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span>Livreurs GPS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#009E49] border-dashed"></span>
            <span>Itinéraire</span>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
    </div>
  );
};
