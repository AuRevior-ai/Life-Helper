const APP_NAME = '同城便民'
const PRICE_UNIT = 'fen'
const DEFAULT_PAGE_SIZE = 20

const CLOUD_FUNCTIONS = Object.freeze({
  LOGIN: 'login',
  USER: 'user',
  SERVICE: 'service',
  ADDRESS: 'address',
  ORDER: 'order',
  WORKER: 'worker',
  REVIEW: 'review',
  ADMIN: 'admin'
})

const COLLECTIONS = Object.freeze({
  USERS: 'users',
  SERVICE_CATEGORIES: 'service_categories',
  SERVICES: 'services',
  ADDRESSES: 'addresses',
  WORKERS: 'workers',
  ORDERS: 'orders',
  REVIEWS: 'reviews'
})

module.exports = {
  APP_NAME,
  PRICE_UNIT,
  DEFAULT_PAGE_SIZE,
  CLOUD_FUNCTIONS,
  COLLECTIONS
}
