Component({
  properties: {
    icon: {
      type: String,
      value: '🚗'
    },
    title: {
      type: String,
      value: '暂无数据'
    },
    description: {
      type: String,
      value: ''
    },
    actionText: {
      type: String,
      value: ''
    }
  },
  methods: {
    onAction() {
      this.triggerEvent('action')
    }
  }
})
