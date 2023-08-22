// 路由鉴权：项目当前路由不能访问的权限
import nprogress from 'nprogress'
import { ElMessage } from 'element-plus'
import router from '@/router'

import setting from './setting'
import useUserStore from './store/modules/user'
//引入进度条样式
import 'nprogress/nprogress.css'
//进度条的加载圆圈不要
nprogress.configure({ showSpinner: false })
import pinia from './store'
const userStore = useUserStore(pinia)

//全局前置守卫
router.beforeEach(async (to: any, from: any, next: any) => {
  //网页的名字
  document.title = `${setting.title}-${to.meta.title}`
  //访问某一个路由之前的守卫
  nprogress.start()
  //获取token，去判断用户登录、还是未登录
  const token = userStore.token
  //获取用户名字
  let username = userStore.username
  //用户登录判断
  if (token) {
    //登陆成功，访问login。指向首页
    if (to.path == '/login') {
      next('/home')
    } else {
      //登陆成功访问其余的，放行
      //有用户信息
      if (username) {
        //放行
        next()
      } else {
        //如果没有用户信息，在收尾这里发请求获取到了用户信息再放行
        try {
          //获取用户信息
          await userStore.userInfo()
          next({ ...to })
        } catch (error) {
          //token过期|用户手动处理token
          //退出登陆->用户相关的数据清空
          // 弹窗提醒

          await userStore.userLogout()
          ElMessage.error('用户信息过期，请重新登录')
          next({
            path: '/login',
            query: { redirect: to.path },
          })
        }
      }
    }
  } else {
    //用户未登录
    if (to.path == '/login') {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.path } })
    }
  }
})

//全局后置守卫
router.afterEach((to: any, from: any) => {
  // to and from are both route objects.
  nprogress.done()
})
