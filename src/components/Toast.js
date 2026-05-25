import { t } from '../utils/i18n.js';

export function showToast(message, type = 'info', duration = 3000) {
  if (window.cocoMessage) {
    const typeMap = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    const method = typeMap[type] || 'info';
    window.cocoMessage[method](message, duration);
  } else {
    console.log(`[${type}] ${message}`);
    if (type === 'error') {
      alert(message);
    }
  }
}

export function showLoading(message = '') {
  const msg = message || t('common.loading');
  if (window.cocoMessage && typeof window.cocoMessage.loading === 'function') {
    return window.cocoMessage.loading(msg);
  }
  console.log(`[loading] ${msg}`);
  return () => console.log(`[loading] 关闭`);
}
