const ORDER_SERVICE_SNAPSHOTS = [
  {
    _id: "svc_home_daily_clean",
    category_id: "cat_housekeeping",
    category_name: "家政保洁",
    name: "日常保洁",
    price: 9900,
    duration: "2小时",
    status: "on",
  },
  {
    _id: "svc_home_deep_clean",
    category_id: "cat_housekeeping",
    category_name: "家政保洁",
    name: "深度保洁",
    price: 19900,
    duration: "4小时",
    status: "on",
  },
  {
    _id: "svc_repair_water",
    category_id: "cat_repair",
    category_name: "维修服务",
    name: "水电检修",
    price: 6900,
    duration: "1小时起",
    status: "on",
  },
  {
    _id: "svc_repair_lock",
    category_id: "cat_repair",
    category_name: "维修服务",
    name: "门锁维修",
    price: 8900,
    duration: "1小时起",
    status: "on",
  },
  {
    _id: "svc_pet_walk",
    category_id: "cat_pet",
    category_name: "宠物服务",
    name: "宠物遛弯",
    price: 3900,
    duration: "30分钟",
    status: "on",
  },
  {
    _id: "svc_pet_feed",
    category_id: "cat_pet",
    category_name: "宠物服务",
    name: "上门喂养",
    price: 4900,
    duration: "30分钟",
    status: "on",
  },
];

function findServiceSnapshotById(serviceId) {
  return (
    ORDER_SERVICE_SNAPSHOTS.find(
      (service) => service._id === serviceId && service.status === "on",
    ) || null
  );
}

module.exports = {
  ORDER_SERVICE_SNAPSHOTS,
  findServiceSnapshotById,
};
