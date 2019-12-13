<template>
  <div class="wrap" ref="wrap">
    <div class="content">
      <div class="searchBox" :class="[search.keyword !== '' ? 'input' : '' , search.isSearch === true ? 'result' : '']">
        <button class="search_back"></button>
        <textarea type="text" placeholder="듣고 싶은 방송명을 검색하세요" autofocus v-model="search.keyword" v-on:keyup="checkKeyword" ref="keyword" id="keyword" @click="openKeypad"/>
        <input type="button" class="search_btn" :class="[search.keyword === '' || search.channelList.length === 0 && search.isSearch === true ? 'dis' : '']" v-show="!search.isSearch" @click="searchKeyword(false)" ref="search"/>
        <input type="button" :class="[search.keyword === '' ? 'dis' : '']" v-show="search.isSearch" @click="resetClick" ref="reset"/>
      </div>
      <div class="searchResult" v-show="search.channelList.length > 0">
        <div class="searchNum">검색결과<span>({{ search.channelList.length }})</span></div>
         <obg-scroll-view style='height:450px;'>
          <ul>
            <li v-for="(item,index) in search.channelList" @click="channelClick(item, index)" :class="[ imgEmptyClass ]" ref="channel">
              <div class="listInfo">
                <div class="podcastImg">
                  <span class="thumbnail"><img :src="checkImgUrl(item)" ref="imageUrl" @error="imageErrorCheck(index)"></span>
                </div>
                <div class="podcastInfo">
                  <strong class="title" v-html="getHtmlString(getTitle(item, search.keyword))"></strong>
                  <span class="categoryInfo"><!--span>카테고리</span-->{{ getCategory(item) }}</span>
                </div>
              </div>
              <em></em>
            </li>
          </ul>
        </obg-scroll-view>
      </div>

      <!-- 검색결과가 없을경우 -->
      <div class="listnone" v-show="search.channelList.length === 0 && search.isSearch === true">
        <div class="text">          
          <p>
            <span>Searched station not found.</span>
          </p>
        </div>
      </div>
      <!-- // 검색결과가 없을경우 -->
      
    </div>  
  </div>
</template>
<script>
import popup from './popup'
import scrollView from './scroll-view'
import { logger } from './js/commonLib'
import { podcastApi, errorMsg } from './js/podcastApi'
import { audio, util } from './js/podcastLib'

let self = this

export default {
  name: 'searchResult',
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
    // 가상 키패드 오픈
    openKeypad: function () {
      self = this
      console.log('window.podcastObj.search.keyword: ' + window.podcastObj.search.keyword)
      if (typeof window.vk !== 'undefined' && !window.vk.isOpen) {
        // 키보드 오픈
        window.vk.open('keyword', window.podcastObj.search.keyword, 'VALUE', function () {
          // 입력 전 함수 호출
          // 아무것도 안함
        }, function () {
          // 입력 후 함수 호출
          // 키워드 체크
          self.checkKeyword()
        },
        // 엔터 텍스트
        '검색',
        // 비프음 함수 호출
        function () {
          // 비프음
          util.beep()
        })
        // OK 버튼
        window.vk.ok.onclick = function () {
          console.log('window.vk.ok 클릭')
          // 키워드 체크
          self.checkKeyword()
          // 검색
          self.searchKeyword(true)
        }
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
    // 이미지 Emtpy 클래스
    imgEmptyClass: function (item) {
      if (typeof item === 'undefined') {
        return 'imgEmpty'
      } else if (typeof item.imageUrl === 'undefined') {
        return 'imgEmpty'
      } else if (item.imageUrl === '') {
        return 'imgEmpty'
      } else {
        return ''
      }
    },
    // 제목 반환
    getTitle: function (item, keyword) {
      if (typeof item === 'undefined') {
        return ''
      } else if (typeof item.title === 'undefined') {
        return ''
      } else if (typeof item.title !== 'undefined' && typeof keyword !== 'undefined') {
        return item.title.replace(keyword, '<span style="color: #000;background: rgba(255, 255, 255, 0.9);">' + keyword + '</span>')
      } else if (typeof item.title !== 'undefined') {
        return item.title
      } else {
        return ''
      }
    },
    // 카테고리 반환
    getCategory: function (item) {
      if (typeof item === 'undefined') {
        return ''
      } else if (typeof item.category === 'undefined') {
        return ''
      } else {
        return item.category
      }
    },
    // 키워드 체크
    checkKeyword: function (evt) {
      // console.log(evt)
      console.log('[1]window.podcastObj.search.keyword : ' + window.podcastObj.search.keyword)
      console.log('[1]this.$refs.keyword.value: ' + this.$refs.keyword.value)
      if (typeof evt !== 'undefined') {
        if (evt.ctrlKey || evt.altKey || evt.metaKey || evt.shiftKey) {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'Backspace' || evt.key === 'Backspace' || evt.code === 'Escape' || evt.key === 'Escape') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'ArrowLeft' || evt.key === 'ArrowLeft' || evt.code === 'ArrowRight' || evt.key === 'ArrowRight') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'ArrowUp' || evt.key === 'ArrowUp' || evt.code === 'ArrowDown' || evt.key === 'ArrowDown') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'PageUp' || evt.key === 'PageUp' || evt.code === 'PageDown' || evt.key === 'PageDown') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'CapsLock' || evt.key === 'CapsLock' || evt.code === 'NumLock' || evt.key === 'NumLock') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'ShiftLeft' || evt.key === 'ShiftLeft' || evt.code === 'ShiftRight' || evt.key === 'ShiftRight') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'ControlLeft' || evt.key === 'ControlLeft' || evt.code === 'ControlRight' || evt.key === 'ControlRight') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'AltLeft' || evt.key === 'AltLeft' || evt.code === 'AltRight' || evt.key === 'AltRight') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'MetaLeft' || evt.key === 'MetaLeft' || evt.code === 'MetaRight' || evt.key === 'MetaRight') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'MetaLeft' || evt.key === 'MetaLeft' || evt.code === 'MetaRight' || evt.key === 'MetaRight') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'Insert' || evt.key === 'Insert' || evt.code === 'Delete' || evt.key === 'Delete') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'F1' || evt.key === 'F1' || evt.code === 'F2' || evt.key === 'F2') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'F3' || evt.key === 'F3' || evt.code === 'F4' || evt.key === 'F4') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'F5' || evt.key === 'F5' || evt.code === 'F6' || evt.key === 'F6') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'F7' || evt.key === 'F7' || evt.code === 'F8' || evt.key === 'F8') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'F9' || evt.key === 'F9' || evt.code === 'F10' || evt.key === 'F10') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'F11' || evt.key === 'F11' || evt.code === 'F11' || evt.key === 'F11') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'ContextMenu' || evt.key === 'ContextMenu') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'HanjaMode' || evt.key === 'HanjaMode' || evt.code === 'ContextMenu' || evt.key === 'ContextMenu') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'Home' || evt.key === 'Home' || evt.code === 'End' || evt.key === 'End') {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        } else if (evt.code === 'Enter' || evt.key === 'Enter') {
          // 키워드 검색
          this.searchKeyword(false)
        } else {
          // 키워드 30자 초과시
          if (this.$refs.keyword.value.length > 30) {
            window.podcastObj.toast.show('검색어는 최대 30자까지 입력됩니다.', 'full')
            // 키워드 30자 제한
            window.podcastObj.search.keyword = this.$refs.keyword.value.substring(0, 30)
            this.$refs.keyword.value = this.$refs.keyword.value.substring(0, 30)
            console.log('[2]window.podcastObj.search.keyword : ' + window.podcastObj.search.keyword)
            console.log('[2]this.$refs.keyword.value: ' + this.$refs.keyword.value)
          } else {
            window.podcastObj.search.keyword = this.$refs.keyword.value
          }
        }
      } else {
        // 키워드 30자 초과시
        if (this.$refs.keyword.value.length > 30) {
          window.podcastObj.toast.show('검색어는 최대 30자까지 입력됩니다.', 'full')
          // 키워드 30자 제한
          window.podcastObj.search.keyword = this.$refs.keyword.value.substring(0, 30)
          this.$refs.keyword.value = this.$refs.keyword.value.substring(0, 30)
          console.log('[3]window.podcastObj.search.keyword : ' + window.podcastObj.search.keyword)
          console.log('[3]this.$refs.keyword.value: ' + this.$refs.keyword.value)
        } else {
          window.podcastObj.search.keyword = this.$refs.keyword.value
        }
      }
      // 키패드 내부 텍스트 동기화
      if (typeof window.vk !== 'undefined') {
        window.vk.sync(window.podcastObj.search.keyword)
      }
      // 포커스 초기화 (0.1초 딜레이 필요 : BACK KEY를 위함)
      self = this
      setTimeout(function () {
        self.$refs.keyword.focus()
      }, 100)
    },
    // 키워드 검색
    searchKeyword: function (isKeypad) {
      console.log('isKeypad : ' + isKeypad)
      if (typeof isKeypad === 'undefined') {
        isKeypad = false
      }
      self = this
      // 콜백 함수
      let callback = function () {
        // 검색어가 없으면
        if (window.podcastObj.search.keyword === '') {
          // 검색 리셋
          this.resetClick()
          return
        }
        // 토스트 클래스 세팅
        window.podcastObj.toast.toastClass = 'full'
        // 검색 여부
        window.podcastObj.search.isSearch = true
        // 키보드 숨김 (AM전용)
        self.$refs.keyword.blur()
        // 키패드 닫기
        if (typeof window.vk !== 'undefined') {
          window.vk.cancel()
        }
        // 로딩 중 표시
        util.showLoading(false)
        // 키워드 검색
        podcastApi.searchKeyword({
          'token': window.podcastObj.user.token,
          'keyword': window.podcastObj.search.keyword
        }, function (result) {
          console.log(result)
          // 방송 목록 세팅
          window.podcastObj.search.channelList = result.data
          // 로딩 중 숨김
          util.hideLoading()
        }, function (result) {
          logger.error(result)
          // 모든 팝업 닫기
          util.closeAllPopup()
          // 에러 팝업 표시
          popup.show(errorMsg.getProp(result))
        })
      }
      if (isKeypad) {
        if (callback) {
          callback()
        }
      } else {
        // 활성화
        util.active(self.$refs['search'], callback)
      }
      // 서비스로그 전송
      if (window.serviceAgent && window.serviceLog) {
        console.info('서비스로그 전송 : 팟빵 검색 재생 요청')
        let svcDetailInfo = {}
        svcDetailInfo.svcItem = '검색 재생'
        // 서비스 시간 : yyyyMMddhhmmss
        svcDetailInfo.svcTime = window.serviceLog.logTime()
        // 서비스 상태
        if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          svcDetailInfo.svcStatus = 'F'
        } else {
          svcDetailInfo.svcStatus = 'B'
        }
        svcDetailInfo.keyword = window.podcastObj.search.keyword
        // 본문
        let body = window.serviceLog.getBody('touch', 0, 0, svcDetailInfo)
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
    // 검색 리셋 클릭
    resetClick: function () {
      self = this
      // 활성화
      util.active(self.$refs['reset'], function () {
        // 키워드 초기화
        window.podcastObj.search.keyword = ''
        // 검색 결과 초기화
        window.podcastObj.search.channelList = []
        // 검색 여부 초기화
        window.podcastObj.search.isSearch = false
        // 키패드 내부 텍스트 동기화 (BM 전용)
        if (typeof window.vk !== 'undefined') {
          window.vk.sync(window.podcastObj.search.keyword)
        }
        // 포커스 초기화
        self.$refs.keyword.focus()
        // 가상 키패드 오픈
        self.openKeypad()
      })
    },
    // 방송 클릭
    channelClick: function (item, index) {
      logger.method(this.$router, 'channelClick')
      self = this
      // 활성화
      util.active(self.$refs['channel'][index], function () {
        if (typeof item === 'undefined') {
          console.log('item is undefined')
          return
        }
        // 방송 정보 세팅
        window.podcastObj.search.title = item.title
        window.podcastObj.search.pid = item.pid
        // 페이지 이동
        self.$router.push('/searchDetail')
      })
    }
  },
  mounted () {
    logger.load(this.$router, 'mounted')
    // 검색어 초기화
    window.podcastObj.search.isSearch = false
    window.podcastObj.search.keyword = ''
    this.$refs.keyword.value = ''
    // 검색 방송 초기화
    window.podcastObj.search.channelList = []
    // 현재 페이지
    window.podcastObj.currentPage = this.$router.history.current.path
    // 오디오 초기화
    audio.init()
    // 토스트 클래스 세팅
    window.podcastObj.toast.toastClass = 'full'
    // 가상 키패드 오픈
    this.openKeypad()
  },
  beforeDestroy () {
    console.log('검색 결과 정리')
    // 키워드 초기화
    window.podcastObj.search.keyword = ''
    // 검색 방송 목록 초기화
    window.podcastObj.search.channelList = []
    // HTML 엘리먼트 정리
    this.$refs['wrap'].innerHTML = ''
  }
}
</script>
<style lang='scss' scoped>
  @import '../scss/common.scss';

  .wrap {
    padding-left: 0;
    position: relative;
    z-index: 10;

    .content {
      display: block;
      position: relative;
      height: 100%;
      margin: 0;
    //   padding: 0;
      padding-top: 16px;
    }
  }
  .searchBox {
    width: 1250px;
    height: 99px;
    padding-left: 143px;
    padding-right: 29px;
    margin: 0 15px;
    background: #fff;
    border-radius: 15px;
    position: relative;
    .search_back{
        display: block;
        width:70px;
        height:70px;
        background: url('../img/btn_search_back.png') no-repeat;
        position: absolute;
        left: 40px;
        top: 15px;
        &:active, &.active{
            background-position: -70px 0;
        }
        &::after{
            content: '';
            width:2px;
            height:60px;
            background: #919191;
            position: absolute;
            right: -22px;
            top: 5px;
        }
    }
    input,textarea {
      box-sizing: border-box;
      border: 0;
      background-color: transparent;
      color: #fff;
      outline-style:none;
    }
    
    textarea[type="text"] { 
      width: 900px;
      height: 99px;
      padding: 0;
      font-size: 33px;
      line-height: 99px;
      color: #333333;
      resize: none;
      white-space: nowrap;
      overflow: hidden;
      text-indent: 20px;
    }
    input[type="button"] {
      float: right;
      width: 70px;
      height: 70px;
      background-image: url('../img/btn_search_close.png');
      background-position: 0 0;
      margin-top: 15px;
      
      &:active, &.active {
        background-position: -70px 0;
      }
      
      &.dis {
        background-position: -140px 0;
      }
      
      &.search_btn {
        background-image: url('../img/btn_search.png');
        background-position: 0 0;
        margin-left: 21px; 
        
        &:active, &.active {
          background-position: -70px 0;
        }

        &.dis {
          background-position: -140px 0;
        }
      }
      
    }
    
    &.input {
    //   background: url('../img/bg_episode_subscription_line.png') no-repeat 1028px 50%;
      
      input[type="text"] {
        width: 833px;  
      }
      
      input[type="button"] {
        display: block !important;
      }
    }
    
    &.result {
    //   background: url('../img/bg_episode_subscription_line.png') no-repeat 1028px 50%;
      
      input[type="text"] {
        width: 833px;  
      }
      
      .result_title {
        display: inline-block;
        font-size: 36px;
        margin-right: 10px;
      }    
      input[type="button"] {
        display: block !important;
      }
    }
    
    textarea::placeholder {
      padding-left: 15px;
    }

    &::after{
        content: '';
        display: block;
        width: 2px;
        height: 60px;
        background: #919191;
        position: absolute;
        right: 107px;
        top: 20px;
    }
    
  }
  .searchResult {
    height: 530px;
    
    .searchNum {
      padding: 14px 45px 9px;
      line-height: 37px;
      font-size: 33px;
      color: #fff;
      span{
          margin-left: 11px;
          vertical-align: 2px;
      }
    }
    
    li {
      padding: 0 45px;
      border-top:1px solid #31345f;
      position: relative;
      
      .keyword {
        color: $pointColor;
      }
      
      &:active, &.active {
        background-color: #3a3d60;
        
        .keyword, .categoryInfo {
          color: #fff !important;
        }
      }
      
      &.imgEmpty {
        .podcastImg {
          display: none;
        }
        
        .podcastInfo {
          width: 100%;
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
    
    .listInfo {
      position: relative;
      height: 130px;
      padding: 15px 0;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      
      >div {
        float: left;
      }
      
      .podcastImg {
        width: 100px;
        height: 100px;
        margin-right: 33px;
        
        .thumbnail {
          display: block;
          width: 100%;
          height: 100%;
          background-image: url('../img/icon_default.png');
          
          img {
            width: 100%;
            height: 100%;
          }
        }
      }
      
      .podcastInfo {
        width: 890px;
        padding-top: 4px;
      }
      
      .title {
        display: block;
        width: 100%;
        line-height: 53px;
        font-size: 33px;
        font-weight: normal;
        @include ellipsis;
        
        .keyword {
          color: $pointColor;
          font-weight: bold;
        }
      }
      
      .categoryInfo {
        display: block;
        line-height: 40px;
        font-size: 27px;
        color: #fff;
        @include ellipsis;
	
        >span {
          position: relative;
          padding-right: 40px;
          
          &:after {
            content: "";
            display: block;
            position: absolute;
            top: 9px;
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
    .text {
      display: table;
      width: 100%;
      height: 530px;     
      text-align: center;
      
      p {
        // display: table-cell;
        // vertical-align: middle;       
        margin-top: 192px;

        >span {
          display: block;
          position: relative;
          line-height: 37px;
          font-size: 33px;
          color: #fff;
          
          &:last-child {
            // display: block;
            // margin-top: 5px;
            // font-size: 30px;
            // color: rgba(255,255,255,0.3);  
            // line-height: 34px;
            
            >i {
              display: block;
              margin-top: 5px;
              font-style: normal;
            }
          }
        }
      }
      
      .icon {
        display: block;
        position: absolute;
        left: 50%;
        top: -100px;
        width: 100px;
        height: 100px;
        margin-left: -50px;
        background-image: url('../img/icon_listnone.png');        
      }
    }
  }
</style>
