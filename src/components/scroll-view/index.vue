<template>
  <div class='scroll-view' >
    <div class='scroll-container' >
      <slot></slot>
      <div class='dummy-item' v-if="hideDummyItem == false && isEmpty == false" ></div>
    </div>
    <div @click="topBtnClick" class="btnTop" v-show="isShowTopBtn && showTopBtn" ref="topBtn"></div>
  </div>
</template>

<script>
import IScroll from '../../libs/iscroll'
import { util } from '../js/podcastLib'
let self = this

export default {
  name: 'scroll-view',
  props: {
    hideDummyItem: {
      type: Boolean,
      default: false
    },
    // TOP 버튼 사용 표시여부
    isShowTopBtn: {
      type: Boolean,
      default: true
    },
    // 스크롤바 표시 여부
    isShowScrollbars: {
      type: Boolean,
      default: true
    },
    // 최초 스크롤바 Y 위치
    initScorllY: {
      type: Number,
      default: 0
    },
    isCheckbox: {
      type: Boolean,
      default: false
    },
    // 스크롤 opacity 설정
    isFadeScrollbars: {
      type: Boolean,
      default: true
    },
    scrollIndex: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      isEmpty: true,
      showTopBtn: false,
      isDisableMouse: false
    }
  },
  methods: {
    // Top 버튼 클릭
    topBtnClick: function () {
      self = this
      // 활성화
      util.active(self.$refs['topBtn'], function () {
        self.$scroll.scrollTo(0, 0, 600)
        setTimeout(function () {
          self.showTopBtn = false
        }, 200)
      })
    },
    makeScroll: function () {
      if (this.$slots.default === undefined || this.$slots.default.length === 0) {
        this.isEmpty = true
        return
      }
      // BM 전용 (isDisableMouse)
      if (typeof window.applicationFramework === 'object') {
        if (this.isCheckbox) {
          this.isDisableMouse = true
        } else {
          this.isDisableMouse = false
        }
      } else {
        this.isDisableMouse = false
      }
      this.isEmpty = false
      this.$scroll = new IScroll(this.$el, {
        probeType: 2,
        bounce: false,
        mouseWheel: false,
        scrollbars: this.isShowScrollbars,
        fadeScrollbars: this.isFadeScrollbars,
        interactiveScrollbars: false,
        click: true, // BM = true
        disableTouch: false,
        disableMouse: this.isDisableMouse,
        disablePointer: true,
        preventDefaultException: {
          // default config, all form elements,
          // extended with a WebComponents Custom Element from the future
          tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|X-WIDGET)$/,
          // and allow any element that has an accessKey (because we can)
          accessKey: /.+/
        }
      })
      this.$scroll.on('scrollStart', function () {
        setTimeout(function () {
          if (self.$scroll.y >= 0) {
            // self.showTopBtn = false
            self.$scroll.scrollTo(0, 0, 100)
          } else {
            self.showTopBtn = true
          }
        }, 300)
      })
      this.$scroll.on('scrollEnd', function () {
        if (this.y >= 0) {
          self.showTopBtn = false
          self.$scroll.scrollTo(0, 0, 600)
        } else {
          self.showTopBtn = true
        }
        // 부모에게 이벤트 전달
        self.$emit('scrollEnd', this)
        // 스크롤바 끝까지 이동
        if (this.y === this.maxScrollY) {
          // 부모에게 이벤트 전달
          self.$emit('scrollEndMax', this)
        }
      })
      // 최초 스크롤바 위치
      if (self.initScorllY !== 0) {
        self.$scroll.scrollTo(0, self.initScorllY, 300)
      }
    },
    refreshScroll: function () {
      if (this.$scroll) {
        if (this.$slots.default === undefined || this.$slots.default.length === 0) {
          this.isEmpty = true
          return
        } else {
          this.isEmpty = false
          this.$scroll.refresh()
        }
      } else {
        this.makeScroll()
      }
    },
    // 초기화 (필요시)
    init: function (scrollY) {
      if (!scrollY) {
        scrollY = 0
      }
      self = this
      self.$scroll.scrollTo(0, scrollY, 0)
      setTimeout(function () {
        self.showTopBtn = false
      }, 300)
    },
    /**
     * basic-player 참고
     * active된 엘리먼트에 스크롤
     */
    scrollToElementVisible (el) {
      let scroll = this.$scroll
      let top = -(el.offsetTop + scroll.y)
      let bottom = scroll.wrapperHeight - (el.offsetTop + scroll.y + el.offsetHeight)

      if (bottom < 0) {
        this.$scroll.scrollTo(0, scroll.y + bottom)
      } else if (top > 0) {
        this.$scroll.scrollTo(0, scroll.y + top)
      }
    }
  },
  updated () {
    self = this
    this.refreshScroll()
  },
  mounted () {
    self = this
    this.makeScroll()
  },
  watch: {
    scrollIndex (newVal, oldVal) {
      if ((newVal !== oldVal) && window.podcastObj.isLongPress) {
        let referName
        if (this.$route.path === '/searchResult' || this.$route.path === '/popular') {
          referName = 'channel'
        } else {
          referName = 'episode'
        }
        let newElement = this.$parent.$refs[referName][newVal]
        this.scrollToElementVisible(newElement)
      }
    }
  },
  beforeDestroy () {
    if (this.$scroll) {
      this.$scroll.destroy()
      this.$scroll = undefined
    }
  }

}
</script>
<style lang="scss" scoped >
  .scroll-view{
    width:100%;
    height:420px;
    position:relative;
    overflow:hidden;
    color:white;
    .dummy-item{
      width:100%;
      height:78px;
    }
  }
  .btnTop {
    position: absolute;
    bottom: 34px;
    right: 35px;
    width: 110px;
    height: 110px;
    background-image: url('../../img/btn_top.png');
    background-position: 0 0;
    
    &:active, &.active {
      background-position: -110px 0;
    }
  }

</style>

