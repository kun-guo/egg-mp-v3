'use strict';
const Service = require('egg').Service;

const BASE_URL = 'https://api.mch.weixin.qq.com/v3';
const API_APPLYMENT = `${BASE_URL}/applyment4sub/applyment/`;
const API_APPLYMENT_CODE_STATE = `${BASE_URL}/applyment4sub/applyment/business_code`;
const API_APPLYMENT_ID_STATE = `${BASE_URL}/applyment4sub/applyment/applyment_id`;
const API_MODIFY_SETTLEMENT = `${BASE_URL}/apply4sub/sub_merchants/{sub_mchid}/modify-settlement`;
const API_SETTLEMENT = `${BASE_URL}/apply4sub/sub_merchants/{sub_mchid}/settlement`;

class MPV3Service extends Service {
  async applyment({ publicKey, serialNo }, data) {
    const { service } = this;
    const {
      business_code,
      contact_info,
      subject_info,
      business_info,
      settlement_info,
      bank_account_info,
      addition_info,
    } = data;

    // encrypt all contact_info item
    Object.keys(contact_info).forEach(key => {
      contact_info[key] = service.v3.security.publicEncrypt(publicKey, contact_info[key]);
    });

    // 经营者/法人身份证件
    const { identity_info: { id_card_info: { id_card_name, id_card_number } } } = subject_info;
    subject_info.identity_info.id_card_info.id_card_name = service.v3.security.publicEncrypt(publicKey, id_card_name);
    subject_info.identity_info.id_card_info.id_card_number = service.v3.security.publicEncrypt(publicKey, id_card_number);

    // 结算银行账户
    const { account_name, account_number } = bank_account_info;
    bank_account_info.account_name = service.v3.security.publicEncrypt(publicKey, account_name);
    bank_account_info.account_number = service.v3.security.publicEncrypt(publicKey, account_number);

    const headers = { 'Wechatpay-Serial': serialNo };
    const { data: result } = await this.ctx.curl(API_APPLYMENT, {
      method: 'POST',
      dataType: 'json',
      headers,
      data: {
        business_code,
        contact_info,
        subject_info,
        business_info,
        settlement_info,
        bank_account_info,
        addition_info,
      },
    });
    return result;
  }

  async applymentState({ applyment_id, business_code }) {
    const url = applyment_id ? `${API_APPLYMENT_ID_STATE}/${applyment_id}` : `${API_APPLYMENT_CODE_STATE}/${business_code}`;
    const { data: result } = await this.ctx.curl(url, {
      method: 'GET',
      dataType: 'json',
    });
    return result;
  }

  async modifySettlement(sub_mchid, payload) {
    const url = API_MODIFY_SETTLEMENT.replace(/{sub_mchid}/g, sub_mchid);
    const { data: result } = await this.ctx.curl(url, {
      method: 'POST',
      dataType: 'json',
      data: payload,
    });
    return result;
  }

  async settlement(sub_mchid) {
    const url = API_SETTLEMENT.replace(/{sub_mchid}/g, sub_mchid);
    const { data: result } = await this.ctx.curl(url, {
      method: 'GET',
      dataType: 'json',
    });
    return result;
  }
}

module.exports = MPV3Service;
