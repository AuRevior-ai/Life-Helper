const { formatPrice, formatOrderStatus } = require('../../utils/format')

Component({
  properties: {
    order: {
      type: Object,
      value: {}
    }
  },

  data: {
    priceText: '¥0.00',
    statusText: '未知状态'
  },

  observers: {
    'order.price, order.status': function updateDisplayText(price, status) {
      this.setData({
        priceText: formatPrice(price),
        statusText: formatOrderStatus(status)
      })
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('select', this.properties.order)
    }
  }
})
