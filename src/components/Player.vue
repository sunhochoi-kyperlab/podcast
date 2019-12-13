<template>
  <div class="wrap" ref="wrap">
    <div class="content">
      <div class="potcastInfo">
        <!-- <span class="thumnail"><img :src="checkImgUrl(playing)" ref="imageUrl" @error="imageErrorCheck"></span> -->
        <div class="btnBox">
          <span class="subscription" ></span>
        </div>
        <div class="title">
          <p class="channel"><span class="title">{{ getHtmlString(playing.title) }}</span>{{ isToday(playing.createdDate) ? '오늘' : '' }} {{ setDate(playing.createdDate) }}</p>
          <strong class="episode" style="-webkit-box-orient: vertical">{{ getHtmlString(playing.etitle) }}</strong>
        </div>        
      </div>
      <obg-progress></obg-progress>
      <div class="controller">
        <ul>
          <li @click="prevClick" :class="['prev']" ref="prev"></li>
          <li @click="playClick" :class="[style.playClass === '' ? 'play' : style.playClass]" ref="play"></li>
          <li @click="nextClick" :class="['next']" ref="next"></li>
          <!-- <li @click="playlistClick" :class="['playlist']" ref="playlist"></li> -->
        </ul>
      </div>
    </div>
  </div>
</template>
<script>
import { logger } from './js/commonLib'
import { audio, util } from './js/podcastLib'
import progressBar from './Progress'

let self = this

export default {
  name: 'player',
  components: {
    obgProgress: progressBar
  },
  data: function () {
    return window.podcastObj
  },
  methods: {
    // 이미지 체크
    imageErrorCheck: function (e) {
      console.log('imageErrorCheck-player :: ', e)
      let ele = e.currentTarget
      let src = ele.getAttribute('src')
      if (src !== '') {
        ele.removeAttribute('src')
        ele.setAttribute('src', src)
      }
    },
    // 이미지 체크
    checkImgUrl: function (item) {
      return util.checkImgUrl(item)
    },
    // HTML 특수 문자를 HTML 태그로 변환
    getHtmlString: function (rawData) {
      return util.getHtmlString(rawData)
    },
    // 날짜 포멧팅
    setDate: function (rawDate) {
      return util.setDate(rawDate)
    },
    // 오늘 여부 표시
    isToday: function (rawDate) {
      return util.isToday(rawDate)
    },
    // 이전 클릭
    prevClick: function () {
      logger.method(this.$router, 'prevClick')
      self = this
      // 활성화
      util.active(self.$refs['prev'], function () {
        // 이전
        window.podcastObj.ctrl.prev()
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 현재 재생 중 이전 (prevClick)')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '이전 버튼 실행'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 2, 0, svcDetailInfo)
        // 로그
        logger.serviceLog(body)
        // 전송
        window.serviceAgent.set('sa_appLog', body, function (success) {
          console.log(success)
        }, function (error) {
          console.log(error)
        })
      }
    },
    // 재생/일시정지 클릭
    playClick: function () {
      logger.method(this.$router, 'playClick')
      self = this
      // 활성화
      util.active(self.$refs['play'], function () {
        // 재생/일시정지
        if (window.podcastObj.audioObj.paused) {
          window.podcastObj.ctrl.play(true)
        } else {
          window.podcastObj.ctrl.pause('PLAYER #1')
        }
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 현재 재생 중 재생/일시정지 (playClick)')
        let svcDetailInfo = {}
        let item = 0
        // 재생/일시정지
        if (window.podcastObj.audioObj.paused) {
          svcDetailInfo.svcItem = '재생 버튼 실행'
          item = 3
        } else {
          svcDetailInfo.svcItem = '일시정지 버튼 실행'
          item = 2
        }
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        svcDetailInfo.title = window.podcastObj.playing.title
        svcDetailInfo.episode = window.podcastObj.playing.etitle
        // 본문
        let body = window.serviceLog.getBody('touch', 2, item, svcDetailInfo)
        // 로그
        logger.serviceLog(body)
        // 전송
        window.serviceAgent.set('sa_appLog', body, function (success) {
          console.log(success)
        }, function (error) {
          console.log(error)
        })
      }
    },
    // 다음 클릭
    nextClick: function () {
      logger.method(this.$router, 'nextClick')
      self = this
      // 활성화
      util.active(self.$refs['next'], function () {
        // 다음
        window.podcastObj.ctrl.next()
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 현재 재생 중 다음 (nextClick)')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '다음 버튼 실행'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 2, 1, svcDetailInfo)
        // 로그
        logger.serviceLog(body)
        // 전송
        window.serviceAgent.set('sa_appLog', body, function (success) {
          console.log(success)
        }, function (error) {
          console.log(error)
        })
      }
    },
    // 재생목록 클릭
    playlistClick: function () {
      logger.method(this.$router, 'playlistClick')
      self = this
      // 활성화
      util.active(self.$refs['playlist'], function () {
        self.$router.push('/playlist')
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 재생목록 메뉴')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '재생 목록 메뉴'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        if (window.podcastObj.playlist.sort === 'L') {
          svcDetailInfo.listSort = 'DESC'
        } else if (window.podcastObj.playlist.sort === 'F') {
          svcDetailInfo.listSort = 'ASC'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 1, 3, svcDetailInfo)
        // 로그
        logger.serviceLog(body)
        // 전송
        window.serviceAgent.set('sa_appLog', body, function (success) {
          console.log(success)
        }, function (error) {
          console.log(error)
        })
      }
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
    // 플레이헤드
    self = this
  },
  beforeDestroy () {
    console.log('플레이어 정리')
    // HTML 엘리먼트 정리
    this.$refs['wrap'].innerHTML = ''
  }
}
</script>
<style lang='scss' scoped>
  @import '../scss/common.scss';

  .content {
    position: relative;
    height: 100%;
    margin: 0 45px;
    padding-top: 154px;
  }
  
  .potcastInfo {
    // position: relative;
    height: 156px;
    // padding: 21px 0 21px 220px;
    margin-bottom: 72px;
    
    .thumnail {
      position: absolute;
      left: 0;
      top: 0;
      width: 193px;
      height: 193px;
      background: rgb(173, 173, 173) url('../img/icon_default.png') no-repeat 50% 50%;
      
      img {
        width: 100%;
        height: 100%;
      }
    }    
    
    .episode {
      text-overflow: ellipsis;
      display: block;
    //   display: -webkit-box;
    //   -webkit-line-clamp: 2;
      white-space: nowrap;
      height: 56px;
      line-height: 56px;
      overflow: hidden;
      font-size: 40px;
      color: #f9f9f9;
      word-break: break-all;
      font-family: 'NotoSansCJKkr-Medium';
      margin-top: 19px;
    }
    
    .channel {
      overflow: hidden;
      line-height: 45px;
      font-size: 30px;
      color: #acacac;
      
      .title {
        display: block;
        position: relative;
        // float: left;
        // max-width: 291px;
        // padding-right: 40px;
        @include ellipsis;
        
        // &:after {
        //   display: block;
        //   content: "";
        //   position: absolute;
        //   top: 11px;
        //   right: 19px;
        //   width: 1px;
        //   height: 20px;
        //   background-color: #999;
        // }
      }
    } 
    
    .btnBox {
      position: absolute;
      right: 0;
      top: 28px;

      >span {
        display: block;
        float: left;
        height: 90px;
        background-image: url('../img/btn_subscrip.png');
        margin-left: 10px;
        
        &.first {
          width: 150px;
          background-position: 0 0;          
          
          &:active, &.active {
            background-position: 0 -90px;
          }          
          
          &.dis {
            background-position: 0 180px;
          }
        }
        
        &.subscription {
          width: 210px;
          background-position: -150px 0;        
          
          &:active, &.active {
            background-position: -150px -90px;
          }          
          
          &.dis {
            background-position: -150px -180px;
          }
          
          &.cancel {
            background-position: -360px 0;       
            
            &:active, &.active {
              background-position: -360px -90px;
            }          
            
            &.dis {
              background-position: -360px -180px;
            }
          }
        }
      }
    }   
  }
  .controller {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 157px;
    
    ul {
      position: relative;
      width: 100%;
      height: 80px;
    }

    li {
      position: absolute;
      top: 0;
      width: 80px;
      height: 80px;
      background-image: url('../img/icon_playlist.png');
      
      &:first-child {
       // margin-left: 0;
      }
      
      &.prev {
        left: 132px;
        background-position: 0 -160px;
        
        &:active, &.active {
          background-position: -80px -160px;
        }
        &.dis {
          background-position: -160px -160px;
        }
      }
      
      &.play {
        left: 300px;
        background-position: 0 0;
        
        &:active, &.active {
          background-position: -80px 0px;
        }
        &.dis {
          background-position: -160px 0px;
        }
      }
      
      &.pause {
        left: 300px;
        background-position: 0 -80px;
        
        &:active, &.active {
          background-position: -80px -80px;
        }
        &.dis {
          background-position: -160px -80px;
        }
      }
      
      &.next {
        left: 468px;
        background-position: 0 -240px;
        
        &:active, &.active {
          background-position: -80px -240px;
        }
        &.dis {
          background-position: -160px -240px;
        }
      }
			
      &.playlist {
        left: 633px;
        background-position: 0 -480px;
        
        &:active, &.active {
          background-position: -120px -480px;
        }
        &.dis {
          background-position: -240px -480px;
        }
      }
    }
  }
</style>
