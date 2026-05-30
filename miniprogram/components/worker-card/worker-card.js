Component({
  properties: {
    worker: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('select', this.properties.worker)
    }
  }
})
