/**
 * 剪贴板工具
 */

/**
 * 从剪贴板读取图片
 * @returns {Promise<File|null>}
 */
export async function readImageFromClipboard() {
  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      const imageTypes = item.types.filter((type) => type.startsWith('image/'));

      if (imageTypes.length > 0) {
        const blob = await item.getType(imageTypes[0]);
        const ext = imageTypes[0].split('/')[1] || 'png';
        const filename = `clipboard-${Date.now()}.${ext}`;
        return new File([blob], filename, { type: imageTypes[0] });
      }
    }

    return null;
  } catch (error) {
    console.error('读取剪贴板失败:', error);
    return null;
  }
}

/**
 * 检查剪贴板是否包含图片
 */
export async function hasImageInClipboard() {
  try {
    const items = await navigator.clipboard.read();
    return items.some((item) => item.types.some((type) => type.startsWith('image/')));
  } catch {
    return false;
  }
}
