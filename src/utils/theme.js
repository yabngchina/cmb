export const presetThemes = {
  blue: { name: '默认蓝', primary: '#3b82f6', primaryHover: '#2563eb' },
  green: { name: '清新绿', primary: '#10b981', primaryHover: '#059669' },
  purple: { name: '优雅紫', primary: '#8b5cf6', primaryHover: '#7c3aed' },
  orange: { name: '活力橙', primary: '#f97316', primaryHover: '#ea580c' },
  pink: { name: '浪漫粉', primary: '#ec4899', primaryHover: '#db2777' },
  red: { name: '中国红', primary: '#dc2626', primaryHover: '#b91c1c' },
  cyan: { name: '清新青', primary: '#06b6d4', primaryHover: '#0891b2' },
  amber: { name: '温暖黄', primary: '#d97706', primaryHover: '#b45309' },
  custom: { name: '自定义', primary: '#3b82f6', primaryHover: '#2563eb' },
};

let currentTheme = localStorage.getItem('themeColor') || 'blue';
let customColor = localStorage.getItem('customThemeColor') || '#3b82f6';

export function getTheme() {
  if (currentTheme === 'custom') {
    return {
      name: '自定义',
      primary: customColor,
      primaryHover: adjustColor(customColor, -20),
    };
  }
  return presetThemes[currentTheme] || presetThemes.blue;
}

export function setTheme(name) {
  if (presetThemes[name] || name === 'custom') {
    currentTheme = name;
    localStorage.setItem('themeColor', name);
    applyTheme();
  }
}

export function setCustomColor(color) {
  customColor = color;
  localStorage.setItem('customThemeColor', color);
  if (currentTheme === 'custom') {
    applyTheme();
  }
}

export function getCurrentThemeName() {
  return currentTheme;
}

export function getCustomColor() {
  return customColor;
}

export function applyTheme() {
  const theme = getTheme();
  const root = document.documentElement;
  const primary = theme.primary;
  const primaryHover = theme.primaryHover;

  // 更新所有蓝色相关的 CSS 变量
  root.style.setProperty('--blue-50', hexToRgba(primary, 0.1));
  root.style.setProperty('--blue-100', hexToRgba(primary, 0.15));
  root.style.setProperty('--blue-200', hexToRgba(primary, 0.2));
  root.style.setProperty('--blue-300', hexToRgba(primary, 0.4));
  root.style.setProperty('--blue-400', primary);
  root.style.setProperty('--blue-500', primary);
  root.style.setProperty('--blue-600', primaryHover);
  root.style.setProperty('--blue-700', adjustColor(primary, -30));
  root.style.setProperty('--blue-800', adjustColor(primary, -40));
  root.style.setProperty('--blue-900', adjustColor(primary, -50));

  // 更新锁屏图标颜色
  root.style.setProperty('--lock-icon-color', primary);
}

// 调整颜色亮度
function adjustColor(hex, amount) {
  const color = hexToRgb(hex);
  if (!color) return hex;

  const r = Math.max(0, Math.min(255, color.r + amount));
  const g = Math.max(0, Math.min(255, color.g + amount));
  const b = Math.max(0, Math.min(255, color.b + amount));

  return rgbToHex(r, g, b);
}

// 十六进制转 RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// RGB 转十六进制
function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

// 十六进制转 RGBA
function hexToRgba(hex, alpha) {
  const color = hexToRgb(hex);
  if (!color) return `rgba(59, 130, 246, ${alpha})`;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}
