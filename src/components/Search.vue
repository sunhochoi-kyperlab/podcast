<template>
  <div class="wrap" ref="wrap">
    <div class="content">
      <div class="searchBox" @click="searchResultClick">
        <span>Search for a station name</span>
      </div>
      <div class="searchGuide">
        <div class="inner">
        </div>
      </div>
    </div>  
  </div>
</template>
<script>
import { logger } from './js/commonLib'
import { audio, util } from './js/podcastLib'

export default {
  name: 'search',
  components: {
  },
  data: function () {
    return window.podcastObj
  },
  methods: {
    // 검색어 입력창 클릭
    searchResultClick: function () {
      logger.method(this.$router, 'searchResultClick')
      // 비프음
      util.beep()
      this.$router.push('/searchResult')
    }
  },
  mounted () {
    logger.load(this.$router, 'mounted')
    // 현재 페이지
    window.podcastObj.currentPage = this.$router.history.current.path
    // 오디오 초기화
    audio.init()
    // 토스트 클래스 세팅
    window.podcastObj.toast.toastClass = ''
  },
  beforeDestroy () {
    console.log('검색 정리')
    // HTML 엘리먼트 정리
    this.$refs['wrap'].innerHTML = ''
  }
}
</script>
<style lang='scss' scoped>
  @import '../scss/common.scss';
  .content {
    display: block;
    margin: 0;
    padding: 16px 15px;
  }

  .searchBox {
    height: 99px;
    background: #fff url('../img/icon_search.png') no-repeat 33px 14px;
    border-radius: 15px;
    
    span {
      display: block;
      padding-left: 125px;
      font-size: 33px;
      color: #919191;
      line-height: 99px;
    }
    
  }
  .searchGuide {
    display: table;
    width: 100%;
    height: 530px;
    text-align: center;
    
    .inner {
      display: table-cell;
      vertical-align: middle;
      
      .textVoice {
        font-size: 27px;
        line-height: 36px;
        span {
          display: block;
        }
        
        strong {
          color: #fff;
          font-size: 30px;
          
          i {
            display: inline-block;
            position: relative;
            top: -3px;
            width: 35px;
            height: 35px;
            background-image: url('../img/icon_voiceBtn.png');
            vertical-align: middle;
          }
        }
      }
      
      .textHint {
        padding-top: 44px;
        line-height: 56px;
        font-size: 36px;
        color: #fff;
      }
    }
  }
</style>
