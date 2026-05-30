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
  MESSAGE: 'message'
})

const COLLECTIONS = Object.freeze({
  USERS: 'users',
  SERVICE_CATEGORIES: 'service_categories',
  SERVICES: 'services',
  ADDRESSES: 'addresses',
  WORKERS: 'workers',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  MESSAGES: 'messages'
})

module.exports = {
  APP_NAME,
  PRICE_UNIT,
  DEFAULT_PAGE_SIZE,
  APPOINTMENT_TIME_SLOTS,
  CLOUD_FUNCTIONS,
  COLLECTIONS
}
