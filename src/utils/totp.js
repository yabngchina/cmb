/**
 * TOTP 二次验证
 * 使用 Web Crypto API 实现
 */

export class TOTPManager {
  constructor() {
    this.secret = null;
    this.enabled = false;
  }

  /**
   * 生成新的 TOTP 密钥
   */
  generateSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    for (let i = 0; i < 32; i++) {
      secret += chars[array[i] % chars.length];
    }
    this.secret = secret;
    return secret;
  }

  /**
   * 获取 TOTP URI（用于生成二维码）
   */
  getTotpUri(account = 'admin', issuer = 'Cf-Github-ImgBed') {
    if (!this.secret) return '';
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${this.secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * 生成当前 TOTP 码
   */
  async generateCode() {
    if (!this.secret) return '';

    const timeStep = 30;
    const digits = 6;

    // 修复：使用 let 声明 counter
    let counter = Math.floor(Date.now() / 1000 / timeStep);

    // Base32 解码
    const secretBytes = this._base32Decode(this.secret);

    // 生成 HMAC-SHA1
    const counterBytes = new Uint8Array(8);
    // 修复：用临时变量避免修改 counter
    let tempCounter = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = tempCounter & 0xff;
      tempCounter = Math.floor(tempCounter / 256);
    }

    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);

    const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
    const sigBytes = new Uint8Array(signature);

    const offset = sigBytes[sigBytes.length - 1] & 0x0f;
    const binary =
      ((sigBytes[offset] & 0x7f) << 24) |
      ((sigBytes[offset + 1] & 0xff) << 16) |
      ((sigBytes[offset + 2] & 0xff) << 8) |
      (sigBytes[offset + 3] & 0xff);

    const code = binary % Math.pow(10, digits);
    return code.toString().padStart(digits, '0');
  }

  /**
   * 验证 TOTP 码（支持前后30秒窗口）
   */
  async verify(code) {
    if (!code || code.length !== 6) return false;

    // 当前时间窗口
    const expected = await this.generateCode();
    if (code === expected) return true;

    // 检查前一个窗口（30秒前）
    const timeStep = 30;
    const now = Math.floor(Date.now() / 1000);
    const prevCounter = Math.floor((now - timeStep) / timeStep);

    // 临时修改时间验证前一个窗口
    const prevCode = await this._generateCodeForCounter(prevCounter);
    if (code === prevCode) return true;

    // 检查后一个窗口（30秒后）
    const nextCounter = Math.floor((now + timeStep) / timeStep);
    const nextCode = await this._generateCodeForCounter(nextCounter);
    if (code === nextCode) return true;

    return false;
  }

  /**
   * 为指定计数器生成TOTP码
   */
  async _generateCodeForCounter(counter) {
    if (!this.secret) return '';

    const digits = 6;
    const secretBytes = this._base32Decode(this.secret);

    const counterBytes = new Uint8Array(8);
    let tempCounter = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = tempCounter & 0xff;
      tempCounter = Math.floor(tempCounter / 256);
    }

    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);

    const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
    const sigBytes = new Uint8Array(signature);

    const offset = sigBytes[sigBytes.length - 1] & 0x0f;
    const binary =
      ((sigBytes[offset] & 0x7f) << 24) |
      ((sigBytes[offset + 1] & 0xff) << 16) |
      ((sigBytes[offset + 2] & 0xff) << 8) |
      (sigBytes[offset + 3] & 0xff);

    const code = binary % Math.pow(10, digits);
    return code.toString().padStart(digits, '0');
  }

  _base32Decode(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const result = [];
    let bits = 0;
    let value = 0;

    for (let i = 0; i < base32.length; i++) {
      const idx = alphabet.indexOf(base32[i].toUpperCase());
      if (idx === -1) continue;

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        result.push((value >> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }

    return new Uint8Array(result);
  }
}

export const totpManager = new TOTPManager();
