const { formatPrice } = require('../../utils/format')

Component({
  properties: {
    service: {
      type: Object,
      value: {}
    }
  },

  data: {
    priceText: '¥0.00'
  },

  observers: {
    'service.price': function updatePriceText(price) {
      this.setData({
        priceText: formatPrice(price)
      })
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('select', this.properties.service)
    }
  }
})
