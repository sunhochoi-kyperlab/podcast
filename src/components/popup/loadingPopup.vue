<template>
  <div class="overlay">
    <div class="loading_content">
      <div><img src="../../img/loading_motion.gif" style="transform: translateZ(0);"></div>
      <!-- 텍스트가 없을 경우에는 아래 h2태그 display: none -->
      <h2 class="title" v-show=true>{{title}}</h2>
    </div>
  </div>
</template>

<script>
import spinner from 'obigo-js-ui/src/components/spinner'
/**
 * popup
 * @class popup
 * @classdesc components/popup
 * @param {object} options                      - options to show
 * @param {string} options.title                - title for popup
 */
export default {
  name: 'obg-loading-popup',
  components: {
    'obg-spinner': spinner
  },
  methods: {
    close () {
      if (this.componentContent) {
        this.componentContent.$destroy()
      }
      this.$root.$destroy()
      if (this.$root.$el.parentNode) {
        this.$root.$el.parentNode.removeChild(this.$root.$el)
      }
    }
  },
  data () {
    return {
      timeout: 5000
    }
  },
  props: {
    title: {
      type: String
    }
  },
  mounted () {
    this.$root.closePopup = this.close
  }
}
</script>

<style lang="scss" scoped >
.overlay{
  display: table;
  position:fixed;
  top:0;
  left:0;
  z-index:100;
  width:1280px;
  height:650px;  
  background-color:rgba(0, 0, 0, 0.7);
  font-family: Roboto, 'Noto Sans', 'Noto Sans CJK KR';
  
  .loading_content {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
  }

  .title{
    width: 100%;
    margin-top: 24px;
    font-size: 36px; 
    line-height: 54px;
    text-align:center;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space: nowrap;
    word-wrap: normal;
    font-weight: normal;
    color: rgba(255,255,255,0.9);
  } 
}
</style>
