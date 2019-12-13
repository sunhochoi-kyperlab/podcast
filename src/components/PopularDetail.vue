<template>
  <div class="wrap" ref="wrap">
    <div class="content">
      <div class="podcastInfo">
        <span class="title" v-html="setPodcastTitle()"></span>
				<!-- <span class="bgImg"></span> -->
        <div class="btnBox">
          <span :class="['first', isFirstListenClass()]" @click="firstListenClick" ref="firstListen"></span>
          <span class="subscription" ></span>
        </div>
      </div>
      <div class="listBox">
        <obg-scroll-view style='height:530px;'>
        <ul>
          <li v-for="(item,index) in popular.episodeList" @click="episodeClick(item, index)" ref="episode">
            <div class="listInfo">
              <div class="episodeInfo">
                <strong class="title">{{ getHtmlString(item.etitle) }}</strong>
                <span class="icon" v-show="isToday(item.createdDate)">TODAY</span>
                <div class="updateInfo">
                  <span class="date">{{ isToday(item.createdDate) ? '오늘' : '' }} {{ setDate(item.createdDate) }}</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
        </obg-scroll-view>
      </div>    
      <div class="btnTop"></div>
    </div>
    <!-- 방송명 길이 계산용 더미 -->
    <span class="titleDummy" id="titleDummy">{{ popular.title }}</span>
  </div>
</template>
<script>
import popup from './popup'
import scrollView from './scroll-view'
import { logger } from './js/commonLib'
import { podcastApi, errorMsg } from './js/podcastApi'
import { audio, util } from './js/podcastLib'

// 목록 완료 여부 (true: 목록 데이터 완료)
let isListComplete = false
let self = this

export default {
  name: 'popularDetail',
  components: {
    'obg-scroll-view': scrollView
  },
  data: function () {
    return window.podcastObj
  },
  methods: {
    // 방송명 세팅
    setPodcastTitle: function () {
      let title = ''
      let titleDummy = document.getElementById('titleDummy')
      if (titleDummy !== null) {
        let width = (titleDummy.clientWidth + 1)
        if (width > 550) { // 352 : AM 팟캐스트 기준
          title = '<marquee direction="left" scrollamount="6">' + window.podcastObj.popular.title + '</marquee>'
        } else {
          title = window.podcastObj.popular.title
        }
        console.log('title: ' + title)
        return title
      }
      return ''
    },
    // 첫회 듣기 Class
    isFirstListenClass: function () {
      if (window.podcastObj.popular.episodeList.length > 0) {
        return ''
      } else {
        return 'dis'
      }
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
    // 에피소드 클릭
    episodeClick: function (item, index) {
      logger.method(this.$router, 'episodeClick')
      self = this
      // 활성화
      util.active(self.$refs['episode'][index], function () {
        // 재생할 에피소드가 다르면
        if (window.podcastObj.playing.eid !== item.eid) {
          // 로딩 중 표시
          util.showLoading(false)
          // 조건부 에피소드 목록 초기화
          if (window.podcastObj.playlist._sort === 'F') {
            console.log('이전 목록이 첫회듣기 기반이였기 때문에 인덱스 순서가 다름, 에피소드 목록 리셋 필요')
            window.podcastObj.playlist.episodeList = []
          }
          // [DEV2PRJ-2339] => 인기 방송에서 에피스드 클릭 시는 최신 순으로 목록을 가져옴
          window.podcastObj.playlist._sort = 'L'
          // 에피소드 추가 및 재생
          util.addEpisodePlay(item)
        } else {
          if (window.podcastObj.audioObj.paused) {
            window.podcastObj.audioObj.play(true)
          }
        }
        // 플레이어로 화면 이동
        self.$router.push('/player')
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 인기방송 에피소드 재생 요청')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '인기방송 에피소드 재생'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 0, 3, svcDetailInfo)
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
    // 첫회 듣기
    firstListenClick: function () {
      logger.method(this.$router, 'firstListenClick')
      self = this
      // 활성화
      util.active(self.$refs['firstListen'], function () {
        // 로딩 중 표시
        util.showLoading(false)
        // 방송 내 에피소드 목록 API
        podcastApi.getEpisodeList({
          'token': window.podcastObj.user.token,
          'count': 1,
          'startSeq': 0,
          'pid': window.podcastObj.popular.pid,
          'sort': 'asc'
        }, function (result) {
          console.log(result)
          if (result.data.length > 0) {
            // 방송 아이디 및 타이틀 세팅
            result.data[0].pid = window.podcastObj.popular.pid
            result.data[0].title = window.podcastObj.popular.title
            // 무조건 에피소드 목록 초기화
            window.podcastObj.playlist.episodeList = []
            // [DEV2PRJ-2339] => 첫회 듣기 시에는 에피스도 목록을 오래된 순으로 미리 설정
            window.podcastObj.playlist._sort = 'F'
            // 에피소드 추가 및 재생
            util.addEpisodePlay(result.data[0])
            // 플레이어로 화면 이동
            self.$router.push('/player')
          } else {
            // 모든 팝업 닫기
            util.closeAllPopup()
            // 에러 팝업 표시
            popup.show(errorMsg.getProp(result))
          }
          // 정리
          result = null
        }, function (result) {
          logger.error(result)
          // 모든 팝업 닫기
          util.closeAllPopup()
          // 에러 팝업 표시
          popup.show(errorMsg.getProp(result))
          // 정리
          result = null
        })
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 인기방송 첫회듣기 재생 요청')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '인기방송 첫회듣기 재생'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        svcDetailInfo.isFirstListen = 'Y'
        // 본문
        let body = window.serviceLog.getBody('touch', 0, 3, svcDetailInfo)
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
    // 방송 내 에피소드 목록
    _getEpisodeList: function (isFirst) {
      // isFirst 없으면
      if (typeof isFirst !== 'boolean') {
        isFirst = false
      }
      // 최초 실행이면
      if (isFirst) {
        isListComplete = false
        window.podcastObj.popular.startSeq = 0
      } else {
        // 목록 데이터 완료 여부
        if (isListComplete) {
          console.log('인기채널 에피소드 데이터 완료')
          return
        }
        window.podcastObj.popular.startSeq += 20
      }
      // 로딩 중 표시
      util.showLoading(false)
      // 방송 내 에피소드 목록 API
      podcastApi.getEpisodeList({
        'token': window.podcastObj.user.token,
        'count': 50,
        'startSeq': 0,
        'pid': window.podcastObj.popular.pid
      }, function (result) {
        console.log(result)
        // 최초 실행이면
        if (isFirst) {
          window.podcastObj.popular.episodeList = JSON.parse(JSON.stringify(result.data))
        } else {
          window.podcastObj.popular.episodeList = window.podcastObj.popular.episodeList.concat(JSON.parse(JSON.stringify(result.data)))
        }
        // 방송 아이디 및 타이틀 세팅
        for (let i = 0; i < window.podcastObj.popular.episodeList.length; i++) {
          window.podcastObj.popular.episodeList[i].pid = window.podcastObj.popular.pid
          window.podcastObj.popular.episodeList[i].title = window.podcastObj.popular.title
        }
        // 마지막 페이지 (추가 데이터 없음)
        if (typeof result.isEnd !== 'undefined' && result.isEnd) {
          isListComplete = true
        }
        // 로딩 중 숨김
        util.hideLoading()
        // 정리
        result = null
      }, function (result) {
        logger.error(result)
        // 모든 팝업 닫기
        util.closeAllPopup()
        // 에러 팝업 표시
        popup.show(errorMsg.getProp(result))
        // 정리
        result = null
      })
    }
  },
  mounted () {
    logger.load(this.$router, 'mounted')
    // 인기 에피소드 초기화
    window.podcastObj.popular.episodeList = []
    // 현재 페이지
    window.podcastObj.currentPage = this.$router.history.current.path
    // 오디오 초기화
    audio.init()
    // 토스트 클래스 세팅
    window.podcastObj.toast.toastClass = ''
    // 방송 내 에피소드 목록
    this._getEpisodeList(true)
  },
  beforeDestroy () {
    console.log('인기 방송 에피소드목록 정리')
    // 검색 방송 목록 초기화
    window.podcastObj.popular.episodeList = []
    // HTML 엘리먼트 정리
    this.$refs['wrap'].innerHTML = ''
  }
}
</script>
<style lang='scss' scoped>
  @import '../scss/common.scss';

  .titleDummy {
    position: absolute;
    visibility: hidden;
    height: auto;
    width: auto;
    white-space: nowrap;
    font-size: 40px;
    font-weight: 400;
    letter-spacing: -1.5px;
  }

  .podcastInfo {
    position: relative;
    height: 104px;
    padding: 0 0 0 44px; 
    // border-bottom: 1px solid #31345f;
    
    .title {
      display: block;
	  font-family: 'NotoSansCJKkr-Medium';
      overflow: hidden;
      position:relative;
      width: 390px;
      height: 103px;
      line-height: 103px;
      font-size: 33px;
      color: #fff;
    //   white-space: nowrap;
    //   text-overflow: ellipsis;
    }
		
    .bgImg {
      display: block;
      position: absolute;
      right: 230px;
      top: 0;
      width: 54px;
      height: 119px;
      background-image: url('../img/bg_episode_title.png');
    }
		
    .btnBox {
      position: absolute;
      right: 15px;
      top: 8px;
			
    //   &:before {
    //     content: "";
    //     position: absolute;
    //     left: -10px;
    //     top: 34px;
    //     width: 1px;
    //     height: 52px;
    //     background-color: #514d58;
    //   }
      
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

  .listBox {    
    li {
      height: 130px;
      border-top: 1px solid #31345f;
      padding: 0 47px;
      position: relative;

      &:active, &.active {
        background-color: #3a3d60;   
        .title{
          color: #fff;
        }     
        .updateInfo {
          color: #fff;
        }
      }
    }
  }
  .listInfo {
    
    .episodeInfo {
      
      .title {
        display: block;
        padding-right: 15px;
        font-size: 33px;
        font-weight: normal;
        color: #fff;
        line-height: 47px;
        margin-top: 22px;
        @include ellipsis;
      }
        
      .icon {
        display: block;
	    font-family: 'NotoSansCJKkr-Medium';
        width: 70px;
        height: 25px;
        line-height: 25px;
        text-align: center;
        font-size: 17px;
        background-color: #d7153e;
        color: #fff;
        border-radius: 20px;
        position: absolute;
        left: 5px;
        top: 5px;
      }
      
      .updateInfo {
        width: 100%;
        @include ellipsis;
        font-size: 27px;
        line-height: 39px;
        color: #fff;
      
        .date {
          height: 40px;
          line-height: 40px;
        }
      }
    }
  }
</style>

