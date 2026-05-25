<div align="center">
<h1>Cf-Github-ImgBed</h1>
<p>基于 Cloudflare Pages + GitHub API 的轻量级图床服务，无需服务器，零成本部署。</p>

<img src="https://img.shields.io/badge/version-v2.0-blue" />
<a href="https://github.com/Stoeaves/Cf-Github-ImgBed/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" /></a>
<a src="https://pages.cloudflare.com"><img src="https://img.shields.io/badge/platform-Cloudflare%20Pages-orange" /></a>

<br/>
<a href="https://docs.stoeaves.com/cf-github-imgbed/">文档</a> · 
<a href="https://github.com/Stoeaves/cf-github-imgbed/issues">反馈</a> ·
<a href="https://docs.stoeaves.com/cf-github-imgbed/update-log.html">更新日志</a>

<br/>

简体中文 | <a href="https://github.com/Stoeaves/Cf-Github-ImgBed/blob/main/README_EN.md">English</a>

<br />

<a src="https://github.com/Stoeaves/cmb/fork"><img src="https://img.shields.io/badge/GitHub-Fork%20this%20Repository-181717?style=for-the-badge&logo=github" /></a><br/>
<a src="https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/pages"><img src="https://img.shields.io/badge/Go%20to-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" /></a>

</div>


## ✨ 特性

- 🚀 **Cloudflare Pages 部署** — 全球 CDN 加速，零成本
- 🔐 **AES + RSA 加密认证** — 安全的管理员登录
- 📱 **TOTP 二次验证** — 支持 Google Authenticator
- 📤 **多文件批量上传** — 拖拽、粘贴、批量管理
- 🗂️ **多仓库支持** — 每个仓库独立 Token 和 CDN
- 🎨 **主题定制** — 8 种预设 + 自定义颜色
- 🌐 **国际化** — 中文 / English
- 🔍 **本地搜索排序** — 按名称、时间、大小v
- 🖼️ **图片编辑** — 格式转换、质量压缩、尺寸调整
- 📋 **批量操作** — 选择、删除、公开/私密、导出
- 📥 **导出链接** — URL / Markdown / HTML / JSON / CSV
- 🔗 **随机图片 API** — 可配置的公开图片接口
- ⚡ **API 限流** — 防止滥用
- 🔄 **上传重试** — 可配置次数，智能跳过不可重试错误
- 📦 **分页浏览** — 可配置每页数量
- 💾 **KV 云端同步** — 设置和公开图片列表持久化
- 🖥️ **响应式设计** — 桌面、平板、手机

## 📖 文档

[部署文档](https://docs.stoeaves.com/cf-github-imgbed/)

## 🚀 快速开始

### 前置要求

- Cloudflare 账号
- GitHub 账号及 [Personal Access Token](https://github.com/settings/tokens)
> 请务必勾选 **repo** 权限，否则无法访问仓库图片
- 一个 GitHub 仓库（用于存储图片）

### 1. 部署到 Cloudflare Pages

1. Fork 本仓库
2. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
3. 创建应用程序 → Pages → 连接到 Git
4. 选择仓库，配置构建设置：
   - **框架预设**: `Vite`
   - **构建命令**: `npm run build`
   - **输出目录**: `dist`
5. 点击部署

### 2. 创建 KV 命名空间

1. Workers & Pages → KV → 创建命名空间
2. 名称随意，如 `imgbed-kv`

### 3. 绑定 KV

在 Pages 项目 → Settings → Functions → KV namespace bindings：

| 变量名 | KV 命名空间 |
|--------|------------|
| `KV` | 选择刚创建的命名空间 |

### 4. 配置环境变量

在 Pages 项目 → Settings → Environment variables：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `GITHUB_TOKEN` | ✅ | GitHub Personal Access Token（全局默认） |
| `ADMIN_PASSWORD` | ✅ | 管理员密码 |
| `RSA_PUBLIC_KEY` | ✅ | RSA 公钥（base64） |
| `RSA_PRIVATE_KEY` | ✅ | RSA 私钥（base64） |

### 5. 生成 RSA 密钥对

你部署的域名，这里以`your-site.pages.dev`举例

编辑地址栏，在后面输入`/generate-keys.html`，回车，点击按钮生成，复制输出的环境变量值。

完整地址：`https://your-site.pages.dev/generate-keys.html`

### 6. 首次使用

1. 访问部署的域名
2. 输入管理员密码登录
3. 进入设置 → 添加仓库，填写信息
> **注意：** 请保证仓库中至少有一个文件（任意文件），否则无法上传图片
4. 开始上传图片

## 📡 API 接口

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/auth` | GET | ❌ | 获取 RSA 公钥 |
| `/api/auth` | POST | ❌ | 管理员登录验证 |
| `/api/images` | GET | ✅ | 获取所有仓库图片 |
| `/api/upload` | POST | ✅ | 上传图片 |
| `/api/delete` | POST | ✅ | 删除图片 |
| `/api/batch-visibility` | POST | ✅ | 批量设置公开/私密 |
| `/api/random` | GET | ❌ | 随机公开图片（可配置开关） |
| `/api/preview/{filename}` | GET | ❌ | 预览私密仓库图片 |
| `/api/settings` | GET | ❌ | 获取设置 |
| `/api/settings` | POST | ✅ | 更新设置 |

### 随机图片 API

```html
<!-- 直接作为 img 标签使用 -->
<img src="https://your-site.pages.dev/api/random" />

<!-- 获取 JSON 格式 URL -->
<script>
fetch('/api/random', { headers: { 'Accept': 'application/json' } })
  .then(res => res.json())
  .then(data => console.log(data.url));
</script>
```

## 📝 更新日志

 - v2.0
   - 重构UI
   - 新增大量新功能
   - 优化性能
   - 修复大量bug
 - v1.0
   - 基础功能上线

## 🤝 贡献

欢迎提交 Issue 和 Pull Request，感谢您的贡献！

## ⚠️ 注意事项

 - 私密仓库图片通过 Workers 代理访问，会消耗 Workers 免费额度（10 万次/天）
 - 公开仓库建议使用 CDN 加速，减少 Workers 消耗
 - RSA 私钥请妥善保管，不要提交到代码仓库
 - KV 免费额度：10 万次读/天，1000 次写/天
 - GitHub API 速率限制：5000 次/小时（认证用户）

## 📝 许可证

本项目采用 [MIT 许可证](LICENSE)