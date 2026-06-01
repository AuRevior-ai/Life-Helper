const workerService = require('../../../services/worker.service')
const { WORKER_ONLINE_STATUS, WORKER_ONLINE_STATUS_TEXT } = require('../../../config/status')
const { showError, showSuccess } = require('../../../utils/toast')

const STATUS_OPTIONS = [
  WORKER_ONLINE_STATUS.AVAILABLE,
  WORKER_ONLINE_STATUS.PAUSED,
  WORKER_ONLINE_STATUS.BUSY
]

Page({
  data: {
    title: '师傅中心',
    worker: null,
    online_status: WORKER_ONLINE_STATUS.AVAILABLE,
    onlineStatusText: WORKER_ONLINE_STATUS_TEXT[WORKER_ONLINE_STATUS.AVAILABLE],
    statusLabels: STATUS_OPTIONS.map((status) => WORKER_ONLINE_STATUS_TEXT[status]),
    selectedStatusIndex: 0
  },

  onShow() {
    this.loadWorker()
  },

  async loadWorker() {
    try {
      const data = await workerService.getWorkerInfo()
      const worker = data.worker || {}
      const onlineStatus = worker.online_status || WORKER_ONLINE_STATUS.AVAILABLE
      const selectedStatusIndex = Math.max(STATUS_OPTIONS.indexOf(onlineStatus), 0)
      this.setData({
        worker,
        online_status: onlineStatus,
        onlineStatusText: WORKER_ONLINE_STATUS_TEXT[onlineStatus],
        selectedStatusIndex
      })
    } catch (error) {
      showError(error.message || '师傅信息加载失败')
    }
  },

  async onOnlineStatusChange(event) {
    const selectedStatusIndex = Number(event.detail.value || 0)
    const onlineStatus = STATUS_OPTIONS[selectedStatusIndex]
    try {
      await workerService.updateWorkerOnlineStatus({
        online_status: onlineStatus
      })
      this.setData({
        selectedStatusIndex,
        online_status: onlineStatus,
        onlineStatusText: WORKER_ONLINE_STATUS_TEXT[onlineStatus]
      })
      showSuccess('接单状态已更新')
    } catch (error) {
      showError(error.message || '状态更新失败')
    }
  },

  goMessageList() {
    wx.navigateTo({
      url: '/pages/message-list/message-list'
    })
  },

  goReviewList() {
    wx.navigateTo({
      url: '/pages/worker/review-list/review-list'
    })
  }
})
