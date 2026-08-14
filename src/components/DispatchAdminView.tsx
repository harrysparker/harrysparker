import React, { useState } from 'react';
import { CityNode, Order, Livreur, ZoneTariff } from '../types';
import { formatFCFA } from '../services/pricingService';
import { downloadWeeklyPerformanceCSV } from '../services/csvExportService';
import { MapComponent } from './MapComponent';
import { DispatchAnalyticsDashboard } from './DispatchAnalyticsDashboard';
import { PredictiveDispatchDashboard } from './PredictiveDispatchDashboard';
import { LayoutDashboard, Sliders, Play, MapPin, Zap, Layers, RefreshCw, ShieldCheck, CheckCircle2, Sparkles, BarChart3, Download, FileSpreadsheet } from 'lucide-react';

interface DispatchAdminViewProps {
  cities: CityNode[];
  orders: Order[];
  livreurs: Livreur[];
  tariffs: ZoneTariff[];
  onToggleHubStatus: (cityId: string) => void;
  onUpdateTariff: (cityId: string, updated: Partial<ZoneTariff>) => void;
  onRunAutoDispatch: () => void;
}

export const DispatchAdminView: React.FC<DispatchAdminViewProps> = ({
  cities,
  orders,
  livreurs,
  tariffs,
  onToggleHubStatus,
  onUpdateTariff,
  onRunAutoDispatch,
}) => {
  const [selectedCityTab, setSelectedCityTab] = useState<string>('all');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'predictive' | 'analytics'>('predictive');
  const [exportToast, setExportToast] = useState<string | null>(null);

  const activeHubsCount = cities.filter(c => c.isHubActive).length;
  const activeOrdersCount = orders.filter(o => o.status === 'in_transit' || o.status === 'ready_for_pickup').length;
  const onlineLivreursCount = livreurs.filter(l => l.status === 'online' || l.status === 'busy').length;

  const handleTriggerDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      onRunAutoDispatch();
      setIsDispatching(false);
    }, 1200);
  };

  const handleExportCSV = () => {
    downloadWeeklyPerformanceCSV(cities, orders, livreurs);
    setExportToast('📊 Rapport de performance hebdomadaire téléchargé sous format CSV (Compatible Excel / Google Sheets).');
    setTimeout(() => setExportToast(null), 4500);
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Title & Controls */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-purple-600 font-black uppercase tracking-wider flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4" />
            <span>Centre de Contrôle National Dispatch AI</span>
          </div>
          <h2 className="text-xl font-bold font-['Outfit'] text-[#111827]">
            Supervision Nationale de Livraison (Côte d'Ivoire)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Supervisez les flux logistiques inter-villes, anticipez la demande et gérez le repositionnement des livreurs.
          </p>
        </div>

        {/* Action Buttons: Auto Dispatch & Export CSV */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-extrabold px-4 py-3 rounded-2xl text-xs shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            title="Exporter l'ensemble des données de performance réseau au format CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>Exporter Rapport CSV</span>
          </button>

          <button
            onClick={handleTriggerDispatch}
            disabled={isDispatching}
            className="bg-[#009E49] hover:bg-emerald-600 text-white font-black px-5 py-3 rounded-2xl text-xs shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>{isDispatching ? 'Algorithme en cours...' : 'Lancer le Dispatch Automatique AI'}</span>
          </button>
        </div>
      </div>

      {exportToast && (
        <div className="bg-purple-50 border border-purple-300 text-purple-950 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{exportToast}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
          <div className="text-xs text-gray-500 font-bold">Hubs Régionaux Actifs</div>
          <div className="text-2xl font-black text-[#FF8C00] font-['Outfit']">{activeHubsCount} / {cities.length}</div>
          <div className="text-[10px] text-[#009E49] font-bold mt-1">Bouaké → Korhogo → Yamoussoukro...</div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
          <div className="text-xs text-gray-500 font-bold">Commandes en Cours</div>
          <div className="text-2xl font-black text-[#009E49] font-['Outfit']">{activeOrdersCount}</div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">En transit ou en attente</div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
          <div className="text-xs text-gray-500 font-bold">Livreurs en Ligne GPS</div>
          <div className="text-2xl font-black text-sky-600 font-['Outfit']">{onlineLivreursCount}</div>
          <div className="text-[10px] text-sky-600 font-bold mt-1">Motos, Tricycles & Camionnettes</div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
          <div className="text-xs text-gray-500 font-bold">Taux de Réussite OTP</div>
          <div className="text-2xl font-black text-purple-600 font-['Outfit']">99.8%</div>
          <div className="text-[10px] text-purple-600 font-bold mt-1">Sécurité Preuve de Livraison</div>
        </div>
      </div>

      {/* Section Switcher: Predictive vs Analytics */}
      <div className="flex items-center justify-between bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveSection('predictive')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'predictive'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 bg-white/60 hover:bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Tableau de Bord Prédictif AI & Repositionnement</span>
            <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase">
              Inov
            </span>
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'analytics'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#009E49]" />
            <span>Analytique Globale & Performance Hubs</span>
          </button>
        </div>

        <div className="hidden md:block text-xs text-gray-500 font-medium px-3">
          {activeSection === 'predictive' ? '🔮 Algorithme de prédiction de demande par zone' : '📊 Rapports de livraisons et volumes historiques'}
        </div>
      </div>

      {/* Active Section */}
      {activeSection === 'predictive' ? (
        <PredictiveDispatchDashboard
          cities={cities}
          orders={orders}
          livreurs={livreurs}
        />
      ) : (
        <DispatchAnalyticsDashboard
          cities={cities}
          orders={orders}
          livreurs={livreurs}
        />
      )}

      {/* National Map Overview */}

      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#111827]">
          <span>Carte de Couverture Nationale & Emplacements des Hubs</span>
          <span className="text-gray-400">Toutes les Villes</span>
        </div>
        <MapComponent
          cities={cities}
          livreurs={livreurs}
          orders={orders}
          height="420px"
        />
      </div>

      {/* Expansion Roadmap & City Hub Activator */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-lg text-[#111827] font-['Outfit'] flex items-center justify-between">
          <span>Stratégie de Déploiement Territorial (Phases d'Expansion)</span>
          <span className="text-xs text-[#FF8C00] font-black bg-orange-50 px-3 py-1 rounded-xl border border-orange-100">
            Commencer hors-Abidjan ➔ Couvrir tout le territoire
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { phase: 1, label: 'Phase 1 : Hubs Stratégiques & Est', citiesList: ['Bouaké', 'Korhogo', 'Agnibilékrou'] },
            { phase: 2, label: 'Phase 2 : Hubs Capitale & Centre-Ouest', citiesList: ['Yamoussoukro', 'Daloa'] },
            { phase: 3, label: 'Phase 3 : Hubs Portuaire & Ouest', citiesList: ['San-Pédro', 'Man'] },
            { phase: 4, label: 'Phase 4 : Hub Métropole Sud', citiesList: ['Abidjan', 'Gagnoa'] },
          ].map(p => (
            <div key={p.phase} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
              <div className="text-xs font-black text-[#FF8C00]">{p.label}</div>
              <div className="space-y-1.5 pt-1">
                {p.citiesList.map(cityName => {
                  const cityObj = cities.find(c => c.name === cityName);
                  if (!cityObj) return null;
                  return (
                    <div key={cityObj.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-800">{cityObj.name}</span>
                      <button
                        onClick={() => onToggleHubStatus(cityObj.id)}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          cityObj.isHubActive
                            ? 'bg-[#009E49] text-white'
                            : 'bg-gray-100 text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {cityObj.isHubActive ? 'Actif' : 'Activer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Tariffs Editor */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-lg text-[#111827] font-['Outfit'] flex items-center justify-between">
          <span>Tarification Dynamique par Zone Régionale</span>
          <span className="text-xs text-gray-400 font-medium">
            Ajustement automatique selon la demande et la distance
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tariffs.map(t => (
            <div key={t.cityId} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
              <div className="font-black text-[#FF8C00] text-sm flex items-center justify-between">
                <span>{t.cityName}</span>
                <span className="text-[10px] bg-white text-gray-600 font-bold px-2 py-0.5 rounded-lg border border-gray-200">FCFA</span>
              </div>

              <div className="space-y-1.5 text-gray-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-500">Prix de Base :</span>
                  <input
                    type="number"
                    value={t.basePriceFCFA}
                    onChange={e => onUpdateTariff(t.cityId, { basePriceFCFA: Number(e.target.value) })}
                    className="w-16 bg-white text-right text-[#009E49] font-black border border-gray-200 rounded-lg px-1.5 py-0.5"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-500">Tarif au KM :</span>
                  <input
                    type="number"
                    value={t.perKmRateFCFA}
                    onChange={e => onUpdateTariff(t.cityId, { perKmRateFCFA: Number(e.target.value) })}
                    className="w-16 bg-white text-right text-[#009E49] font-black border border-gray-200 rounded-lg px-1.5 py-0.5"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-500">Mult. Express :</span>
                  <input
                    type="number"
                    step="0.1"
                    value={t.expressMultiplier}
                    onChange={e => onUpdateTariff(t.cityId, { expressMultiplier: Number(e.target.value) })}
                    className="w-16 bg-white text-right text-[#FF8C00] font-black border border-gray-200 rounded-lg px-1.5 py-0.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
