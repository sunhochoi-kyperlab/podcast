/**
 *  @namespace Action creater
 *  @desc commit or dispatch action, do ajax action
 */
import * as types from './actionTypes'

export function switchLoadingState ({commit}) {
  commit(types.SWITCH_LOADING_STATE)
}
