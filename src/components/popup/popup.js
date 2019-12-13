/**
 * @module Popup
 * @desc popup instance for show/hide
 *
 * @function
 * @name show - show popup
 *
 */

import guidePopup from './guidePopup.vue'
import listPopup from './listPopup.vue'
import listPopup2 from './listPopup2.vue'
import loadingPopup from './loadingPopup.vue'
import normalPopup from './popup.vue'
import Vue from 'vue'

let shownPopupHashMap = {}
let gudiePopup = null

window.shownPopupHashMap = shownPopupHashMap

export default function () {
  return {
    show (props) {
      if (props === null) {
        console.log('popup: props is null')
        return
      }
      if (typeof props === 'undefined') {
        console.log('popup: props is undefined')
        return
      }
      const node = document.createElement('div')
      document.body.appendChild(node)
      let popup
      if (props.type === 'loading') {
        popup = loadingPopup
      } else if (props.type === 'list') {
        popup = listPopup
      } else if (props.type === 'list2') {
        popup = listPopup2
      } else if (props.type === 'guide') {
        popup = guidePopup
      } else {
        popup = normalPopup
      }
      let vm = new Vue({
        el: node,
        data () {
          return {props}
        },
        destroyed () {
          delete shownPopupHashMap[this._uid]
        },
        render: h => h(popup, {props})
      })

      let popupObj = { }

      if (props.type === 'progress') {
        popupObj = {
          close () {
            vm.closePopup()
          },
          updateProgress (width) {
            vm.updateProgress(width)
          }
        }
      } else if (props.type !== 'guide') {
        popupObj = {
          close () {
            vm.closePopup()
          }
        }
      } else {
        gudiePopup = {
          close () {
            vm.closePopup()
          }
        }
        popupObj = null
        console.log('guide')
      }
      if (popupObj) {
        shownPopupHashMap[vm._uid] = popupObj
      }
      return popupObj
    },
    closeTopPopup () {
      var keys = Object.keys(shownPopupHashMap)
      keys.sort((a, b) => a - b)
      if (keys.length === 0) {
        return false
      } else {
        var topPopup = shownPopupHashMap[keys[keys.length - 1]]
        topPopup.close()
        delete shownPopupHashMap[keys.length - 1]
        return true
      }
    },
    closeCenterPopup () {
      if (gudiePopup) {
        gudiePopup.close()
        gudiePopup = null
      }
    }
  }
}
