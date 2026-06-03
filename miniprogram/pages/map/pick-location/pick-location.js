const { showSuccess } = require("../../../utils/toast");

Page({
  data: {
    point: {
      latitude: 30.2741,
      longitude: 120.1551,
      map_address: "杭州市西湖区未来小区",
      map_poi_name: "未来小区东门",
      city: "杭州",
      district: "西湖区",
      adcode: "330106",
      map_point_source: "manual_pick",
    },
  },

  onInput(event) {
    this.setData({
      [`point.${event.currentTarget.dataset.field}`]: event.detail.value,
    });
  },

  confirmPoint() {
    const pages = getCurrentPages();
    const previous = pages[pages.length - 2];
    if (previous && previous.setData) {
      previous.setData({ pickedLocation: this.data.point });
    }
    showSuccess("位置已选择");
    wx.navigateBack();
  },
});
