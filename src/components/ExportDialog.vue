<template>
  <div
    class="modal"
    v-if="visible"
    @click.self="close"
  >
    <div
      class="export-modal"
      @click.stop
    >
      <div class="modal-header">
        <h3>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="20"
            height="20"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line
              x1="12"
              y1="15"
              x2="12"
              y2="3"
            />
          </svg>
          {{ t('export.title') }}
        </h3>
        <button
          class="close-btn"
          @click="close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="20"
            height="20"
          >
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
            />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
            />
          </svg>
        </button>
      </div>

      <div class="export-body">
        <div class="format-options">
          <label
            class="format-option"
            v-for="fmt in formats"
            :key="fmt.value"
            :class="{ active: selectedFormat === fmt.value }"
          >
            <input
              type="radio"
              v-model="selectedFormat"
              :value="fmt.value"
            />
            <span class="format-label">{{ t(`export.${fmt.label}`) }}</span>
          </label>
        </div>

        <div class="export-preview-wrap">
          <textarea
            class="export-preview"
            readonly
            :value="previewText"
            rows="8"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="copyResult"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="16"
            height="16"
          >
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
              ry="2"
            />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {{ t('export.copyResult') }}
        </button>
        <button
          class="btn btn-primary"
          @click="downloadFile"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="16"
            height="16"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line
              x1="12"
              y1="15"
              x2="12"
              y2="3"
            />
          </svg>
          {{ t('export.download') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { t } from '../utils/i18n.js';
  import { showToast } from './Toast.js';

  // ==========================================
  // 响应式数据
  // ==========================================

  const visible = ref(false);
  const images = ref([]);
  const selectedFormat = ref('url');

  const formats = ref([
    { value: 'url', label: 'url' },
    { value: 'markdown', label: 'markdown' },
    { value: 'html', label: 'html' },
    { value: 'json', label: 'json' },
    { value: 'csv', label: 'csv' },
  ]);

  // ==========================================
  // 计算属性
  // ==========================================

  const previewText = computed(() => {
    return generateExport();
  });

  // ==========================================
  // 方法
  // ==========================================

  const open = (imgs) => {
    images.value = imgs || [];
    selectedFormat.value = 'url';
    visible.value = true;
  };

  const close = () => {
    visible.value = false;
  };

  const generateExport = () => {
    const urls = images.value.map((img) => img.url || '');

    switch (selectedFormat.value) {
      case 'url':
        return urls.join('\n');
      case 'markdown':
        return urls.map((url, i) => `![image${i + 1}](${url})`).join('\n');
      case 'html':
        return urls.map((url) => `<img src="${url}" alt="image" />`).join('\n');
      case 'json':
        return JSON.stringify(urls, null, 2);
      case 'csv':
        return 'url\n' + urls.join('\n');
      default:
        return urls.join('\n');
    }
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(previewText.value);
      showToast(t('common.copied'), 'success');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = previewText.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(t('common.copied'), 'success');
    }
  };

  const downloadFile = () => {
    const extMap = {
      url: 'txt',
      markdown: 'md',
      html: 'html',
      json: 'json',
      csv: 'csv',
    };
    const ext = extMap[selectedFormat.value] || 'txt';
    const blob = new Blob([previewText.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `images_export_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 暴露方法给父组件
  defineExpose({
    open,
  });
</script>

<style scoped>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .export-modal {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    width: 560px;
    max-width: 95vw;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .modal-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: #fee2e2;
    color: #dc2626;
    border-color: #fca5a5;
  }

  .export-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .format-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .format-option {
    padding: 0.5rem 0.875rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .format-option:hover {
    border-color: var(--blue-300);
    color: var(--text-primary);
  }

  .format-option.active {
    border-color: var(--blue-500);
    background: rgba(59, 130, 246, 0.06);
    color: var(--blue-600);
  }

  .format-option input {
    display: none;
  }

  .export-preview-wrap {
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .export-preview {
    width: 100%;
    padding: 0.875rem;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
    font-size: 0.8125rem;
    line-height: 1.6;
    resize: vertical;
    outline: none;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.15s ease;
  }

  .btn-primary {
    background: var(--blue-500);
    color: white;
  }

  .btn-primary:hover {
    background: var(--blue-600);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--bg-secondary);
    border-color: var(--blue-300);
    color: var(--blue-600);
  }
</style>
