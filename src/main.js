// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import FastClick from 'fastclick'
import store from './store'
import Router from 'vue-router'
import { sync } from 'vuex-router-sync'
import App from './App'
import Search from './components/Search'
import SearchResult from './components/SearchResult'
import SearchDetail from './components/SearchDetail'
import Player from './components/Player'
import Playlist from './components/Playlist'
import History from './components/History'
import HistoryEdit from './components/HistoryEdit'
import Popular from './components/Popular'
import PopularDetail from './components/PopularDetail'
import ObigoUI from 'obigo-js-ui'
import { storage } from './components/js/podcastLib'

Vue.use(ObigoUI)
Vue.use(Router)

const routes = [
  {path: '/search', component: Search},
  {path: '/searchResult', component: SearchResult},
  {path: '/searchDetail', component: SearchDetail},
  {path: '/player', component: Player},
  {path: '/playlist', component: Playlist},
  {path: '/history', component: History},
  {path: '/historyEdit', component: HistoryEdit},
  {path: '/popular', component: Popular},
  {path: '/popularDetail', component: PopularDetail}
]

const router = new Router({
  mode: 'abstract',
  routes
})
// 히스토리가 있으면
if (storage.isHistory()) {
  router.push('/player') // 플레이어
} else {
  router.push('/popular') // 인기방송
}
FastClick.attach(document.body)

sync(store, router)

/* eslint-disable no-new */
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
