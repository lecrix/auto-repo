export interface MaintenanceTemplate {
  id: string;
  title: string;
  type: 'maintenance' | 'repair' | 'modification' | 'fuel' | 'parking' | 'inspection' | 'other' | 'insurance';
  suggestedCost: number;
  suggestedMileageInterval?: number;
  icon: string;
  description?: string;
}

export const MAINTENANCE_TEMPLATES: MaintenanceTemplate[] = [
  // 保养 (Maintenance)
  {
    id: 'oil_change',
    title: '更换机油',
    type: 'maintenance',
    suggestedCost: 400,
    suggestedMileageInterval: 5000,
    icon: '🛢️',
    description: '定期更换机油和机滤'
  },
  {
    id: 'tire_rotation',
    title: '倒胎存胎',
    type: 'maintenance',
    suggestedCost: 80,
    suggestedMileageInterval: 10000,
    icon: '🔄',
    description: '冬夏季轮胎更换或倒胎存放'
  },
  {
    id: 'air_filter',
    title: '更换空滤',
    type: 'maintenance',
    suggestedCost: 100,
    icon: '💨',
    description: '更换发动机进气滤芯'
  },
  {
    id: 'wheel_alignment',
    title: '四轮定位',
    type: 'maintenance',
    suggestedCost: 200,
    icon: '⚖️',
    description: '调整车轮角度'
  },
  {
    id: 'spark_plugs',
    title: '更换火花塞',
    type: 'maintenance',
    suggestedCost: 300,
    icon: '⚡',
    description: '更换点火系统火花塞'
  },
  {
    id: 'coolant_flush',
    title: '冷却液更换',
    type: 'maintenance',
    suggestedCost: 250,
    icon: '❄️',
    description: '更换防冻冷却液'
  },
  
  // 维修 (Repair)
  {
    id: 'brake_pads',
    title: '更换刹车片',
    type: 'repair',
    suggestedCost: 550,
    icon: '🛑',
    description: '更换磨损的刹车片'
  },
  {
    id: 'battery_replacement',
    title: '更换电池',
    type: 'repair',
    suggestedCost: 550,
    icon: '🔋',
    description: '更换蓄电池'
  },

  // 改装 (Modification)
  {
    id: 'audio_upgrade',
    title: '改装音响',
    type: 'modification',
    suggestedCost: 2500,
    icon: '🔊',
    description: '升级车载音响系统'
  },

  {
    id: 'fuel',
    title: '加油费用',
    type: 'fuel',
    suggestedCost: 300,
    icon: '⛽',
    description: '燃油加注费用'
  },
  {
    id: 'parking',
    title: '停车费用',
    type: 'parking',
    suggestedCost: 50,
    icon: '🅿️',
    description: '停车场费用'
  },
  {
    id: 'inspection',
    title: '年检费用',
    type: 'inspection',
    suggestedCost: 300,
    icon: '📋',
    description: '车辆年度检验费用'
  },
  {
    id: 'other',
    title: '其他费用',
    type: 'other',
    suggestedCost: 100,
    icon: '💰',
    description: '其他杂项费用'
  },

  // 保险 (Insurance)
  {
    id: 'insurance_renewal',
    title: '购买保险',
    type: 'insurance',
    suggestedCost: 4000,
    icon: '🛡️',
    description: '车辆商业险/交强险续保'
  }
];
