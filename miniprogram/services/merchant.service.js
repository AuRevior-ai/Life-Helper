const { CLOUD_FUNCTIONS } = require('../config/constants')
const { createActionService } = require('./_base.service')

module.exports = createActionService(CLOUD_FUNCTIONS.MERCHANT, [
  'applyMerchant',
  'getMyMerchantInfo',
  'getMerchantAuditStatus',
  'updateMerchantProfile',
  'getMerchantServiceList',
  'createMerchantService',
  'updateMerchantService',
  'enableMerchantService',
  'disableMerchantService',
  'getMerchantOrderList',
  'getMerchantOrderDetail',
  'merchantAcceptOrder',
  'merchantStartService',
  'merchantFinishService',
  'getStoreList',
  'getStoreDetail',
  'getStoreServices',
  'adminGetMerchantList',
  'adminGetMerchantDetail',
  'adminApproveMerchant',
  'adminRejectMerchant',
  'adminEnableMerchant',
  'adminDisableMerchant',
  'adminGetMerchantOrders',
  'adminGetMerchantActionLogs'
])
