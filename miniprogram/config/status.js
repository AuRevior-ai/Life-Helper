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
  PAYING: 'paying',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
})

const PAY_STATUS_TEXT = Object.freeze({
  [PAY_STATUS.UNPAID]: '未支付',
  [PAY_STATUS.PAYING]: '支付中',
  [PAY_STATUS.PAID]: '已支付',
  [PAY_STATUS.FAILED]: '支付失败',
  [PAY_STATUS.REFUNDED]: '已退款'
})

const AFTER_SALE_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
  REFUNDED: 'refunded'
})

const AFTER_SALE_STATUS_TEXT = Object.freeze({
  [AFTER_SALE_STATUS.NONE]: '无售后',
  [AFTER_SALE_STATUS.PENDING]: '售后待审核',
  [AFTER_SALE_STATUS.APPROVED]: '售后已通过',
  [AFTER_SALE_STATUS.REJECTED]: '售后未通过',
  [AFTER_SALE_STATUS.CANCELED]: '售后已取消',
  [AFTER_SALE_STATUS.REFUNDED]: '已退款'
})

const AFTER_SALE_TYPE = Object.freeze({
  REFUND_ONLY: 'refund_only',
  CANCEL_AND_REFUND: 'cancel_and_refund'
})

const AFTER_SALE_TYPE_TEXT = Object.freeze({
  [AFTER_SALE_TYPE.REFUND_ONLY]: '仅退款',
  [AFTER_SALE_TYPE.CANCEL_AND_REFUND]: '取消并退款'
})

const REFUND_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  MOCK_SUCCESS: 'mock_success'
})

const REFUND_STATUS_TEXT = Object.freeze({
  [REFUND_STATUS.NONE]: '未退款',
  [REFUND_STATUS.PENDING]: '退款处理中',
  [REFUND_STATUS.SUCCESS]: '退款成功',
  [REFUND_STATUS.FAILED]: '退款失败',
  [REFUND_STATUS.MOCK_SUCCESS]: '模拟退款成功'
})

const REFUND_CHANNEL = Object.freeze({
  MOCK: 'mock',
  WECHAT: 'wechat'
})

const SERVICE_AREA_STATUS = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled'
})

const SERVICE_AREA_STATUS_TEXT = Object.freeze({
  [SERVICE_AREA_STATUS.ENABLED]: '启用',
  [SERVICE_AREA_STATUS.DISABLED]: '禁用'
})

const WORKER_ONLINE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  PAUSED: 'paused',
  BUSY: 'busy'
})

const WORKER_ONLINE_STATUS_TEXT = Object.freeze({
  [WORKER_ONLINE_STATUS.AVAILABLE]: '可接单',
  [WORKER_ONLINE_STATUS.PAUSED]: '暂停接单',
  [WORKER_ONLINE_STATUS.BUSY]: '忙碌中'
})

const DISPATCH_ACTION = Object.freeze({
  WORKER_ACCEPT: 'worker_accept',
  ADMIN_ASSIGN: 'admin_assign',
  ADMIN_UNASSIGN: 'admin_unassign',
  ORDER_REFLOW: 'order_reflow'
})

const DISPATCH_ACTION_TEXT = Object.freeze({
  [DISPATCH_ACTION.WORKER_ACCEPT]: '师傅接单',
  [DISPATCH_ACTION.ADMIN_ASSIGN]: '管理员指派',
  [DISPATCH_ACTION.ADMIN_UNASSIGN]: '取消指派',
  [DISPATCH_ACTION.ORDER_REFLOW]: '订单回流'
})

const FINANCE_LOG_TYPE = Object.freeze({
  ORDER_INCOME: 'order_income',
  PLATFORM_COMMISSION: 'platform_commission',
  WORKER_EARNING: 'worker_earning',
  REFUND_REVERSE: 'refund_reverse',
  EARNING_REVERSE: 'earning_reverse',
  MANUAL_ADJUST: 'manual_adjust'
})

const FINANCE_LOG_TYPE_TEXT = Object.freeze({
  [FINANCE_LOG_TYPE.ORDER_INCOME]: '订单收入',
  [FINANCE_LOG_TYPE.PLATFORM_COMMISSION]: '平台服务费',
  [FINANCE_LOG_TYPE.WORKER_EARNING]: '师傅收益',
  [FINANCE_LOG_TYPE.REFUND_REVERSE]: '退款回冲',
  [FINANCE_LOG_TYPE.EARNING_REVERSE]: '收益冲回',
  [FINANCE_LOG_TYPE.MANUAL_ADJUST]: '人工处理'
})

const FINANCE_LOG_DIRECTION = Object.freeze({
  IN: 'in',
  OUT: 'out',
  REVERSE: 'reverse'
})

const FINANCE_LOG_DIRECTION_TEXT = Object.freeze({
  [FINANCE_LOG_DIRECTION.IN]: '入账',
  [FINANCE_LOG_DIRECTION.OUT]: '出账',
  [FINANCE_LOG_DIRECTION.REVERSE]: '回冲'
})

const WORKER_EARNING_STATUS = Object.freeze({
  FROZEN: 'frozen',
  SETTLEABLE: 'settleable',
  SETTLED: 'settled',
  REVERSED: 'reversed',
  PENDING_MANUAL: 'pending_manual'
})

const WORKER_EARNING_STATUS_TEXT = Object.freeze({
  [WORKER_EARNING_STATUS.FROZEN]: '冻结中',
  [WORKER_EARNING_STATUS.SETTLEABLE]: '可结算',
  [WORKER_EARNING_STATUS.SETTLED]: '已结算',
  [WORKER_EARNING_STATUS.REVERSED]: '已冲回',
  [WORKER_EARNING_STATUS.PENDING_MANUAL]: '需人工处理'
})

const SETTLEMENT_STATUS = Object.freeze({
  NOT_SETTLED: 'not_settled',
  SETTLEABLE: 'settleable',
  SETTLED: 'settled',
  REVERSED: 'reversed'
})

const SETTLEMENT_STATUS_TEXT = Object.freeze({
  [SETTLEMENT_STATUS.NOT_SETTLED]: '未结算',
  [SETTLEMENT_STATUS.SETTLEABLE]: '可结算',
  [SETTLEMENT_STATUS.SETTLED]: '已结算',
  [SETTLEMENT_STATUS.REVERSED]: '已冲回'
})

const MEMBER_LEVEL = Object.freeze({
  NONE: 'none',
  MONTHLY: 'monthly',
  SEASONLY: 'seasonly',
  YEARLY: 'yearly'
})

const MEMBER_LEVEL_TEXT = Object.freeze({
  [MEMBER_LEVEL.NONE]: '非会员',
  [MEMBER_LEVEL.MONTHLY]: '月卡',
  [MEMBER_LEVEL.SEASONLY]: '季卡',
  [MEMBER_LEVEL.YEARLY]: '年卡'
})

const MEMBER_STATUS = Object.freeze({
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  DISABLED: 'disabled'
})

const MEMBER_STATUS_TEXT = Object.freeze({
  [MEMBER_STATUS.INACTIVE]: '未开通',
  [MEMBER_STATUS.ACTIVE]: '生效中',
  [MEMBER_STATUS.EXPIRED]: '已过期',
  [MEMBER_STATUS.DISABLED]: '已停用'
})

const COUPON_TYPE = Object.freeze({
  AMOUNT_OFF: 'amount_off',
  DISCOUNT: 'discount',
  FULL_REDUCTION: 'full_reduction'
})

const COUPON_TYPE_TEXT = Object.freeze({
  [COUPON_TYPE.AMOUNT_OFF]: '立减券',
  [COUPON_TYPE.DISCOUNT]: '折扣券',
  [COUPON_TYPE.FULL_REDUCTION]: '满减券'
})

const COUPON_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  EXPIRED: 'expired'
})

const COUPON_STATUS_TEXT = Object.freeze({
  [COUPON_STATUS.DRAFT]: '草稿',
  [COUPON_STATUS.ACTIVE]: '启用',
  [COUPON_STATUS.DISABLED]: '停用',
  [COUPON_STATUS.EXPIRED]: '已过期'
})

const USER_COUPON_STATUS = Object.freeze({
  UNUSED: 'unused',
  USED: 'used',
  EXPIRED: 'expired',
  LOCKED: 'locked'
})

const USER_COUPON_STATUS_TEXT = Object.freeze({
  [USER_COUPON_STATUS.UNUSED]: '未使用',
  [USER_COUPON_STATUS.USED]: '已使用',
  [USER_COUPON_STATUS.EXPIRED]: '已过期',
  [USER_COUPON_STATUS.LOCKED]: '已锁定'
})

const PROMOTION_SOURCE = Object.freeze({
  NONE: 'none',
  MEMBER: 'member',
  COUPON: 'coupon',
  MEMBER_AND_COUPON: 'member_and_coupon'
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

const MESSAGE_TYPE = Object.freeze({
  ORDER_CREATED: 'order_created',
  ORDER_ACCEPTED: 'order_accepted',
  SERVICE_STARTED: 'service_started',
  SERVICE_FINISHED: 'service_finished',
  ORDER_COMPLETED: 'order_completed',
  AFTER_SALE_CREATED: 'after_sale_created',
  AFTER_SALE_APPROVED: 'after_sale_approved',
  AFTER_SALE_REJECTED: 'after_sale_rejected',
  REFUND_SUCCESS: 'refund_success',
  REFUND_FAILED: 'refund_failed',
  WORKER_APPROVED: 'worker_approved',
  WORKER_REJECTED: 'worker_rejected',
  SYSTEM: 'system'
})

const MESSAGE_TYPE_TEXT = Object.freeze({
  [MESSAGE_TYPE.ORDER_CREATED]: '订单已提交',
  [MESSAGE_TYPE.ORDER_ACCEPTED]: '师傅已接单',
  [MESSAGE_TYPE.SERVICE_STARTED]: '服务已开始',
  [MESSAGE_TYPE.SERVICE_FINISHED]: '服务已完成',
  [MESSAGE_TYPE.ORDER_COMPLETED]: '订单已完成',
  [MESSAGE_TYPE.AFTER_SALE_CREATED]: '售后已提交',
  [MESSAGE_TYPE.AFTER_SALE_APPROVED]: '售后已通过',
  [MESSAGE_TYPE.AFTER_SALE_REJECTED]: '售后未通过',
  [MESSAGE_TYPE.REFUND_SUCCESS]: '退款成功',
  [MESSAGE_TYPE.REFUND_FAILED]: '退款失败',
  [MESSAGE_TYPE.WORKER_APPROVED]: '审核通过',
  [MESSAGE_TYPE.WORKER_REJECTED]: '审核未通过',
  [MESSAGE_TYPE.SYSTEM]: '系统消息'
})

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PAY_STATUS,
  PAY_STATUS_TEXT,
  AFTER_SALE_STATUS,
  AFTER_SALE_STATUS_TEXT,
  AFTER_SALE_TYPE,
  AFTER_SALE_TYPE_TEXT,
  REFUND_STATUS,
  REFUND_STATUS_TEXT,
  REFUND_CHANNEL,
  SERVICE_AREA_STATUS,
  SERVICE_AREA_STATUS_TEXT,
  WORKER_ONLINE_STATUS,
  WORKER_ONLINE_STATUS_TEXT,
  DISPATCH_ACTION,
  DISPATCH_ACTION_TEXT,
  FINANCE_LOG_TYPE,
  FINANCE_LOG_TYPE_TEXT,
  FINANCE_LOG_DIRECTION,
  FINANCE_LOG_DIRECTION_TEXT,
  WORKER_EARNING_STATUS,
  WORKER_EARNING_STATUS_TEXT,
  SETTLEMENT_STATUS,
  SETTLEMENT_STATUS_TEXT,
  MEMBER_LEVEL,
  MEMBER_LEVEL_TEXT,
  MEMBER_STATUS,
  MEMBER_STATUS_TEXT,
  COUPON_TYPE,
  COUPON_TYPE_TEXT,
  COUPON_STATUS,
  COUPON_STATUS_TEXT,
  USER_COUPON_STATUS,
  USER_COUPON_STATUS_TEXT,
  PROMOTION_SOURCE,
  WORKER_AUDIT_STATUS,
  WORKER_AUDIT_STATUS_TEXT,
  COMMON_STATUS,
  MESSAGE_TYPE,
  MESSAGE_TYPE_TEXT
}
