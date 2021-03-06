import { setToken, removeToken } from '@/util/auth'
import { setStore, getStore } from '@/util/store'
import { isURL, validatenull } from '@/util/validate'
import { encryption, deepClone } from '@/util/util'
import webiste from '@/config/website'
import { LoginByUsername, getUserInfo, getMenu, logout, getTopMenu, refeshToken } from '@/api/system/user'


function addPath (ele, first) {
  const propsConfig = webiste.menu.props;
  const propsDefault = {
    label: propsConfig.label || 'label',
    path: propsConfig.path || 'path',
    icon: propsConfig.icon || 'icon',
    children: propsConfig.children || 'children'
  }
  const isChild = ele[propsDefault.children] && ele[propsDefault.children].length !== 0;
  if (!isChild && first) {
    ele[propsDefault.path] = ele[propsDefault.path] + '/index'
    return
  }
  ele[propsDefault.children].forEach(child => {
    if (!isURL(child[propsDefault.path])) {
      child[propsDefault.path] = `${ele[propsDefault.path]}/${child[propsDefault.path] ? child[propsDefault.path] : 'index'}`
    }
    addPath(child);
  })
}
const user = {
  state: {
    userInfo: {},
    permission: {},
    roles: [],
    menuId: getStore({ name: 'menuId' }) || [],
    menu: getStore({ name: 'menu' }) || [],
    menuAll: getStore({ name: 'menuAll' }) || [],
    token: getStore({ name: 'token' }) || '',
  },
  actions: {
    //根据用户名登录
    LoginByUsername ({ commit }, userInfo) {
      const user = encryption({
        data: userInfo,
        type: 'Aes',
        key: 'zvue',
        param: ['useranme', 'password']
      });
      return new Promise(async (resolve) => {
        const res = await LoginByUsername(user.username, user.password, userInfo.code, userInfo.redomStr)
        const { data } = res.data
        commit('SET_TOKEN', data)
        commit('DEL_ALL_TAG')
        commit('CLEAR_LOCK')
        setToken(data)
        resolve(res)
      })
    },
    //根据手机号登录
    LoginByPhone ({ commit }, userInfo) {
      return new Promise(async (resolve) => {
        const res = await LoginByUsername(userInfo.phone, userInfo.code)
        const { data } = res.data
        commit('SET_TOKEN', data)
        commit('DEL_ALL_TAG')
        commit('CLEAR_LOCK')
        setToken(data)
        resolve(data);
      })
    },
    GetUserInfo ({ commit }) {
      return new Promise(async (resolve, reject) => {
        try {
          const res = await getUserInfo()
          const { data } = res.data
          commit('SET_USERIFNO', data.userInfo)
          commit('SET_ROLES', data.roles)
          commit('SET_PERMISSION', data.permission)
          resolve(data)
        } catch (err) {
          reject(err)
        }
      })
    },
    //刷新token
    RefeshToken ({ commit }) {
      return new Promise(async (resolve, reject) => {
        try {
          const res = await refeshToken()
          const { data } = res.data
          commit('SET_TOKEN', data)
          setToken(data)
          resolve(data)
        } catch (error) {
          reject(error)
        }
      })
    },
    // 登出
    logOut ({ commit }) {
      return new Promise(async (resolve, reject) => {
        try {
          const res = await logout()
          commit('SET_TOKEN', '')
          commit('SET_MENUID', {})
          commit('SET_MENU', [])
          commit('SET_ROLES', [])
          commit('DEL_ALL_TAG')
          commit('CLEAR_LOCK')
          removeToken()
          resolve(res)
        } catch (error) {
          reject(error)
        }
      })
    },
    //注销session
    fedLogOut ({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        commit('SET_MENUID', {})
        commit('SET_MENU', [])
        commit('SET_ROLES', [])
        commit('DEL_ALL_TAG');
        commit('CLEAR_LOCK');
        removeToken()
        resolve()
      })
    },
    getTopMenu () {
      return new Promise(async resolve => {
        const res = await getTopMenu()
        const { data } = res.data
        resolve(data)
      })
    },
    //获取系统菜单
    getMenu ({ commit }, parentId) {
      return new Promise(async resolve => {
        const res = await getMenu(parentId)
        const { data } = res.data
        let menu = deepClone(data)
        menu.forEach(ele => {
          addPath(ele, true)
        })
        commit('SET_MENU', menu)
        resolve(menu)
      })
    },
  },
  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token;
      setStore({ name: 'token', content: state.token, type: 'session' })
    },
    SET_MENUID: (state, menuId) => {
      state.menuId = menuId
      setStore({ name: 'menuId', content: state.menuId, type: 'session' })
    },
    SET_USERIFNO: (state, userInfo) => {
      state.userInfo = userInfo;
    },
    SET_MENU: (state, menu) => {
      state.menu = menu
      let menuAll = state.menuAll;
      if (!validatenull(menu)) {
        const obj = menuAll.filter(ele => ele.path === menu[0].path)[0]
        if (!obj) {
          menuAll = menuAll.concat(menu);
          state.menuAll = menuAll
        }
        setStore({ name: 'menuAll', content: state.menuAll, type: 'session' })
      }
      setStore({ name: 'menu', content: state.menu, type: 'session' })
    },
    SET_MENU_ALL: (state, menuAll) => {
      state.menuAll = menuAll;
      setStore({ name: 'menuAll', content: state.menuAll, type: 'session' })
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles;
    },
    SET_PERMISSION: (state, permission) => {
      state.permission = {};
      permission.forEach(ele => {
        state.permission[ele] = true;
      });
    }
  }

}
export default user