const areaService = require("../../../services/area.service");
const { showError, showSuccess } = require("../../../utils/toast");

const EMPTY_FORM = Object.freeze({
  city: "",
  district: "",
  street: "",
  community: "",
  latitude: "",
  longitude: "",
  adcode: "",
  map_address: "",
  map_poi_name: "",
  sort: 0,
});

Page({
  data: {
    title: "新增区域",
    areaId: "",
    form: { ...EMPTY_FORM },
    loading: false,
    errorText: "",
    saving: false,
  },

  onLoad(options = {}) {
    const areaId = options.areaId || "";
    this.setData({
      areaId,
      title: areaId ? "编辑区域" : "新增区域",
    });
    if (areaId) this.loadArea(areaId);
  },

  async loadArea(areaId) {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await areaService.getServiceAreaList({
        includeDisabled: true,
      });
      const area = (data.areas || []).find((item) => item._id === areaId);
      if (!area) {
        this.setData({ errorText: "区域不存在" });
        showError("区域不存在");
        return;
      }
      this.setData({
        form: {
          city: area.city || "",
          district: area.district || "",
          street: area.street || "",
          community: area.community || "",
          latitude: area.latitude ?? area.center_latitude ?? "",
          longitude: area.longitude ?? area.center_longitude ?? "",
          adcode: area.adcode || "",
          map_address: area.map_address || "",
          map_poi_name: area.map_poi_name || "",
          sort: area.sort || 0,
        },
      });
    } catch (error) {
      const errorText = error.message || "区域加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  async handleSave() {
    const form = this.data.form;
    if (!form.city.trim() || !form.community.trim()) {
      showError("请填写城市和小区");
      return;
    }
    this.setData({ saving: true });
    try {
      if (this.data.areaId) {
        await areaService.adminUpdateServiceArea({
          areaId: this.data.areaId,
          ...form,
        });
      } else {
        await areaService.adminCreateServiceArea(form);
      }
      showSuccess("区域已保存");
      wx.navigateBack();
    } catch (error) {
      showError(error.message || "保存失败");
    } finally {
      this.setData({ saving: false });
    }
  },
});
