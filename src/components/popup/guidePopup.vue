<template>
  <div>
    <div class="overlay" @click.stop="close"></div>
    <div class="popup">
      <div class="pop-contents" >
        <h2 class="title" >
            {{title}}
        </h2>
        <div class="text-content">
          <span class='' :style="{'text-align':contentAlign}">
            <p class='' v-html="content"></p>
            <p class="subContent" v-html="subContent"></p>
          </span>  
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
        } else if (callback === null) {
          self.close()
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
    subContent: {
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
    background-color:rgba(0, 0, 0, 0.7); 
  }

  .popup{
    position: absolute;
    top: 50%;
    left: 50%;
    z-index:110;
    width:708px;
    height:500px;
    font-size:32px;
    margin: -250px 0 0 -354px;
    background: #272e39 url('img/popBg_default.jpg') no-repeat 50% 0;
		

    .pop-contents{
      
      .title{
        font-size: 35px;
        line-height: 140px;
        height: 84px;
        text-align: center;
        color: #fff;
        font-weight: 400;
        border-top: 1px solid #72777e;
      }

      .text-content{
        display: table;
        width: 100%;
        height: 305px;
        padding: 40px;
        line-height:38px;
        box-sizing: border-box;
        color: #bebfc2;
        font-size: 27px;

        >span {
          display: table-cell;
          vertical-align: middle;
          text-align: center;
          color: #fff;
          word-break: keep-all;
        }
        
        .subContent {
					margin-top: 15px;
					font-size: 24px;
          color: rgba(255, 255, 255, 0.5); 
					line-height: 32px;
        }
      }
    }
		
    .btn-area{
			height: 104px;
			background: url('./img/bg_btn_lineW.png') repeat-x;

			button{
				margin-top:2px;
				background: url('./img/bg_btn_lineH.png') repeat-y left top;
				color:white;
				box-shadow:none;
				height:103px;
				font-size:30.39px;
				line-height:103px;

				&:first-child{
					background: none;
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
