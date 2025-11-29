import { useEffect, useRef } from 'react';
import { useNotifications } from './useNotifications';

interface Alert {
  id: number;
  asset: string;
  price: string;
  confidence: string;
  recommendation: string;
  signalType: string;
}

/**
 * Hook pour envoyer des notifications lors de nouvelles alertes
 */
export function useAlertNotifications(alerts: Alert[] | undefined) {
  const { isEnabled, sendNotification } = useNotifications();
  const previousAlertsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!alerts || !isEnabled) {
      return;
    }

    // Première initialisation : enregistrer les alertes existantes sans notifier
    if (previousAlertsRef.current.size === 0) {
      previousAlertsRef.current = new Set(alerts.map(a => a.id));
      return;
    }

    // Détecter les nouvelles alertes
    const currentAlertIds = new Set(alerts.map(a => a.id));
    const newAlerts = alerts.filter(
      alert => !previousAlertsRef.current.has(alert.id)
    );

    // Envoyer une notification pour chaque nouvelle alerte
    newAlerts.forEach(alert => {
      const emoji = alert.confidence === 'Très Élevée' ? '🚀' : 
                    alert.confidence === 'Élevée' ? '⚡' : '💡';
      
      sendNotification(
        `${emoji} Nouvelle opportunité ${alert.asset}`,
        {
          body: `${alert.confidence} - ${alert.recommendation.substring(0, 100)}...`,
          tag: `alert-${alert.id}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        }
      );
    });

    // Mettre à jour la référence
    previousAlertsRef.current = currentAlertIds;
  }, [alerts, isEnabled, sendNotification]);
}
