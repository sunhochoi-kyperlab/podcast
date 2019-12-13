<template>
  <div class="submenu">
    <div class="globalmenu">
      <span class="back" @click="backClick" ref="back"></span>
      <!--span class="menu"></span-->
      <span class="home" @click="homeClick" ref="home"></span>
    </div>
    <div class="submenuList" v-show="(currentPage !== '/searchResult' && currentPage !== '/playlist')">
      <div @click="playerClick" :class="[ currentPage.indexOf('/player') !== -1 ? 'm_playing sel' : 'm_playing', history.episodeList.length === 0 ? 'dis' : '' ]" ref="player"><span>Now Playing<img src="../../img/menuEqualizer.gif" v-show="(style.playClass === 'pause' && history.episodeList.length !== 0)"></span><span class="dim"></span><!--span class="bg_playingAlbum" :style="{'background-image': 'url(' + checkImgUrl(playing) + ')'}"  v-show="(currentPage !== '/player')"></span--></div>
      <ul>
        <li @click="searchClick" :class="['line', currentPage.indexOf('/search') !== -1 ? 'sel' : '' ]" ref="search">Podbbang<br/>Search</li>
        <li @click="historyClick" :class="[ currentPage.indexOf('/history') !== -1 ? 'sel' : '' ]" ref="history">Play List</li>
        <li @click="popularClick" :class="['line', currentPage.indexOf('/popular') !== -1 ? 'sel' : '' ]" ref="popular">Popular<br/>Broadcast</li>
      </ul>
    </div>
  </div>
</template>
<script>
import { logger } from '../js/commonLib'
import { util } from '../js/podcastLib'

let self = this

export default {
  name: 'submenu',
  components: {
  },
  data: function () {
    return window.podcastObj
  },
  methods: {
    // BACK 클릭
    backClick: function (evt) {
      logger.method(this.$router, 'backClick')
      // 선택모드 해제
      window.podcastObj.history.isDelete = false
      self = this
      // 활성화
      util.active(self.$refs['back'], function () {
        // 화면이동
        self.$emit('back', evt)
      })
    },
    // HOME 클릭
    homeClick: function (evt) {
      logger.method(this.$router, 'homeClick')
      // 선택모드 해제
      window.podcastObj.history.isDelete = false
      self = this
      // 활성화
      util.active(self.$refs['home'], function () {
        // 화면이동
        self.$emit('home', evt)
      })
    },
    // 검색 클릭
    searchClick: function () {
      logger.method(this.$router, 'searchClick')
      self = this
      // 활성화
      util.active(self.$refs['search'], function () {
        // 화면이동
        self.editmodeCheck('/search')
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 팟빵 검색 메뉴')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '팟빵 검색 메뉴'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 1, 0, svcDetailInfo)
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
    // 플레이어 클릭
    playerClick: function () {
      logger.method(this.$router, 'playerClick')
      self = this
      // 활성화
      util.active(self.$refs['player'], function () {
        // 화면이동
        self.editmodeCheck('/player')
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 현재 재생 중 메뉴')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '현재 재생 중 메뉴'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 1, 1, svcDetailInfo)
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
    // 히스토리 클릭
    historyClick: function () {
      logger.method(this.$router, 'historyClick')
      self = this
      // 활성화
      util.active(self.$refs['history'], function () {
        // 화면이동
        self.editmodeCheck('/history')
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 히스토리 메뉴')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '히스토리 메뉴'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        if (window.podcastObj.history.sort === 'L') {
          svcDetailInfo.listSort = 'DESC'
        } else if (window.podcastObj.history.sort === 'F') {
          svcDetailInfo.listSort = 'ASC'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 1, 2, svcDetailInfo)
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
    // 인기 방송 클릭
    popularClick: function () {
      logger.method(this.$router, 'popularClick')
      self = this
      // 활성화
      util.active(self.$refs['popular'], function () {
        // 화면이동
        self.editmodeCheck('/popular')
      })
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 인기방송 메뉴')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '인기 방송 메뉴'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        // 본문
        let body = window.serviceLog.getBody('touch', 1, 4, svcDetailInfo)
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
    // 선택모드 체크
    editmodeCheck: function (urlPath) {
      console.log('editmodeCheck')
      if (window.podcastObj.history.isChoice === true) {
        window.podcastObj.toast.show('선택 모드 취소 후 메뉴 이동이 가능합니다.')
      } else {
        this.$router.push(urlPath)
      }
    },
    // 이미지 체크
    checkImgUrl: function (item) {
      return util.checkImgUrl(item)
    }
  },
  mounted () {
    logger.load(this.$router, 'mounted')
  }
}
</script>
<style lang='scss' scoped>
  @import '../../scss/common.scss';

  .submenu {
    overflow: hidden;
    position: absolute;
    left: 0;
    top: 0;    
    height: 100%;
    
    .submenuList {
      position: relative;
      float: right;
      width: 330px;
      height: 100%;
      padding-top: 126px;
      background: #212347;
      
      .m_playing {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 130px;
        box-sizing: border-box;
        border: 4px solid #212347;
        font-size: 33px;
        color: #fff;
        padding-left: 41px;
        line-height: 104px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
         >span {
          position: relative;
          z-index: 3;
        }
          
        .dim {
          display: block;
          position: absolute;
          left: 0;
          top: 0;
          z-index: 2;
          width: 100%;
          height: 100%;
        //   background-color: rgba(0, 0, 0, 0.5);
        }
        
        .bg_playingAlbum {
          display: block;
          position: absolute;
          left: 0;
          top: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
        }
        
        &.sel {
          font-family: 'NotoSansCJKkr-Medium';
          color: #00b1fb;
          
        //   .dim {
        //     background-color: rgba(0, 0, 0, 0.3);
        //   }
        }
        
        &:active, &.active {
          border-color: #3a3d60;
	      background: #3a3d60;
        //   .dim {            
        //     background-color: rgba(124, 107, 245, 0.5);
        //   }
        }
        
        &.dis {
          color: #535353;
	      pointer-events: none;
          
        //   .dim {            
        //     background-color: rgba(0, 0, 0, 0.3);
        //   }
        }
      }
      
      span {
        display: block;
        
        >img {
          margin-left: 24px;
          
          &.iconNew {
            position: relative;
            top: 5px;
            margin-left: 17px;
          }
        }
      }
    }
    
    .topBg {
      display: block;
      position: absolute;
      left: 0;
      top: 126px;
      z-index: 1;
      width: 100%;
      height: 20px;
      background: url('../img/bg_sidemenu_top.png') repeat-x left top;
    }
    
    

    .bottomBg {
      display: block;
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 23px;
      background: url('../img/bg_sidemenu_bottom.png') repeat-x left bottom;
    }
    
    .globalmenu {
      position: relative;
      width: 126px;
      height: 100%;
      float: left;
      background: url('../img/gnb_bg.png') no-repeat 0 0;
      >span {
        display: block;
        position: absolute;
        left: 0;
        width: 125px;
        height: 100px;
        background-image: url('../../img/ico_gnb.png');
        
        &.back {
          top: 13px;
          background-position: 0 1px;
        
          &:active, &.active {
            background-position: -126px 1px;
          }
          
          &.dis {
            background-position: -252px 1px;
	        pointer-events: none;
          }
        }
        
        &.menu {
          top: 50%;
          margin-top: -50px;
          background-position: -125px -200px;
        
          &:active, &.active {
            background-position: -250px -200px;
          }
          
          &.dis {
            background-position: 0 -200px;
          }
        }
        
        &.home {
          bottom: 17px;
          background-position: 1px -100px;
        
          &:active, &.active {
            background-position: -125px -100px;
          }
          
          &.dis {
            background-position: -251px -100px;
	        pointer-events: none;
          }
        }        
      }
    }
    
    ul {
      width: 100%;
      height: 100%;
    }
    
    li {
      position: relative;
      width: 100%;
      height: 130px;
      box-sizing: border-box;
      border: 4px solid #212347;
      font-size: 33px;
      color: #fff;
      padding-left: 41px;
      line-height: 104px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &.line{
        line-height: 39px;
        padding-top:19px;
      }

      &:active, &.active {
        border-color: #3a3d60;
	    background: #3a3d60;
      }
      
      &.dis {
        color: #535353;
	    pointer-events: none;
      }
      
      &.sel {
        font-family: 'NotoSansCJKkr-Medium';
        color: #00b1fb;
      }
    }
  }
</style>