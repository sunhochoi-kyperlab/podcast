<template>
  <div>
    <div class="overlay" @click.stop="close"></div>
    <div class="popup">
      <div class="pop-contents" >
        <h2 class="title" >
            {{title}}
        </h2>
        <div class="popList">
          <scroll-view :isShowTopBtn=false :hideDummyItem=true style='height:241px;'>
          <ul>
            <li v-for="(item,index) in listItem" @click="itemClick(item.onClick, index)" :class="[item.selected ? 'sel' : '']">
              {{ item.title }}
            </li>
          </ul>
          </scroll-view>
        </div>
      </div>
      <div class="btn-area" >
          <button v-for="(btn,index) in buttons" :style="getBtnWidth()" @click="btnClick(index, btn.onClick)" ref="btn">{{btn.label}}</button>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import scrollView from '../scroll-view'
import { util } from '../js/podcastLib'

export default {
  name: 'obg-popup',
  components: {
    'scroll-view': scrollView
  },
  methods: {
    // 아이템 클릭
    itemClick: function (callback, idx) {
      // 비프음 처리
      util.beep()
      // 콜백 함수가 있으면 실행
      if (typeof callback === 'function') {
        callback(idx)
      }
      // 선택된 항목 정리
      for (var i = 0; i < this.listItem.length; i++) {
        if (i === idx) {
          this.listItem[i].selected = true
        } else {
          this.listItem[i].selected = false
        }
      }
    },
    close () {
      if (this.componentContent) {
        this.componentContent.$destroy()
      }
      this.$root.$destroy()
      if (this.$root.$el.parentNode) {
        this.$root.$el.parentNode.removeChild(this.$root.$el)
      }
      this.onClose()
    },
    getBtnWidth () {
      return {
        width: (100 / this.buttons.length) + '%'
      }
    },
    // 버튼 클릭
    btnClick (index, callback) {
      let self = this
      // 활성화
      util.active(self.$refs['btn'][index], function () {
        if (typeof callback === 'function') {
          callback()
        }
      })
    }
  },
  data () {
    return {
      timeout: 5000
    }
  },
  props: {
    buttons: {
      type: Array
    },
    title: {
      type: String
    },
    listItem: {
      type: Array
    },
    onOpen: {
      type: Function,
      default: () => {}
    },
    onClose: {
      type: Function,
      default: () => {}
    }
  },
  mounted () {
    if (typeof this.content === 'object') {
      var props = this.content.props
      this.componentContent = new Vue({
        el: this.$el.querySelector('.component-content'),
        render: h => h(this.content.component, {props})
      })
    }
    if (!this.buttons || this.buttons.length === 0) {
      setTimeout(this.close, this.timeout)
    }
    this.$root.closePopup = this.close
    this.onOpen()
  }
}
</script>

<style lang="scss" scoped >
  @import '../../scss/common.scss';
  
  .overlay{
    position:fixed;
    top:0;
    left:126px;
    z-index:100;
    width:1154px;
    height:650px;
    background-color:rgba(0, 0, 0, 0.9);
  }

  .popup{
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 110;
    width: 660px;
    height: 416px;
    margin: -208px 0 0 -267px;
    font-size: 32px;
    background: #212347;
    border-radius: 15px;
    
    .pop-contents{
      text-align:center;

      .title{
        padding: 27px 0 15px;
        font-size:33px;
        line-height:37px;
        text-align:center;
        color: #fff;
        font-weight: normal;
      }

      .popList {
        overflow: hidden;
        height: 242px;
        border-top: 1px solid #31345f;
        margin: 0 40px;

        ul {
        }

        li {
          line-height: 70px;
          padding-left: 89px;
          border-bottom: 1px solid #343b44;
          background-color:#111138;
          text-align: left;
          color: rgba(255,255,255,0.7);
          font-size: 33px;

          &.sel {
            color: #00b1fb;
            background:#111138 url('./img/icon_select.png') no-repeat 39px 24px;
          }
        }
      }
    }

    .btn-area{
      height:104px;
      border-top: 1px solid #444673;
      background: #212347;
      border-bottom-left-radius:15px;
      border-bottom-right-radius:15px;
      overflow: hidden;
      button{
        margin:0;
        color:white;
        box-shadow:none;
        height:100px;
        font-size:30.39px;
        line-height:100px;
        background: transparent;

        &:first-child{
          border-right: 1px solid #444673;
        }

        &:active, &.active {
          background-color: #3a3d60;
        }

        &.dis {
          color: #79787f;
          pointer-events: none;
        }
      }
    }
  }
</style>
