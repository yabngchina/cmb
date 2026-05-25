<template>
  <transition name="batch-slide">
    <div
      class="batch-bar"
      v-if="selectedCount > 0"
    >
      <div class="batch-container">
        <div class="batch-info">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="20"
            height="20"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>{{ t('batch.selected', { count: selectedCount }) }}</span>
        </div>
        <p class="shortcut-hint">{{ t('batch.shortcutsHint') }}</p>
        <div class="batch-actions">
          <button
            class="batch-btn"
            @click="$emit('selectAll')"
            :title="t('batch.selectAll')"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </button>
          <button
            class="batch-btn"
            @click="$emit('deselectAll')"
            :title="t('batch.deselectAll')"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                ry="2"
              />
            </svg>
          </button>
          <div class="batch-divider"></div>
          <button
            class="batch-btn primary"
            @click="$emit('setPublic')"
            :title="t('batch.setPublic')"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
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
                y2="16"
              />
              <line
                x1="8"
                y1="12"
                x2="16"
                y2="12"
              />
            </svg>
            <span>{{ t('batch.setPublic') }}</span>
          </button>
          <button
            class="batch-btn"
            @click="$emit('setPrivate')"
            :title="t('batch.setPrivate')"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
            >
              <rect
                x="3"
                y="11"
                width="18"
                height="11"
                rx="2"
                ry="2"
              />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>{{ t('batch.setPrivate') }}</span>
          </button>
          <div class="batch-divider"></div>
          <button
            class="batch-btn"
            @click="$emit('copyLinks')"
            :title="t('batch.copyLinks')"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
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
            <span>{{ t('batch.copyLinks') }}</span>
          </button>
          <div class="batch-divider"></div>
          <button
            class="batch-btn danger"
            @click="$emit('delete')"
            :title="t('batch.delete')"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
            >
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{{ t('batch.delete') }}</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
  import { t } from '../utils/i18n.js';

  // ==========================================
  // Props & Emits
  // ==========================================

  defineProps({
    selectedCount: { type: Number, default: 0 },
  });

  const emit = defineEmits(['selectAll', 'deselectAll', 'setPublic', 'setPrivate', 'copyLinks', 'delete']);

  // ==========================================
  // 方法
  // ==========================================

  const handleSelectAll = () => emit('selectAll');
  const handleDeselectAll = () => emit('deselectAll');
  const handleSetPublic = () => emit('setPublic');
  const handleSetPrivate = () => emit('setPrivate');
  const handleCopyLinks = () => emit('copyLinks');
  const handleDelete = () => emit('delete');
</script>

<style scoped>
  .batch-slide-enter-active,
  .batch-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .batch-slide-enter-from,
  .batch-slide-leave-to {
    transform: translateY(100%);
    opacity: 0;
  }

  .batch-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--bg-primary);
    border-top: 2px solid var(--blue-500);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(12px);
    padding: 0;
  }

  .batch-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.75rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .batch-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--blue-600);
    white-space: nowrap;
  }

  .batch-info svg {
    flex-shrink: 0;
  }

  .shortcut-hint {
    color: var(--text-secondary);
    font-size: 14px;
    text-align: center;
  }

  .batch-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .batch-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .batch-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .batch-btn.primary {
    color: var(--blue-600);
  }

  .batch-btn.primary:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .batch-btn.danger {
    color: #dc2626;
  }

  .batch-btn.danger:hover {
    background: rgba(220, 38, 38, 0.1);
  }

  .batch-divider {
    width: 1px;
    height: 24px;
    background: var(--border-color);
    margin: 0 0.375rem;
  }

  .batch-btn.primary:active {
    transform: scale(0.95);
  }

  .batch-btn:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    .batch-container {
      padding: 0.5rem 1rem;
      flex-direction: column;
      align-items: stretch;
    }

    .batch-info {
      justify-content: center;
    }

    .batch-actions {
      justify-content: center;
    }

    .batch-btn span {
      display: none;
    }

    .batch-btn {
      padding: 0.5rem;
    }

    .batch-divider {
      margin: 0 0.125rem;
    }
  }
</style>
