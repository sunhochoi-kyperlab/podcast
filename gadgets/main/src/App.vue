<template>
  <div id="app" class="pd_main">
    <div :class="['toastPopup', toast.toastClass]" v-show="toast.isToastShow">
      <p>{{ toast.toastContent }}</p>
    </div>
    <i class="clova_logo"></i>
    <div class="top">
      <div class="app_title"><i></i>팟빵 - 최근 재생 에피소드</div>
    </div>
    <div class="middle">
      <div class="controlBox">
        <div class="btnBox">
          <div class="buttons">
            <span :class="['btnPrev', playing.etitle === '' ? 'dis' : '']" @click="prevClick" ref="prev">이전</span>
            <span :class="[style.playClass === 'pause' ? 'btnPause' : 'btnPlay']" @click="playClick" ref="play">재생/정지</span>
            <span :class="['btnNext', playing.etitle === '' ? 'dis' : '']" @click="nextClick" ref="next">다음</span>
          </div>
          <div class="progressBox" v-show="getEtitle() !== ''">
            <div class="time">
              <span class="play">{{ getCurrentTime() }}</span>
              <span class="total">{{ getDuration() }}</span>
            </div>
            <span class="pgBg">
              <span class="play" :style="{ 'width': getNowPos() }"></span>
            </span>
          </div>
        </div>
        <div class="albumImg">
          <span class="dimLayer"></span>
          <img :src="getImageUrl()" v-show="getEtitle() !== ''" ref="imageUrl" @error="imageErrorCheck">
        </div>
      </div>
      <div class="infoBox" v-show="getEtitle() !== ''">
      	<div class="infoBoxWrap">
        	<div class="episode" :class="[style.playClass === 'pause' ? 'playing' : '']"  style="-webkit-box-orient: vertical">
			<span></span>{{ getEtitle() }}
		</div>
        	<div class="channel">{{ getTitle() }}</div>
      	</div>
      </div>
      <div class="infoBox default" v-show="getEtitle() === ''">
        <div class="episode">재생할 에피소드가 없습니다.</div>
        <div class="channel"></div>
      </div>
    </div>
    <div class="bottom">
      <span class="btnGo" @click="goPodcastClick">바로가기</span>  
    </div>
  </div>
</template>

<script>
import '../../../src/components/js/podcastObj'
import { util } from '../../../src/components/js/podcastLib'

let self = this

export default {
  name: 'main',
  components: {
  },
  data: function () {
    return window.podcastObj
  },
  methods: {
    // 이미지 체크
    imageErrorCheck: function (e) {
      // this.$refs['imageUrl'].src = '../../img/img_default.png'
      console.log('imageErrorCheck-main :: ', e)
      let ele = e.currentTarget
      let src = ele.getAttribute('src')
      if (src !== '') {
        ele.removeAttribute('src')
        ele.setAttribute('src', src)
      }
    },
    // 토스트 표시 (3초후 자동 숨김)
    toastShowFn: function (content, toastClass) {
      // 기본값 세팅
      if (typeof toastClass === 'undefined' || toastClass !== 'full') {
        toastClass = ''
      }
      console.log('토스트 표시 : ' + content + ', toastClass : ' + window.podcastObj.toast.toastClass)
      window.podcastObj.toast.isToastShow = true
      window.podcastObj.toast.toastContent = content
      window.podcastObj.toast.toastClass = toastClass
      clearTimeout(window.toast)
      window.toast = setTimeout(function () {
        console.log('토스트 자동숨김 : ' + content)
        window.podcastObj.toast.isToastShow = false
        window.podcastObj.toast.toastContent = ''
        window.podcastObj.toast.toastClass = ''
      }, 3000)
    },
    // 토스트 숨김
    toastHideFn: function () {
      console.log('토스트 숨김 : ')
      window.podcastObj.toast.isToastShow = false
      window.podcastObj.toast.toastContent = ''
      window.podcastObj.toast.toastClass = ''
    },
    // 메인카드 상단영역 해당정보 출력
    getTop: function () {
      if (typeof window.podcastObj.playing.etitle !== 'undefined' && window.podcastObj.playing.etitle !== '') {
        return '최근 재생 에피소드'
      } else {
        return '인기 방송'
      }
    },
    // 현재 재생중인 시간 조회
    getCurrentTime: function () {
      if (window.podcastObj.playing.currentTime !== 'undefined') {
        return window.podcastObj.playing.currentTime
      } else {
        return '00:00'
      }
    },
    // 총 재생 시간 조회
    getDuration: function () {
      if (window.podcastObj.playing.duration !== 'undefined') {
        return window.podcastObj.playing.duration
      } else {
        return '00:00'
      }
    },
    // 시크바 위치
    getNowPos: function () {
      if (window.podcastObj.playing.nowPos !== 'undefined') {
        return window.podcastObj.playing.nowPos
      } else {
        return ''
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
      if (typeof window.podcastObj.playing.title !== 'undefined') {
        return window.podcastObj.playing.title
      } else {
        return ''
      }
    },
    // 이미지 경로 조회
    getImageUrl: function () {
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
    // 이전 클릭
    prevClick: function () {
      self = this
      // 활성화
      util.active(self.$refs['prev'], function () {
        // 에피소드 이전
        self.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_PREV_SET', null)
      })
    },
    // 재생/일시정지
    playClick: function () {
      self = this
      // 활성화
      util.active(self.$refs['play'], function () {
        // 에피소드 재생/일시정지 요청
        self.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_PLAY_PAUSE_SET', null)
      })
    },
    // 다음 클릭
    nextClick: function () {
      self = this
      // 활성화
      util.active(self.$refs['next'], function () {
        // 에피소드 다음
        self.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_NEXT_SET', null)
      })
    },
    // 팟캐스트 앱으로 이동
    goPodcastClick: function () {
      console.log('[팟빵/main가젯] goPodcastClick')
      // 비프음 추가
      util.beep()
      if (window.applicationFramework) {
        // 플레이어 화면 표시
        this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_PLAYER_SHOW_AUTO_PLAY', null)
      }
    },
    // AIC 초기화
    initAIC: function () {
      console.log('[팟빵/main가젯] initAIC')
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
        // 스타일 GET
        this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_STYLE_GET', null)
        // BT Call GET
        this.application.postMessage('', window.msgObj.aicOrigin + 'PODCAST_BTCALL_GET', null)
        window.podcastObj.isRunMainCard = true
        this.application.postMessage(JSON.stringify(window.podcastObj.isRunMainCard), window.msgObj.aicOrigin + 'PODCAST_RUN_MAIN_CARD_SET', null)
      }
    },
    // AIC 이벤트 핸들러
    AICEventHandler: function (message, origin) {
      const filterName = (origin.indexOf('filter-name=') > -1) ? origin.slice(origin.indexOf('filter-name=') + 12) : ''
      console.log('[팟빵/main가젯] filterName: ' + filterName)
      switch (filterName) {
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
        case 'PODCAST_LASTEPISODE_TOAST_SHOW':
          window.podcastObj.toast.show('마지막 에피소드입니다.')
          break
        case 'PODCAST_FIRSTEPISODE_TOAST_SHOW':
          window.podcastObj.toast.show('첫번째 에피소드입니다.')
          break
        case 'PODCAST_RUN_MAIN_CARD_GET':
          window.podcastObj.isRunMainCard = true
          this.application.postMessage(JSON.stringify(window.podcastObj.isRunMainCard), window.msgObj.aicOrigin + 'PODCAST_RUN_MAIN_CARD_SET', null)
          break
        case 'SEND_NETWORK_ERROR_MESSAGE_TO_MAIN_CARD':
          window.podcastObj.toast.show('네트워크 지연(중단)으로 서비스 접속이 어렵습니다. 잠시 후 다시 시도해 주세요.')
          break
        case 'SEND_PLAY_ERROR_MESSAGE_TO_MAIN_CARD':
          window.podcastObj.toast.show('팟캐스트 재생이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.')
          break
        default:
          break
      }
    }
  },
  mounted: function () {
    if (window.applicationFramework) {
      this.application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
    }
    // AIC 초기화
    this.initAIC()
    // 토스트 표시 함수
    window.podcastObj.toast.show = this.toastShowFn
    // 토스트 숨김 함수
    window.podcastObj.toast.hide = this.toastHideFn
    // 메인카드 실행 여부 세팅 (앱간통신)
    window.podcastObj.isRunMainCard = true
    this.application.postMessage(JSON.stringify(window.podcastObj.isRunMainCard), window.msgObj.aicOrigin + 'PODCAST_RUN_MAIN_CARD_SET', null)
  }
}
</script>

<style lang="scss">
  @mixin ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  body {
    margin: 0;
  }

  #app.pd_main {
    position: relative;
    width: 743px;
    height: 650px;
    color: #ffffff;
    padding: 41px 40px 81px;
    font-family: Roboto, 'Noto Sans', 'Noto Sans CJK KR';
    box-sizing: border-box;
    
    .clova_logo {
      display: block;
      position: absolute;
      right: 40px;
      bottom: 30px;
      width: 94px;
      height: 27px;
      background: url('img/logo_lgu.png');
    }

    .top {
      position: relative;
      width: 100%;
      text-align: right;
      height: 27px;
      font-size: 24px;
      color: rgba(255, 255, 255, 0.8);

      .app_title {
        position: absolute;
        left: 0;
        top: 0;
        padding-left: 37px;
        line-height: 27px;
        
        >i {
          position: absolute;
          left: 0;
          top: 0;
          display: inline-block;
          width: 27px;
          height: 27px;
          background: url('img/icon.png');
        }        
      }
    }

    .middle {
      padding: 47px 0 39px;
      
      .controlBox {
        position: relative;
        width: 530px;
        height: 231px;
        margin: 0 auto;
        
        .btnBox {
          position: relative;
          z-index: 1;
          padding-top: 53px;
          box-sizing: border-box;
          
          .buttons {
            width: 100%;
            height: 120px;
            
            span {
              display: block;
              float: left;
              width: 120px;
              height: 120px;
              font-size: 0;
              background-image: url("img/btn_control.png");
              
              &:nth-child(2) {
                margin: 0 85px;
              }
              
              &.btnPrev {
                background-position: 0 -120px;
                
                &:active, &.active {
                  background-position: -120px -120px;
                }
                
                &.dis {
                  pointer-events: none;
                  background-position: -240px -120px;
                }
              }
              
              &.btnPlay {
                background-position: 0 0px;
                
                &:active, &.active {
                  background-position: -120px 0;
                }
                
                &.dis {
                  pointer-events: none;
                  background-position: -240px 0;
                }
              }
              
              &.btnPause {
                background-position: 0 -360px;
                
                &:active, &.active {
                  background-position: -120px -360px;
                }
                
                &.dis {
                  pointer-events: none;
                  background-position: -240px -360px;
                }
              }
              
              &.btnNext {
                background-position: 0 -240px;
                
                &:active, &.active {
                  background-position: -120px -240px;
                }
                
                &.dis {
                  pointer-events: none;
                  background-position: -240px -240px;
                }
              }
            }
          }
          
          .progressBox {
            width: 231px;
            margin: 23px auto 0;
            
            .time {
              span {
                display: inline-block;
                width: 66px;
                height: 25px;
                line-height: 25px;
                text-align: left;
                font-size: 21px;
                color: #eee;
                padding-left: 7px;
                
                &.total {
                  width: auto;
                  padding-right: 7px;
                  text-align: right;
                  float: right;
                }
              }
            }
            
            .pgBg {
              display: block;
              position: relative;
              width: 100%;
              height: 5px;
              margin-top: 5px;
              background-color: #63717d;
              
              .play {
                display: block;
                position: absolute;
                left: 0;
                top: 0;
                height: 5px;
                background-color: #875de6;
              }
            }
          }
        }
        
        .albumImg {
          position: absolute;
          left: 50%;
          top: 0;
          width: 231px;
          height: 231px;
          margin-left: -115.5px;
          background-image: url('img/img_default.png');
          
          .dimLayer {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.65 );
          }
          
          img {
            display: block;
            width: 100%;
            height: 100%;
          }
        }
      }
      
      .infoBox {
        display:table;
        width: 100%;
        height: 171px;
        
        .infoBoxWrap {
          display:table-cell;
          vertical-align:middle;
        }
        .episode {
          overflow:hidden;
          width: 100%;
          max-height: 96px;
          line-height: 48px;
          color: #875de6;
          font-size: 40px;
          font-weight: 600;
          text-align: center;
          box-sizing: border-box;
          text-overflow: ellipsis;          
          display: -webkit-box;
          -webkit-line-clamp: 2;
          word-wrap:break-word;
          word-break: break-all;
          
          >span {
            display: inline-block;
            width: 32px;
            height: 32px;
            margin-right: 14px;
            background: url('img/equalizer.png') no-repeat left 3px;
            
          }
          
          &.playing {
            >span {
              background: url('img/equalizer.gif') no-repeat left 3px;  
            }
          }
        }
        
        .channel {
          margin-top: 5px;
          width: 100%;
          height: 32px;
          line-height: 32px;
          font-size: 27px;
          color: #fff;
          text-align: center;
          @include ellipsis;
        }
        
        &.default {
          display: block;
          
          .episode {
            display:block;
            height: 171px;
            max-height: none;
            line-height: 171px;
            padding: 0;
            font-size: 30px;
            color: rgba(255,255,255,0.3);
            font-weight: 400;
          }
        }
      }
    }

    .bottom {
      position: absolute;
      bottom: 80px;
      width: 663px;
      box-sizing: border-box;
      
      .btnGo {
        display: block;
        width: 184px;
        height: 54px;
        margin: 0 auto;
        background-image: url("img/btn_go.png");
        font-size: 0;
      }
    }
    
    .toastPopup {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 10;
      width: 100%;
      height: 70px;
      background-color: rgba(0, 0, 0, 0.7);
      
      p {
        margin: 0;
        line-height: 70px;
        color: #fff;
        font-size: 22px;
        text-align: center;
      }
    }
  }
</style>
