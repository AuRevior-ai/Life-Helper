Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        icon: "home",
      },
      {
        pagePath: "/pages/order-list/order-list",
        text: "订单",
        icon: "order",
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        icon: "mine",
      },
    ],
  },

  methods: {
    switchTab(event) {
      const index = Number(event.currentTarget.dataset.index || 0);
      const item = this.data.list[index];
      if (!item || index === this.data.selected) {
        return;
      }

      wx.switchTab({
        url: item.pagePath,
      });
    },
  },
});
