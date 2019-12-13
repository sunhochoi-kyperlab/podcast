import Vue from 'vue'
import Vuex from 'vuex'

import state from './state'
import * as actions from './actions'
import * as getters from './getters'
import mutations from './mutations'
import createLogger from './util/logger'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

const store = new Vuex.Store({
  state,
  actions,
  getters,
  mutations,
  strict: debug,
  plugins: debug ? [createLogger()] : []
})

export default store
