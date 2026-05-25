const API_BASE = '/api';

export async function fetchRandom() {
  const res = await fetch(`${API_BASE}/random`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '获取随机图片失败');
  }
  return await res.json();
}

export async function fetchImages(token = '') {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/images`, { headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '获取图片列表失败');
  }
  return await res.json();
}

export async function deleteImage(filename, repoId, token) {
  const res = await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename, repoId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '删除失败');
  }
  return await res.json();
}

/**
 * 批量修改图片可见性
 * @param {Array} filesList - 文件名列表
 * @param {boolean} isPublic - 是否公开
 * @param {string} token - 认证 token
 */
export async function batchSetVisibility(filesList, isPublic, token) {
  const res = await fetch(`${API_BASE}/batch-visibility`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filesList, isPublic }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '批量修改失败');
  }

  return await res.json();
}

export async function checkRepository(repoId, token) {
  const res = await fetch(`${API_BASE}/checkRepositoryStatus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ repoId }),
  });
  return await res.json();
}

export async function verifyAuth(encryptedToken) {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: encryptedToken }),
  });
  return await res.json();
}

export async function verifyLogin(sessionToken) {
  const res = await fetch(`${API_BASE}/verifyLogin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  return await res.json();
}

export async function fetchPublicKey() {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error('获取公钥失败');
  return await res.json();
}
