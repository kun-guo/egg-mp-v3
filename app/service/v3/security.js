'use strict';

const Service = require('egg').Service;
const crypto = require('crypto');
const { KEYUTIL, KJUR, hextob64, b64tohex } = require('jsrsasign');


class SecurityService extends Service {
  getToken({ mchId, serialNo, privateKey }, method, url, body) {
    const nonceStr = this.getNonceStr();
    const timestamp = parseInt(Date.now() / 1000);
    const message = this.buildMessage(method, url, timestamp, nonceStr, body);
    const signature = this.sign(privateKey, message);

    return 'mchid="' + mchId + '",'
            + 'nonce_str="' + nonceStr + '",'
            + 'timestamp="' + timestamp + '",'
            + 'serial_no="' + serialNo + '",'
            + 'signature="' + signature + '"';
  }

  getNonceStr() {
    return Math.random().toString(32).substr(2, 15);
  }

  sign(privateKey, inputString) {
    const key = KEYUTIL.getKey(privateKey);
    // 创建 Signature 对象，设置签名编码算法
    const signature = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' });
    // 初始化
    signature.init(key);
    // 传入待加密字符串
    signature.updateString(inputString);
    // 生成密文
    const originSign = signature.sign();
    const sign64 = hextob64(originSign);
    console.log('sign base64 =======', sign64);
    return sign64;
  }

  buildMessage(method, url, timestamp, nonceStr, body) {
    const canonicalUrl = encodeURIComponent(url);
    return method + '\n'
            + canonicalUrl + '\n'
            + timestamp + '\n'
            + nonceStr + '\n'
            + body + '\n';
  }

  buildResponse(timestamp, nonceStr, body) {
    return timestamp + '\n'
        + nonceStr + '\n'
        + body + '\n';
  }

  verify(publicKey, { timestamp, nonceStr, body }, target) {
    const token = this.buildResponse(timestamp, nonceStr, body);
    const signature = new KJUR.crypto.Signature({ alg: 'SHA256withRSA', prvkeypem: publicKey });

    signature.updateString(token); // 传入待签明文
    return signature.verify(b64tohex(target));
  }

  publicEncrypt(publicKey, data) {
    const buffer = Buffer.from(data, 'utf8'); // default  utf8
    return crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, buffer)
      .toString('base64');
  }
}

module.exports = SecurityService;
