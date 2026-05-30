const addressService = require('../../services/address.service')
const orderService = require('../../services/order.service')
const serviceService = require('../../services/service.service')
const { APPOINTMENT_TIME_SLOTS } = require('../../config/constants')
const { formatPrice, buildFullAddress } = require('../../utils/format')
const { hideLoading, showError, showLoading, showSuccess } = require('../../utils/toast')

Page({
  data: {
    title: '提交订单',
    serviceId: '',
    service: null,
    priceText: '¥0.00',
    addresses: [],
    selectedAddressId: '',
    selectedAddress: null,
    selectedAddressText: '',
    appointmentDate: '',
    appointmentSlot: '',
    appointmentSlots: APPOINTMENT_TIME_SLOTS,
    appointmentSlotIndex: 0,
    minAppointmentDate: '',
    appointment_time: '',
    remark: '',
    loading: true,
    submitting: false
  },

  onLoad(options = {}) {
    const minAppointmentDate = this.getTodayDate()
    this.setData({
      serviceId: options.serviceId || '',
      minAppointmentDate,
      appointmentDate: minAppointmentDate,
      appointmentSlot: APPOINTMENT_TIME_SLOTS[0],
      appointment_time: `${minAppointmentDate} ${APPOINTMENT_TIME_SLOTS[0]}`
    })
    this.loadPageData()
  },

  onShow() {
    if (this.data.serviceId && !this.data.loading) {
      this.loadAddressList()
    }
  },

  async loadPageData() {
    if (!this.data.serviceId) {
      this.setData({ loading: false })
      showError('缺少服务 ID')
      return
    }

    this.setData({ loading: true })
    try {
      const [serviceData, addressData] = await Promise.all([
        serviceService.getServiceDetail({ serviceId: this.data.serviceId }),
        addressService.getAddressList()
      ])
      this.applyService(serviceData.service)
      this.applyAddresses(addressData.addresses || [])
    } catch (error) {
      showError(error.message || '下单信息加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadAddressList() {
    try {
      const data = await addressService.getAddressList()
      this.applyAddresses(data.addresses || [])
    } catch (error) {
      showError(error.message || '地址加载失败')
    }
  },

  applyService(service) {
    this.setData({
      service,
      priceText: formatPrice(service.price)
    })
  },

  applyAddresses(addresses) {
    const selectedAddress = this.findSelectedAddress(addresses)
    this.setData({
      addresses,
      selectedAddress,
      selectedAddressId: selectedAddress ? selectedAddress._id : '',
      selectedAddressText: selectedAddress ? buildFullAddress(selectedAddress) : ''
    })
  },

  findSelectedAddress(addresses) {
    if (!addresses.length) return null
    const previous = addresses.find((address) => address._id === this.data.selectedAddressId)
    if (previous) return previous
    return addresses.find((address) => address.is_default) || addresses[0]
  },

  selectAddress(event) {
    const addressId = event.currentTarget.dataset.id
    const selectedAddress = this.data.addresses.find((address) => address._id === addressId)
    this.setData({
      selectedAddressId: addressId,
      selectedAddress,
      selectedAddressText: selectedAddress ? buildFullAddress(selectedAddress) : ''
    })
  },

  goAddAddress() {
    wx.navigateTo({
      url: '/pages/address-edit/address-edit'
    })
  },

  getTodayDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = `${now.getMonth() + 1}`.padStart(2, '0')
    const day = `${now.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  refreshAppointmentTime() {
    this.setData({
      appointment_time: `${this.data.appointmentDate} ${this.data.appointmentSlot}`
    })
  },

  handleAppointmentDateChange(event) {
    this.setData({
      appointmentDate: event.detail.value
    })
    this.refreshAppointmentTime()
  },

  handleAppointmentSlotChange(event) {
    const appointmentSlotIndex = Number(event.detail.value || 0)
    this.setData({
      appointmentSlotIndex,
      appointmentSlot: this.data.appointmentSlots[appointmentSlotIndex]
    })
    this.refreshAppointmentTime()
  },

  handleRemarkInput(event) {
    this.setData({
      remark: event.detail.value
    })
  },

  async handleSubmit() {
    if (!this.data.selectedAddressId) {
      showError('请先添加服务地址')
      return
    }

    if (!this.data.appointmentDate || !this.data.appointmentSlot) {
      showError('请选择预约时间')
      return
    }

    this.setData({ submitting: true })
    showLoading('提交中')
    try {
      const data = await orderService.createOrder({
        serviceId: this.data.serviceId,
        addressId: this.data.selectedAddressId,
        appointmentDate: this.data.appointmentDate,
        appointmentSlot: this.data.appointmentSlot,
        appointment_time: this.data.appointment_time,
        remark: this.data.remark
      })
      showSuccess('订单已创建')
      wx.redirectTo({
        url: `/pages/order-detail/order-detail?orderId=${data.order._id}`
      })
    } catch (error) {
      showError(error.message || '提交失败')
    } finally {
      hideLoading()
      this.setData({ submitting: false })
    }
  }
})
