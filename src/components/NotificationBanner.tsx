import React, { useEffect, useState } from 'react';
import { InAppNotification, subscribeToInAppNotifications } from '../utils/notificationService';
import { Flame, Bell, CheckCircle2, X, ArrowRight } from 'lucide-react';

interface NotificationBannerProps {
  onOpenPlanner?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ onOpenPlanner }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    const unsub = subscribeToInAppNotifications((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev.slice(0, 2)]);

      // Auto-dismiss after 7 seconds
      setTimeout(() => {
        setNotifications((current) => current.filter((n) => n.id !== newNotif.id));
      }, 7000);
    });

    return () => unsub();
  }, []);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => {
        const isStreak = notif.type === 'streak';
        const isSuccess = notif.type === 'success';

        return (
          <div
            key={notif.id}
            role="alert"
            className="pointer-events-auto p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isStreak
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {isStreak ? (
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-600 animate-pulse" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Bell className="w-5 h-5 text-blue-600" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {notif.message}
                </p>

                <div className="mt-2.5 flex items-center gap-2">
                  {notif.actionLabel && (
                    <button
                      onClick={() => {
                        handleDismiss(notif.id);
                        if (notif.onAction) {
                          notif.onAction();
                        } else if (onOpenPlanner) {
                          onOpenPlanner();
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>{notif.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(notif.id)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleDismiss(notif.id)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
