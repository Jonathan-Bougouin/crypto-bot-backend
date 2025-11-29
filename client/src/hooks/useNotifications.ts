import { useState, useEffect, useCallback } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  isEnabled: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  toggleNotifications: () => void;
}

const NOTIFICATION_STORAGE_KEY = 'crypto_alerts_notifications_enabled';

/**
 * Hook personnalisé pour gérer les notifications push navigateur
 */
export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  
  // Vérifier si les notifications sont supportées
  const isSupported = 'Notification' in window;

  // Charger l'état des notifications depuis le localStorage
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      
      const storedEnabled = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      setIsEnabled(storedEnabled === 'true' && Notification.permission === 'granted');
    }
  }, [isSupported]);

  /**
   * Demande la permission d'envoyer des notifications
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('[Notifications] Les notifications ne sont pas supportées par ce navigateur');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
        console.log('[Notifications] Permission accordée');
      } else {
        setIsEnabled(false);
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'false');
        console.log('[Notifications] Permission refusée');
      }
      
      return result;
    } catch (error) {
      console.error('[Notifications] Erreur lors de la demande de permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  /**
   * Envoie une notification
   */
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported) {
      console.warn('[Notifications] Les notifications ne sont pas supportées');
      return;
    }

    if (!isEnabled || permission !== 'granted') {
      console.warn('[Notifications] Les notifications ne sont pas activées ou la permission n\'est pas accordée');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options,
      });

      // Fermer automatiquement après 10 secondes
      setTimeout(() => notification.close(), 10000);

      console.log('[Notifications] Notification envoyée:', title);
    } catch (error) {
      console.error('[Notifications] Erreur lors de l\'envoi de la notification:', error);
    }
  }, [isSupported, isEnabled, permission]);

  /**
   * Active/désactive les notifications
   */
  const toggleNotifications = useCallback(() => {
    if (!isSupported) {
      console.warn('[Notifications] Les notifications ne sont pas supportées');
      return;
    }

    if (permission !== 'granted') {
      requestPermission();
    } else {
      const newState = !isEnabled;
      setIsEnabled(newState);
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, newState.toString());
      console.log('[Notifications] Notifications', newState ? 'activées' : 'désactivées');
    }
  }, [isSupported, isEnabled, permission, requestPermission]);

  return {
    permission,
    isSupported,
    isEnabled,
    requestPermission,
    sendNotification,
    toggleNotifications,
  };
}
