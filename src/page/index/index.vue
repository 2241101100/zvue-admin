<template>
  <div class="zvue-contail"
       :class="{'zvue--collapse':isCollapse}">
    <div class="zvue-header">
      <!-- 顶部 -->
      <top />
    </div>

    <div class="zvue-layout">
      <div class="zvue-left">
        <!-- 左侧导航栏 -->
        <sidebar />
      </div>
      <div class="zvue-main">
        <!-- 标签 -->
        <tags />
        <!-- 主体视图 -->
        <el-scrollbar style="height:100%">
          <keep-alive>
            <router-view class="zvue-view"
                         v-if="$route.meta.$keepAlive" />
          </keep-alive>
          <router-view class="zvue-view"
                       v-if="!$route.meta.$keepAlive" />
        </el-scrollbar>

      </div>
    </div>
    <div class="zvue-shade"
         @click="showCollapse"></div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import tags from './tags'
import top from './top/'
import sidebar from './sidebar/'
import admin from '@/util/admin';
import { validatenull } from '@/util/validate';
import { calcDate } from '@/util/date.js';
import { getStore } from '@/util/store.js';
export default {
  components: {
    top,
    tags,
    sidebar
  },
  name: 'index',
  provide () {
    return {
      index: this
    };
  },
  data () {
    return {
      //刷新token锁
      refreshLock: false,
      //刷新token的时间
      refreshTime: '',
    }
  },
  created () {
    //实时检测刷新token
    // this.refreshToken();
  },
  mounted () {
    this.init();
  },
  computed: mapGetters(['isLock', 'isCollapse', 'website']),
  props: [],
  methods: {
    //打开菜单
    openMenu (item = {}) {
      this.$store.dispatch("getMenu", item.parentId).then(data => {
        if (data.length !== 0) {
          this.$router.$zvueRouter.formatRoutes(data, true);
        }
        //当点击顶部菜单做的事件
        if (!this.validatenull(item)) {
          let itemActive,
            childItemActive = 0;
          if (item.href) {
            itemActive = item;
          } else {
            if (this.menu[childItemActive].length == 0) {
              itemActive = this.menu[childItemActive];
            } else {
              itemActive = this.menu[childItemActive].children[childItemActive];
            }
          }
          this.$store.commit('SET_MENUID', item);
          this.$router.push({
            path: this.$router.$zvueRouter.getPath({
              name: itemActive.label,
              src: itemActive.href
            })
          });
        }

      });
    },
    showCollapse () {
      this.$store.commit("SET_COLLAPSE");
    },
    // 屏幕检测
    init () {
      this.$store.commit('SET_SCREEN', admin.getScreen());
      window.onresize = () => {
        setTimeout(() => {
          this.$store.commit('SET_SCREEN', admin.getScreen());
        }, 0);
      }
    },
    // 实时检测刷新token
    refreshToken () {
      this.refreshTime = setInterval(() => {
        const token = getStore({
          name: 'token',
          debug: true,
        }) || {};
        const date = calcDate(token.datetime, new Date().getTime());
        if (validatenull(date)) return;
        if (!(date.seconds >= this.website.tokenTime) && !this.refreshLock) {
          this.refreshLock = true;
          this.$store
            .dispatch('RefeshToken')
            .then(() => {
              clearInterval(this.refreshTime);
            })
            .catch(() => {
              this.refreshLock = false;
            });
        }
      }, 3000);
    },
  }
}
</script>