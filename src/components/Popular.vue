<template>
  <div class="wrap" ref="wrap">
    <div class="content">
      <div class="selectBox">
        <span class="input" @click="categoryChange" ref="category"><em></em>{{popular.category}}</span>
      </div>
      <div class="listBox">
        <obg-scroll-view style='height:469px;' @scrollEndMax="getPopular" ref="popularScrollView" v-if="popular.channelList.length > 0">
        <ul>
          <li v-for="(item,index) in popular.channelList" @click="channelClick(item, index)" ref="channel">
            <div class="listInfo">
              <div class="podcastImg">
                <span class="rank">{{ (index + 1) < 10 ? '0'+ (index + 1) : (index + 1) }}</span>
                <span class="thumbnail"><img :src="item.imageUrl" v-show="item.imageUrl !== ''" ref="imageUrl" @error="imageErrorCheck(index)"></span>
              </div>
              <div class="podcastInfo">
                <strong class="podcastTitle">{{ getHtmlString(item.title) }}</strong>
                <span class="categoryInfo"><span class="title">카테고리</span>{{ item.category }}</span>
              </div>
            </div>
            <em></em>
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
import { audio, storage, util, appMsg } from './js/podcastLib'

// 목록 완료 여부 (true: 목록 데이터 완료)
let isListComplete = false
let self = this

export default {
  name: 'popular',
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
    // HTML 특수 문자를 HTML 태그로 변환
    getHtmlString: function (rawData) {
      return util.getHtmlString(rawData)
    },
    // 날짜 포멧팅
    setDate: function (rawDate) {
      return util.setDate(rawDate)
    },
    // 카테고리 변경
    categoryChange: function () {
      logger.method(this.$router, 'categoryChange')
      self = this
      // 활성화
      util.active(self.$refs['category'], function () {
        // 카테고리 목록 체크
        if (window.podcastObj.popular.categoryList.length === 0) {
          // 카테고리 목록
          podcastApi.getCategory({
            'count': 30
          }, function (result) {
            console.log(result)
            window.podcastObj.popular.categoryList = JSON.parse(JSON.stringify(result.data))
            window.podcastObj.popular.categoryList.unshift({'category': '종합'})
            // 카테고리 변경 호출
            self.categoryChange()
            // 정리
            result = null
          }, function (result) {
            logger.error(result)
            // 에러 팝업 표시
            popup.show(errorMsg.getProp(result))
            // 정리
            result = null
          })
          return
        }
        let selectedVal = null
        let listItem = []
        for (let i = 0; i < window.podcastObj.popular.categoryList.length; i++) {
          let item = {
            title: window.podcastObj.popular.categoryList[i].category,
            selected: window.podcastObj.popular.category === window.podcastObj.popular.categoryList[i].category,
            onClick: function (idx) {
              selectedVal = window.podcastObj.popular.categoryList[idx].category
            }
          }
          listItem.push(item)
        }
        popup.show({
          type: 'list',
          title: '카테고리 선택',
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
                window.podcastObj.popular.category = selectedVal
                // 팟캐스트 오브젝트 저장
                storage.savePodcastObj()
              }
              // 인기 방송 목록
              self.getPopular(true)
              // 모든 팝업 닫기
              util.closeAllPopup()
              // 스크롤뷰 초기화
              if (self.$refs.popularScrollView) {
                self.$refs.popularScrollView.init()
              }
            }
          }]
        })
      })
    },
    // 방송 클릭
    channelClick: function (item, index) {
      logger.method(this.$router, 'channelClick : pid : ' + item.pid)
      self = this
      // 활성화
      util.active(self.$refs['channel'][index], function () {
        // 방송 정보 세팅
        window.podcastObj.popular.title = item.title
        window.podcastObj.popular.pid = item.pid
        // 페이지 이동
        self.$router.push('/popularDetail')
      })
    },
    // 인기 방송 목록
    getPopular: function (isFirst) {
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
          console.log('인기 방송 목록 데이터 완료')
          return
        }
        window.podcastObj.popular.startSeq += 20
      }
      // 로딩 중 표시
      util.showLoading(false)
      // 카테고리별 인기 방송 API
      podcastApi.getPopular({
        'count': 20,
        'startSeq': window.podcastObj.popular.startSeq,
        'category': window.podcastObj.popular.category
      }, function (result) {
        console.log(result)
        // 최초 실행이면
        if (isFirst) {
          window.podcastObj.popular.channelList = JSON.parse(JSON.stringify(result.data))
        } else {
          window.podcastObj.popular.channelList = window.podcastObj.popular.channelList.concat(JSON.parse(JSON.stringify(result.data)))
        }
        // 마지막 페이지 (추가 데이터 없음)
        if (typeof result.isEnd !== 'undefined' && result.isEnd) {
          isListComplete = true
        }
        // 에피소드 조회
        if (window.podcastObj.popular.channelList.length > 0) {
          podcastApi.getEpisodeList({
            'token': window.podcastObj.user.token,
            'count': 1,
            'startSeq': 0,
            'pid': window.podcastObj.popular.channelList[0].pid
          }, function (result) {
            // 인기 방송 상세 목록 체크
            if (typeof result.data !== 'undefined' && result.data.length > 0) {
              // 인기 방송 상세 목록 세팅
              // window.podcastObj.popular.episodeList = result.data
//              window.podcastObj.popular.episodeList[0].pid = window.podcastObj.popular.channelList[0].pid
//              window.podcastObj.popular.episodeList[0].title = window.podcastObj.popular.channelList[0].title
              window.podcastObj.popular.pid = window.podcastObj.popular.channelList[0].pid
              window.podcastObj.popular.title = window.podcastObj.popular.channelList[0].title
              // 인기방송 SET
              appMsg.postMessage('PODCAST_POPULAR_SET')
            } else {
              console.log(result)
            }
            // 정리
            result = null
          }, function (result) {
            console.log(result)
            // 정리
            result = null
          })
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
    // 현재 페이지
    window.podcastObj.currentPage = this.$router.history.current.path
    // 오디오 초기화
    audio.init()
    // 토스트 클래스 세팅
    window.podcastObj.toast.toastClass = ''
    // 인기 방송 목록 (최초실행)
    this.getPopular(true)
  },
  beforeDestroy () {
    console.log('인기 방송 채널목록 정리')
    // 검색 방송 목록 초기화
    window.podcastObj.popular.channelList = []
    // HTML 엘리먼트 정리
    this.$refs['wrap'].innerHTML = ''
  }
}
</script>
<style lang='scss' scoped>
  @import '../scss/common.scss';

  .content {
    height: 104px;
    border-top:1px solid #31345f;
  }
  
  .selectBox {
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
  }
  .listBox {    
    li {
      height: 130px;
      padding: 15px 44px; 
      border-bottom:1px solid #31345f; 
      position: relative;
      &:active, &.active {
        background-color: #3a3d60;        
        .categoryInfo {
          color: #fff;
        }
      }
      em{
        display: block;
        width: 19px;
        height: 36px;
        background: url('../img/list_arrow.png') no-repeat;
        position: absolute;
        top: 47px;
        right: 61px;
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
      
      .rank {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 48px;
        height: 40px;
        line-height: 40px;
        text-align: center;
        font-size: 27px;
        background-color: $pointColor;
        font-family: Roboto;
      }
      
      .thumbnail {
        display: block;
        width: 100px;
        height: 100px;
        background-image: url('../img/icon_default.png');
        
        >img {
          width: 100%;
          height: 100%;
        }
      }
    }
    .podcastInfo {
      padding-top: 5px;
      margin-left: 130px;
      
      .podcastTitle {
        display: block;
        padding-right: 15px;
        font-size: 33px;
        font-weight: normal;
        color: #fff;
        line-height: 53px;
        @include ellipsis;
      }
      
      .categoryInfo {
        display: block;
        line-height: 37px;
        font-size: 27px;
        color: #fff;        
        @include ellipsis;
      
        .title {
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
</style>
