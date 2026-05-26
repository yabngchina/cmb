export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  const rateLimiter = new RateLimiter();

  if (pathname.startsWith('/api/')) {
    const allowed = await rateLimiter.checkLimit(env, ip, pathname);
    if (!allowed) {
      return jsonResponse({ error: 'rateLimit' }, 429);
    }
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (pathname.startsWith('/api')) {
    console.log("rsa_public_key = " + env.RSA_PUBLIC_KEY)
    console.log("rsa_private_key = " + env.RSA_PRIVATE_KEY)
    console.log("pass = " + env.ADMIN_PASSWORD)
    console.log("token = " + env.GITHUB_TOKEN)
    if (!env.RSA_PUBLIC_KEY || !env.RSA_PRIVATE_KEY || !env.ADMIN_PASSWORD || !env.GITHUB_TOKEN)
      return jsonResponse({ error: 'lackRequiredEnv' }, 500);

    if (!env.KV) return jsonResponse({ error: 'noKV' }, 500);

    let response;

    if (pathname === '/api/auth' && (request.method === 'GET' || request.method === 'HEAD'))
      response = await handleGetPublicKey(env);

    if (pathname === '/api/auth' && request.method === 'POST') response = await handleAuth(request, env);

    if (pathname === '/api/verifyLogin' && request.method === 'POST') response = await handleVerifyLogin(request, env);

    if (pathname === '/api/random' && (request.method === 'GET' || request.method === 'HEAD'))
      response = await handleRandom(request, env);

    if (pathname === '/api/images' && request.method === 'GET') response = await handleImages(request, env);

    if (pathname === '/api/upload' && request.method === 'POST') response = await handleUpload(request, env);

    if (pathname === '/api/delete' && request.method === 'POST') response = await handleDelete(request, env);

    if (pathname === '/api/settings' && request.method === 'GET') response = await handleGetSettings(env);

    if (pathname === '/api/settings' && request.method === 'POST') response = await handleUpdateSettings(request, env);

    if (pathname === '/api/getSettingsUpdateTime' && request.method === 'GET')
      response = await handleGetSettingsUpdateTime(env);

    if (pathname === '/api/checkRepositoryStatus' && request.method === 'POST')
      response = await handleCheckRepositoryStatus(request, env);

    if (pathname.startsWith('/api/preview/') && request.method === 'GET') response = await handlePreview(request, env);

    if (pathname === '/api/batch-visibility' && request.method === 'POST')
      response = await handleBatchVisibility(request, env);

    if (!response) {
      response = jsonResponse({ error: 'notFound' }, 404);
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return env.ASSETS.fetch(request);
}

// ================= API 处理函数 =================
async function handleRandom(request, env) {
  // 检查是否允许随机 API
  const allowRandom = await getKVSetting(env, 'allowRandom', false);
  if (!allowRandom) {
    return jsonResponse({ error: 'randomIsDisable' }, 403);
  }

  // 检查请求来源
  const randomAllowedHosts = await getKVSetting(env, 'randomAllowedHosts', '*');
  if (randomAllowedHosts !== '*') {
    const referer = request.headers.get('Referer') || '';
    const origin = request.headers.get('Origin') || '';
    const requestHost = referer ? new URL(referer).hostname : origin ? new URL(origin).hostname : '';

    if (requestHost) {
      const allowedHosts = randomAllowedHosts.split(',').map((h) => h.trim());
      const isAllowed = allowedHosts.some((host) => {
        if (host.startsWith('*.')) {
          const domain = host.substring(2);
          return requestHost === domain || requestHost.endsWith('.' + domain);
        }
        return requestHost === host;
      });

      if (!isAllowed) {
        return jsonResponse({ error: 'disallowedHost' }, 403);
      }
    }
  }

  // 获取 URL 参数
  const url = new URL(request.url);
  const repoId = url.searchParams.get('repoId') || 'all';

  // 从 KV 获取公开图片
  const allImages = await getAllImages(env);
  const publicMap = await getPublicMapFromKV(env);

  const publicImages = allImages.filter((img) => !!publicMap[img.name]);

  if (!publicImages || !Array.isArray(publicImages) || publicImages.length === 0) {
    return jsonResponse({ error: 'noPublicImages' }, 404);
  }

  // 按仓库过滤
  let filteredImages = publicImages;
  if (repoId && repoId !== 'all') {
    filteredImages = publicImages.filter((img) => img.repoId === repoId);
  }

  // 过滤无效图片
  filteredImages = filteredImages.filter((img) => img.url && img.name);

  if (filteredImages.length === 0) {
    return jsonResponse({ error: 'noMatchingImages' }, 404);
  }

  // 随机选一张
  const image = filteredImages[Math.floor(Math.random() * filteredImages.length)];

  // 获取该图片所属仓库配置
  const repo = getRepositoryById(env, image.repoId);

  // 构建图片 URL
  const cdnBase = repo.cdnBase || 'https://cdn.jsdmirror.com/gh';
  const branch = repo.branch || 'main';
  const path = (repo.path || '').replace(/^\/+|\/+$/g, '');

  let imageUrl;
  let isCDN = false;

  if (repo.isPublic && repo.owner && repo.repo) {
    const cdn = cdnBase.replace(/\/+$/, '');
    if (path) {
      imageUrl = `${cdn}/${repo.owner}/${repo.repo}@${branch}/${path}/${image.name}`;
    } else {
      imageUrl = `${cdn}/${repo.owner}/${repo.repo}@${branch}/${image.name}`;
    }
    isCDN = true;
  } else {
    imageUrl = image.url;
    isCDN = false;
  }

  // 根据请求头返回 JSON 或图片
  const acceptHeader = request.headers.get('Accept') || '';

  if (acceptHeader.includes('application/json')) {
    return jsonResponse({ name: image.name, repoId: image.repoId });
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  }

  if (isCDN) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: imageUrl,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } else {
    try {
      const imageResponse = await fetch(imageUrl, {
        headers: {
          Authorization: `token ${repo.token || env.GITHUB_TOKEN}`,
          'User-Agent': 'Cf-Github-ImgBed',
        },
      });

      if (!imageResponse.ok) {
        return jsonResponse({ error: 'fetchImageFailed' }, 500);
      }

      const contentType = imageResponse.headers.get('Content-Type') || getContentType(image.name);
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Cache-Control', 'public, max-age=3600');
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(imageResponse.body, { status: 200, headers });
    } catch (error) {
      return jsonResponse({ error: 'fetchImageFailed' }, 500);
    }
  }
}

async function handleImages(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return jsonResponse({ error: 'notAuthorized' }, 401);
  }

  const allImages = await getAllImages(env);
  const publicMap = await getPublicMapFromKV(env);

  return jsonResponse({
    images: allImages.map((img) => ({ ...img, public: !!publicMap[img.name] })),
    total: allImages.length,
  });
}

async function getRepositories(env) {
  let repositories = [];

  // 从 KV 读取仓库配置
  if (env.KV) {
    try {
      const kvData = await env.KV.get('site_settings', { type: 'json' });
      if (kvData && kvData.repositories && Array.isArray(kvData.repositories) && kvData.repositories.length > 0) {
        repositories = kvData.repositories;
      }
    } catch (error) {
      console.error('读取仓库配置失败:', error.message);
    }
  }

  // 如果 KV 中有仓库但没有 token，用全局 token 填充
  const globalToken = env.GITHUB_TOKEN || '';
  repositories = repositories.map((repo) => ({
    ...repo,
    token: repo.token || globalToken,
  }));

  // 如果没有配置任何仓库，返回空数组
  if (repositories.length === 0) {
    repositories.push({
      id: 'default',
      name: '默认仓库',
      owner: '',
      repo: '',
      branch: 'main',
      path: 'images',
      token: globalToken,
      isDefault: false,
      isPublic: false,
    });
  }

  // 过滤掉配置不完整的仓库
  return repositories.filter((repo) => {
    const isValid = repo.owner && repo.repo && repo.token;
    if (!isValid) {
      console.warn(`仓库 "${repo.name || '未命名'}" 配置不完整，跳过`);
    }
    return isValid;
  });
}

// 获取所有仓库的图片
async function getAllImages(env) {
  const repositories = await getRepositories(env);
  let allImages = [];

  for (const repo of repositories) {
    try {
      const images = await getImageListForRepo(repo);
      allImages.push(
        ...images.map((img) => ({
          ...img,
          repoId: repo.id,
          repoName: repo.name,
        })),
      );
    } catch (err) {
      console.error(`获取仓库 "${repo.name}" 图片失败:`, err.message);
    }
  }

  return allImages;
}

// 获取单个仓库的图片列表
async function getImageListForRepo(repoConfig) {
  const { owner, repo, branch, path, token } = repoConfig;

  if (!owner || !repo || !token) {
    return [];
  }

  const repoBranch = branch || 'main';
  const repoPath = (path || '').replace(/^\/+|\/+$/g, '');

  // 根据路径是否为空构建不同的 API URL
  let apiUrl;
  if (repoPath) {
    apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}?ref=${repoBranch}`;
  } else {
    apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/?ref=${repoBranch}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'Cf-Github-ImgBed',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const imageRegex = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;

    return data
      .filter((item) => item.type === 'file' && imageRegex.test(item.name))
      .map((item) => ({
        name: item.name,
        url: item.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/${repoBranch}/${item.path}`,
        size: item.size || 0,
      }));
  } catch {
    return [];
  }
}

async function handleUpload(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return jsonResponse({ error: 'notAuthorized' }, 401);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return jsonResponse({ error: 'invalidFormData' }, 400);
  }

  const file = formData.get('image');
  const isPublic = formData.get('public') === 'true';
  // 获取目标仓库 ID
  const repoId = formData.get('repoId') || 'default';

  if (!file || !file.name) {
    return jsonResponse({ error: 'noUploadedImage' }, 400);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return jsonResponse({ error: 'invalidFileType' }, 400);
  }

  if (file.size > 20 * 1024 * 1024) {
    return jsonResponse({ error: 'fileTooLarge' }, 400);
  }

  // 获取目标仓库配置
  const repo = await getRepositoryById(env, repoId);
  if (!repo.owner || !repo.repo || !repo.token) {
    return jsonResponse({ error: 'incompleteRepoConfig' }, 500);
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const timestamp = Date.now();
  const randomStr = crypto.randomUUID
    ? crypto.randomUUID().substring(0, 8)
    : Math.random().toString(36).substring(2, 10);
  const fileName = `${timestamp}-${randomStr}.${ext}`;
  const repoPath = (repo.path || '').replace(/^\/+|\/+$/g, '');
  const filePath = repoPath ? `${repoPath}/${fileName}` : fileName;

  const content = await file.arrayBuffer();
  const base64Content = arrayBufferToBase64(content);

  const apiUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${filePath}`;

  const body = JSON.stringify({
    message: `Upload ${fileName} [${isPublic ? '公开' : '私密'}]`,
    content: base64Content,
    branch: repo.branch || 'main',
  });

  const ghResponse = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${repo.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Cf-Github-ImgBed',
    },
    body: body,
  });

  if (!ghResponse.ok) {
    const err = await ghResponse.json().catch(() => ({ message: 'GitHub unknownError' }));
    throw new Error(err.message || '上传到 GitHub 失败');
  }

  const imageUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch || 'main'}/${filePath}`;

  if (isPublic && env.KV) {
    try {
      await addPublicImageToKV(env, fileName, {
        name: fileName,
        url: imageUrl,
        size: file.size,
        uploadedAt: timestamp,
        repoId: repoId,
      });
    } catch (kvError) {
      console.error('KV 存储错误:', kvError.message);
    }
  }

  return jsonResponse({
    success: true,
    name: fileName,
    url: imageUrl,
    size: file.size,
    public: isPublic,
    repoId: repoId,
  });
}

async function handleDelete(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return jsonResponse({ error: 'notAuthorized' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'invalidData' }, 400);
  }

  const { filename, repoId } = body;
  if (!filename || filename.includes('/') || filename.includes('..')) {
    return jsonResponse({ error: 'invalidFilename' }, 400);
  }
  if (!repoId) {
    return jsonResponse({ error: 'notProvidedRepoId' }, 400);
  }

  const repo = await getRepositoryById(env, repoId);

  const repoPath = (repo.path || 'images').replace(/^\/+|\/+$/g, '');
  const filePath = repoPath ? `${repoPath}/${filename}` : filename;
  const apiUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${filePath}`;

  const getResponse = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cf-Github-ImgBed',
    },
  });

  if (!getResponse.ok) {
    return jsonResponse({ error: 'fileNotExist' }, 404);
  }

  const fileData = await getResponse.json().catch(() => null);
  if (!fileData || !fileData.sha) {
    return jsonResponse({ error: 'getFileInfoFailed' }, 500);
  }

  const deleteResponse = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Cf-Github-ImgBed',
    },
    body: JSON.stringify({
      message: `Delete ${filename}`,
      sha: fileData.sha,
      branch: repo.branch || 'main',
    }),
  });

  if (!deleteResponse.ok) {
    const err = await deleteResponse.json().catch(() => ({ message: 'unknownError' }));
    throw new Error(err.message || '删除失败');
  }

  if (env.KV) {
    try {
      await removePublicImageFromKV(env, filename);
    } catch (kvError) {
      console.error('KV 删除错误:', kvError.message);
    }
  }

  return jsonResponse({ success: true, deleted: filename });
}

// 批量修改图片可见性
async function handleBatchVisibility(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return jsonResponse({ error: 'notAuthorized' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'invalidData' }, 400);
  }

  const { filesList, isPublic } = body;

  if (!Array.isArray(filesList) || filesList.length === 0) {
    return jsonResponse({ error: 'emptyFilesList' }, 400);
  }

  if (typeof isPublic !== 'boolean') {
    return jsonResponse({ error: 'isPublicMustBeBoolean' }, 400);
  }

  if (!env.KV) {
    return jsonResponse({ error: 'noKV' }, 500);
  }

  try {
    const results = { success: [], failed: [] };

    for (const file of filesList) {
      const filename = file.name;
      const repoId = file.repoId;
      try {
        if (isPublic) {
          const repo = await getRepositoryById(env, repoId);
          let path = (repo.path || 'images').replace(/^\/+|\/+$/g, '');
          if (repo) path = `${repo.path}/`;

          const imageUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch || 'main'}/${path}${filename}`;
          await addPublicImageToKV(env, filename, {
            name: filename,
            url: imageUrl,
            size: 0,
            uploadedAt: Date.now(),
          });
        } else {
          await removePublicImageFromKV(env, filename);
        }
        results.success.push(filename);
      } catch (err) {
        console.error(`修改 ${filename} 可见性失败:`, err.message);
        results.failed.push(filename);
      }
    }

    return jsonResponse({
      success: true,
      results,
      isPublic,
    });
  } catch (error) {
    console.error('批量修改可见性失败:', error.message);
    return jsonResponse({ error: 'batchFailed' }, 500);
  }
}

/**
 * 通过指定仓库 ID 获取仓库信息
 * @returns {Promise<[{ id: string; name: string; owner: string; repo: string; branch: string; path: string; token: string; isPublic: boolean; isDefault: boolean; cdnBase?: string }]>}
 */
async function getRepositoryById(env, repoId) {
  const repositories = await getRepositories(env);
  return (
    repositories.find((r) => r.id === repoId) ||
    repositories[0] || {
      id: 'default',
      name: 'Default Repo',
      owner: '',
      repo: '',
      branch: 'main',
      path: 'images',
      token: '',
      isPublic: false,
      isDefault: false,
    }
  );
}

async function handleGetPublicKey(env) {
  const allowRandom = await getKVSetting(env, 'allowRandom', false);
  return jsonResponse({
    publicKey: env.RSA_PUBLIC_KEY,
    allowRandom: allowRandom === true,
  });
}

async function handleAuth(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'invalidData' }, 400);
  }

  const { token } = body;
  if (!token) {
    return jsonResponse({ error: 'lackAuthToken' }, 400);
  }

  if (!env.RSA_PRIVATE_KEY || !env.ADMIN_PASSWORD) {
    console.error('缺少 RSA_PRIVATE_KEY 或 ADMIN_PASSWORD 配置');
    return jsonResponse({ error: 'lackRequiredEnv' }, 500);
  }

  try {
    const decrypted = await rsaDecrypt(token, env.RSA_PRIVATE_KEY);
    if (decrypted === env.ADMIN_PASSWORD) {
      const sessionToken = await generateSessionToken(decrypted, env);

      const allowRandom = await getKVSetting(env, 'allowRandom', false);
      return jsonResponse({
        valid: true,
        token: sessionToken,
        allowRandom: allowRandom === 'true',
      });
    }
    return jsonResponse({ valid: false, error: 'wrongPassword' }, 401);
  } catch (error) {
    return jsonResponse({ valid: false, error: 'authFailed' }, 401);
  }
}

async function handleVerifyLogin(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return jsonResponse({ valid: false }, 401);
  }
  return jsonResponse({ valid: true });
}

async function handleGetSettings(env) {
  let kvSettings = {};

  if (env.KV) {
    try {
      const kvData = await env.KV.get('site_settings', { type: 'json' });
      if (kvData && typeof kvData === 'object') {
        kvSettings = kvData;
      }
    } catch (error) {
      console.error('读取 KV 设置失败:', error.message);
    }
  }

  const updateTime = (await env.KV.get('updateTime')) ?? 0;

  const settings = {
    siteTitle: kvSettings.siteTitle || 'Cf-Github-ImgBed',
    maxRetries: kvSettings.maxRetries || 3,
    pageSize: kvSettings.pageSize || 20,
    allowRandom: kvSettings.allowRandom || false,
    randomAllowedHosts: kvSettings.randomAllowedHosts || '*',
    repositories: kvSettings.repositories || [],
    githubOwner: kvSettings.githubOwner || '',
    githubRepo: kvSettings.githubRepo || '',
    githubBranch: kvSettings.githubBranch || 'main',
    githubPath: kvSettings.githubPath || 'images',
    activeRepository: kvSettings.activeRepository || 'default',
    totp: {
      enable: (kvSettings.totp && kvSettings.totp.enable) || false,
      secret: (kvSettings.totp && kvSettings.totp.secret) || '',
    },
    updateTime,
  };

  return jsonResponse(settings);
}

async function handleGetSettingsUpdateTime(env) {
  const updateTime = await getKVSetting(env, 'updateTime', 0);
  return jsonResponse({ updateTime });
}

async function handleUpdateSettings(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return jsonResponse({ error: 'notAuthorized' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'invalidData' }, 400);
  }

  if (!env.KV) {
    return jsonResponse({ error: 'noKV' }, 500);
  }

  try {
    // 读取现有设置
    let currentSettings = {};
    const existing = await env.KV.get('site_settings', { type: 'json' });
    if (existing && typeof existing === 'object') {
      currentSettings = existing;
    }

    // 合并所有提交的字段（不限于白名单，支持嵌套对象）
    const newSettings = deepMerge(currentSettings, body);
    const updateTime = newSettings.updateTime || Date.now();

    // 保存到 KV
    await env.KV.put('site_settings', JSON.stringify(newSettings));
    await env.KV.put('updateTime', updateTime.toString());

    return jsonResponse({
      success: true,
    });
  } catch (error) {
    console.error('保存设置到 KV 失败:', error.message);
    return jsonResponse({ error: 'saveSettingsFailed' }, 500);
  }
}

async function handleCheckRepositoryStatus(request, env) {
  const authResult = await verifyAuth(request, env);
  if (!authResult) {
    return jsonResponse({ error: 'notAuthorized' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'invalidData' }, 400);
  }

  if (!env.KV) {
    return jsonResponse({ error: 'noKV' }, 500);
  }

  const { repoId } = body;
  if (!repoId) {
    return jsonResponse({ error: 'notProvidedRepoId' }, 400);
  }

  try {
    const repo = await getRepositoryById(env, repoId);
    if (!repo) {
      return jsonResponse({ error: 'repoNotFound' }, 404);
    }

    const isPublic = repo.isPublic ?? true;
    const apiUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}`;
    const options = isPublic
      ? { headers: { 'User-Agent': 'Cf-Github-ImgBed' } }
      : { headers: { 'User-Agent': 'Cf-Github-ImgBed', Authorization: `Bearer ${repo.token}` } };
    const res = await fetch(apiUrl, options);

    if (res.status === 200) return jsonResponse({ available: true });
    else if (res.status === 404) return jsonResponse({ available: false, error: 'NotFound' });
    else if (res.status === 401) return jsonResponse({ available: false, error: 'InvalidToken' });
    else
      return jsonResponse({
        status: res.status,
        available: false,
        error: 'Unknown',
      });
  } catch (error) {
    return jsonResponse({ available: false, error: 'Network' }, 404);
  }
}

// 深度合并对象
function deepMerge(target, source) {
  const output = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(output[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

async function handlePreview(request, env) {
  const url = new URL(request.url);
  const pathParts = url.pathname.replace('/api/preview/', '').split('/');
  const filename = pathParts[pathParts.length - 1];

  if (!filename || filename.includes('..')) {
    return jsonResponse({ error: 'invalidFilename' }, 400);
  }

  // 获取仓库列表
  const repositories = await getRepositories(env);

  if (repositories.length === 0) {
    return jsonResponse({ error: 'notConfiguredRepo' }, 500);
  }

  // 遍历所有仓库查找文件
  for (const repo of repositories) {
    const repoPath = (repo.path || '').replace(/^\/+|\/+$/g, '');
    const filePath = repoPath ? `${repoPath}/${filename}` : filename;
    const apiUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${filePath}?ref=${repo.branch || 'main'}`;

    try {
      const metaResponse = await fetch(apiUrl, {
        headers: {
          Authorization: `token ${repo.token || env.GITHUB_TOKEN}`,
          'User-Agent': 'Cf-Github-ImgBed',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (metaResponse.ok) {
        const fileData = await metaResponse.json();

        const fileResponse = await fetch(fileData.download_url, {
          headers: {
            Authorization: `token ${repo.token || env.GITHUB_TOKEN}`,
            'User-Agent': 'Cf-Github-ImgBed',
          },
        });

        if (fileResponse.ok) {
          const contentType = fileResponse.headers.get('Content-Type') || getContentType(filename);
          const headers = new Headers();
          headers.set('Content-Type', contentType);
          headers.set('Cache-Control', 'public, max-age=3600');
          headers.set('Access-Control-Allow-Origin', '*');

          return new Response(fileResponse.body, {
            status: 200,
            headers,
          });
        }
      }
    } catch (error) {
      console.error(`仓库 ${repo.name} 查找失败:`, error.message);
    }
  }

  return jsonResponse({ error: 'fileNotFound' }, 404);
}

// ========== 工具函数 ==========

async function getKVSetting(env, key, defaultValue) {
  if (!env.KV) return defaultValue;

  try {
    const kvData = await env.KV.get('site_settings', { type: 'json' });
    if (kvData && kvData[key] !== undefined) {
      return kvData[key];
    }
  } catch (error) {
    console.error('读取 KV 设置失败:', error.message);
  }

  return defaultValue;
}

function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return verifyToken(token, env);
}

async function verifyToken(token, env) {
  if (!token || !env.RSA_PRIVATE_KEY || !env.ADMIN_PASSWORD) {
    return false;
  }

  try {
    const decrypted = await rsaDecrypt(token, env.RSA_PRIVATE_KEY);
    const parts = decrypted.split(':');
    if (parts.length !== 2) return false;

    const [password, timestampStr] = parts;
    const timestamp = parseInt(timestampStr);

    if (isNaN(timestamp) || Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return false;
    }

    return password === env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

// ========== KV 操作 ==========

async function getPublicImagesFromKV(env) {
  if (!env.KV) return [];
  try {
    const data = await env.KV.get('public_images', { type: 'json' });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getPublicMapFromKV(env) {
  if (!env.KV) return {};
  try {
    const images = await getPublicImagesFromKV(env);
    const map = {};
    for (const img of images) {
      if (img && img.name) map[img.name] = true;
    }
    return map;
  } catch {
    return {};
  }
}

async function addPublicImageToKV(env, filename, imageData) {
  if (!env.KV) return;
  const images = await getPublicImagesFromKV(env);
  const idx = images.findIndex((img) => img.name === filename);
  if (idx >= 0) images[idx] = imageData;
  else images.push(imageData);
  await env.KV.put('public_images', JSON.stringify(images));
}

async function removePublicImageFromKV(env, filename) {
  if (!env.KV) return;
  const images = await getPublicImagesFromKV(env);
  await env.KV.put('public_images', JSON.stringify(images.filter((img) => img.name !== filename)));
}

// ========== 加密函数 ==========

async function rsaDecrypt(encryptedBase64, privateKeyBase64) {
  const privateKeyData = base64ToArrayBuffer(privateKeyBase64);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  );
  const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, base64ToArrayBuffer(encryptedBase64));
  return new TextDecoder().decode(decrypted);
}

async function generateSessionToken(password, env) {
  const data = `${password}:${Date.now()}`;
  const publicKeyData = base64ToArrayBuffer(env.RSA_PUBLIC_KEY);
  const publicKey = await crypto.subtle.importKey('spki', publicKeyData, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, [
    'encrypt',
  ]);
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, new TextEncoder().encode(data));
  return arrayBufferToBase64(encrypted);
}

// ========== 通用工具 ==========

function getContentType(filename) {
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
  };
  return types[(filename.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  base64 = base64
    .replace(/^data:.*?;base64,/, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * 限流器类，用于控制API请求频率
 * 使用滑动窗口算法实现限流功能
 */
class RateLimiter {
  /**
   * 构造函数，初始化存储窗口数据的Map
   */
  constructor() {
    this.windows = new Map(); // 存储不同IP和端口的请求窗口数据
  }

  async checkLimit(env, ip, endpoint) {
    const key = `ratelimit:${ip}:${endpoint}`;
    const maxRequests = this.getLimitForEndpoint(endpoint);
    const windowMs = 60000; // 1分钟窗口

    if (env.KV) {
      try {
        const now = Date.now();
        const windowStart = now - windowMs;

        let data = await env.KV.get(key, { type: 'json' });
        if (!data || data.windowStart < windowStart) {
          data = { windowStart: now, count: 1 };
        } else {
          data.count++;
        }

        await env.KV.put(key, JSON.stringify(data), { expirationTtl: 120 });

        return data.count <= maxRequests;
      } catch (e) {
        console.error('限流检查失败:', e.message);
        return true;
      }
    }

    return true;
  }

  getLimitForEndpoint(endpoint) {
    const limits = {
      '/api/upload': 30,
      '/api/delete': 60,
      '/api/random': 30,
      '/api/images': 20,
      default: 60, // 默认60次
    };
    return limits[endpoint] || limits.default;
  }
}
