<template>
  <div>
    <div class="overlay" @click.stop="close"></div>
    <div class="popup">
      <div class="pop-contents" >
        <h2 class="title" >
            {{title}}
        </h2>
        <div class="text-content">
          <span class='' :style="{'text-align':contentAlign}" v-html="content"></span>
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
import { util } from '../js/podcastLib'

export default {
  name: 'obg-popup',
  methods: {
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
    content: {
      type: String
    },
    contentAlign: {
      type: String,
      defalut: 'center'
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
    width:1280px;
    height:650px;
    top:0;
    left:0;
    z-index:100;
    background-color:rgba(0, 0, 0, 0.9);
    color:color(dark);    
  }

  .popup{
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 110;
    width: 732px;
    height: 500px;
    margin: -250px 0 0 -366px;
    font-size: 32px;
    background: #282d38 url('./img/bg_popup_title.gif') no-repeat left top;

    .pop-contents{
      text-align:center;

      .title{
        margin-top: 50px;
        padding: 0 50px;
        font-size:36px;
        line-height:54px;
        height: 54px;
        text-align:center;
        color: #fff;
        font-weight: 400;
      }

      .text-content{
        display: table;
        width: 100%;
        height: 305px;
        padding: 0px 50px;
        line-height:38px;
        box-sizing: border-box;
        color: #bebfc2;
        font-size: 27px;

        >span {
          display: table-cell;
          vertical-align: middle;
          text-align: center;
          color: #fff;
        }
      }
    }
    .btn-area{
      height:90px;
      border-top: 1px solid #484c56;

      button{
        margin:0;
        background:none;
        color:white;
        box-shadow:none;
        height:90px;
        font-size:32px;
        line-height:90px;

        &:first-child{
          border-left: 0 !important;
        }

        &:last-child{
          border-left: 1px solid #484c56;
        }

        &:active, &.active {
          background-color: #59647a;
        }

        &.dis {
          color: rgba(255,255,255,0.3);
          pointer-events: none;
        }
      }
    }
  }
</style>
