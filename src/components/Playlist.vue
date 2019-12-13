<template>
  <div class="wrap" ref="wrap">
    <div class="content">
      <div class="podcastInfo">
        <strong class="title">재생목록</strong>
        <!-- <div class="btnBox">
          <span class="btnsort" @click="sortChange" ref="sort">{{ playlist._sort === 'F' ? '오래된 순' : '최신순' }}</span>
        </div> -->
      </div>
      <div class="listBox">
        <obg-scroll-view 
          style='height:530px;'
          :scrollIndex="getEpisodeIndex()"
          ref="scroll-view">
        <ul>
          <li 
            v-for="(item,index) in playlist._episodeList" 
            :key="index" 
            @click="episodeClick(item, index)" 
            :class="[playing.eid === item.eid ? 'playing': '']" 
            ref="episode">
            <div class="listInfo">
              <div class="podcastImg">
                <span :class="['btnControl', style.playClass === 'pause' ? '' : 'pause']"></span> <!-- 일시정지일 경우 pause 클래스 추가 -->
                <span class="progress">
                  <span class="now" :style="{ 'width': playing.nowPos }"></span>
                </span>
                <span class="thumbnail">
                  <i class="dim"></i>
                  <img :src='checkImgUrl(item)' ref="imageUrl" @error="imageErrorCheck(index)">
                </span>
              </div>
              <div class="episodeInfo">
                <strong class="title">{{ getHtmlString(item.etitle) }}</strong>
                <div class="updateInfo">
                  <span class="icon" v-show="isToday(item.createdDate)">TODAY</span>
                  <span class="date">{{ isToday(item.createdDate) ? '오늘' : '' }} {{ setDate(item.createdDate) }}</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
        </obg-scroll-view>
      </div>
    </div>	
    
  </div>
</template>
<script>
import popup from './popup'
import scrollView from './scroll-view'
import { logger } from './js/commonLib'
import { podcastApi, errorMsg } from './js/podcastApi'
import { audio, storage, util } from './js/podcastLib'

// 목록 완료 여부 (true: 목록 데이터 완료)
let isListComplete = false
let self = this

export default {
  name: 'playlist',
  components: {
    'obg-scroll-view': scrollView
  },
  data: function () {
    return window.podcastObj
  },
  methods: {
    // 이미지 체크
    imageErrorCheck: function (index) {
      this.$refs['imageUrl'][index].src = '/img/icon_default.png'
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
    getEpisodeIndex () {
      // template에서 data의 playlist.episodeIndex를 반환하면 episodeIndex의 변경감지를 하지못함
      let num = JSON.stringify(window.podcastObj.playlist.episodeIndex)
      return parseInt(num)
    },
    // 에피소드 클릭
    episodeClick: function (item, index) {
      logger.method(this.$router, 'episodeClick')
      window.podcastObj.toast.toastClass = 'full'
      self = this
      // 활성화
      util.active(self.$refs['episode'][index], function () {
        // 재생할 에피소드가 다르면
        if (window.podcastObj.playing.eid !== item.eid) {
          // 로딩 중 표시
          util.showLoading(false)
          // [DEV2PRJ-2339] => 로컬 목록을 재생 목록에 할당
          // console.log('로컬 목록을 재생 목록에 할당')
          // window.podcastObj.playlist.episodeList = window.podcastObj.playlist._episodeList
          // window.podcastObj.playlist.sort = window.podcastObj.playlist._sort
          // 에피소드 추가 및 재생
          util.addEpisodePlay(item)
        } else {
          // 일시정지 중이면
          if (window.podcastObj.audioObj.paused) {
            // 재생
            window.podcastObj.ctrl.play(true)
          } else {
            // 일시정지
            window.podcastObj.ctrl.pause('PLAYLIST #1')
          }
        }
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 재생목록 재생 요청')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '재생목록 재생'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 0, 2, svcDetailInfo)
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
    // 정렬 변경
    sortChange: function () {
      logger.method(this.$router, 'sortChange')
      self = this
      // 활성화
      util.active(self.$refs['sort'], function () {
        let selectedVal = null
        let listItem = [
          {
            title: '최신순',
            selected: window.podcastObj.playlist._sort === 'L',
            onClick: function (idx) {
              selectedVal = 'L'
            }
          }, {
            title: '오래된 순',
            selected: window.podcastObj.playlist._sort === 'F',
            onClick: function (idx) {
              selectedVal = 'F'
            }
          }
        ]
        popup.show({
          type: 'list',
          title: '정렬 기준',
          listItem: listItem,
          buttons: [{
            label: '취소',
            onClick: function () {
              // 모든 팝업 닫기
              util.closeAllPopup()
            }
          }, {
            label: '확인',
            onClick: function () {
              if (selectedVal !== null) {
                // 값 세팅
                window.podcastObj.playlist._sort = selectedVal
                // 팟캐스트 오브젝트 저장
                storage.savePodcastObj()
              }
              // TODO:
              if (selectedVal === 'L') { // 최신순
                console.log('sort by latest')
                window.podcastObj.playlist._episodeList.sort((a, b) => a.createdDate < b.createdDate ? 1 : -1)
              } else if (selectedVal === 'F') { // 오래된 순
                console.log('sort by oldest')
                window.podcastObj.playlist._episodeList.sort((a, b) => a.createdDate > b.createdDate ? 1 : -1)
              }
              // 방송 내 에피소드 목록
              // self._getEpisodeList(true)
              // 모든 팝업 닫기
              util.closeAllPopup()
              // 스크롤뷰 초기화
              if (self.$refs.playlistScrollView) {
                self.$refs.playlistScrollView.init()
              }
            }
          }]
        })
      })
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
        window.podcastObj.playlist.startSeq = 0
      } else {
        // 목록 데이터 완료 여부
        if (isListComplete) {
          console.log('인기채널 에피소드 데이터 완료')
          return
        }
        window.podcastObj.playlist.startSeq += 20
      }
      // 로딩 중 표시
      util.showLoading(false)
      // 방송 내 에피소드 목록 API
      podcastApi.getEpisodeList({
        'token': window.podcastObj.user.token,
        'count': 50,
        'startSeq': 0,
        'pid': window.podcastObj.playing.pid,
        'sort': window.podcastObj.playlist._sort === 'F' ? 'asc' : 'desc'
      }, function (result) {
        console.warn('현 시나리오상 Playlist.vue에서는 ajax 호출이 필요없어야 정상')
        console.log(result)
        // 방송 아이디 및 타이틀
        window.podcastObj.playlist.pid = window.podcastObj.playing.pid
        window.podcastObj.playlist.title = window.podcastObj.playing.title
        // 최초 실행이면
        if (isFirst) {
          window.podcastObj.playlist.episodeList = JSON.parse(JSON.stringify(result.data))
          window.podcastObj.playlist._episodeList = JSON.parse(JSON.stringify(result.data))
        } else {
          window.podcastObj.playlist._episodeList = window.podcastObj.playlist._episodeList.concat(JSON.parse(JSON.stringify(result.data)))
        }
        // 방송 아이디 및 타이틀 세팅
        for (let i = 0; i < window.podcastObj.playlist._episodeList.length; i++) {
          window.podcastObj.playlist._episodeList[i].pid = window.podcastObj.playlist.pid
          window.podcastObj.playlist.episodeList[i].pid = window.podcastObj.playlist.pid
          window.podcastObj.playlist._episodeList[i].title = window.podcastObj.playlist.title
          window.podcastObj.playlist.episodeList[i].title = window.podcastObj.playlist.title
        }

        // episodeIndex 세팅
        util.updateEpisodeIndex(Object.assign({}, window.podcastObj.playing))
        // 마지막 페이지 (추가 데이터 없음)
        if (typeof result.isEnd !== 'undefined' && result.isEnd) {
          isListComplete = true
        }
        // 로딩 중 숨김
        util.hideLoading()
        result = ''
      }, function (result) {
        logger.error(result)
        // 모든 팝업 닫기
        util.closeAllPopup()
        // 에러 팝업 표시
        popup.show(errorMsg.getProp(result))
      })
    }
  },
  mounted () {
    logger.load(this.$router, 'mounted')
    // 현재 페이지
    window.podcastObj.currentPage = this.$router.history.current.path
    // 오디오 초기화
    audio.init()
    // 토스트 클래스 세팅
    window.podcastObj.toast.toastClass = 'full'
    console.log('window.podcastObj.playlist.episodeList.length : ' + window.podcastObj.playlist.episodeList.length)
    console.log('window.podcastObj.playlist.pid : ' + window.podcastObj.playlist.pid + ' // ' + 'window.podcastObj.playing.pid : ' + window.podcastObj.playing.pid)
    /**
     * [DEV2PRJ-2339]
     * - 재생목록은 ajax 호출을 하지 않고, 현재 재생 중인 목록을 표시함
     */
    // 재생목록이 없거나, 현재 방송과 다르면
    if (window.podcastObj.playlist.episodeList.length === 0 || window.podcastObj.playlist.pid !== window.podcastObj.playing.pid) {
      // 방송 내 에피소드 목록
      this._getEpisodeList(true)
    } else {
      console.log('get stated episodeList, sort by createdDate : 항상 최신순 정렬')
      window.podcastObj.playlist._episodeList = Object.assign([], window.podcastObj.playlist.episodeList)
      window.podcastObj.playlist._episodeList.sort((a, b) => a.createdDate < b.createdDate ? 1 : -1)
      console.log('first episode:', window.podcastObj.playlist._episodeList[0].etitle)
      console.log('last episode:', window.podcastObj.playlist._episodeList[window.podcastObj.playlist._episodeList.length - 1].etitle)
      // episodeIndex 세팅
      util.updateEpisodeIndex(Object.assign({}, window.podcastObj.playing))
    }
    // 현재 재생 중인 에피소드로 scroll
    this.$nextTick(() => {
      let newElement = this.$el.querySelector('.playing')
      if (newElement) {
        this.$refs['scroll-view'].scrollToElementVisible(newElement)
      }
    })
  },
  beforeDestroy () {
    /**
     * [DEV2PRJ-2339] => 불필요한 episodelist ajax 호출을 줄이기 위해, playlist.episodeList의 상태값을 유지합니다.
     * i.e., 재생 목록 정리를 하지 않음, 아래 코드 주석 처리
     */
    // console.log('재생 목록 정리')
    // 검색 방송 목록 초기화
    // window.podcastObj.playlist._episodeList = []
    // HTML 엘리먼트 정리
    this.$refs['wrap'].innerHTML = ''
  }
}
</script>
<style lang='scss' scoped>
  @import '../scss/common.scss';

	.wrap {
		padding-left: 125px;
	}

  .podcastInfo {
    position: relative;
    height: 120px;
    padding: 30px 0 0 60px; 
    border-bottom: 1px solid rgba(255,255,255,0.07);
    
    .title {
      display: block;
      overflow: hidden;
      position:relative;
      width: 550px;
      height: 60px;
      line-height: 60px;
      font-size: 40px;
      font-weight: 400;
      color: #fff;
      letter-spacing: -1.5px;
    }
		
    .btnBox {
      position: absolute;
      right: 0;
      top: 0;
      padding: 15px 31px 0 0;
			
			>span {
        display: block;
        width: 231px;
        height: 80px;
        font-size: 27px;
        font-weight: 900;
        color: #fff;
        line-height: 80px;
        padding-left: 32px;
        background: rgba(255, 255, 255, 0.1) url('../img/icon_selectBox.png') no-repeat 176px 50%;
        border: 1px solid rgba(255, 255, 255, 0.2);

        &:active {
          background-color: #504691;
          border: 1px solid #504691;
        }
      }
    }
  }

  .listBox {    
    li {
      height: 150px;
      padding: 20px 60px;

      &:active, &.active {
        background-color: $selbgColor;        
        .updateInfo {
          color: #fff;
        }
      }
			
			&.playing {
        .dim {
          display: block !important;
        }
        
        .progress {
          display: block !important;
        }
        
        .equalizer {
          display: inline-block !important;
        }
        
        .title {
          color: $pointColor;
          font-weight: bold;
        }
        
        .btnControl {
          display: block;
          position: absolute;
          left: 0;
          top: 0;
          z-index: 10;
          width: 100%;
          height: 100%;
          background-image: url("../img/btn_listControl.png");
          background-position: 0 0;
          
          &:active, &.active {
            background-position: -110px 0;
          }
          
          &.dis {
            background-position: -220px 0;
          }
          
          &.pause {
            background-position: 0 -110px;
            
            &:active, &.active {
              background-position: -110px -110px;
            }
            
            &.dis {
              background-position: -220px -110px;
            }
          }
        } 
      }
      
      &:active, &.active {
        .title {
          color: #fff !important;
        }
      }
    }
  }

  .listInfo {
    position: relative;
    height: 130px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
		
		.podcastImg {
      position: absolute;
      top: 0;
      left: 0;
      width: 110px;
      height: 110px;
      
      .progress {
        display: none;
        position: absolute;
        left: 0;
        bottom: 0;
        z-index: 10;
        width: 100%;
        height: 8px;
        background-color: rgba(113, 113, 113, 1);

        .now {
          display: block;
          position: absolute;
          left: 0;
          bottom: 0;
          z-index: 11;
          height: 8px;
          background-color: $pointColor;
        }
      }
      
      .thumbnail {
        display: block;
        width: 110px;
        height: 110px;
        background-image: url('../img/icon_default.png');
        
        .dim {
          display: none;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        img {
          width: 100%;
          height: 100%;
        }
      } 
    }
    
    .episodeInfo {
      padding-top: 8px;
			margin-left: 143px;
      
      .title {
        display: block;
        padding-right: 15px;
        font-size: 36px;
        font-weight: normal;
        color: #fff;
        line-height: 50px;
        @include ellipsis;
      }
      
      .updateInfo {
        width: 100%;
        @include ellipsis;
        font-size: 27px;
        color: #999;
        
        .icon {
          display: inline-block;
          width: 103px;
          height: 40px;
          margin-right: 20px;
          line-height: 40px;
          text-align: center;
          font-size: 27px;
          background-color: $pointColor;
          color: #fff;
          letter-spacing: -1px;
          font-weight: bold;
        }
      
        .date {
          height: 40px;
          line-height: 40px;
        }
      }
    }
  }
</style>

