import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { CityNode, Order, Livreur, PredictiveZoneDemand, DriverRepositionRecommendation } from '../types';
import { formatFCFA } from '../services/pricingService';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  Bike,
  ShieldAlert,
  BarChart3,
  RefreshCw,
  Zap,
  Users,
  Navigation,
  Check
} from 'lucide-react';

interface PredictiveDispatchDashboardProps {
  cities: CityNode[];
  orders: Order[];
  livreurs: Livreur[];
}

export const PredictiveDispatchDashboard: React.FC<PredictiveDispatchDashboardProps> = ({
  cities,
  orders,
  livreurs,
}) => {
  const [timeHorizon, setTimeHorizon] = useState<'lunch' | 'evening' | 'market' | 'payday'>('lunch');
  const [sentRecommendationIds, setSentRecommendationIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Predictive Demand Curve Data based on Time Horizon
  const hourlyForecastData = useMemo(() => {
    switch (timeHorizon) {
      case 'lunch':
        return [
          { time: '10:00', historicalOrders: 120, predictedOrders: 130, driversAvailable: 150 },
          { time: '10:30', historicalOrders: 180, predictedOrders: 210, driversAvailable: 150 },
          { time: '11:00', historicalOrders: 290, predictedOrders: 360, driversAvailable: 145 },
          { time: '11:30', historicalOrders: 450, predictedOrders: 580, driversAvailable: 140 }, // Pre-positioning window
          { time: '12:00', historicalOrders: 680, predictedOrders: 890, driversAvailable: 135 }, // PEAK
          { time: '12:30', historicalOrders: 720, predictedOrders: 940, driversAvailable: 130 }, // PEAK
          { time: '13:00', historicalOrders: 590, predictedOrders: 780, driversAvailable: 140 },
          { time: '13:30', historicalOrders: 380, predictedOrders: 490, driversAvailable: 148 },
          { time: '14:00', historicalOrders: 220, predictedOrders: 270, driversAvailable: 152 },
        ];
      case 'evening':
        return [
          { time: '16:00', historicalOrders: 180, predictedOrders: 200, driversAvailable: 160 },
          { time: '16:30', historicalOrders: 240, predictedOrders: 280, driversAvailable: 155 },
          { time: '17:00', historicalOrders: 390, predictedOrders: 480, driversAvailable: 150 },
          { time: '17:30', historicalOrders: 580, predictedOrders: 740, driversAvailable: 145 }, // Pre-positioning window
          { time: '18:00', historicalOrders: 760, predictedOrders: 960, driversAvailable: 138 }, // PEAK
          { time: '18:30', historicalOrders: 810, predictedOrders: 1020, driversAvailable: 132 }, // PEAK
          { time: '19:00', historicalOrders: 650, predictedOrders: 810, driversAvailable: 140 },
          { time: '19:30', historicalOrders: 420, predictedOrders: 510, driversAvailable: 150 },
          { time: '20:00', historicalOrders: 260, predictedOrders: 300, driversAvailable: 155 },
        ];
      case 'market':
        return [
          { time: '06:00', historicalOrders: 150, predictedOrders: 210, driversAvailable: 120 },
          { time: '07:00', historicalOrders: 320, predictedOrders: 440, driversAvailable: 125 },
          { time: '08:00', historicalOrders: 580, predictedOrders: 790, driversAvailable: 130 },
          { time: '09:00', historicalOrders: 740, predictedOrders: 1020, driversAvailable: 135 }, // Pre-positioning window
          { time: '10:00', historicalOrders: 890, predictedOrders: 1180, driversAvailable: 132 }, // PEAK
          { time: '11:00', historicalOrders: 820, predictedOrders: 1090, driversAvailable: 138 },
          { time: '12:00', historicalOrders: 640, predictedOrders: 830, driversAvailable: 140 },
          { time: '13:00', historicalOrders: 480, predictedOrders: 610, driversAvailable: 145 },
          { time: '14:00', historicalOrders: 310, predictedOrders: 390, driversAvailable: 150 },
        ];
      case 'payday':
      default:
        return [
          { time: '10:00', historicalOrders: 250, predictedOrders: 340, driversAvailable: 160 },
          { time: '11:00', historicalOrders: 480, predictedOrders: 690, driversAvailable: 155 },
          { time: '12:00', historicalOrders: 820, predictedOrders: 1150, driversAvailable: 150 }, // Pre-positioning window
          { time: '13:00', historicalOrders: 950, predictedOrders: 1380, driversAvailable: 142 }, // PEAK
          { time: '14:00', historicalOrders: 880, predictedOrders: 1240, driversAvailable: 145 },
          { time: '15:00', historicalOrders: 710, predictedOrders: 980, driversAvailable: 148 },
          { time: '16:00', historicalOrders: 790, predictedOrders: 1120, driversAvailable: 142 },
          { time: '17:00', historicalOrders: 910, predictedOrders: 1290, driversAvailable: 138 },
          { time: '18:00', historicalOrders: 840, predictedOrders: 1180, driversAvailable: 145 },
        ];
    }
  }, [timeHorizon]);

  // 2. High-Demand Forecasted Hotspot Zones
  const predictedZones: PredictiveZoneDemand[] = useMemo(() => {
    switch (timeHorizon) {
      case 'lunch':
        return [
          {
            id: 'pz-1',
            cityName: 'Bouaké',
            zoneName: 'Marché Gros & Quartier Commerce',
            predictedSurgePercent: 88,
            timeWindowMin: 20,
            expectedOrdersCount: 145,
            currentDriversAvailable: 3,
            requiredDriversCount: 10,
            confidenceScore: 97,
            triggerReason: 'Heure de Déjeuner • Restaurants & Boutiques Marchandes',
            heatLevel: 'critical',
          },
          {
            id: 'pz-2',
            cityName: 'Korhogo',
            zoneName: 'Zone Marché Central & Petit Paris',
            predictedSurgePercent: 65,
            timeWindowMin: 30,
            expectedOrdersCount: 92,
            currentDriversAvailable: 2,
            requiredDriversCount: 7,
            confidenceScore: 94,
            triggerReason: 'Commandes de Produits Frais & Épicerie',
            heatLevel: 'high',
          },
          {
            id: 'pz-3',
            cityName: 'Yamoussoukro',
            zoneName: 'Zone Cité Administrative & Fondation',
            predictedSurgePercent: 52,
            timeWindowMin: 15,
            expectedOrdersCount: 78,
            currentDriversAvailable: 3,
            requiredDriversCount: 7,
            confidenceScore: 92,
            triggerReason: 'Courriers Express de Bureau & Déjeuner',
            heatLevel: 'high',
          },
          {
            id: 'pz-4',
            cityName: 'Abidjan',
            zoneName: 'Plateau & Cocody Vallon',
            predictedSurgePercent: 115,
            timeWindowMin: 25,
            expectedOrdersCount: 310,
            currentDriversAvailable: 8,
            requiredDriversCount: 22,
            confidenceScore: 98,
            triggerReason: 'Rush Entreprises & Commandes Express',
            heatLevel: 'critical',
          },
          {
            id: 'pz-5',
            cityName: 'Agnibilékrou',
            zoneName: 'Grand Marché & Route de Bondoukou',
            predictedSurgePercent: 78,
            timeWindowMin: 20,
            expectedOrdersCount: 105,
            currentDriversAvailable: 3,
            requiredDriversCount: 8,
            confidenceScore: 96,
            triggerReason: 'Flux Commerçants Djuablin & Transit Frontalier',
            heatLevel: 'critical',
          },
        ];
      case 'evening':
        return [
          {
            id: 'pz-1',
            cityName: 'Bouaké',
            zoneName: 'Zone Residentiel & Air France 2',
            predictedSurgePercent: 72,
            timeWindowMin: 25,
            expectedOrdersCount: 120,
            currentDriversAvailable: 4,
            requiredDriversCount: 9,
            confidenceScore: 95,
            triggerReason: 'Livraisons à Domicile & Colis du Soir',
            heatLevel: 'critical',
          },
          {
            id: 'pz-2',
            cityName: 'Agnibilékrou',
            zoneName: 'Axe Frontalier Niablé / Dormaa',
            predictedSurgePercent: 68,
            timeWindowMin: 30,
            expectedOrdersCount: 88,
            currentDriversAvailable: 2,
            requiredDriversCount: 7,
            confidenceScore: 93,
            triggerReason: 'Colis Inter-Villes & Produits Agricoles Djuablin',
            heatLevel: 'high',
          },
          {
            id: 'pz-3',
            cityName: 'Daloa',
            zoneName: 'Centre Commercial & Hub Cacao',
            predictedSurgePercent: 58,
            timeWindowMin: 35,
            expectedOrdersCount: 84,
            currentDriversAvailable: 2,
            requiredDriversCount: 6,
            confidenceScore: 91,
            triggerReason: 'Expéditions Inter-villes de Fin de Journée',
            heatLevel: 'high',
          },
          {
            id: 'pz-4',
            cityName: 'San-Pédro',
            zoneName: 'Zone Portuaire & Bardo',
            predictedSurgePercent: 64,
            timeWindowMin: 20,
            expectedOrdersCount: 95,
            currentDriversAvailable: 3,
            requiredDriversCount: 8,
            confidenceScore: 93,
            triggerReason: 'Fret Légers & Pièces de Rechange',
            heatLevel: 'high',
          },
        ];
      default:
        return [
          {
            id: 'pz-1',
            cityName: 'Bouaké',
            zoneName: 'Marché de Gros (Secteur Vivriers)',
            predictedSurgePercent: 125,
            timeWindowMin: 15,
            expectedOrdersCount: 210,
            currentDriversAvailable: 5,
            requiredDriversCount: 18,
            confidenceScore: 98,
            triggerReason: 'Marché Hebdomadaire & Grossistes',
            heatLevel: 'critical',
          },
          {
            id: 'pz-2',
            cityName: 'Agnibilékrou',
            zoneName: 'Marché Central & Gare Routière',
            predictedSurgePercent: 95,
            timeWindowMin: 20,
            expectedOrdersCount: 130,
            currentDriversAvailable: 3,
            requiredDriversCount: 10,
            confidenceScore: 97,
            triggerReason: 'Rassemblement Marchands & Produits Djuablin',
            heatLevel: 'critical',
          },
          {
            id: 'pz-3',
            cityName: 'Korhogo',
            zoneName: 'Gare Routière & Sogonko',
            predictedSurgePercent: 80,
            timeWindowMin: 30,
            expectedOrdersCount: 110,
            currentDriversAvailable: 3,
            requiredDriversCount: 9,
            confidenceScore: 96,
            triggerReason: 'Transit de Marchandises Régionales',
            heatLevel: 'critical',
          },
        ];
    }
  }, [timeHorizon]);

  // 3. Proactive Driver Repositioning Recommendations
  const driverRecommendations: DriverRepositionRecommendation[] = useMemo(() => {
    return [
      {
        id: 'rec-1',
        livreurId: 'liv-1',
        livreurName: 'Kouassi Jean',
        vehicleType: 'Moto TVS Star 125cc',
        currentZone: 'Bouaké - Nimbo (Demande Faible)',
        targetZone: 'Bouaké - Marché Gros (Surdemande +88%)',
        cityName: 'Bouaké',
        transitTimeMins: 6,
        expectedOrderBonusFCFA: 3500,
        isSent: sentRecommendationIds.includes('rec-1'),
      },
      {
        id: 'rec-6',
        livreurId: 'liv-6',
        livreurName: 'Adou Koffi',
        vehicleType: 'Moto Kasea 125cc',
        currentZone: 'Agnibilékrou - Residentiel (Demande Faible)',
        targetZone: 'Agnibilékrou - Grand Marché (Surdemande +78%)',
        cityName: 'Agnibilékrou',
        transitTimeMins: 5,
        expectedOrderBonusFCFA: 3200,
        isSent: sentRecommendationIds.includes('rec-6'),
      },
      {
        id: 'rec-2',
        livreurId: 'liv-2',
        livreurName: 'Soro Ibrahim',
        vehicleType: 'Tricycle Cargo 200cc',
        currentZone: 'Korhogo - Sogonko (Demande Modérée)',
        targetZone: 'Korhogo - Marché Central (Surdemande +65%)',
        cityName: 'Korhogo',
        transitTimeMins: 8,
        expectedOrderBonusFCFA: 4200,
        isSent: sentRecommendationIds.includes('rec-2'),
      },
      {
        id: 'rec-3',
        livreurId: 'liv-3',
        livreurName: 'Yao Matthieu',
        vehicleType: 'Moto Yamaha Crux',
        currentZone: 'Yamoussoukro - Habitat (Demande Faible)',
        targetZone: 'Yamoussoukro - Cité Admin (Surdemande +52%)',
        cityName: 'Yamoussoukro',
        transitTimeMins: 5,
        expectedOrderBonusFCFA: 2800,
        isSent: sentRecommendationIds.includes('rec-3'),
      },
      {
        id: 'rec-4',
        livreurId: 'liv-4',
        livreurName: 'Bakayoko Moussa',
        vehicleType: 'Camionnette Hyundai H100',
        currentZone: 'Abidjan - Marcory (Demande Modérée)',
        targetZone: 'Abidjan - Plateau (Surdemande +115%)',
        cityName: 'Abidjan',
        transitTimeMins: 12,
        expectedOrderBonusFCFA: 7500,
        isSent: sentRecommendationIds.includes('rec-4'),
      },
      {
        id: 'rec-5',
        livreurId: 'liv-5',
        livreurName: 'Kone Salif',
        vehicleType: 'Moto Haojue 150cc',
        currentZone: 'Daloa - Tazibouo (Demande Faible)',
        targetZone: 'Daloa - Centre Commercial (Surdemande +58%)',
        cityName: 'Daloa',
        transitTimeMins: 7,
        expectedOrderBonusFCFA: 3100,
        isSent: sentRecommendationIds.includes('rec-5'),
      },
    ];
  }, [sentRecommendationIds]);

  // Actions
  const handleSendSingleRecommendation = (rec: DriverRepositionRecommendation) => {
    if (sentRecommendationIds.includes(rec.id)) return;

    setSentRecommendationIds(prev => [...prev, rec.id]);
    setToastMessage(`Ordre de repositionnement GPS envoyé avec succès à ${rec.livreurName} (${rec.targetZone}).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendAllRecommendations = () => {
    const allIds = driverRecommendations.map(r => r.id);
    setSentRecommendationIds(allIds);
    setToastMessage(`🚀 Recommandations envoyées à tous les ${driverRecommendations.length} livreurs ciblés !`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Custom Recharts Tooltip
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 border border-gray-800 font-sans">
          <div className="font-black text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Créneau Horaire : {label}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Moyenne Historique :</span>
            <span className="font-bold text-gray-200">{payload[0]?.value} colis</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-400 font-black">Prédiction IA (Surchauffe) :</span>
            <span className="font-extrabold text-emerald-400">{payload[1]?.value} colis</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-800 pt-1">
            <span className="text-sky-400 font-bold">Livreurs sur la zone :</span>
            <span className="font-bold text-sky-300">{payload[2]?.value} actifs</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
            <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="text-xs text-purple-700 font-black uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-600" />
              <span>Dispatch Prédictif Proactif AI • Côte d'Ivoire v3.4</span>
            </div>
            <h3 className="text-xl font-bold font-['Outfit'] text-[#111827]">
              Anticipation de Demande & Repositionnement Stratégique des Livreurs
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Analyse le réseau historique pour déplacer les livreurs 15 à 30 minutes AVANT l'arrivée des pics de commandes.
            </p>
          </div>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200">
          {[
            { key: 'lunch', label: '🍱 Déjeuner (11h30-14h)' },
            { key: 'evening', label: '🌆 Soirée (17h-19h30)' },
            { key: 'market', label: '🏬 Marché Gros' },
            { key: 'payday', label: '💳 Fin de Mois' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setTimeHorizon(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                timeHorizon === tab.key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top AI Predictive KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/80 p-4 rounded-2xl space-y-1">
          <div className="text-[10px] text-purple-800 uppercase font-black tracking-wider flex items-center justify-between">
            <span>Surchauffe Prédictive</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 font-['Outfit']">
            +68% <span className="text-xs font-extrabold text-purple-700">sur-demand</span>
          </div>
          <div className="text-[10px] text-purple-700 font-bold">
            Anticipée dans les 25 prochaines minutes
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 rounded-2xl space-y-1">
          <div className="text-[10px] text-emerald-800 uppercase font-black tracking-wider flex items-center justify-between">
            <span>Précision Modèle AI</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 font-['Outfit']">
            96.8%
          </div>
          <div className="text-[10px] text-emerald-700 font-bold">
            Sur 125k+ historiques de livraisons
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 p-4 rounded-2xl space-y-1">
          <div className="text-[10px] text-amber-900 uppercase font-black tracking-wider flex items-center justify-between">
            <span>Livreurs à Déplacer</span>
            <Bike className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 font-['Outfit']">
            {driverRecommendations.filter(r => !r.isSent).length} <span className="text-xs font-bold text-amber-800">recommandés</span>
          </div>
          <div className="text-[10px] text-amber-800 font-bold">
            {sentRecommendationIds.length} ordre(s) déjà transmis
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200/80 p-4 rounded-2xl space-y-1">
          <div className="text-[10px] text-sky-800 uppercase font-black tracking-wider flex items-center justify-between">
            <span>Gain de Temps Attente</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-950 font-['Outfit']">
            -14.2 min
          </div>
          <div className="text-[10px] text-sky-700 font-bold">
            Réduction du délai de prise en charge
          </div>
        </div>
      </div>

      {/* Hourly Demand Forecast Chart */}
      <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-extrabold text-gray-800">
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span>Courbe de Demande Historique vs Prédiction IA (Fenêtre d'Anticipation)</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-extrabold bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            ⚡ Zone d'Action Préventive (-20 min)
          </span>
        </div>

        <div className="h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyForecastData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomForecastTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              <Area
                type="monotone"
                dataKey="historicalOrders"
                name="Moyenne Historique (Colis/h)"
                fill="#94a3b8"
                stroke="#64748b"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="predictedOrders"
                name="Demande Prédite IA (Pic en Surchauffe)"
                fill="#9333ea"
                stroke="#7e22ce"
                fillOpacity={0.25}
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="driversAvailable"
                name="Livreurs Actifs sur Zone"
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Grid: Forecasted Hotspots & Driver Repositioning Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Forecasted High-Demand Hotspots (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-800">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Prochaines Zones en Surchauffe Prédite</span>
            </span>
            <span className="text-gray-400 font-mono">{predictedZones.length} zones détectées</span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {predictedZones.map(zone => {
              const deficit = zone.requiredDriversCount - zone.currentDriversAvailable;

              return (
                <div
                  key={zone.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    zone.heatLevel === 'critical'
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-amber-50/70 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-gray-900">{zone.cityName}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                          +{zone.predictedSurgePercent}% surge dans {zone.timeWindowMin} min
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 mt-1">{zone.zoneName}</h4>
                      <p className="text-[11px] text-gray-600 font-medium mt-0.5">{zone.triggerReason}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-1 rounded-xl border border-rose-300">
                        Déficit: -{deficit} livreurs
                      </div>
                      <div className="text-[10px] text-gray-500 font-extrabold mt-1">
                        IA Confiance: {zone.confidenceScore}%
                      </div>
                    </div>
                  </div>

                  {/* Progress ratio bar */}
                  <div className="space-y-1 mt-3 pt-2 border-t border-gray-200/60">
                    <div className="flex justify-between text-[10px] font-bold text-gray-600">
                      <span>Livreurs dispo ({zone.currentDriversAvailable}) vs Requis ({zone.requiredDriversCount})</span>
                      <span>~{zone.expectedOrdersCount} colis prévus</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (zone.currentDriversAvailable / zone.requiredDriversCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Driver Repositioning Assistant (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-gray-800">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>Recommandations de Repositionnement Préventif GPS</span>
            </span>

            <button
              onClick={handleSendAllRecommendations}
              className="bg-[#009E49] hover:bg-emerald-600 text-white font-black px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              <span>Repositionner Tout le Groupe ({driverRecommendations.length})</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {driverRecommendations.map(rec => (
              <div
                key={rec.id}
                className={`p-4 rounded-2xl border transition-all ${
                  rec.isSent
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-white border-gray-200 shadow-sm hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  
                  {/* Left Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 text-sm">{rec.livreurName}</span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                        {rec.vehicleType}
                      </span>
                    </div>

                    <div className="text-gray-600 font-medium text-[11px] flex items-center gap-1">
                      <span className="text-gray-400">Origine:</span>
                      <span className="font-semibold text-gray-700">{rec.currentZone}</span>
                    </div>

                    <div className="text-purple-700 font-bold text-[11px] flex items-center gap-1">
                      <span>🎯 Cible :</span>
                      <span>{rec.targetZone}</span>
                      <span className="text-[10px] text-gray-400">({rec.transitTimeMins} min de trajet)</span>
                    </div>
                  </div>

                  {/* Right Actions & Bonus */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg text-[11px] font-black">
                      +{formatFCFA(rec.expectedOrderBonusFCFA)}/h de gains prévus
                    </div>

                    <button
                      onClick={() => handleSendSingleRecommendation(rec)}
                      disabled={rec.isSent}
                      className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        rec.isSent
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm active:scale-95'
                      }`}
                    >
                      {rec.isSent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ordre Transmis GPS</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer Ordre GPS</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Historical Factors Training Insights */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 text-xs">
        <div className="font-extrabold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Facteurs Historiques Alimentant le Modèle Prédictif AI</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-gray-600 text-[11px]">
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            🌧️ <strong>Météo & Pluie :</strong> +38% de commandes urgentes enregistrées en période d'averses sur les hubs urbains.
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            🏬 <strong>Jours de Marché :</strong> Pic systématique les mercredis et samedis au Marché de Gros de Bouaké & Korhogo.
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            💳 <strong>Cycles de Paie :</strong> +62% d'expéditions marchandes entre le 28 et le 5 de chaque mois.
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            🚦 <strong>Trafic Urbain :</strong> Repositionnement 20 min en amont évitant les congestions aux carrefours.
          </div>
        </div>
      </div>

    </div>
  );
};
