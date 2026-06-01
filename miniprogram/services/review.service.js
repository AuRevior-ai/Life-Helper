const { CLOUD_FUNCTIONS } = require('../config/constants')
const { createActionService } = require('./_base.service')

module.exports = createActionService(CLOUD_FUNCTIONS.REVIEW, [
  'createReview',
  'getReviewDetail',
  'addReviewFollowup',
  'workerReplyReview',
  'workerCreateReviewAppeal',
  'adminGetReviewList',
  'adminGetReviewDetail',
  'adminHideReview',
  'adminRestoreReview',
  'adminGetReviewAppealList',
  'adminGetReviewAppealDetail',
  'adminReviewAppeal',
  'getWorkerReviewList',
  'getOrderReview',
  'getServiceReviews',
  'getWorkerReviews'
])
