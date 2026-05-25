<template>
  <div class="search-bar">
    <div class="search-input-wrap">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle
          cx="11"
          cy="11"
          r="8"
        />
        <line
          x1="21"
          y1="21"
          x2="16.65"
          y2="16.65"
        />
      </svg>
      <input
        type="text"
        class="search-input"
        :placeholder="t('gallery.search')"
        v-model="query"
        @input="onInput"
      />
      <button
        class="clear-btn"
        v-if="query"
        @click="clear"
      >
        ✕
      </button>
    </div>
    <div class="sort-options">
      <select
        v-model="sortBy"
        @change="onSortChange"
      >
        <option value="name">{{ t('gallery.sortName') }}</option>
        <option value="date">{{ t('gallery.sortDate') }}</option>
        <option value="size">{{ t('gallery.sortSize') }}</option>
      </select>
      <button
        class="sort-order-btn"
        @click="toggleOrder"
      >
        {{ sortOrder === 'asc' ? '↑' : '↓' }}
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { t } from '../utils/i18n.js';

  // ==========================================
  // Emits
  // ==========================================

  const emit = defineEmits(['search', 'sort']);

  // ==========================================
  // 响应式数据
  // ==========================================

  const query = ref('');
  const sortBy = ref('date');
  const sortOrder = ref('desc');
  let debounceTimer = null;

  // ==========================================
  // 方法
  // ==========================================

  const onInput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => emit('search', query.value), 300);
  };

  const onSortChange = () => {
    emit('sort', { by: sortBy.value, order: sortOrder.value });
  };

  const toggleOrder = () => {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    emit('sort', { by: sortBy.value, order: sortOrder.value });
  };

  const clear = () => {
    query.value = '';
    emit('search', '');
  };
</script>

<style scoped>
  .search-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    align-items: center;
  }

  .search-input-wrap {
    flex: 1;
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: var(--text-tertiary);
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 2rem 0.625rem 2.5rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    outline: none;
    transition: border-color var(--transition);
  }

  .search-input:focus {
    border-color: var(--blue-400);
  }

  .clear-btn {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
  }

  .sort-options {
    display: flex;
    gap: 0.25rem;
  }

  .sort-options select {
    padding: 0.5rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.8125rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    outline: none;
  }

  .sort-order-btn {
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .search-bar {
      flex-direction: column;
    }
    .sort-options {
      width: 100%;
    }
    .sort-options select {
      flex: 1;
    }
  }
</style>
