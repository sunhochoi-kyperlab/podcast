<template>
  <div class="wrap" ref="wrap">
    <div class="content" v-show="history.episodeList.length > 0">
      <div class="selectBox">
        <span class="input" @click="sortChange" ref="sort"><em></em>{{ setSortText() }}</span>
        <span :class="['btnEdit', history.episodeList.length === 0 ? 'dis' : '']" @click="historyEditClick" ref="historyEdit">선택</span>
      </div>
      <div class="listBox">
        <obg-scroll-view style='height:469px;'>
        <ul>
          <li v-for="(item,index) in history.episodeList" @click="episodeClick(item, index)" :class="[playing.eid === item.eid ? 'playing' : '']" ref="episode">
            <div class="listInfo">
              <div class="podcastImg">
                <span class="thumbnail">
                  <img :src="checkImgUrl(item)" ref="imageUrl" @error="imageErrorCheck(index)">
                </span>
              </div>
              <div class="podcastInfo">
                <strong class="episodeTitle">{{ getHtmlString(item.etitle) }}</strong>
                <span class="episodeInfo"><span class="update">{{ isToday(item.createdDate) ? '오늘' : '' }} {{ setDate(item.createdDate) }}</span>{{ getHtmlString(item.title) }}</span>
              </div>
            </div>
          </li>
        </ul>
        </obg-scroll-view>
      </div> 
    </div>

    <!-- 히스토리 없음 -->
    <div class="listnone" v-show="history.episodeList.length === 0">
      <div class="content">
        <div class="text">
          <!-- <span class="icon"></span> -->
          <strong>No recently played episodes.</strong>
          <p>Reselect from top shows.</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import popup from './popup'
import scrollView from './scroll-view'
import { logger } from './js/commonLib'
import { audio, storage, util } from './js/podcastLib'

let self = this

export default {
  name: 'history',
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
    // 정렬 순서 텍스트
    setSortText: function () {
      return window.podcastObj.history.sort === 'L' ? '최근 재생 순서' : '오래된 재생 순서'
    },
    // 정렬 순서 변경
    sortChange: function () {
      logger.method(this.$router, 'sortChange')
      self = this
      // 활성화
      util.active(self.$refs['sort'], function () {
        let selectedVal = null
        popup.show({
          type: 'list2',
          title: '정렬 기준',
          listItem: [{
            title: '최근 재생 순서',
            selected: window.podcastObj.history.sort === 'L',
            onClick: function () {
              selectedVal = 'L'
            }
          }, {
            title: '오래된 재생 순서',
            selected: window.podcastObj.history.sort === 'F',
            onClick: function () {
              selectedVal = 'F'
            }
          }],
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
                // 기존에 설정된 값과 다르면
                if (window.podcastObj.history.sort !== selectedVal) {
                  // 값 세팅
                  window.podcastObj.history.sort = selectedVal
                  // 히스토리 정렬
                  util.sortHistory()
                }
                // 팟캐스트 오브젝트 저장
                storage.savePodcastObj()
              }
              // 모든 팝업 닫기
              util.closeAllPopup()
            }
          }]
        })
      })
    },
    // 히스토리 편집 클릭
    historyEditClick: function () {
      logger.method(this.$router, 'historyEditClick')
      self = this
      // 활성화
      util.active(self.$refs['historyEdit'], function () {
        // 플레이어로 편집 화면 이동
        self.$router.push('/historyEdit')
      })
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
          // 플레이어 화면으로 이동
          self.$router.push('/player')
        } else {
          // 재생
          window.podcastObj.ctrl.play(true)
          // 플레이어 화면으로 이동
          self.$router.push('/player')
        }
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 히스토리 재생 요청')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '히스토리 재생'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 0, 1, svcDetailInfo)
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
    // 히스토리 데이터가 있으면
    if (window.podcastObj.history.episodeList.length > 0) {
      // 로딩중
      util.showLoading()
    }
  },
  beforeDestroy () {
    console.log('히스토리 초기화')
    // HTML 엘리먼트 정리
    this.$refs['wrap'].innerHTML = ''
  }
}
</script>
<style lang='scss' scoped>
  @import '../scss/common.scss';

  .content {
    position: relative;
  }
  .selectBox {
  position: relative;
  border-bottom:1px solid #31345f; 
    .input {
      position: relative;
      display: block;
      height: 103px;
      line-height: 70px;
      padding: 21px 45px 12px 134px;
      font-size: 33px;
      color: #fff;
      em{
        display: block;
        width: 70px; 
        height: 70px;
        background: url('../img/icon_selectBox.png') no-repeat ;
        position: absolute;
        left: 45px;
        top: 21px;
      }
      
       &:active, &.active {
        background-color: #3a3d60;
        em{
          background-position: 0 -70px;
        }
      }
    }
    
    .btnEdit {
      display: block;
      font-family: 'NotoSansCJKkr-Medium';
      position: absolute;
      right: 45px;
      top: 16px;
      width: 150px;
      height: 70px;
      line-height: 70px;
      text-align: center;
      font-size: 30px;
      color: #fff;
      background-color:#3c3d4c;
      
      &:active, &.active {
        background-color: #00b1fb;
      }
      
      &.dis {
        color: #6a6a72;
        background-color: #3c3d4c;
      }
    }
  }
  .listBox {    
    li {
      height: 130px;
      padding: 15px 44px; 
      border-bottom:1px solid #31345f; 
      position: relative;
      
      &.playing {
        
        .episodeTitle {
          color: #00b1fb;
        }
        .listInfo .podcastInfo .episodeInfo{
          color: #00b1fb;
          .update::after{
            background-color: #00b1fb;
          }
        }
      }   
      &:active, &.active {
        background-color: #3a3d60;       
        .episodeInfo, .episodeTitle {
          color: #fff !important;
        }
      }
    }
  }
  .listInfo {
    position: relative;
    
    .podcastImg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100px;
      height: 100px;
      
      .thumbnail {
        display: block;
        width: 100px;
        height: 100px;
        background-image: url('../img/icon_default.png');
        
        img {
          width: 100%;
          height: 100%;
        }
      }
    }
    .podcastInfo {
      padding-top: 5px;
      margin-left: 130px;
      
      .episodeTitle {
        display: block;
        padding-right: 15px;
        font-size: 33px;
        font-weight: normal;
        color: #fff;
        line-height: 53px;
        @include ellipsis;
      }
      
      .episodeInfo {
        display: block;
        line-height: 37px;
        font-size: 27px;
        color: #fff;        
        @include ellipsis;
      
        .update {
          position: relative;
          padding-right: 40px;
          
          &:after {
            content: "";
            display: block;
            position: absolute;
            top: 10px;
            right: 20px;
            width: 1px;
            height: 20px;
            background-color: #fff;
          }
        }
      }
    }
  }

  .listnone {
    height: 100%;
    .content {
        display: table;
        width: 100%;
        height: 100%;
    }    
    
    .text {
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      
      .icon {
        display: block;
        width: 100px;
        height: 100px;
        margin: 0 auto;
        background-image: url('../img/icon_listnone.png');        
      }
      
      strong {
        line-height: 63px;
        font-weight: 300;
        font-size: 33px;
        font-weight: normal;
        color: #fff;
      }
      
      p {
        line-height: 57px;
        font-size: 27px;
        color: #969696;
      }
    }
  }

.popup .pop-contents{
  .title{
    padding-bottom: 35px;  
  }
  .popList{
    background-color: transparent;
    li{
      line-height: 90px;
      background-color: #111138;
      &.sel{
        background:#111138 url(./img/icon_select.png) no-repeat 39px 24px; 
      }
    }
  }
} 
</style>
