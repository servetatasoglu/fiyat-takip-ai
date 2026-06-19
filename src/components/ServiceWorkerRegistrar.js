'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistrar() {
  const [showBanner, setShowBanner] = useState(false);
  const [swReg, setSwReg] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      setSwReg(reg);
      const permission = Notification.permission;
      const existing = await reg.pushManager.getSubscription();

      // Show banner if not yet decided and no existing subscription
      if (permission === 'default' && !existing) {
        const dismissed = localStorage.getItem('push-banner-dismissed');
        if (!dismissed) {
          setTimeout(() => setShowBanner(true), 3000);
        }
      }
    }).catch(err => console.warn('[SW]', err));
  }, []);

  const handleAccept = async () => {
    setShowBanner(false);
    if (!swReg) return;

    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch (err) {
      console.warn('[PUSH]', err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('push-banner-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="push-banner">
      <div className="push-banner-icon">🔔</div>
      <div className="push-banner-text">
        <div className="push-banner-title">Fiyat Düşüşlerini Kaçırma!</div>
        <div className="push-banner-desc">Anlık bildirimler ile en iyi fırsatları yakala.</div>
        <div className="push-banner-actions">
          <button className="push-banner-accept" onClick={handleAccept}>
            Bildirimleri Aç
          </button>
          <button className="push-banner-dismiss" onClick={handleDismiss}>
            Hayır
          </button>
        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
