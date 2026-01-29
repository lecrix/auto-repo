Component({
  properties: {
    filters: {
      type: Object,
      value: {}
    }
  },
  
  data: {
    typeKeys: ['', 'maintenance', 'repair', 'modification', 'fuel', 'parking', 'inspection', 'other', 'insurance', 'purchase'],
    typeLabels: ['全部类型', '常规保养', '故障维修', '改装升级', '加油费用', '停车费用', '年检费用', '其他费用', '车辆保险', '购车费用'],
    typeIndex: 0,
    searchQuery: '',
    mileageMin: '',
    mileageMax: '',
    showAdvanced: false,
    searchTimer: null as any
  },
  
  methods: {
    onTypeChange(e: any) {
      const index = e.detail.value;
      this.setData({ typeIndex: index });
      this.triggerFilter();
    },
    
    onSearchInput(e: any) {
      this.setData({ searchQuery: e.detail.value });
      // Debounce search
      if (this.data.searchTimer) {
        clearTimeout(this.data.searchTimer);
      }
      const timer = setTimeout(() => this.triggerFilter(), 500);
      this.setData({ searchTimer: timer });
    },
    
    onMileageInput(e: any) {
      const field = e.currentTarget.dataset.field;
      this.setData({ [field]: e.detail.value });
    },
    
    applyFilters() {
      this.triggerFilter();
    },
    
    resetFilters() {
      this.setData({
        typeIndex: 0,
        searchQuery: '',
        mileageMin: '',
        mileageMax: ''
      });
      this.triggerFilter();
    },
    
    toggleAdvanced() {
      this.setData({ showAdvanced: !this.data.showAdvanced });
    },
    
    triggerFilter() {
      const filters: any = {};
      
      if (this.data.typeIndex > 0) {
        filters.type = this.data.typeKeys[this.data.typeIndex];
      }
      if (this.data.searchQuery) {
        filters.search = this.data.searchQuery;
      }
      if (this.data.mileageMin) {
        filters.mileageMin = Number(this.data.mileageMin);
      }
      if (this.data.mileageMax) {
        filters.mileageMax = Number(this.data.mileageMax);
      }
      
      this.triggerEvent('change', filters);
    }
  }
})
