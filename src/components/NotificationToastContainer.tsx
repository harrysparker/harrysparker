import React, { useState } from 'react';
import { AppNotification, UserRole } from '../types';
import { Bell, X, Check, CheckCircle2, Truck, Package, ShoppingBag, Zap, AlertCircle, Info, Trash2, Clock, Eye } from 'lucide-react';

interface NotificationToastContainerProps {
  notifications: AppNotification[];
  activeToasts: AppNotification[];
  onDismissToast: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  currentRole: UserRole;
  isOpenNotificationCenter: boolean;
  onToggleNotificationCenter: () => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  activeToasts,
  onDismissToast,
  onMarkAllAsRead,
  onClearAllNotifications,
  currentRole,
  isOpenNotificationCenter,
  onToggleNotificationCenter,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Filter notifications relevant to current role or targetRole === 'all'
  const relevantNotifications = notifications.filter(n => 
    !n.targetRole || n.targetRole === 'all' || n.targetRole === currentRole
  );

  const filteredHistory = relevantNotifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  // Helper for notification style & icon
  const getNotificationStyle = (type: AppNotification['type'], status?: AppNotification['status']) => {
    if (type === 'new_order') {
      return {
        bg: 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-purple-500/30',
        icon: <Zap className="w-5 h-5 text-amber-400 animate-pulse" />,
        badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
        badgeText: 'DISPATCH ADMIN',
      };
    }

    if (type === 'order_status_change') {
      switch (status) {
        case 'ready_for_pickup':
          return {
            bg: 'bg-gradient-to-r from-amber-900 to-orange-950 text-white border-amber-500/30',
            icon: <Package className="w-5 h-5 text-amber-400" />,
            badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
            badgeText: 'PRÊT CHEZ LE COMMERÇANT',
          };
        case 'in_transit':
          return {
            bg: 'bg-gradient-to-r from-sky-900 to-blue-950 text-white border-sky-500/30',
            icon: <Truck className="w-5 h-5 text-sky-400 animate-bounce" />,
            badgeBg: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
            badgeText: 'EN COURS DE LIVRAISON',
          };
        case 'delivered':
          return {
            bg: 'bg-gradient-to-r from-emerald-900 to-teal-950 text-white border-emerald-500/30',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
            badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
            badgeText: 'COLIS LIVRÉ',
          };
        case 'cancelled':
          return {
            bg: 'bg-gradient-to-r from-rose-900 to-red-950 text-white border-rose-500/30',
            icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
            badgeBg: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
            badgeText: 'ANNULÉ',
          };
        default:
          return {
            bg: 'bg-gradient-to-r from-gray-900 to-slate-900 text-white border-gray-700',
            icon: <ShoppingBag className="w-5 h-5 text-gray-300" />,
            badgeBg: 'bg-gray-700 text-gray-300',
            badgeText: 'COMMANDE',
          };
      }
    }

    return {
      bg: 'bg-gradient-to-r from-gray-900 to-slate-900 text-white border-gray-700',
      icon: <Info className="w-5 h-5 text-sky-400" />,
      badgeBg: 'bg-sky-400/20 text-sky-300',
      badgeText: 'SYSTÈME',
    };
  };

  return (
    <>
      {/* FLOATING TOAST STACK (Top Right) */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {activeToasts.map((toast) => {
          const style = getNotificationStyle(toast.type, toast.status);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in-right transform hover:scale-[1.02] ${style.bg}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-2 rounded-xl bg-white/10 shrink-0">
                  {style.icon}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${style.badgeBg}`}>
                      {style.badgeText}
                    </span>
                    {toast.trackingNumber && (
                      <span className="text-[10px] font-mono text-gray-300 font-bold">
                        #{toast.trackingNumber}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-black text-white leading-tight">
                    {toast.title}
                  </h4>

                  <p className="text-[11px] text-gray-200 font-medium leading-relaxed">
                    {toast.message}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{toast.timestamp}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDismissToast(toast.id)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Animated Progress Bar indicating auto-dismiss */}
              <div className="mt-3 w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-full animate-toast-progress origin-left"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NOTIFICATION CENTER SLIDE-OVER DRAWER */}
      {isOpenNotificationCenter && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onToggleNotificationCenter}
          ></div>

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-[#FF8C00] flex items-center justify-center relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 font-['Outfit']">
                      Centre de Notifications
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Alertes commandes, statut livraison & dispatch
                    </p>
                  </div>
                </div>

                <button
                  onClick={onToggleNotificationCenter}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs & Quick Actions */}
              <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filter === 'all'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Toutes ({relevantNotifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filter === 'unread'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Non lues ({unreadCount})
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="Tout marquer comme lu"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Lire tout</span>
                    </button>
                  )}
                  {relevantNotifications.length > 0 && (
                    <button
                      onClick={onClearAllNotifications}
                      className="text-gray-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Effacer tout l'historique"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-3xl text-gray-400 flex items-center justify-center mx-auto text-xl">
                      🔔
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-800">Aucune notification</p>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Les alertes sur l'avancement de vos commandes et le dispatch s'afficheront ici.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredHistory.map((n) => {
                    const style = getNotificationStyle(n.type, n.status);
                    return (
                      <div
                        key={n.id}
                        className={`p-4 rounded-2xl border transition-all space-y-2 ${
                          !n.read
                            ? 'bg-amber-50/50 border-amber-200/60 shadow-sm'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${style.badgeBg}`}>
                              {style.badgeText}
                            </span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-[#FF8C00]"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {n.timestamp}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                            {style.icon}
                            <span>{n.title}</span>
                          </h4>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">
                            {n.message}
                          </p>
                        </div>

                        {n.trackingNumber && (
                          <div className="pt-2 border-t border-gray-100/60 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-gray-500 font-bold">
                              Suivi : {n.trackingNumber}
                            </span>
                            <span className="text-[#009E49] font-bold">
                              Ivoire Delivery GPS
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                <p className="text-[11px] text-gray-500 font-medium">
                  Système de notifications temps réel • Côte d'Ivoire
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
