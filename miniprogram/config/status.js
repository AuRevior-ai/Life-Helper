const ORDER_STATUS = Object.freeze({
  PENDING_PAY: 'pending_pay',
  PENDING_ACCEPT: 'pending_accept',
  ACCEPTED: 'accepted',
  SERVING: 'serving',
  PENDING_REVIEW: 'pending_review',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
})

const ORDER_STATUS_TEXT = Object.freeze({
  [ORDER_STATUS.PENDING_PAY]: '待付款',
  [ORDER_STATUS.PENDING_ACCEPT]: '待接单',
  [ORDER_STATUS.ACCEPTED]: '已接单',
  [ORDER_STATUS.SERVING]: '服务中',
  [ORDER_STATUS.PENDING_REVIEW]: '待评价',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELED]: '已取消'
})

const PAY_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid'
})

const PAY_STATUS_TEXT = Object.freeze({
  [PAY_STATUS.UNPAID]: '未支付',
  [PAY_STATUS.PAID]: '已支付'
})

const WORKER_AUDIT_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
})

const WORKER_AUDIT_STATUS_TEXT = Object.freeze({
  [WORKER_AUDIT_STATUS.PENDING]: '待审核',
  [WORKER_AUDIT_STATUS.APPROVED]: '已通过',
  [WORKER_AUDIT_STATUS.REJECTED]: '已拒绝'
})

const COMMON_STATUS = Object.freeze({
  NORMAL: 'normal',
  DISABLED: 'disabled',
  ENABLED: 'enabled',
  ON: 'on',
  OFF: 'off'
})

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PAY_STATUS,
  PAY_STATUS_TEXT,
  WORKER_AUDIT_STATUS,
  WORKER_AUDIT_STATUS_TEXT,
  COMMON_STATUS
}
