import { IVOIRIAN_CITIES, INITIAL_TARIFFS } from '../data/mockData';
import { CartItem, DeliveryMode, SmartGroupingRecommendation } from '../types';

// Distance matrix between key Ivory Coast cities in kilometers (road distances)
const ROAD_DISTANCES_KM: Record<string, Record<string, number>> = {
  bouake: {
    bouake: 5,
    korhogo: 225,
    yamoussoukro: 105,
    daloa: 195,
    'san-pedro': 415,
    man: 320,
    abidjan: 335,
    gagnoa: 245,
  },
  korhogo: {
    bouake: 225,
    korhogo: 5,
    yamoussoukro: 330,
    daloa: 420,
    'san-pedro': 640,
    man: 480,
    abidjan: 560,
    gagnoa: 470,
  },
  yamoussoukro: {
    bouake: 105,
    korhogo: 330,
    yamoussoukro: 5,
    daloa: 140,
    'san-pedro': 360,
    man: 295,
    abidjan: 230,
    gagnoa: 140,
  },
  daloa: {
    bouake: 195,
    korhogo: 420,
    yamoussoukro: 140,
    daloa: 5,
    'san-pedro': 270,
    man: 185,
    abidjan: 370,
    gagnoa: 120,
  },
  'san-pedro': {
    bouake: 415,
    korhogo: 640,
    yamoussoukro: 360,
    daloa: 270,
    'san-pedro': 5,
    man: 390,
    abidjan: 345,
    gagnoa: 215,
  },
  man: {
    bouake: 320,
    korhogo: 480,
    yamoussoukro: 295,
    daloa: 185,
    'san-pedro': 390,
    man: 5,
    abidjan: 525,
    gagnoa: 280,
  },
  abidjan: {
    bouake: 335,
    korhogo: 560,
    yamoussoukro: 230,
    daloa: 370,
    'san-pedro': 345,
    man: 525,
    abidjan: 8,
    gagnoa: 270,
  },
  gagnoa: {
    bouake: 245,
    korhogo: 470,
    yamoussoukro: 140,
    daloa: 120,
    'san-pedro': 215,
    man: 280,
    abidjan: 270,
    gagnoa: 5,
  }
};

export function getDistanceKm(cityAId: string, cityBId: string): number {
  if (cityAId === cityBId) return 6; // intra-city average

  if (ROAD_DISTANCES_KM[cityAId] && ROAD_DISTANCES_KM[cityAId][cityBId]) {
    return ROAD_DISTANCES_KM[cityAId][cityBId];
  }

  const cityA = IVOIRIAN_CITIES.find(c => c.id === cityAId);
  const cityB = IVOIRIAN_CITIES.find(c => c.id === cityBId);

  if (cityA && cityB) {
    const directKm = calculateHaversineKm(cityA.lat, cityA.lng, cityB.lat, cityB.lng);
    return Math.max(15, Math.round(directKm * 1.28));
  }

  return 200; // default fallback km
}

export function calculateDeliveryFee(
  originCityId: string,
  destinationCityId: string,
  totalWeightKg: number,
  mode: DeliveryMode = 'express',
  isGrouped: boolean = false
): number {
  const distanceKm = getDistanceKm(originCityId, destinationCityId);
  const tariff = INITIAL_TARIFFS.find(t => t.cityId === originCityId) || INITIAL_TARIFFS[0];

  let fee = tariff.basePriceFCFA;

  // Add distance cost
  if (originCityId === destinationCityId) {
    // Intra-city
    fee += Math.max(0, totalWeightKg - 1) * 300;
  } else {
    // Inter-city national delivery
    fee += distanceKm * 8.5 + (totalWeightKg * 400);
  }

  // Multiplier for express
  if (mode === 'express') {
    fee *= tariff.expressMultiplier;
  } else if (mode === 'scheduled') {
    fee *= 0.95;
  }

  // Surge multiplier
  fee *= tariff.surgeMultiplier;

  // Discount for grouped smart delivery
  if (isGrouped) {
    fee *= 0.70; // 30% savings when grouping packages!
  }

  // Round to nearest 50 FCFA
  return Math.round(fee / 50) * 50;
}

export function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export function simulateSmartGrouping(cartItems: CartItem[]): SmartGroupingRecommendation {
  if (cartItems.length === 0) {
    return {
      canGroup: false,
      originalDeliveryFeeFCFA: 0,
      groupedDeliveryFeeFCFA: 0,
      savingsFCFA: 0,
      hubLocation: 'Bouaké (Hub Central)',
      estimatedExtraHours: 0,
      explanation: 'Aucun article dans le panier.'
    };
  }

  const merchantsCount = new Set(cartItems.map(i => i.product.merchantId)).size;
  const citiesCount = new Set(cartItems.map(i => i.product.cityId)).size;

  // Sum separate delivery fees
  let totalIndividualFee = 0;
  cartItems.forEach(item => {
    const fee = calculateDeliveryFee(item.product.cityId, item.product.cityId, item.product.weightKg * item.quantity, 'express', false);
    totalIndividualFee += fee;
  });

  if (merchantsCount > 1 || cartItems.length > 1) {
    const groupedFee = Math.round((totalIndividualFee * 0.65) / 50) * 50;
    const savings = totalIndividualFee - groupedFee;
    return {
      canGroup: true,
      originalDeliveryFeeFCFA: totalIndividualFee,
      groupedDeliveryFeeFCFA: groupedFee,
      savingsFCFA: savings,
      hubLocation: citiesCount > 1 ? 'Bouaké Hub National' : 'Relais Local',
      estimatedExtraHours: citiesCount > 1 ? 4 : 1,
      explanation: `L'algorithme Ivoire Delivery regroupe vos ${cartItems.length} articles provenant de ${merchantsCount} commerçant(s) dans une seule tournée de livraison. Économie estimée : ${formatFCFA(savings)}.`
    };
  }

  return {
    canGroup: false,
    originalDeliveryFeeFCFA: totalIndividualFee,
    groupedDeliveryFeeFCFA: totalIndividualFee,
    savingsFCFA: 0,
    hubLocation: cartItems[0].product.cityName,
    estimatedExtraHours: 0,
    explanation: '1 seul commerçant sélectionné. Livraison directe disponible.'
  };
}

/**
 * Calculates straight-line Haversine distance in km between two GPS coordinates.
 */
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round(R * c));
}

export interface DeliveryETAEstimate {
  originCityName: string;
  destinationCityName: string;
  originCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
  haversineKm: number;
  roadDistanceKm: number;
  averageSpeedKmh: number;
  preparationMin: number;
  transitMin: number;
  lastMileMin: number;
  groupingDelayMin: number;
  totalDurationMin: number;
  formattedDuration: string;
  estimatedArrivalRange: string;
  isSameCity: boolean;
}

/**
 * Calculates estimated transit time & ETA based on simulated hub GPS coordinates and road distance.
 */
export function calculateDeliveryETA(
  originCityId: string,
  destinationCityId: string,
  deliveryMode: DeliveryMode = 'express',
  isGrouped: boolean = false
): DeliveryETAEstimate {
  const defaultCity = IVOIRIAN_CITIES[0] || { id: 'abidjan', name: 'Abidjan', lat: 5.36, lng: -4.0083 };
  const originCity = IVOIRIAN_CITIES.find(c => c.id === originCityId) || defaultCity;
  const destCity = IVOIRIAN_CITIES.find(c => c.id === destinationCityId) || defaultCity;

  const originLat = originCity?.lat ?? 5.36;
  const originLng = originCity?.lng ?? -4.0083;
  const destLat = destCity?.lat ?? 5.36;
  const destLng = destCity?.lng ?? -4.0083;

  const isSameCity = originCityId === destinationCityId;

  // 1. Calculate GPS straight-line Haversine distance using hub coordinates
  const haversineKm = isSameCity ? 4 : calculateHaversineKm(originLat, originLng, destLat, destLng);

  // 2. Road distance in km
  const roadDistanceKm = getDistanceKm(originCityId, destinationCityId);

  // 3. Average logistics speed & stages in Cote d'Ivoire
  const averageSpeedKmh = isSameCity ? 30 : 65; // 30 km/h in city traffic, 65 km/h on national highways
  const preparationMin = 20; // 20 mins merchant packaging & hub intake
  const lastMileMin = isSameCity ? 20 : 35; // 20-35 mins local courier delivery

  // Transit duration = (road distance / speed) * 60 minutes
  const transitMin = Math.round((roadDistanceKm / averageSpeedKmh) * 60);

  // Mode adjustment
  let groupingDelayMin = 0;
  if (isGrouped || deliveryMode === 'grouped') {
    groupingDelayMin = isSameCity ? 45 : 180; // 45 min to 3 hours extra for package batching
  } else if (deliveryMode === 'scheduled') {
    groupingDelayMin = 120;
  }

  const totalDurationMin = preparationMin + transitMin + lastMileMin + groupingDelayMin;

  // Format Duration string e.g. "5h 30 min" or "45 min"
  const hours = Math.floor(totalDurationMin / 60);
  const mins = totalDurationMin % 60;
  let formattedDuration = '';
  if (hours > 0) {
    formattedDuration = `${hours}h${mins > 0 ? ` ${mins} min` : ''}`;
  } else {
    formattedDuration = `${mins} min`;
  }

  // Calculate Arrival Time Range
  const now = new Date();
  const arrivalMinTime = new Date(now.getTime() + totalDurationMin * 60 * 1000);
  const arrivalMaxTime = new Date(now.getTime() + (totalDurationMin + 35) * 60 * 1000);

  const formatTime = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const isTomorrow = arrivalMinTime.getDate() !== now.getDate();
  const datePrefix = isTomorrow ? 'Demain' : 'Aujourd\'hui';

  const estimatedArrivalRange = `${datePrefix} entre ${formatTime(arrivalMinTime)} et ${formatTime(arrivalMaxTime)}`;

  return {
    originCityName: originCity.name,
    destinationCityName: destCity.name,
    originCoords: { lat: originLat, lng: originLng },
    destinationCoords: { lat: destLat, lng: destLng },
    haversineKm,
    roadDistanceKm,
    averageSpeedKmh,
    preparationMin,
    transitMin,
    lastMileMin,
    groupingDelayMin,
    totalDurationMin,
    formattedDuration,
    estimatedArrivalRange,
    isSameCity,
  };
}

