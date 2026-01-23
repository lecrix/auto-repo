Component({
    properties: {
        showBack: {
            type: Boolean,
            value: false
        }
    },
    data: {
        navHeight: 60,
        menuTop: 24,
        menuHeight: 32
    },
    lifetimes: {
        attached() {
            const menu = wx.getMenuButtonBoundingClientRect()
            // const system = wx.getSystemInfoSync()
            const navHeight = menu.bottom + 8
            this.setData({
                navHeight,
                menuTop: menu.top,
                menuHeight: menu.height
            })
        }
    },
    methods: {
        goBack() {
            wx.navigateBack()
        },
        goHome() {
            wx.reLaunch({
                url: '/pages/repo-list/index'
            })
        }
    }
})
