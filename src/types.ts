export type UserRole = 'client' | 'merchant' | 'livreur' | 'admin';

export type DeliveryMode = 'express' | 'grouped' | 'scheduled';

export type OrderStatus = 
  | 'pending' 
  | 'accepted' 
  | 'preparing' 
  | 'ready_for_pickup' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

export interface CityNode {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  isHubActive: boolean;
  launchPhase: number; // 1 = First wave (Bouaké, Korhogo), 2 = Yamoussoukro, Daloa, 3 = San-Pédro, Man, 4 = Abidjan
  couriersCount: number;
}

export interface Merchant {
  id: string;
  name: string;
  category: 'chaussures' | 'parfum' | 'telephone' | 'repas' | 'general';
  cityId: string;
  cityName: string;
  address: string;
  rating: number;
  avatar: string;
  phone: string;
}

export interface Product {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  category: 'chaussures' | 'parfum' | 'telephone' | 'repas' | 'general';
  priceFCFA: number;
  weightKg: number;
  image: string;
  description: string;
  cityId: string;
  cityName: string;
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Livreur {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  cityId: string;
  cityName: string;
  vehicle: 'Moto Express' | 'Tricycle Frigo' | 'Camionnette Inter-ville' | 'Vélo Cargo';
  rating: number;
  status: 'online' | 'busy' | 'offline';
  currentLat: number;
  currentLng: number;
  totalDeliveries: number;
  walletFCFA: number;
}

export interface ProofOfDelivery {
  otpCode: string;
  isOtpVerified?: boolean;
  signatureDataUrl?: string;
  signatureUrl?: string;
  photoUrl?: string;
  deliveredAt?: string;
  receivedBy?: string;
  recipientName?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  merchantId: string;
  merchantName: string;
  cityName: string;
  priceFCFA: number;
  quantity: number;
  weightKg: number;
}

export interface OrderReview {
  livreurRating: number;
  livreurComment?: string;
  merchantRating: number;
  merchantComment?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  trackingNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  deliveryAddress: string;
  originCityId: string;
  originCityName: string;
  destinationCityId: string;
  destinationCityName: string;
  items: OrderItem[];
  itemsSubtotalFCFA: number;
  deliveryFeeFCFA: number;
  totalFCFA: number;
  deliveryMode: DeliveryMode;
  isGrouped: boolean;
  groupedSavingsFCFA?: number;
  scheduledTime?: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime: string;
  roadDistanceKm?: number;
  haversineKm?: number;
  assignedLivreur?: Livreur;
  proof?: ProofOfDelivery;
  paymentMethod: 'wave' | 'orange_money' | 'mtn_money' | 'cash';
  currentLat?: number;
  currentLng?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsUsed?: number;
  loyaltyDiscountFCFA?: number;
  review?: OrderReview;
}

export interface LoyaltyTransaction {
  id: string;
  date: string;
  points: number;
  type: 'earn_order' | 'bonus_threshold' | 'redeem_discount' | 'bonus_signup';
  description: string;
  orderTrackingNumber?: string;
}

export interface LoyaltyAccount {
  pointsBalance: number;
  totalEarnedPoints: number;
  tier: 'bronze' | 'argent' | 'or' | 'diamant';
  discountThresholdFCFA: number;
  pointsPerFCFA: number;
  transactions: LoyaltyTransaction[];
}

export interface WalletTransaction {
  id: string;
  date: string;
  amountFCFA: number;
  type: 'credit' | 'debit';
  description: string;
  method: 'wave' | 'orange_money' | 'mtn_money' | 'bank';
  reference: string;
}

export interface SmartGroupingRecommendation {
  canGroup: boolean;
  originalDeliveryFeeFCFA: number;
  groupedDeliveryFeeFCFA: number;
  savingsFCFA: number;
  hubLocation: string;
  estimatedExtraHours: number;
  explanation: string;
}

export interface ZoneTariff {
  cityId: string;
  cityName: string;
  basePriceFCFA: number;
  perKmRateFCFA: number;
  expressMultiplier: number;
  surgeMultiplier: number;
}

export interface RouteWaypoint {
  id: string;
  type: 'start' | 'pickup' | 'delivery';
  stepNumber: number; // 0, 1, 2, 3...
  title: string;
  subtitle: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  orderId?: string;
  trackingNumber?: string;
  legDistanceKm?: number;
  legEstimatedMins?: number;
}

export interface OptimizedTourResult {
  waypoints: RouteWaypoint[];
  totalDistanceKm: number;
  unoptimizedDistanceKm: number;
  savedDistanceKm: number;
  savingsPercentage: number;
  totalDurationMins: number;
  totalEarningsFCFA: number;
  fuelSavedLiters: number;
}

export interface PredictiveZoneDemand {
  id: string;
  cityName: string;
  zoneName: string;
  predictedSurgePercent: number;
  timeWindowMin: number; // e.g. in 20 minutes
  expectedOrdersCount: number;
  currentDriversAvailable: number;
  requiredDriversCount: number;
  confidenceScore: number; // 0-100%
  triggerReason: string;
  heatLevel: 'critical' | 'high' | 'moderate';
}

export interface DriverRepositionRecommendation {
  id: string;
  livreurId: string;
  livreurName: string;
  vehicleType: string;
  currentZone: string;
  targetZone: string;
  cityName: string;
  transitTimeMins: number;
  expectedOrderBonusFCFA: number;
  isSent?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_status_change' | 'new_order' | 'system';
  timestamp: string;
  read: boolean;
  targetRole?: 'client' | 'admin' | 'merchant' | 'livreur' | 'all';
  orderId?: string;
  trackingNumber?: string;
  status?: OrderStatus;
}

