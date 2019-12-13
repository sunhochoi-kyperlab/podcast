<template>
  <div id="app" class="pd_sub1">
    <!-- S : 최근 재생 에피소드 -->
    <div class="gg_container" v-show="getEtitle() !== ''">
      <div class="gg_content">
        <span class="title"><i>아이콘</i>팟빵 - 최근 재생 에피소드</span>
        <span class="text">
          <span class="episodeTitle"><span class="equalizer" v-show="style.playClass === 'pause'"></span>{{ getEtitle() }}</span>
          <span class="smallText">{{ getTitle() }}</span>
        </span>
      </div>
      <span class="dimLayer"></span>
      <img class="gg_thumImg" :src="getImageUrl()" @error="imageErrorCheck"></span>
    </div>
    <!-- E : 최근 재생 에피소드 -->
    <!-- S : 인기 방송 -->
    <div class="gg_container" v-show="getPopularEtitle() !== ''">
      <div class="gg_content">
        <span class="title"><i>아이콘</i>팟빵</span>
        <span class="text">
          <span class="episodeTitle"><span class="equalizer" v-show="style.playClass === 'pause'"></span>{{ getPopularEtitle() }}</span>
          <span class="smallText">{{ getPopularTitle() }}</span>
        </span>
      </div>
      <span class="dimLayer"></span>
      <span class="gg_thumImg" :style="{'background-image': 'url(' + getPopularImageUrl() + ')'}"></span>      
    </div>
    <!-- E : 인기방송 -->
    <div class="gg_container default" v-show="getEtitle() === ''">
      <div class="gg_content">
        <span class="title"><i>아이콘</i>팟빵</span>
        <p>재생할 에피소드가 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script>
import '../../../src/components/js/podcastObj'

export default {
  name: 'sub-1',
  components: {
  },
  data: function () {
    return window.podcastObj
  },
  methods: {
    imageErrorCheck: function (e) {
      // this.$refs['imageUrl'].src = '../../img/img_default.png'
      console.log('imageErrorCheck-sub :: ', e)
      let ele = e.currentTarget
      let src = ele.getAttribute('src')
      if (src !== '') {
        ele.removeAttribute('src')
        ele.setAttribute('src', src)
      }
    },
    // 에피소드명 조회
    getEtitle: function () {
      if (typeof window.podcastObj.playing.etitle !== 'undefined') {
        return window.podcastObj.playing.etitle
      } else {
        return ''
      }
    },
    // 팟캐스트명 조회
    getTitle: function () {
      if (window.podcastObj.playing.title !== 'undefined') {
        return window.podcastObj.playing.title
      } else {
        return ''
      }
    },
    // 이미지 경로 조회
    getImageUrl: function () {
      console.log('getImageUrl')
      console.log(window.podcastObj.playing.imageUrl)
      if (typeof window.podcastObj.playing.imageUrl !== 'undefined') {
        // 이미지 url 유효성 검사
        let imgUrl = window.podcastObj.playing.imageUrl
        let afterStr = imgUrl.split('/img/')
        if (typeof afterStr !== 'undefined' && afterStr[1] === '') {
          // 투명이미지
          return ''
        } else {
          return window.podcastObj.playing.imageUrl
        }
      } else {
        return ''
      }
    },
    // 인기방송 에피소드명 조회
    getPopularEtitle: function () {
      if (window.podcastObj.popular.episodeList.length > 0) {
        return window.podcastObj.popular.episodeList[0].etitle
      } else {
        return ''
      }
    },
    // 인기방송 팟캐스트명 조회
    getPopularTitle: function () {
      if (window.podcastObj.popular.episodeList.length > 0) {
        return window.podcastObj.popular.episodeList[0].title
      } else {
        return ''
      }
    },
    // 인기방송 팟캐스트 제목 조회
    getPopularCategory: function () {
      if (window.podcastObj.popular.episodeList.length > 0 && window.podcastObj.popular.channelList.length > 0) {
        if (window.podcastObj.popular.episodeList[0].pid === window.podcastObj.popular.channelList[0].pid) {
          return window.podcastObj.popular.channelList[0].category
        } else {
          return ''
        }
      }
    },
    // 인기방송 팟캐스트 이미지 조회
    getPopularImageUrl: function () {
      if (window.podcastObj.popular.episodeList.length > 0) {
        return window.podcastObj.popular.episodeList[0].imageUrl
      } else {
        return ''
      }
    },
    // AIC 초기화
    initAIC: function () {
      console.log('[팟빵/sub-1가젯] initAIC')
      if (window.applicationFramework) {
        // register receive event type
        window.msgObj.aicMessage.map((id) => {
          this.application.registerMessageListener(id)
        })
        // register event listener
        this.application.addEventListener('ApplicationMessage', this.AICEventHandler, false)
        // 에피소드 제목 체크
        if (window.podcastObj.playing.etitle === '' || window.podcastObj.playing.etitle === null) {
          // 재생정보 GET
          this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_PLAYING_GET', null)
        }
        if (window.podcastObj.popular.episodeList.length === 0) {
          // 인기 방송 GET
          this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_POPULAR_GET', null)
          // 아래는 factory reset한 경우 네트워크 문제로 인하여 popular 데이터가 없을 수 있음
          let firstRequestPopularData = setInterval(() => {
            if (window.podcastObj.popular.episodeList.length > 0) {
              console.log('[팟빵/sub-1가젯] 인기방송 데이터 interval clear')
              clearInterval(firstRequestPopularData)
            } else {
              this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_POPULAR_GET', null)
            }
          }, 30 * 1000)
        }
        if (window.podcastObj.history.episodeList.length === 0) {
          // 히스토리 GET
          this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_HISTORY_GET', null)
        }
        // 스타일 GET
        this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_STYLE_GET', null)
        // BT Call GET
        this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_BTCALL_GET', null)
        // 메인카드 실행 여부 세팅 (앱간통신)
        window.podcastObj.isRunMainCard = false
        this.application.postMessage(JSON.stringify(window.podcastObj.isRunMainCard), window.msgObj.aicOrigin + 'PODCAST_RUN_MAIN_CARD_SET', null)
      }
    },
    // AIC 이벤트 핸들러
    AICEventHandler: function (message, origin) {
      const filterName = (origin.indexOf('filter-name=') > -1) ? origin.slice(origin.indexOf('filter-name=') + 12) : ''
      console.log('[팟빵/sub-1가젯] filterName: ' + filterName)
      switch (filterName) {
        case 'PODCAST_POPULAR_SET':
          if (typeof message !== 'undefined') {
            window.podcastObj.popular.episodeList = JSON.parse(message)
          }
          break
        case 'PODCAST_HISTORY_SET':
          if (typeof message !== 'undefined') {
            window.podcastObj.history.episodeList = JSON.parse(message)
          }
          break
        case 'PODCAST_POPULAR_CATEGORY_SET':
          if (typeof message !== 'undefined') {
            window.podcastObj.popular.channelList = JSON.parse(message)
          }
          break
        case 'PODCAST_PLAYING_SET':
          if (typeof message !== 'undefined') {
            window.podcastObj.playing = JSON.parse(message)
          }
          break
        case 'PODCAST_STYLE_SET':
          if (typeof message !== 'undefined') {
            window.podcastObj.style = JSON.parse(message)
          }
          break
        case 'PODCAST_RUN_MAIN_CARD_GET':
          // 메인카드 실행 여부 세팅 (앱간통신)
          window.podcastObj.isRunMainCard = false
          this.application.postMessage(JSON.stringify(window.podcastObj.isRunMainCard), window.msgObj.aicOrigin + 'PODCAST_RUN_MAIN_CARD_SET', null)
          break
        default:
          break
      }
    },
    // 팟캐스트 이동
    goPodcastClick: function () {
      console.log('[팟빵/sub-1가젯] goPodcastClick')
      // if (window.applicationFramework) {
      //   // 인기방송 화면 표시
      //   this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_POPULAR_SHOW', null)
      // }
      if (window.applicationFramework) {
        // 플레이어 화면 표시
        this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_PLAYER_SHOW', null)
      }
    }
  },
  mounted: function () {
    if (window.applicationFramework) {
      this.application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
    }
    // AIC 초기화
    this.initAIC()
    // 서브가젯 클릭 이벤트 처리
    window.document.addEventListener('click', this.goPodcastClick)
    // 메인카드 실행 여부 세팅 (앱간통신)
    window.podcastObj.isRunMainCard = false
    this.application.postMessage(JSON.stringify(window.podcastObj.isRunMainCard), window.msgObj.aicOrigin + 'PODCAST_RUN_MAIN_CARD_SET', null)
  }
}
</script>

<style lang='scss'>
  @mixin ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  body {
    margin: 0;
  }

  #app.pd_sub1 {
    position: relative;
    width: 411px;
    height: 180px;
    color: #ffffff;
    box-sizing: border-box;
    font-family: Roboto, 'Noto Sans', 'Noto Sans CJK KR';

    .gg_container {
      overflow: hidden;
      position: relative;
      width: 411px;
      height: 180px;
      background:#875de6;
      
      .gg_content {
        position: absolute;
        left: 12px;
        top: 0;
        z-index: 2;
        width: 399px;
        height: 100%;
        padding: 30px;
        box-sizing: border-box;
        
        .equalizer {
          display: inline-block;
          position: relative;
          top: -7px;
          width: 32px;
          height: 32px;
          margin-right: 5px;
          background-image: url('img/equalizer.gif');
          vertical-align: middle;
        }
        
        .title {
          position: relative;
          display: block;
          width: 100%;
          height: 25px;
          line-height: 25px;
          font-size: 21px;
          padding-left: 37px;
          color: rgba(255, 255, 255, 0.8);
          box-sizing: border-box;
          
          i {
            position: absolute;
            left:0 ;
            top: -1px;
            display: block;
            width: 27px;
            height: 27px;
            background: url("img/icon.png");
            font-size: 0;
          }
          
        }
        
        .text {
          display: block;
          width: 100%;
          margin-top: 23px;
          
          .ranking {
            display: inline-block;
            position: relative;
            top: -6px;
            width: 40px;
            height: 30px;
            line-height: 30px;
            font-size: 21px;
            margin-right: 12px;
            text-align: center;
            background-color: #a07cf0;
          }
          
          .episodeTitle {
            display: block;
            width: 100%;
            height: 43px;
            line-height: 43px;
            font-size: 36px;
            @include ellipsis;
            font-weight: 500;
          }
                    
          .smallText {
            display: block;
            margin-top: 2px;
            width: 100%;
            height: 25px;
            line-height: 25px;
            font-size: 21px;
            @include ellipsis;
            font-weight: normal;
            color: rgba(255, 255, 255, 0.5);
          }
        }
        
      }
      
      .dimLayer {
        position: absolute;
        left: 12px;
        top: 0;
        z-index: 1;
        width: 399px;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.65);
      }
      
      img {
        object-fit: cover;
        width: 100%;
        height: 100%;
      }
      
      .gg_thumImg {
        display: block;
        height: 100%;
        margin-left: 12px;
        background-color: rgba(255,255,255,0.9);
        background-repeat: no-repeat;
        background-size: cover;
        background-position: 50% 50%;
      }
      
      &.default {
        background-color: #414959;
        
        .gg_content {
          background: #313948 url('img/bg_default.png') no-repeat 50% 40%;
          
          >p {
            height: 24px;
            text-align: center;
            font-size: 21px;
            color: rgba(255,255,255,0.3);
            padding-top: 55px;
          }
        }
      }
    }
  }
  
</style>
