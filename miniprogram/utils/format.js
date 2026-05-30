const { ORDER_STATUS_TEXT, PAY_STATUS_TEXT, WORKER_AUDIT_STATUS_TEXT } = require('../config/status')

function formatPrice(value) {
  const cents = Number.isFinite(Number(value)) ? Number(value) : 0
  return `¥${(cents / 100).toFixed(2)}`
}

function compactTextParts(parts) {
  return parts
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean)
}

function buildFullAddress(address = {}) {
  return compactTextParts([
    address.city,
    address.community,
    address.detail_address || address.detailAddress
  ]).join(' ')
}

function formatOrderStatus(status) {
  return ORDER_STATUS_TEXT[status] || '未知状态'
}

function formatPayStatus(status) {
  return PAY_STATUS_TEXT[status] || '未知状态'
}

function formatWorkerAuditStatus(status) {
  return WORKER_AUDIT_STATUS_TEXT[status] || '未知状态'
}

module.exports = {
  formatPrice,
  buildFullAddress,
  formatOrderStatus,
  formatPayStatus,
  formatWorkerAuditStatus
}
