const addressService = require("../../services/address.service");
const areaService = require("../../services/area.service");
const { validateAddressForm } = require("../../utils/validator");
const { showError, showSuccess } = require("../../utils/toast");

const EMPTY_FORM = Object.freeze({
  contact_name: "",
  phone: "",
  service_area_id: "",
  city: "",
  district: "",
  street: "",
  community: "",
  detail_address: "",
  is_default: false,
});

Page({
  data: {
    title: "新增地址",
    addressId: "",
    form: {
      ...EMPTY_FORM,
    },
    areas: [],
    areaNames: [],
    selectedAreaIndex: -1,
    loading: false,
    saving: false,
  },

  onLoad(options = {}) {
    const addressId = options.addressId || "";
    this.setData({
      addressId,
      title: addressId ? "编辑地址" : "新增地址",
    });

    if (addressId) {
      this.loadAddress(addressId);
    }
    this.loadAreas();
  },

  async loadAreas() {
    try {
      const data = await areaService.getServiceAreaList();
      const areas = data.areas || [];
      this.setData({
        areas,
        areaNames: areas.map(
          (area) =>
            area.full_name ||
            `${area.city || ""} ${area.community || ""}`.trim(),
        ),
      });
    } catch (error) {
      showError(error.message || "服务区域加载失败");
    }
  },

  async loadAddress(addressId) {
    this.setData({ loading: true });
    try {
      const data = await addressService.getAddressList();
      const address = (data.addresses || []).find(
        (item) => item._id === addressId,
      );
      if (!address) {
        showError("地址不存在");
        return;
      }

      this.setData({
        form: {
          contact_name: address.contact_name || "",
          phone: address.phone || "",
          service_area_id: address.service_area_id || "",
          city: address.city || "",
          district: address.district || "",
          street: address.street || "",
          community: address.community || "",
          detail_address: address.detail_address || "",
          is_default: Boolean(address.is_default),
        },
      });
    } catch (error) {
      showError(error.message || "地址加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value,
    });
  },

  handleDefaultChange(event) {
    this.setData({
      "form.is_default": event.detail.value,
    });
  },

  onAreaChange(event) {
    const selectedAreaIndex = Number(event.detail.value || 0);
    const area = this.data.areas[selectedAreaIndex];
    if (!area) return;
    this.setData({
      selectedAreaIndex,
      "form.service_area_id": area._id,
      "form.city": area.city || "",
      "form.district": area.district || "",
      "form.street": area.street || "",
      "form.community": area.community || "",
    });
  },

  async handleSave() {
    const form = this.data.form;
    const validation = validateAddressForm(form);
    if (!validation.valid) {
      showError(validation.message || "请填写完整地址信息");
      return;
    }

    this.setData({ saving: true });
    try {
      if (this.data.addressId) {
        await addressService.updateAddress({
          addressId: this.data.addressId,
          ...form,
        });
      } else {
        await addressService.createAddress(form);
      }
      showSuccess("地址已保存");
      wx.navigateBack();
    } catch (error) {
      showError(error.message || "保存失败");
    } finally {
      this.setData({ saving: false });
    }
  },
});
