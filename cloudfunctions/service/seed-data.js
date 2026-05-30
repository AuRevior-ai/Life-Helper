const SERVICE_CATEGORIES = Object.freeze([
  {
    _id: 'cat_housekeeping',
    name: '家政保洁',
    icon: '家',
    sort: 1,
    status: 'enabled',
    description: '日常保洁、深度清洁、厨房卫生间清洗'
  },
  {
    _id: 'cat_repair',
    name: '维修服务',
    icon: '修',
    sort: 2,
    status: 'enabled',
    description: '水电、门锁、家电等常见上门维修'
  },
  {
    _id: 'cat_pet',
    name: '宠物服务',
    icon: '宠',
    sort: 3,
    status: 'enabled',
    description: '遛宠、喂养、基础照看'
  }
])

const SERVICES = Object.freeze([
  {
    _id: 'svc_home_daily_clean',
    category_id: 'cat_housekeeping',
    category_name: '家政保洁',
    name: '日常保洁',
    price: 9900,
    duration: '2小时',
    cover_image: '',
    description: '适合日常家庭清洁，包含客厅、卧室、厨房台面和卫生间基础清理。',
    flow_steps: ['确认服务面积与重点区域', '师傅按预约时间上门', '完成清洁后用户验收'],
    status: 'on',
    recommended: true,
    sort: 1
  },
  {
    _id: 'svc_home_deep_clean',
    category_id: 'cat_housekeeping',
    category_name: '家政保洁',
    name: '深度保洁',
    price: 19900,
    duration: '4小时',
    cover_image: '',
    description: '适合入住前、节前或长期未深度打扫的家庭场景。',
    flow_steps: ['沟通清洁范围', '重点处理油污和积尘', '用户验收并评价'],
    status: 'on',
    recommended: false,
    sort: 2
  },
  {
    _id: 'svc_repair_water',
    category_id: 'cat_repair',
    category_name: '维修服务',
    name: '水电检修',
    price: 6900,
    duration: '1小时起',
    cover_image: '',
    description: '处理漏水、开关插座、灯具等常见水电问题，材料费另计。',
    flow_steps: ['用户描述故障', '师傅上门排查', '确认方案后维修'],
    status: 'on',
    recommended: true,
    sort: 1
  },
  {
    _id: 'svc_repair_lock',
    category_id: 'cat_repair',
    category_name: '维修服务',
    name: '门锁维修',
    price: 8900,
    duration: '1小时起',
    cover_image: '',
    description: '处理门锁卡顿、把手松动、锁芯更换等基础维修事项。',
    flow_steps: ['确认门锁类型', '师傅携带工具上门', '维修完成后测试开合'],
    status: 'on',
    recommended: false,
    sort: 2
  },
  {
    _id: 'svc_pet_walk',
    category_id: 'cat_pet',
    category_name: '宠物服务',
    name: '宠物遛弯',
    price: 3900,
    duration: '30分钟',
    cover_image: '',
    description: '适合工作日或临时外出时的宠物短时遛弯服务。',
    flow_steps: ['确认宠物习惯和牵引用品', '按预约时间上门接宠', '完成后反馈照片和状态'],
    status: 'on',
    recommended: true,
    sort: 1
  },
  {
    _id: 'svc_pet_feed',
    category_id: 'cat_pet',
    category_name: '宠物服务',
    name: '上门喂养',
    price: 4900,
    duration: '30分钟',
    cover_image: '',
    description: '短期出行时提供上门喂食、换水和基础查看。',
    flow_steps: ['确认喂养要求', '师傅上门服务', '反馈宠物状态'],
    status: 'on',
    recommended: false,
    sort: 2
  },
  {
    _id: 'svc_pet_bath_future',
    category_id: 'cat_pet',
    category_name: '宠物服务',
    name: '宠物洗护',
    price: 0,
    duration: '待开放',
    cover_image: '',
    description: '后续版本开放。',
    flow_steps: [],
    status: 'off',
    recommended: false,
    sort: 99
  }
])

module.exports = {
  SERVICE_CATEGORIES,
  SERVICES
}
