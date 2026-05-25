<template>
  <div
    class="confirm-overlay"
    v-if="visible"
    @click.self="handleCancel"
  >
    <div
      class="confirm-dialog"
      :class="type"
    >
      <div class="confirm-icon">
        <svg
          v-if="type === 'danger'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <line
            x1="12"
            y1="8"
            x2="12"
            y2="12"
          />
          <line
            x1="12"
            y1="16"
            x2="12.01"
            y2="16"
          />
        </svg>
        <svg
          v-else-if="type === 'warning'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line
            x1="12"
            y1="9"
            x2="12"
            y2="13"
          />
          <line
            x1="12"
            y1="17"
            x2="12.01"
            y2="17"
          />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <line
            x1="12"
            y1="16"
            x2="12"
            y2="12"
          />
          <line
            x1="12"
            y1="8"
            x2="12.01"
            y2="8"
          />
        </svg>
      </div>
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button
          class="btn btn-cancel"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          class="btn"
          :class="type === 'danger' ? 'btn-danger' : 'btn-primary'"
          @click="handleConfirm"
          :disabled="loading"
        >
          {{ loading ? t('common.processing') : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { t } from '../utils/i18n.js';

  // ==========================================
  // 响应式数据
  // ==========================================

  const visible = ref(false);
  const title = ref('');
  const message = ref('');
  const type = ref('info');
  const confirmText = ref('');
  const cancelText = ref('');
  const loading = ref(false);

  let resolvePromise = null;
  let rejectPromise = null;

  // ==========================================
  // 方法
  // ==========================================

  const show = (options = {}) => {
    visible.value = true;
    title.value = options.title || t('common.confirm');
    message.value = options.message || '';
    type.value = options.type || 'info';
    confirmText.value = options.confirmText || t('common.confirm');
    cancelText.value = options.cancelText || t('common.cancel');
    loading.value = false;

    return new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
  };

  const handleConfirm = () => {
    loading.value = true;
    if (resolvePromise) resolvePromise(true);
    close();
  };

  const handleCancel = () => {
    if (rejectPromise) rejectPromise(false);
    close();
  };

  const close = () => {
    visible.value = false;
    loading.value = false;
    resolvePromise = null;
    rejectPromise = null;
  };

  // 暴露方法给父组件
  defineExpose({
    show,
  });
</script>

<style scoped>
  .confirm-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 400;
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

  .confirm-dialog {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    padding: 2rem;
    max-width: 420px;
    width: 90%;
    text-align: center;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .confirm-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 1rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .confirm-icon svg {
    width: 28px;
    height: 28px;
  }

  .danger .confirm-icon {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }

  .warning .confirm-icon {
    background: rgba(234, 179, 8, 0.1);
    color: #ca8a04;
  }

  .info .confirm-icon {
    background: rgba(59, 130, 246, 0.1);
    color: var(--blue-500);
  }

  .confirm-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .confirm-message {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .btn {
    padding: 0.625rem 1.5rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all var(--transition);
    min-width: 90px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-cancel {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .btn-cancel:hover {
    background: var(--bg-secondary);
  }

  .btn-primary {
    background: var(--blue-500);
    color: white;
  }

  .btn-primary:hover {
    background: var(--blue-600);
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }
</style>
