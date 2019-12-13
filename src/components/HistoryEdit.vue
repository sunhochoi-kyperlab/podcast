<template>
  <div class="wrap" ref="wrap">
    <div class="content">
      <div class="editBox">
        <div class="checkBox">
          <input type="checkbox" id="allSelect" @click="episodeCheckClick('A')" ref="allSelect">
          <label class="label" for="allSelect"><span></span>전체선택</label>
        </div>
        <div class="btnBox">
          <span @click="episodeDeleteClick" :class="[history.isDelete ? '' : 'dis']" ref="episodeDelete">삭제</span>
          <span @click="editCompleteClick" ref="editComplete">취소</span>
        </div>
      </div>
      <div class="listBox">
        <obg-scroll-view style='height:469px;' :isCheckbox="true"><!--BM 전용 -->
        <ul>
          <li v-for="(item,index) in history.episodeList" :key="index" :class="[style.playClass === 'pause' && playing.eid === item.eid ? 'playing' : '']" ref="episode">
            <label class="listInfo" :for="'check'+index">
              <input type="checkbox" :id="'check'+index" :value="item.eid" class="episodeCheckbox" @click="episodeCheckClick('E')">
              <div class="checkBox">
                <span class="label"><span></span>선택</span>
              </div>

              <div class="podcastImg">
                <span class="thumbnail">
                  <img :src='checkImgUrl(item)' ref="imageUrl" @error="imageErrorCheck(index)">
                </span>
              </div>
              <div class="podcastInfo">
                <strong class="episodeTitle">{{ getHtmlString(item.etitle) }}</strong>
                <span class="episodeInfo"><span class="update">{{ setDate(item.createdDate) }}</span>{{ getHtmlString(item.title) }}</span>
              </div>
            </label>
          </li>
        </ul>
        </obg-scroll-view>
      </div>
    </div>
  </div>
</template>
<script>
import scrollView from './scroll-view'
import { logger } from './js/commonLib'
import { audio, storage, util, appMsg } from './js/podcastLib'

// 체크된 에피소드 문자열 (콤마로 분리)
let checkedEpisodeStr = ''
let self = this

export default {
  name: 'historyEdit',
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
    // 에피소드 체크 여부
    episodeCheckClick: function (item, id) {
      logger.method(this.$router, 'episodeCheckClick')
      // 비프음 처리
      util.beep()
      // 체크박스
      let checkArray = document.getElementsByClassName('episodeCheckbox')
      let checkAll = this.$refs.allSelect
      let checkCount = 0
      checkedEpisodeStr = ''
      // 개별선택 일 경우
      console.log(item)
      console.log(checkArray)
      if (item === 'E') {
        for (let i = 0; i < checkArray.length; i++) {
          if (checkArray[i].checked) {
            checkCount++
            checkedEpisodeStr += (',' + checkArray[i].value)
          } else {
            checkedEpisodeStr = checkedEpisodeStr.replace(',' + checkArray[i].value, '')
          }
        }
        if (checkArray.length !== 0 && checkCount === checkArray.length) {
          checkAll.checked = true
        } else {
          checkAll.checked = false
        }
        // 삭제버튼 활성/비활성
        if (checkCount > 0) {
          window.podcastObj.history.isDelete = true
        } else {
          window.podcastObj.history.isDelete = false
        }
        // 전체선택 일 경우
      } else {
        console.log('전체선택')
        if (checkAll.checked) {
          for (let i = 0; i < checkArray.length; i++) {
            checkArray[i].checked = true
            checkedEpisodeStr += (',' + checkArray[i].value)
          }
          window.podcastObj.history.isDelete = true
        } else {
          for (let i = 0; i < checkArray.length; i++) {
            checkArray[i].checked = false
          }
          checkedEpisodeStr = ''
          window.podcastObj.history.isDelete = false
        }
      }
      console.log('checkedEpisodeStr : ' + checkedEpisodeStr)
    },
    episodeDeleteClick: function () {
      logger.method(this.$router, 'episodeDeleteClick')
      console.log('checkedEpisodeStr : ' + checkedEpisodeStr)
      self = this
      // 활성화
      util.active(self.$refs['episodeDelete'], function () {
        // 에피소트 삭제
        let episodeList = []
        for (let i = 0; i < window.podcastObj.history.episodeList.length; i++) {
          let item = window.podcastObj.history.episodeList[i]
          if (item.eid && checkedEpisodeStr.indexOf(item.eid) === -1) {
            episodeList.push(item)
          }
        }
        let checkArray = document.getElementsByClassName('episodeCheckbox')
        for (let i = 0; i < checkArray.length; i++) {
          checkArray[i].checked = false
        }
        self.$refs.allSelect.checked = false
        window.podcastObj.history.isDelete = false
        // 재생중인 에피소드 삭제 여부
        if (checkedEpisodeStr.indexOf(window.podcastObj.playing.eid) >= 0) {
          let item = {}
          if (window.podcastObj.history.sort === 'L') {
            item = episodeList[0]
          } else {
            item = episodeList[episodeList.length - 1]
          }
          // 일시정지 상태이면
          if (window.podcastObj.audioObj.paused) {
            // 기본정보 세팅
            if (episodeList.length > 0) {
              window.podcastObj.playing.pid = item.pid
              window.podcastObj.playing.title = item.title
              window.podcastObj.playing.eid = item.eid
              window.podcastObj.playing.etitle = item.etitle
              window.podcastObj.playing.fileUrl = item.fileUrl
              window.podcastObj.playing.imageUrl = item.imageUrl
              window.podcastObj.playing.createdDate = item.createdDate
              window.podcastObj.playing.currentTime = '00:00'
              window.podcastObj.playing.currentTimeOrigin = 0
              window.podcastObj.playing.duration = '00:00'
              window.podcastObj.playing.durationOrigin = 0
              window.podcastObj.playing.bufferPos = '0%'
              window.podcastObj.playing.nowPos = '0%'
            }
          } else {
            // 일시정지
            window.podcastObj.ctrl.pause('HISTORY #1')
            // 재생 시간 초기화
//            window.podcastObj.playing.currentTimeOrigin = 0
//            window.podcastObj.playing.duration = '00:00'
//            window.podcastObj.playing.durationOrigin = 0
            // 현재 진행 중 목록 이퀄라이저 안보이기
            window.podcastObj.style.playClass = 'play'
            // 히스토리에 남은 에피소드가 있으면
            if (episodeList.length > 0) {
              let isPlaying = audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2
              if (!isPlaying) {
                // 재생
                audio.play(item)
              }
            }
          }
        }
        // 삭제 후 초기화
        checkedEpisodeStr = ''
        // 삭제 후 에피소드 목록 적용
        window.podcastObj.history.episodeList = episodeList
        // 히스토리가 없으면
        if (window.podcastObj.history.episodeList.length === 0) {
          // 재생중인 정보 초기화
          window.podcastObj.playing = JSON.parse(JSON.stringify(window.templateObj.playing))
          window.podcastObj.audioObj.currentTime = 0
          // 선택모드 해제
          window.podcastObj.history.isChoice = false
          // 오디오 src 초기화
          window.podcastObj.audioObj.removeAttribute('src')
          // 클러스터로 기본값 전송
          if (util.checkAudioFocus()) {
            // audioFocus가 잡혀있을 경우에 전송함
            window.podcastAgent.sendClusterDefaultInfo('MODE')
          }
          // 히스토리 화면 이동
          self.$router.push('/history')
        }
        // 팟캐스트 오브젝트 저장
        storage.savePodcastObj()
        // 스타일 SET
        appMsg.postMessage('PODCAST_STYLE_SET')
        // 재생정보 SET (히스토리 수 전달을 위해서)
        appMsg.postMessage('PODCAST_PLAYING_SET')
        // 히스토리 정보 SET
        appMsg.postMessage('PODCAST_HISTORY_SET')
        // 인기 방송 조회
        util.getPopular()
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 편집모드 삭제 요청')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '편집모드 삭제'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 2, 4, svcDetailInfo)
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
    // 완료 (히스토리 이동)
    editCompleteClick: function () {
      logger.method(this.$router, 'editCompleteClick')
      self = this
      // 활성화
      util.active(self.$refs['editComplete'], function () {
        // 선택모드 해제
        window.podcastObj.history.isChoice = false
        // 히스토리 화면 이동
        self.$router.push('/history')
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
    window.podcastObj.toast.toastClass = ''
    // 선택모드 설정
    window.podcastObj.history.isChoice = true
    // 내 히스토리 데이터가 있으면
    if (window.podcastObj.history.episodeList.length > 0) {
      // 로딩중
      util.showLoading()
    }
  },
  beforeDestroy () {
    console.log('히스토리 편집 정리')
    // HTML 엘리먼트 정리
    this.$refs['wrap'].innerHTML = ''
  }
}
</script>
<style lang='scss' scoped>
  @import '../scss/common.scss';
  
  .content {
    position: relative;
    // padding-top: 181px;
  }
  .editBox {
    width: 100%;
    height: 103px;
    padding: 16px 46px 17px;
    border-top:1px solid #31345f;
    border-bottom:1px solid #31345f;
    
    .checkBox {
      width: 270px;
      position: relative;
      left: 0;
      top: 0;
      
      .label {        
        font-size: 33px;
        color: #fff;
        line-height: 60px;
        padding-left: 89px;
        
        span {
          width: 315px;
        }
      }
    }
    .btnBox {
      position: absolute;
      top: 16px;
      right: 46px;
      
      span {
        display: inline-block;
        width: 150px;
        height: 70px;
        line-height: 70px;
        text-align: center;
        color: #fff;
        font-size: 30px;
	    font-family: 'NotoSansCJKkr-Medium';
        background-color: #3c3d4c;
        margin-left: 10px;
        
        &:active, &.active {          
          background-color: #00b1fb;
        }
                
        &.dis {
          color: #6a6a72;
          background-color: #3c3d4c;          
        }        
      }
    }
  }

  .listBox {    
    li {
      
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
    display: block;
    height: 130px;
    border-bottom: 1px solid #31345f;
    
    input[type="checkbox"] {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 2;
    }

    .podcastImg {
      position: absolute;
      top: 15px;
      left: 135px;
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
      padding-top: 16px;
      margin-left: 265px;
      
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
  .checkBox {
    overflow: hidden;
    position: absolute;
    left: 46px;
    top: 34px;
    
    .label {
      display: block;
      font-size: 0;
      background: url("../img/btn_checkbox2.png") no-repeat;
      z-index: 1;      
      padding-left: 60px;
      height: 60px;    
    }    

    input:checked + .label {
        background-position: 0 -60px;
    }

    input.dis + .label {
        background-position: 0 -120px;
    }
  }
  input[type="checkbox"] {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    z-index: 99;
  }      
  input:checked + .checkBox .label {
    background-position: 0 -60px;
  }

  input.dis + .checkBox .label {
    background-position: 0 -120px;
  }
</style>
