'use client';
import React, { useState } from 'react';
// VAPID公開鍵は環境変数から取得（NEXT_PUBLIC_VAPID_PUBLIC_KEY）
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(Array.from(rawData, (c) => c.charCodeAt(0)));
};

export default function TestPushSubscription({ userId }: { userId: string }) {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState('');

  // 通知許可リクエスト
  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  // サブスクリプション取得＆登録
  const subscribePush = async () => {
    if (!('serviceWorker' in navigator)) {
      setMessage('Service Worker未対応ブラウザです');
      return;
    }
    const reg = await navigator.serviceWorker.ready;

    // 既存のサブスクリプションを取得
    const existingSubscription = await reg.pushManager.getSubscription();

    // 既存のサブスクリプションがある場合は解除
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
      setMessage('既存のサブスクリプションを解除しました');
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    setSubscription(sub);
    // ユーザーID取得API（例: /api/user/me など）
    let uid = userId;
    if (!uid) {
      // サンプル: ローカルストレージやAPIから取得する場合はここで
      uid = window.localStorage.getItem('user_id') || '';
    }
    if (!uid) {
      setMessage('ユーザーIDが必要です');
      return;
    }
    // サブスクリプション登録API呼び出し
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub, userId: uid }),
      credentials: 'include',
    });
    if (res.ok) {
      setSubscribed(true);
      setMessage('Pushサブスクリプション登録完了');
    } else {
      setMessage('Pushサブスクリプション登録失敗');
    }
  };

  // テストPush送信
  const sendTestPush = async () => {
    if (!subscription) {
      setMessage('サブスクリプションがありません');
      return;
    }
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        notification: {
          title: 'テスト通知',
          message: 'Web Pushのテストです',
          id: 'test-1',
          type: 'test',
          link_url: '/',
          priority: 'normal',
          metadata: {},
        },
      }),
    });
    if (res.ok) {
      setMessage('Push通知送信リクエスト完了');
    } else {
      setMessage('Push通知送信失敗');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8, maxWidth: 400 }}>
      <h3>Web Pushテスト</h3>
      <div style={{ marginBottom: 8 }}>
        <button className='bg-blue-500 text-white px-4 py-2 rounded-md' onClick={requestPermission}>
          通知許可
        </button>
        <span style={{ marginLeft: 8 }}>通知許可状態: {permission}</span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div>{userId}</div>
        <button className='bg-blue-500 text-white px-4 py-2 rounded-md' onClick={subscribePush}>
          Pushサブスクリプション登録
        </button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <button
          className='bg-blue-500 text-white px-4 py-2 rounded-md'
          onClick={sendTestPush}
          disabled={!subscribed}
        >
          Push通知送信テスト
        </button>
      </div>
      <div style={{ color: '#888' }}>{message}</div>
    </div>
  );
}
