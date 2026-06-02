const addressService = require('../../services/address.service')
const orderService = require('../../services/order.service')
const promotionService = require('../../services/promotion.service')
const serviceService = require('../../services/service.service')
const merchantService = require('../../services/merchant.service')
const { APPOINTMENT_TIME_SLOTS } = require('../../config/constants')
const { formatPrice, buildFullAddress } = require('../../utils/format')
const { hideLoading, showError, showLoading, showSuccess } = require('../../utils/toast')

Page({
  data: {
    title: '提交订单',
    serviceId: '',
    merchantServiceId: '',
    service: null,
    priceText: '¥0.00',
    originalAmountText: '¥0.00',
    memberDiscountText: '-¥0.00',
    couponDiscountText: '-¥0.00',
    payableAmountText: '¥0.00',
    availableCoupons: [],
    couponLabels: ['不使用优惠券'],
    selectedCouponIndex: 0,
    selectedCouponId: '',
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
    loadError: '',
    loading: true,
    submitting: false
  },

  onLoad(options = {}) {
    const minAppointmentDate = this.getTodayDate()
    this.setData({
      serviceId: options.serviceId || '',
      merchantServiceId: options.merchantServiceId || '',
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
    if (!this.data.serviceId && !this.data.merchantServiceId) {
      this.setData({ loading: false, loadError: '缺少服务 ID' })
      showError('缺少服务 ID')
      return
    }

    this.setData({ loading: true, loadError: '' })
    try {
      const serviceLoader = this.data.merchantServiceId
        ? this.loadMerchantServiceSnapshot()
        : serviceService.getServiceDetail({ serviceId: this.data.serviceId })
      const [serviceData, addressData] = await Promise.all([
        serviceLoader,
        addressService.getAddressList()
      ])
      this.applyService(serviceData.service)
      this.applyAddresses(addressData.addresses || [])
    } catch (error) {
      this.setData({ service: null, loadError: error.message || '下单信息加载失败' })
      showError(error.message || '下单信息加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadMerchantServiceSnapshot() {
    const data = await merchantService.getStoreServices({ merchantServiceId: this.data.merchantServiceId })
    const service = (data.services || []).find((item) => item._id === this.data.merchantServiceId) || data.service
    return {
      service: {
        _id: service.service_id,
        name: service.service_name,
        category_id: service.category_id,
        category_name: service.category_name,
        price: service.price,
        duration: service.duration
      }
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
      priceText: formatPrice(service.price),
      originalAmountText: formatPrice(service.price),
      payableAmountText: formatPrice(service.price),
      loadError: ''
    })
    this.loadPromotionPreview()
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

  async loadPromotionPreview() {
    if (!this.data.service) return
    try {
      const couponData = await promotionService.getAvailableCouponsForOrder({
        service: this.data.service
      })
      const availableCoupons = couponData.coupons || []
      const couponLabels = ['不使用优惠券'].concat(availableCoupons.map((coupon) => coupon.coupon_name || coupon.name))
      this.setData({ availableCoupons, couponLabels })
      await this.refreshPromotionAmount()
    } catch (error) {
      this.setData({ availableCoupons: [], couponLabels: ['不使用优惠券'] })
    }
  },

  async refreshPromotionAmount() {
    if (!this.data.service) return
    try {
      const data = await promotionService.calculateOrderPromotion({
        service: this.data.service,
        userCouponId: this.data.selectedCouponId
      })
      this.setData({
        originalAmountText: formatPrice(data.original_amount || this.data.service.price),
        memberDiscountText: `-${formatPrice(data.member_discount_amount || 0)}`,
        couponDiscountText: `-${formatPrice(data.coupon_discount_amount || 0)}`,
        payableAmountText: formatPrice(data.payable_amount || this.data.service.price)
      })
    } catch (error) {
      this.setData({
        payableAmountText: formatPrice(this.data.service.price)
      })
    }
  },

  handleCouponChange(event) {
    const selectedCouponIndex = Number(event.detail.value || 0)
    const selectedCoupon = selectedCouponIndex > 0
      ? this.data.availableCoupons[selectedCouponIndex - 1]
      : null
    this.setData({
      selectedCouponIndex,
      selectedCouponId: selectedCoupon ? selectedCoupon._id : ''
    })
    this.refreshPromotionAmount()
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
        merchantServiceId: this.data.merchantServiceId,
        addressId: this.data.selectedAddressId,
        appointmentDate: this.data.appointmentDate,
        appointmentSlot: this.data.appointmentSlot,
        appointment_time: this.data.appointment_time,
        userCouponId: this.data.selectedCouponId,
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
