const { CLOUD_FUNCTIONS } = require('../config/constants')
const { createActionService } = require('./_base.service')

module.exports = createActionService(CLOUD_FUNCTIONS.ADDRESS, [
  'getAddressList',
  'createAddress',
  'updateAddress',
  'deleteAddress',
  'setDefaultAddress'
])
