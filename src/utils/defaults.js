export const DEFAULT_SETTINGS = {
  siteTitle: 'Cf-Github-ImgBed',
  siteSubtitle: '轻量级图床服务',
  maxRetries: 3,
  pageSize: 20,
  allowRandom: false,
  randomAllowedHosts: '*',

  repositories: [
    {
      id: 'default',
      name: '默认仓库',
      owner: '',
      repo: '',
      branch: 'main',
      path: 'images',
      token: '',
      isPublic: true,
      cdnBase: 'https://cdn.jsdmirror.com/gh',
    },
  ],

  githubOwner: '',
  githubRepo: '',
  githubBranch: 'main',
  githubPath: 'images',

  activeRepository: 'default',

  totp: {
    enable: false,
    secret: '',
  },

  updateTime: 0,
};

/**
 * 获取默认设置值（返回新对象，避免引用污染）
 */
export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}
