<template>
  <div
    class="modal editor-overlay"
    v-if="visible"
    @click.self="close"
  >
    <div
      class="editor-modal"
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
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {{ t('editor.title') }}
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

      <div class="editor-body">
        <div class="editor-preview">
          <img
            :src="imageUrl"
            ref="previewImage"
          />
        </div>

        <div class="editor-controls">
          <div class="control-group">
            <label>{{ t('editor.format') }}</label>
            <select
              v-model="outputFormat"
              @change="updateEstimate"
              class="control-select"
            >
              <option value="original">{{ t('editor.original') }}</option>
              <option value="webp">WebP</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
            </select>
          </div>

          <div
            class="control-group"
            v-if="outputFormat !== 'original'"
          >
            <label>{{ t('editor.quality') }}: {{ quality }}%</label>
            <input
              type="range"
              v-model.number="quality"
              @input="updateEstimate"
              min="10"
              max="100"
              class="control-range"
            />
          </div>

          <div class="control-group">
            <label>{{ t('editor.maxWidth') }} (px)</label>
            <input
              type="number"
              v-model.number="maxWidth"
              @input="updateEstimate"
              min="0"
              class="control-input"
              :placeholder="originalWidth ? `${t('editor.original')}: ${originalWidth}px` : t('editor.originalSize')"
            />
            <span
              class="control-hint"
              v-if="originalWidth"
              >{{ t('editor.originalWidth') }}: {{ originalWidth }}px</span
            >
          </div>

          <!-- 文件大小信息区域 -->
          <div class="size-info">
            <div class="size-row">
              <span class="size-label">{{ t('editor.originalSize') }}</span>
              <span class="size-value">{{ formatSize(originalSize) }}</span>
            </div>

            <div
              class="size-row"
              v-if="outputFormat !== 'original'"
            >
              <span class="size-label">{{ t('editor.estimatedSize') }}</span>
              <span class="size-value estimated">{{ formatSize(estimatedSize) }}</span>
            </div>

            <div
              class="size-row"
              v-if="widthChanged"
            >
              <span class="size-label">{{ t('editor.changedDimensions') }}</span>
              <span class="size-value">{{ resultWidth }} × {{ resultHeight }} px</span>
            </div>

            <div
              class="size-row saved-row"
              v-if="savedBytes > 0"
            >
              <span class="size-label">{{ t('editor.savedSize') }}</span>
              <span class="size-value saved"> {{ formatSize(savedBytes) }} ({{ savedPercent }}%) </span>
            </div>

            <div
              class="size-row"
              v-if="outputFormat === 'original' && !widthChanged"
            >
              <span class="size-label hint">{{ t('editor.noChange') }}</span>
              <span class="size-value hint">—</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="close"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          class="btn btn-primary"
          @click="processImage"
          :disabled="processing"
        >
          {{ processing ? t('common.processing') : t('editor.process') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { t } from '../utils/i18n.js';

  // ==========================================
  // Emits
  // ==========================================

  const emit = defineEmits(['processed', 'close']);

  // ==========================================
  // 响应式数据
  // ==========================================

  const visible = ref(false);
  const imageUrl = ref('');
  const originalFile = ref(null);
  const outputFormat = ref('original');
  const quality = ref(80);
  const maxWidth = ref(0);
  const processing = ref(false);
  const originalSize = ref(null);
  const originalWidth = ref(null);
  const originalHeight = ref(null);
  const estimatedSize = ref(null);
  const resultWidth = ref(null);
  const resultHeight = ref(null);

  // refs
  const previewImage = ref(null);

  // ==========================================
  // 计算属性
  // ==========================================

  const savedBytes = computed(() => {
    if (!originalSize.value || !estimatedSize.value) return 0;
    return Math.max(0, originalSize.value - estimatedSize.value);
  });

  const savedPercent = computed(() => {
    if (!originalSize.value || !estimatedSize.value || originalSize.value === 0) return 0;
    return Math.round((1 - estimatedSize.value / originalSize.value) * 100);
  });

  const widthChanged = computed(() => {
    if (maxWidth.value <= 0 || !originalWidth.value) return false;
    return maxWidth.value < originalWidth.value;
  });

  // ==========================================
  // 方法
  // ==========================================

  const open = (file) => {
    originalFile.value = file;
    originalSize.value = file.size;
    outputFormat.value = 'original';
    quality.value = 80;
    maxWidth.value = 0;
    estimatedSize.value = null;
    processing.value = false;
    originalWidth.value = null;
    originalHeight.value = null;
    resultWidth.value = null;
    resultHeight.value = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      imageUrl.value = e.target.result;

      const img = new Image();
      img.onload = () => {
        originalWidth.value = img.width;
        originalHeight.value = img.height;
        resultWidth.value = img.width;
        resultHeight.value = img.height;
        updateEstimate();
      };
      img.src = e.target.result;

      visible.value = true;
      emit('open');
    };
    reader.readAsDataURL(file);
  };

  const close = () => {
    visible.value = false;
    emit('close');
  };

  const updateEstimate = () => {
    if (originalWidth.value) {
      if (maxWidth.value > 0 && originalWidth.value > maxWidth.value) {
        resultWidth.value = maxWidth.value;
        resultHeight.value = Math.round(originalHeight.value * (maxWidth.value / originalWidth.value));
      } else {
        resultWidth.value = originalWidth.value;
        resultHeight.value = originalHeight.value;
      }
    }
    estimateFileSize();
  };

  const estimateFileSize = () => {
    if (outputFormat.value === 'original' && !widthChanged.value) {
      estimatedSize.value = originalSize.value;
      return;
    }

    if (!originalWidth.value || !originalHeight.value) {
      estimatedSize.value = null;
      return;
    }

    const totalPixels = resultWidth.value * resultHeight.value;
    let bytesPerPixel = 3;

    if (outputFormat.value === 'original') {
      const originalPixels = originalWidth.value * originalHeight.value;
      if (originalPixels > 0) {
        estimatedSize.value = Math.round(originalSize.value * (totalPixels / originalPixels));
      }
      return;
    }

    switch (outputFormat.value) {
      case 'webp':
        bytesPerPixel = 0.4 * (quality.value / 100);
        break;
      case 'jpeg':
        bytesPerPixel = 0.5 * (quality.value / 100);
        break;
      case 'png':
        bytesPerPixel = 1.2;
        break;
      default:
        bytesPerPixel = 0.5;
    }

    estimatedSize.value = Math.round(totalPixels * bytesPerPixel);
  };

  const processImage = async () => {
    processing.value = true;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl.value;
      });

      let width = img.width;
      let height = img.height;

      if (maxWidth.value > 0 && width > maxWidth.value) {
        height = Math.round(height * (maxWidth.value / width));
        width = maxWidth.value;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      let mimeType = originalFile.value.type;
      let ext = originalFile.value.name.split('.').pop();

      if (outputFormat.value !== 'original') {
        switch (outputFormat.value) {
          case 'webp':
            mimeType = 'image/webp';
            ext = 'webp';
            break;
          case 'jpeg':
            mimeType = 'image/jpeg';
            ext = 'jpg';
            break;
          case 'png':
            mimeType = 'image/png';
            ext = 'png';
            break;
        }
      }

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, mimeType, quality.value / 100);
      });

      const baseName = originalFile.value.name.replace(/\.[^.]+$/, '');
      const filename = `${baseName}_edited.${ext}`;
      const processedFile = new File([blob], filename, { type: mimeType });

      estimatedSize.value = blob.size;
      emit('processed', processedFile);
      close();
    } catch (err) {
      console.error('图片处理失败:', err);
    } finally {
      processing.value = false;
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 暴露方法给父组件
  defineExpose({
    open,
  });
</script>

<style scoped>
  .editor-overlay {
    z-index: 600 !important;
  }

  .editor-modal {
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    width: 640px;
    max-width: 95vw;
    max-height: 90vh;
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

  .editor-body {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .editor-preview {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    min-height: 200px;
    max-height: 400px;
    overflow: hidden;
  }

  .editor-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .editor-controls {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .control-group label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .control-select,
  .control-input {
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .control-select:focus,
  .control-input:focus {
    border-color: var(--blue-400);
  }

  .control-range {
    -webkit-appearance: none;
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }

  .control-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: var(--blue-500);
    border-radius: 50%;
    cursor: pointer;
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

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--blue-500);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--blue-600);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--bg-secondary);
  }

  .size-info {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .size-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .size-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .size-value {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .size-value.estimated {
    color: var(--blue-500);
  }

  .size-value.saved {
    color: #16a34a;
  }

  .size-value.hint {
    color: var(--text-tertiary);
  }

  .saved-row {
    padding-top: 0.5rem;
    border-top: 1px dashed var(--border-color);
  }

  .control-hint {
    font-size: 0.6875rem;
    color: var(--text-tertiary);
    margin-top: 0.125rem;
  }

  @media (max-width: 640px) {
    .editor-body {
      flex-direction: column;
    }
    .editor-controls {
      width: 100%;
    }
  }
</style>
