const APP_NAME = '同城便民'
const PRICE_UNIT = 'fen'
const DEFAULT_PAGE_SIZE = 20
const APPOINTMENT_TIME_SLOTS = Object.freeze([
  '09:00-11:00',
  '11:00-13:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00'
])

const CLOUD_FUNCTIONS = Object.freeze({
  LOGIN: 'login',
  USER: 'user',
  SERVICE: 'service',
  ADDRESS: 'address',
  ORDER: 'order',
  WORKER: 'worker',
  REVIEW: 'review',
  ADMIN: 'admin',
  MESSAGE: 'message',
  PAYMENT: 'payment',
  REFUND: 'refund',
  AREA: 'area',
  DISPATCH: 'dispatch',
  FINANCE: 'finance',
  PROMOTION: 'promotion',
  TIP: 'tip'
})

const COLLECTIONS = Object.freeze({
  USERS: 'users',
  SERVICE_CATEGORIES: 'service_categories',
  SERVICES: 'services',
  ADDRESSES: 'addresses',
  WORKERS: 'workers',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  MESSAGES: 'messages',
  PAYMENT_LOGS: 'payment_logs',
  AFTER_SALES: 'after_sales',
  REFUND_LOGS: 'refund_logs',
  SERVICE_AREAS: 'service_areas',
  DISPATCH_LOGS: 'dispatch_logs',
  FINANCE_LOGS: 'finance_logs',
  WORKER_EARNINGS: 'worker_earnings',
  MEMBER_PLANS: 'member_plans',
  USER_MEMBERSHIPS: 'user_memberships',
  COUPON_TEMPLATES: 'coupon_templates',
  USER_COUPONS: 'user_coupons',
  REVIEW_APPEALS: 'review_appeals',
  REVIEW_ACTION_LOGS: 'review_action_logs',
  TIP_LOGS: 'tip_logs'
})

module.exports = {
  APP_NAME,
  PRICE_UNIT,
  DEFAULT_PAGE_SIZE,
  APPOINTMENT_TIME_SLOTS,
  CLOUD_FUNCTIONS,
  COLLECTIONS
}
