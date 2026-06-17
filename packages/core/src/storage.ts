import { StorageItem } from './types';

let listeners: (() => void)[] = [];
let isIntercepting = false;

const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;
const originalClear = Storage.prototype.clear;

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export function subscribeToStorage(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((x) => x !== cb);
  };
}

export function startStorageInterception() {
  if (isIntercepting) return;
  isIntercepting = true;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    notifyListeners();
  };

  Storage.prototype.removeItem = function (key: string) {
    originalRemoveItem.apply(this, [key]);
    notifyListeners();
  };

  Storage.prototype.clear = function () {
    originalClear.apply(this);
    notifyListeners();
  };

  window.addEventListener('storage', () => {
    notifyListeners();
  });
}

export function stopStorageInterception() {
  if (!isIntercepting) return;
  isIntercepting = false;
  Storage.prototype.setItem = originalSetItem;
  Storage.prototype.removeItem = originalRemoveItem;
  Storage.prototype.clear = originalClear;
}

export function getStorageData(type: 'local' | 'session'): StorageItem[] {
  const store = type === 'local' ? localStorage : sessionStorage;
  const items: StorageItem[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key !== null) {
      items.push({ key, value: store.getItem(key) || '' });
    }
  }
  return items.sort((a, b) => a.key.localeCompare(b.key));
}

export function setStorageItem(type: 'local' | 'session', key: string, value: string) {
  const store = type === 'local' ? localStorage : sessionStorage;
  store.setItem(key, value);
}

export function deleteStorageItem(type: 'local' | 'session', key: string) {
  const store = type === 'local' ? localStorage : sessionStorage;
  store.removeItem(key);
}

export function clearStorage(type: 'local' | 'session') {
  const store = type === 'local' ? localStorage : sessionStorage;
  store.clear();
}

export function getCookies(): StorageItem[] {
  const cookies: StorageItem[] = [];
  const cookieStr = document.cookie;
  if (!cookieStr) return cookies;

  const pairs = cookieStr.split(';');
  for (const pair of pairs) {
    const parts = pair.split('=');
    const key = parts[0].trim();
    if (!key) continue;
    const value = parts.slice(1).join('=').trim();
    cookies.push({ key, value: decodeURIComponent(value) });
  }
  return cookies.sort((a, b) => a.key.localeCompare(b.key));
}

export function setCookie(key: string, value: string) {
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/`;
  notifyListeners();
}

export function deleteCookie(key: string) {
  document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  notifyListeners();
}

export function clearCookies() {
  const cookies = getCookies();
  for (const c of cookies) {
    deleteCookie(c.key);
  }
}
