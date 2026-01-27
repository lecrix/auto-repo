export interface MaintenanceTemplate {
  id: string;
  title: string;
  type: 'maintenance' | 'repair' | 'modification';
  suggestedCost: {
    parts: number;
    labor: number;
  };
  suggestedMileageInterval?: number;
  icon: string;
  description?: string;
}

export const MAINTENANCE_TEMPLATES: MaintenanceTemplate[] = [
  {
    id: 'oil_change',
    title: '更换机油',
    type: 'maintenance',
    suggestedCost: { parts: 300, labor: 100 },
    suggestedMileageInterval: 5000,
    icon: '🛢️',
    description: '定期更换机油和机滤'
  },
  {
    id: 'tire_rotation',
    title: '轮胎换位',
    type: 'maintenance',
    suggestedCost: { parts: 0, labor: 80 },
    suggestedMileageInterval: 10000,
    icon: '🔄',
    description: '前后轮胎对调以延长寿命'
  },
  {
    id: 'air_filter',
    title: '更换空气滤清器',
    type: 'maintenance',
    suggestedCost: { parts: 80, labor: 20 },
    icon: '💨',
    description: '更换发动机进气滤芯'
  },
  {
    id: 'brake_pads',
    title: '更换刹车片',
    type: 'repair',
    suggestedCost: { parts: 400, labor: 150 },
    icon: '🛑',
    description: '更换磨损的刹车片'
  },
  {
    id: 'wheel_alignment',
    title: '四轮定位',
    type: 'maintenance',
    suggestedCost: { parts: 0, labor: 200 },
    icon: '⚖️',
    description: '调整车轮角度'
  },
  {
    id: 'spark_plugs',
    title: '更换火花塞',
    type: 'maintenance',
    suggestedCost: { parts: 200, labor: 100 },
    icon: '⚡',
    description: '更换点火系统火花塞'
  },
  {
    id: 'battery_replacement',
    title: '更换电池',
    type: 'repair',
    suggestedCost: { parts: 500, labor: 50 },
    icon: '🔋',
    description: '更换蓄电池'
  },
  {
    id: 'coolant_flush',
    title: '冷却液更换',
    type: 'maintenance',
    suggestedCost: { parts: 150, labor: 100 },
    icon: '❄️',
    description: '更换防冻冷却液'
  },
  {
    id: 'audio_upgrade',
    title: '改装音响',
    type: 'modification',
    suggestedCost: { parts: 2000, labor: 500 },
    icon: '🔊',
    description: '升级车载音响系统'
  },
  {
    id: 'annual_inspection',
    title: '年检',
    type: 'maintenance',
    suggestedCost: { parts: 0, labor: 300 },
    icon: '📋',
    description: '车辆年度检验'
  }
];
