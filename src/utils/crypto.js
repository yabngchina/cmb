// AES + RSA 加密工具
// 使用 Web Crypto API 实现

class CryptoManager {
  constructor() {
    this.aesKey = null;
    this.rsaPublicKey = null;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  // 生成 AES 密钥
  async generateAESKey() {
    this.aesKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    );
    return this.aesKey;
  }

  // 导出 AES 密钥
  async exportAESKey() {
    const exported = await crypto.subtle.exportKey('raw', this.aesKey);
    return this.arrayBufferToBase64(exported);
  }

  // 导入 AES 密钥
  async importAESKey(keyData) {
    const keyBuffer = this.base64ToArrayBuffer(keyData);
    this.aesKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    return this.aesKey;
  }

  // AES 加密
  async aesEncrypt(plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = this.encoder.encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.aesKey,
      encoded,
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return this.arrayBufferToBase64(combined.buffer);
  }

  // AES 解密
  async aesDecrypt(ciphertextBase64) {
    const combined = this.base64ToArrayBuffer(ciphertextBase64);
    const data = new Uint8Array(combined);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.aesKey,
      ciphertext,
    );
    return this.decoder.decode(decrypted);
  }

  // RSA 加密（使用公钥加密 AES 密钥）
  async rsaEncrypt(data) {
    const encoded = this.encoder.encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      this.rsaPublicKey,
      encoded,
    );
    return this.arrayBufferToBase64(encrypted);
  }

  // 设置 RSA 公钥
  async setRSAPublicKey(spkiBase64) {
    const keyData = this.base64ToArrayBuffer(spkiBase64);
    this.rsaPublicKey = await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt'],
    );
  }

  // 生成 RSA 密钥对（服务端使用）
  async generateRSAKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );
    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey),
    };
  }

  // RSA 解密（服务端使用）
  async rsaDecrypt(privateKeyBase64, ciphertextBase64) {
    const privateKeyData = this.base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt'],
    );
    const ciphertext = this.base64ToArrayBuffer(ciphertextBase64);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      ciphertext,
    );
    return this.decoder.decode(decrypted);
  }

  // 生成随机密码
  generateRandomPassword(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }
    return password;
  }

  // 工具方法
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const cryptoManager = new CryptoManager();

// 简化的加密验证流程
export async function encryptPassword(password, publicKey) {
  await cryptoManager.setRSAPublicKey(publicKey);
  const encrypted = await cryptoManager.rsaEncrypt(password);
  return encrypted;
}

export async function generateAuthToken(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':' + Date.now());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return cryptoManager.arrayBufferToBase64(hash);
}
