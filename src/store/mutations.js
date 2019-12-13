
// import { set } from 'vue'
import * as types from './actionTypes'

export default {
  [types.SWITCH_LOADING_STATE] (state) {
    state.isLoading = !state.isLoading
  }
}

