import { Order, Livreur, CityNode, RouteWaypoint, OptimizedTourResult } from '../types';

// Haversine formula distance in kilometers
export function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Deterministic GPS coordinate offset generator for mock city addresses
function getHashOffset(seed: string, scale = 0.02) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const norm = (Math.abs(hash) % 1000) / 1000;
  return (norm - 0.5) * scale;
}

interface NodePoint {
  id: string;
  type: 'pickup' | 'delivery';
  orderId: string;
  order: Order;
  title: string;
  subtitle: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
}

export function optimizeDeliveryTour(
  selectedOrders: Order[],
  livreur: Livreur,
  cities: CityNode[]
): OptimizedTourResult {
  if (selectedOrders.length === 0) {
    const startWaypoint: RouteWaypoint = {
      id: 'start-node',
      type: 'start',
      stepNumber: 0,
      title: `Départ Livreur : ${livreur.name}`,
      subtitle: `Position GPS actuelle (${livreur.cityName})`,
      address: `Hub ${livreur.cityName}, Côte d'Ivoire`,
      phone: livreur.phone,
      lat: livreur.currentLat,
      lng: livreur.currentLng,
      legDistanceKm: 0,
      legEstimatedMins: 0,
    };

    return {
      waypoints: [startWaypoint],
      totalDistanceKm: 0,
      unoptimizedDistanceKm: 0,
      savedDistanceKm: 0,
      savingsPercentage: 0,
      totalDurationMins: 0,
      totalEarningsFCFA: 0,
      fuelSavedLiters: 0,
    };
  }

  // 1. Generate Pickup & Delivery Node objects with GPS coordinates
  const pickups: NodePoint[] = [];
  const deliveriesMap = new Map<string, NodePoint>();

  selectedOrders.forEach(order => {
    const defaultCity = (cities && cities.length > 0) ? cities[0] : { id: 'abidjan', name: 'Abidjan', lat: 5.36, lng: -4.0083 };
    const originCity = (cities && cities.length > 0 ? cities.find(c => c.id === order.originCityId) : null) || defaultCity;
    const destCity = (cities && cities.length > 0 ? cities.find(c => c.id === order.destinationCityId) : null) || defaultCity;

    const originLat = originCity?.lat ?? 5.36;
    const originLng = originCity?.lng ?? -4.0083;
    const destLat = destCity?.lat ?? 5.36;
    const destLng = destCity?.lng ?? -4.0083;

    const merchantLat = originLat + getHashOffset((order.items[0]?.merchantId || 'm1') + 'm_lat', 0.018);
    const merchantLng = originLng + getHashOffset((order.items[0]?.merchantId || 'm1') + 'm_lng', 0.018);

    const clientLat = order.currentLat && order.status === 'delivered'
      ? order.currentLat
      : destLat + getHashOffset(order.id + 'client_lat', 0.024);
    const clientLng = order.currentLng && order.status === 'delivered'
      ? order.currentLng
      : destLng + getHashOffset(order.id + 'client_lng', 0.024);

    const pNode: NodePoint = {
      id: `p_${order.id}`,
      type: 'pickup',
      orderId: order.id,
      order,
      title: `Pick-up: ${order.items[0]?.merchantName || 'Boutique Partenaire'}`,
      subtitle: `Article(s): ${order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}`,
      address: `Marché / Store ${order.originCityName}`,
      phone: '+225 07 00 11 22',
      lat: merchantLat,
      lng: merchantLng,
    };

    const dNode: NodePoint = {
      id: `d_${order.id}`,
      type: 'delivery',
      orderId: order.id,
      order,
      title: `Livraison: ${order.clientName}`,
      subtitle: `Colis ${order.trackingNumber} • Encaissement: ${order.totalFCFA} FCFA`,
      address: `${order.deliveryAddress} (${order.destinationCityName})`,
      phone: order.clientPhone,
      lat: clientLat,
      lng: clientLng,
    };

    pickups.push(pNode);
    deliveriesMap.set(order.id, dNode);
  });

  // 2. Unoptimized sequential distance calculation (P1 -> D1 -> P2 -> D2...)
  let currLat = livreur.currentLat;
  let currLng = livreur.currentLng;
  let unoptimizedDistanceKm = 0;

  selectedOrders.forEach(order => {
    const p = pickups.find(node => node.orderId === order.id);
    const d = deliveriesMap.get(order.id);

    if (p && d) {
      unoptimizedDistanceKm += getHaversineDistanceKm(currLat, currLng, p.lat, p.lng);
      unoptimizedDistanceKm += getHaversineDistanceKm(p.lat, p.lng, d.lat, d.lng);
      currLat = d.lat;
      currLng = d.lng;
    }
  });

  // 3. TSP Nearest Neighbor with Pickup-before-Delivery Constraint Optimization
  currLat = livreur.currentLat;
  currLng = livreur.currentLng;

  const waypoints: RouteWaypoint[] = [];

  // Step 0: Driver Start
  waypoints.push({
    id: 'start-node',
    type: 'start',
    stepNumber: 0,
    title: `Point de Départ : ${livreur.name}`,
    subtitle: `Position GPS actuelle (${livreur.cityName})`,
    address: `Hub Livreur ${livreur.cityName}, Côte d'Ivoire`,
    phone: livreur.phone,
    lat: currLat,
    lng: currLng,
    legDistanceKm: 0,
    legEstimatedMins: 0,
  });

  const availablePickups = [...pickups];
  const unlockedDeliveries: NodePoint[] = [];

  let stepCounter = 1;
  let totalOptimizedDistanceKm = 0;
  let totalDurationMins = 0;

  while (availablePickups.length > 0 || unlockedDeliveries.length > 0) {
    const candidates = [...availablePickups, ...unlockedDeliveries];

    // Find candidate with minimum Haversine distance from current location
    let bestCandidate: NodePoint | null = null;
    let minDistance = Infinity;

    for (const cand of candidates) {
      const dist = getHaversineDistanceKm(currLat, currLng, cand.lat, cand.lng);
      if (dist < minDistance) {
        minDistance = dist;
        bestCandidate = cand;
      }
    }

    if (!bestCandidate) break;

    // Move to best candidate
    totalOptimizedDistanceKm += minDistance;
    // Estimate leg time: average urban speed 24 km/h (~2.5 min/km) + 5 min handling stop
    const legMins = Math.max(3, Math.round((minDistance / 24) * 60) + 5);
    totalDurationMins += legMins;

    waypoints.push({
      id: bestCandidate.id,
      type: bestCandidate.type,
      stepNumber: stepCounter++,
      title: bestCandidate.title,
      subtitle: bestCandidate.subtitle,
      address: bestCandidate.address,
      phone: bestCandidate.phone,
      lat: bestCandidate.lat,
      lng: bestCandidate.lng,
      orderId: bestCandidate.orderId,
      trackingNumber: bestCandidate.order.trackingNumber,
      legDistanceKm: minDistance,
      legEstimatedMins: legMins,
    });

    currLat = bestCandidate.lat;
    currLng = bestCandidate.lng;

    if (bestCandidate.type === 'pickup') {
      // Remove from availablePickups and unlock corresponding delivery
      const idx = availablePickups.findIndex(p => p.id === bestCandidate!.id);
      if (idx !== -1) availablePickups.splice(idx, 1);

      const dNode = deliveriesMap.get(bestCandidate.orderId);
      if (dNode) unlockedDeliveries.push(dNode);
    } else {
      // Remove from unlockedDeliveries
      const idx = unlockedDeliveries.findIndex(d => d.id === bestCandidate!.id);
      if (idx !== -1) unlockedDeliveries.splice(idx, 1);
    }
  }

  // 4. Calculate final metrics
  totalOptimizedDistanceKm = Math.round(totalOptimizedDistanceKm * 10) / 10;
  unoptimizedDistanceKm = Math.round(unoptimizedDistanceKm * 10) / 10;
  const savedDistanceKm = Math.max(0, Math.round((unoptimizedDistanceKm - totalOptimizedDistanceKm) * 10) / 10);
  const savingsPercentage = unoptimizedDistanceKm > 0
    ? Math.round((savedDistanceKm / unoptimizedDistanceKm) * 100)
    : 0;

  // Driver total earnings = 75% of sum of delivery fees
  const totalEarningsFCFA = selectedOrders.reduce(
    (sum, o) => sum + Math.round(o.deliveryFeeFCFA * 0.75),
    0
  );

  // Fuel saved estimate (0.035 Liters of fuel per km saved on motorbike/tricycle)
  const fuelSavedLiters = Math.round(savedDistanceKm * 0.035 * 100) / 100;

  return {
    waypoints,
    totalDistanceKm: totalOptimizedDistanceKm,
    unoptimizedDistanceKm,
    savedDistanceKm,
    savingsPercentage,
    totalDurationMins,
    totalEarningsFCFA,
    fuelSavedLiters,
  };
}
