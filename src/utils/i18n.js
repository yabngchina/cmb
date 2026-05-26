import { zh_cn_messages } from '../locales/zh-CN';
import { en_messages } from '../locales/en';

const messages = {
  'zh-CN': zh_cn_messages,
  en: en_messages,
};

let currentLang = localStorage.getItem('lang') || 'zh-CN';

/**
 * 翻译函数
 * @param {string} key - 翻译键，支持点号分隔，如 'lock.title'
 * @param {Object} params - 插值参数，如 { count: 5 }
 * @returns {string} 翻译后的文本
 */
export function t(key, params = {}) {
  const keys = key.split('.');
  let value = messages[currentLang];

  for (const k of keys) {
    if (value && typeof value === 'object' && value[k] !== undefined) {
      value = value[k];
    } else {
      // 回退到中文
      let fallback = messages['zh-CN'];
      for (const fk of keys) {
        if (fallback && fallback[fk] !== undefined) {
          fallback = fallback[fk];
        } else {
          return key;
        }
      }
      return interpolate(fallback, params);
    }
  }

  return interpolate(value, params);
}

/**
 * 字符串插值
 */
function interpolate(template, params) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/**
 * 切换语言
 */
export function setLang(lang) {
  if (messages[lang]) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    return true;
  }
  return false;
}

/**
 * 获取当前语言
 */
export function getLang() {
  return currentLang;
}

/**
 * 获取所有支持的语言
 */
export function getSupportedLangs() {
  return Object.keys(messages).map((key) => ({
    code: key,
    name: key === 'zh-CN' ? '中文' : 'English',
  }));
}
