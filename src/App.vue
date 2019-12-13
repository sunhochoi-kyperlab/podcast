<template>
  <div id='app'>
    <!-- 토스트 -->
    <div :class="['toastPopup', toast.toastClass]" v-show="toast.isToastShow">
      <p>{{ toast.toastContent }}</p>
    </div>
    <router-view></router-view>
    <!-- 오디오 -->
    <podcast-audio></podcast-audio>
    <!-- 서브메뉴 -->
    <podcast-submenu @back='onBack' @home='onHome'></podcast-submenu>
</div>
</template>

<script>
// WEB API 연동 라이브러리 ▼
import 'obigo-js-webapi/ai/ai'
import 'obigo-js-webapi/cloud/cloud'
import 'obigo-js-webapi/serviceAgent/serviceAgent'
import 'obigo-js-webapi/cluster/cluster'
import 'obigo-js-webapi/developer/developer'
import 'obigo-js-webapi/telephony/telephony'
// WEB API 연동 라이브러리 ▲

import './components/js/podcastObj'
import './components/js/podcastAgent'
import './components/js/serviceLog'

import audio from './components/audio'
import popup from '../src/components/popup'
import submenu from './components/submenu'
import { logger } from './components/js/commonLib'
import { podcastApi, errorMsg } from './components/js/podcastApi'
import { storage, util, appMsg } from './components/js/podcastLib'

// 팟캐스트 오브젝트 로드
storage.loadPodcastObj()

// 서브카드 실행 여부 (BM 전용)
let isRunSubCard = false
let self = this

export default {
  name: 'home',
  components: {
    'podcast-audio': audio,
    'podcast-submenu': submenu
  },
  data: function () {
    return window.podcastObj
  },
  methods: {
    // 토스트 표시 (5초후 자동 숨김)
    toastShowFn: function (content, toastClass) {
      // 기본값 세팅
      if (typeof toastClass === 'undefined') {
        toastClass = window.podcastObj.toast.toastClass
      }
      console.log('토스트 표시 : ' + content + ', toastClass : ' + window.podcastObj.toast.toastClass)
      window.podcastObj.toast.isToastShow = true
      window.podcastObj.toast.toastContent = content
      window.podcastObj.toast.toastClass = toastClass
      clearTimeout(window.toastTimer)
      window.toastTimer = setTimeout(function () {
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
    // 팟캐스트 앱 종료
    podcastAppTerminate () {
      console.log('podcastAppTerminate : 팟캐스트 앱 종료')
      // 모든 팝업 닫기
      util.closeAllPopup()
      // 앱 종료
      if (window.applicationFramework) {
        window.applicationFramework.applicationManager.getOwnerApplication(window.document).back()
      }
    },
    onBack (evt) {
      console.log(evt)
      if (typeof window.vk !== 'undefined' && window.vk.isOpen === true) {
        // 키패드 닫기
        window.vk.cancel()
      }
      if (popup.closeTopPopup()) {
        // 팝업 창만 닫음
      } else if (window.podcastObj.currentPage === '/search') {
        // 앱 종료
        this.podcastAppTerminate()
      } else if (window.podcastObj.currentPage === '/searchResult') {
        this.$router.push('/search')
      } else if (window.podcastObj.currentPage === '/searchDetail') {
        this.$router.push('/searchResult')
      } else if (window.podcastObj.currentPage === '/player') {
        // 앱 종료
        this.podcastAppTerminate()
      } else if (window.podcastObj.currentPage === '/playlist') {
        this.$router.push('/player')
      } else if (window.podcastObj.currentPage === '/history') {
        // 앱 종료
        this.podcastAppTerminate()
      } else if (window.podcastObj.currentPage === '/historyEdit') {
        window.podcastObj.history.isChoice = false
        this.$router.push('/history')
      } else if (window.podcastObj.currentPage === '/popular') {
        // 앱 종료
        this.podcastAppTerminate()
      } else if (window.podcastObj.currentPage === '/popularDetail') {
        this.$router.push('/popular')
      } else if (window.podcastObj.currentPage === '/subscript') {
        // 앱 종료
        this.podcastAppTerminate()
      } else if (window.podcastObj.currentPage === '/subscriptDetail') {
        this.$router.push('/subscript')
      } else {
        // 앱 종료
        this.podcastAppTerminate()
      }
    },
    onHome (evt) {
      console.log(evt)
      // 서비스 메인으로 이동
      window.applicationFramework.applicationManager.getOwnerApplication(window.document).main()
    },
    // 하드웨어키 초기화
    initHardKeyAction () {
      // Background Hardkey 등록
      this.application.registerHardKey(1001)
      this.application.registerHardKey(1002)
      this.application.registerHardKey(16008)
      this.application.registerHardKey(16009)
      this.application.registerHardKey(16018)
      // 하드웨어키 리스너 등록
      self = this
      window.addEventListener('hardkey', function (evt) {
        if (typeof evt === 'undefined') {
          console.log('hardkey event is undefined')
          return
        }
        console.log('hardkey: evt.hardkeyType: ' + evt.hardkeyType)
        console.log('hardkey: evt.hardkeyMode: ' + evt.hardkeyMode)
        if (evt.hardkeyType === 1001 && evt.hardkeyMode === 3) { // HARDKEY_BUTTON_HOME && HARDKEY_MODE_RELEASE
          // 미정
        } else if (evt.hardkeyType === 1002 && evt.hardkeyMode === 3) { // HARDKEY_BUTTON_BACK && HARDKEY_MODE_RELEASE
          // 백키 동작
          self.onBack(evt)
        } else if (evt.hardkeyType === 16008 && evt.hardkeyMode === 1) { // HARDKEY_BUTTON_SEEK_UP && HARDKEY_MODE_PRESS
          if (window.podcastObj.history.episodeList.length === 0) {
            console.log('HARDKEY_BUTTON_SEEK_UP && HARDKEY_MODE_PRESS 대해서 동작 안함 : 히스토리 이력 없음')
            return
          }
          console.log('getTopVisibleAppID() :: ' + window.applicationFramework.applicationManager.getTopVisibleAppID())
          console.log('isRunMainCard :: ' + window.podcastObj.isRunMainCard)
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            // [DEV2PRJ-2339] => Short Press에서 Release 시점에 액션을 수행하는 것으로 변경
            // console.log('SEEK_UP H/W Key APP : 이전 (1회)')
            // long press 여부
            // window.podcastObj.isLongPress = false
            // 요청완료 여부
            window.podcastObj.isComplete = false
            // 1회 실행
            // window.podcastObj.ctrl.prev()
          } else {
            console.info('요금제 ratePayment 체크 hardkeyType : 16008, hardkeyMode : 1 #1 ' + window.podcastObj.service.status.ratePayment)
          }
        } else if (evt.hardkeyType === 16008 && evt.hardkeyMode === 2) { // HARDKEY_BUTTON_SEEK_UP && HARDKEY_MODE_LONG_PRESS
          if (window.podcastObj.history.episodeList.length === 0) {
            console.log('HARDKEY_BUTTON_SEEK_UP && HARDKEY_MODE_LONG_PRESS 대해서 동작 안함 : 히스토리 이력 없음')
            return
          }
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            // [DEV2PRJ-2330] 팟빵 앱 Seek Up/Down 동작 수정: F/G, B/G 상관없이 동일한 H/W Key 이벤트 처리하는 것으로 변경
            // 팟빵 SEEK_UP H/W Key Long Press
            console.log('SEEK_UP H/W Key APP : 이전 (반복시작)')
            // [DEV2PRJ-2583] Beep 음 처리
            util.beep()
            // long press 여부
            window.podcastObj.isLongPress = true
            // 요청완료 여부
            window.podcastObj.isComplete = true
            // H/W SEEK UP/DOWN 여부
            window.podcastObj.isLongClick = true
            console.log('hardkey: 이전 (반복시작)')
            // 1회 실행
            // [DEV2PRJ-2339] => seekUp() 호출로 동작 변경
            window.podcastObj.ctrl.seekUp()
            // window.podcastObj.ctrl.prev()
            // 이전 콘트롤 타이머가 있으면 해제
            if (typeof window.prevControlTimer !== 'undefined') {
              clearInterval(window.prevControlTimer)
            }
            // 0.5초 마다 반복 실행
            window.prevControlTimer = setInterval(function () {
              console.log('hardkey: 이전 (반복중)')
              // [DEV2PRJ-2339] => seekUp() 호출로 동작 변경
              window.podcastObj.ctrl.seekUp()
              // window.podcastObj.ctrl.prev()
              // AF F/G상태 팟빵이 F/G상태 확인하여 OSD 출력
              if (window.applicationFramework && window.applicationFramework.getAppFrameworkState) {
                if (window.applicationFramework.getAppFrameworkState() === 1) {
                  // F/G 앱이 팟빵이 아닐 경우 OSD 출력
                  if (window.applicationFramework.applicationManager.getTopVisibleAppID() !== '' && window.applicationFramework.applicationManager.getTopVisibleAppID() !== window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().id && window.applicationFramework.applicationManager.getTopVisibleAppID() !== 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher') {
                    util.showOsd('[OSD] #3 : SEEK_UP Long Press', 16 | 1)
                  }
                } else if (window.applicationFramework.getAppFrameworkState() === 2) {
                  util.showOsd('[OSD] #4 : SEEK_UP Long Press', 16)
                }
              }
            }, 500)
          } else {
            console.info('요금제 ratePayment 체크 hardkeyType : 16008, hardkeyMode : 2 #1 ' + window.podcastObj.service.status.ratePayment)
          }
        } else if (evt.hardkeyType === 16008 && evt.hardkeyMode === 3) { // HARDKEY_BUTTON_SEEK_UP && HARDKEY_MODE_RELEASE
          if (window.podcastObj.history.episodeList.length === 0) {
            console.log('HARDKEY_BUTTON_SEEK_UP && HARDKEY_MODE_RELEASE 대해서 동작 안함 : 히스토리 이력 없음')
            return
          }
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            if (window.podcastObj.isLongPress) {
              if (window.applicationFramework && window.applicationFramework.getAppFrameworkState) {
                if (window.applicationFramework.getAppFrameworkState() === 1) {
                  // F/G 앱이 팟빵이 아닐 경우 OSD 출력
                  if (window.applicationFramework.applicationManager.getTopVisibleAppID() !== '' && window.applicationFramework.applicationManager.getTopVisibleAppID() !== window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().id && window.applicationFramework.applicationManager.getTopVisibleAppID() !== 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher') {
                    util.showOsd('[OSD] #1 : SEEK_UP Long Press', 16 | 1)
                  }
                } else if (window.applicationFramework.getAppFrameworkState() === 2) {
                  util.showOsd('[OSD] #2 : SEEK_UP Long Press', 16)
                }
              }
            }
            // [DEV2PRJ-2330] 팟빵 앱 Seek Up/Down 동작 수정: F/G, B/G 상관없이 동일한 H/W Key 이벤트 처리하는 것으로 변경
            // 팟빵 SEEK_UP H/W Key Release
            console.log('SEEK_UP H/W Key APP : 이전 (반복해제)')
            console.log('SEEK_UP H/W Key APP : window.podcastObj.isFirstLastEpisode : ' + window.podcastObj.isFirstLastEpisode)
            if (!window.podcastObj.isFirstLastEpisode) {
              // long press 여부
              if (window.podcastObj.isLongPress) {
                /**
                 * [DEV2PRJ-2339]
                 * - LongPress 중 Release되었다는 것은, 실제 곡 변경이 이루어지지 않는 탐색(seekUp,seekDown)만 이루어진 것
                 * 이에 Release 시점의 에피소드 추가 및 재생이 필요함
                 * - Single Release시에는, 기존의 prev() 함수 호출 (press에서 수행하던 것을 release에서 대신 수행)
                 */
                window.podcastObj.isLongPress = false
                // 에피소드 추가 및 재생
                util.addEpisodePlay(window.podcastObj.playing)
              } else {
                window.podcastObj.ctrl.prev()
              }
            } else { // 처음이거나 마지막 곡인데 SEEK_UP H/W Key Key Release
              window.podcastObj.ctrl.prev()
            }
            window.podcastObj.isLongPress = false
            // 이전 콘트롤 타이머가 있으면 해제
            if (typeof window.prevControlTimer !== 'undefined') {
              console.log('이전 콘트롤 타이머가 있으면 해제')
              clearInterval(window.prevControlTimer)
            }
            // 다음 콘트롤 타이머가 있으면 해제 (하드웨어키 버그시 방어코드)
            if (typeof window.prevControlTimer !== 'undefined') {
              clearInterval(window.prevControlTimer)
            }
          } else {
            console.info('요금제 ratePayment 체크 hardkeyType : 16008, hardkeyMode : 3 #1 ' + window.podcastObj.service.status.ratePayment)
          }
        } else if (evt.hardkeyType === 16009 && evt.hardkeyMode === 1) { // HARDKEY_BUTTON_SEEK_DOWN && HARDKEY_MODE_PRESS
          if (window.podcastObj.history.episodeList.length === 0) {
            console.log('HARDKEY_BUTTON_SEEK_DOWN && HARDKEY_MODE_PRESS 대해서 동작 안함 : 히스토리 이력 없음')
            return
          }
          console.log('getTopVisibleAppID() :: ' + window.applicationFramework.applicationManager.getTopVisibleAppID())
          console.log('isRunMainCard :: ' + window.podcastObj.isRunMainCard)
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            // [DEV2PRJ-2339] => Short Press에서 Release 시점에 액션을 수행하는 것으로 변경
            // console.log('SEEK_DOWN H/W Key APP : 다음 (1회)')
            // long press 여부
            // window.podcastObj.isLongPress = false
            // 요청완료 여부
            window.podcastObj.isComplete = false
            // 1회 실행
            // window.podcastObj.ctrl.next()
          } else {
            console.info('요금제 ratePayment 체크 hardkeyType : 16009, hardkeyMode : 1 #1 ' + window.podcastObj.service.status.ratePayment)
          }
        } else if (evt.hardkeyType === 16009 && evt.hardkeyMode === 2) { // HARDKEY_BUTTON_SEEK_DOWN && HARDKEY_MODE_LONG_PRESS
          if (window.podcastObj.history.episodeList.length === 0) {
            console.log('HARDKEY_BUTTON_SEEK_DOWN && HARDKEY_MODE_LONG_PRESS 대해서 동작 안함 : 히스토리 이력 없음')
            return
          }
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            // [DEV2PRJ-2330] 팟빵 앱 Seek Up/Down 동작 수정: F/G, B/G 상관없이 동일한 H/W Key 이벤트 처리하는 것으로 변경
            // 팟빵 SEEK_DOWN H/W Key Long Press
            console.log('SEEK_DOWN H/W Key APP F/G : 다음 (반복시작)')
            // [DEV2PRJ-2583] Beep 음 처리
            util.beep()
            // long press 여부
            window.podcastObj.isLongPress = true
            // 요청완료 여부
            window.podcastObj.isComplete = true
            // H/W SEEK UP/DOWN 여부
            window.podcastObj.isLongClick = true
            console.log('hardkey: 다음 (반복시작)')
            // 1회 실행
            // [DEV2PRJ-2339] => seekDown() 호출로 동작 변경
            window.podcastObj.ctrl.seekDown()
            // window.podcastObj.ctrl.next()
            // 다음 콘트롤 타이머가 있으면 해제
            if (typeof window.nextControlTimer !== 'undefined') {
              clearInterval(window.nextControlTimer)
            }
            // 0.5초 마다 반복 실행
            window.nextControlTimer = setInterval(function () {
              console.log('hardkey: 다음 (반복중)')
              // [DEV2PRJ-2339] => seekDown() 호출로 동작 변경
              window.podcastObj.ctrl.seekDown()
              // window.podcastObj.ctrl.next()
              // AF F/G상태 팟빵이 F/G상태 확인하여 OSD 출력
              if (window.applicationFramework && window.applicationFramework.getAppFrameworkState) {
                if (window.applicationFramework.getAppFrameworkState() === 1) {
                  // F/G 앱이 팟빵이 아닐 경우 OSD 출력
                  if (window.applicationFramework.applicationManager.getTopVisibleAppID() !== '' && window.applicationFramework.applicationManager.getTopVisibleAppID() !== window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().id && window.applicationFramework.applicationManager.getTopVisibleAppID() !== 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher') {
                    util.showOsd('[OSD] #1 : SEEK_DOWN Long Press', 16 | 1)
                  }
                } else if (window.applicationFramework.getAppFrameworkState() === 2) {
                  util.showOsd('[OSD] #2 : SEEK_DOWN Long Press', 16)
                }
              }
            }, 500)
          } else {
            console.info('요금제 ratePayment 체크 hardkeyType : 16009, hardkeyMode : 2 #1 ' + window.podcastObj.service.status.ratePayment)
          }
        } else if (evt.hardkeyType === 16009 && evt.hardkeyMode === 3) { // HARDKEY_BUTTON_SEEK_DOWN && HARDKEY_MODE_RELEASE
          if (window.podcastObj.history.episodeList.length === 0) {
            console.log('HARDKEY_BUTTON_SEEK_DOWN && HARDKEY_MODE_RELEASE 대해서 동작 안함 : 히스토리 이력 없음')
            return
          }
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            if (window.podcastObj.isLongPress) {
              if (window.applicationFramework && window.applicationFramework.getAppFrameworkState) {
                if (window.applicationFramework.getAppFrameworkState() === 1) {
                  // F/G 앱이 팟빵이 아닐 경우 OSD 출력
                  if (window.applicationFramework.applicationManager.getTopVisibleAppID() !== '' && window.applicationFramework.applicationManager.getTopVisibleAppID() !== window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().id && window.applicationFramework.applicationManager.getTopVisibleAppID() !== 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher') {
                    util.showOsd('[OSD] #1 : SEEK_UP Long Press', 16 | 1)
                  }
                } else if (window.applicationFramework.getAppFrameworkState() === 2) {
                  util.showOsd('[OSD] #2 : SEEK_UP Long Press', 16)
                }
              }
            }
            // [DEV2PRJ-2330] 팟빵 앱 Seek Up/Down 동작 수정: F/G, B/G 상관없이 동일한 H/W Key 이벤트 처리하는 것으로 변경
            // 팟빵 SEEK_DOWN H/W Key Release
            console.log('SEEK_DOWN H/W Key APP F/G : 다음 (반복해제)')
            if (!window.podcastObj.isFirstLastEpisode) {
              // long press 여부
              if (window.podcastObj.isLongPress) {
                /**
                 * [DEV2PRJ-2339]
                 * - LongPress 중 Release되었다는 것은, 실제 곡 변경이 이루어지지 않는 탐색(seekUp,seekDown)만 이루어진 것
                 * 이에 Release 시점의 에피소드 추가 및 재생이 필요함
                 * - Single Release시에는, 기존의 prev() 함수 호출 (press에서 수행하던 것을 release에서 대신 수행)
                 */
                window.podcastObj.isLongPress = false
                // 에피소드 추가 및 재생
                util.addEpisodePlay(window.podcastObj.playing)
              } else {
                window.podcastObj.ctrl.next()
              }
            } else { // 처음이거나 마지막 곡인데 SEEK_DOWN H/W Key Key Release
              window.podcastObj.ctrl.next()
            }
            window.podcastObj.isLongPress = false
            // 이전 콘트롤 타이머가 있으면 해제 (하드웨어키 버그시 방어코드)
            if (typeof window.prevControlTimer !== 'undefined') {
              clearInterval(window.prevControlTimer)
            }
            // 다음 콘트롤 타이머가 있으면 해제
            if (typeof window.nextControlTimer !== 'undefined') {
              console.log('다음 콘트롤 타이머가 있으면 해제')
              clearInterval(window.nextControlTimer)
            }
          } else {
            console.info('요금제 ratePayment 체크 hardkeyType : 16009, hardkeyMode : 3 #1 ' + window.podcastObj.service.status.ratePayment)
          }
        } else if (evt.hardkeyType === 16018 && evt.hardkeyMode === 2) { // HARDKEY_BUTTON_MODE_LONG
          // [DEV2PRJ-2583] Beep 음 처리
          util.beep()
          window.podcastObj.isLongPress = true
        } else if (evt.hardkeyType === 16018 && evt.hardkeyMode === 3) { // HARDKEY_BUTTON_MODE
          window.applicationFramework.applicationManager.getOwnerApplication(window.document).requestAudioFocus('main', false)
          // 서브카드 실행 (오디오 재생중인 앱이 없으면 runSubCard 실행)
          let json = window.applicationFramework.applicationManager.getOwnerApplication(window.document).getActiveAudioAppName()
          json = (json) ? JSON.parse(json) : ''
          let activeAudioAppName = json.AppName ? json.AppName : ''
          let isPlaying = json.IsPlaying ? json.IsPlaying : false
          console.log('[activeAudioAppName] : ' + activeAudioAppName)
          console.log('[isPlaying] : ' + isPlaying)
          if (!isPlaying) {
            appMsg.runSubCard('podcast-sub-1')
          }
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            // 일시 정지 중인 곡이 있을때
            if (window.podcastObj.playing.eid !== '' && window.podcastObj.audioObj.paused) {
              if (evt.hardkeyAction === 1 || window.podcastObj.isLongPress) {
                window.podcastAgent.sendClusterDisplayInfo(1, true)
              } else {
                window.podcastAgent.sendClusterDisplayInfo(1)
              }
              // 재생
              window.podcastObj.ctrl.play()
            // ++우
            } else if (window.podcastObj.playing.eid === '' && window.podcastObj.history.episodeList.length > 0) {
              // 히스토리 재생
              util.addEpisodePlay(window.podcastObj.history.episodeList[0])
            // 일시 정지 중인 곡 없고 히스토리에 곡이 없을 경우
            } else if (window.podcastObj.playing.eid === '' && window.podcastObj.history.episodeList.length === 0) {
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
                window.podcastObj.popular.episodeList = JSON.parse(JSON.stringify(result.data))
                // 방송 아이디 및 타이틀 세팅
                for (let i = 0; i < window.podcastObj.popular.episodeList.length; i++) {
                  window.podcastObj.popular.episodeList[i].pid = window.podcastObj.popular.pid
                  window.podcastObj.popular.episodeList[i].title = window.podcastObj.popular.title
                }
                // 에피소드 추가 및 재생
                util.addEpisodePlay(window.podcastObj.popular.episodeList[0])
                result = ''
              }, function (result) {
                logger.error(result)
                // 모든 팝업 닫기
                util.closeAllPopup()
                // 에러 팝업 표시
                popup.show(errorMsg.getProp(result))
              })
              // 인기방송 목록 화면 이동(v01.12.00)
              self.$router.push('/player')
            }
            console.log('클러스터 에피소드 정보 전송')
          } else if (window.podcastObj.service.status.networkStatus === '01') {
            console.info('요금제 ratePayment 체크 hardkeyType : 16018 #1 ' + window.podcastObj.service.status.ratePayment)
            console.log('클러스터 에피소드 정보 전송 default - 요금제 체크 fail')
            window.podcastAgent.sendClusterDefaultInfo('MODE')
          } else {
            console.log('클러스터 에피소드 정보 전송 default - 네트워크 연결안됨')
            window.podcastAgent.sendClusterDefaultInfo('LAST')
          }
          // 클러스터 에피소드 정보 전송 (BM 전용)
          if (window.podcastAgent && !window.podcastObj.playing) {
            // 클러스터 전송 필요
            window.podcastAgent.sendClusterDisplayInfo(1, true)
          }
          if (window.podcastObj.playing.etitle === '' && window.podcastObj.playing.imageUrl === '') {
            console.log('클러스터 에피소드 정보 전송 default')
            window.podcastAgent.sendClusterDefaultInfo('MODE')
            // [GRLGUP-4126] Navigation Full 화면에서 SWR-Mode Short Key 나 Long Key 로 모드 변경 시 OSD 출력하지 않음
            // silent.wav 재생하는 것을 삭제
            // 히스토리가 없을 경우 mode key 눌러 팟캐스트 진입 시 서버로 부터 에피소드를 받아 play하는데
            // 이때 silent.wav를 재생하는 로직때문에 실제 에피소드가 play되려할때 ended 이벤트가 발생함
            // ended이벤트가 발생하면 자동재생으로 곡변경시에는 osd를 표시하지않기 때문에 osd가 표시되지 않는다.
          }
          window.podcastObj.isLongPress = false
        }
      }, false)
    },
    // 라우터 초기화
    initRouter () {
      window.podcastObj.router = this.$router
    },
    // AIC 초기화
    initAIC: function () {
      if (window.applicationFramework) {
        // register receive event type
        window.msgObj.aicMessage.map((id) => {
          this.application.registerMessageListener(id)
        })
        // register event listener
        this.application.addEventListener('ApplicationMessage', this.AICEventHandler, false)
        // 재생정보 SET
        appMsg.postMessage('PODCAST_PLAYING_SET')
        // 인기 방송 조회
        util.getPopular()
        // 메인카드 실행 여부 체크
        appMsg.postMessage('PODCAST_RUN_MAIN_CARD_GET')
        // 히스토리 SET
        appMsg.postMessage('PODCAST_HISTORY_SET')
      }
    },
    // AIC 이벤트 핸들러
    AICEventHandler: function (message, origin) {
      self = this
      logger.debug(message)
      const filterName = (origin.indexOf('filter-name=') > -1) ? origin.slice(origin.indexOf('filter-name=') + 12) : ''
      logger.debug('[app]filterName: ' + filterName)
      switch (filterName) {
        case 'PODCAST_PLAYING_GET':
          // 재생정보 SET
          appMsg.postMessage('PODCAST_PLAYING_SET')
          break
        case 'PODCAST_STYLE_GET':
          // 스타일 SET
          appMsg.postMessage('PODCAST_STYLE_SET')
          break
        case 'PODCAST_PREV_SET':
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            // 이전 재생
            window.podcastObj.ctrl.prev()
          }
          // 서비스로그 전송
          if (window.serviceAgent && window.serviceLog) {
            console.info('서비스로그 전송 : 서비스카드 이전')
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
          break
        case 'PODCAST_PLAY_PAUSE_SET':
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            if (window.podcastObj.history.episodeList.length > 0) {
              if (window.podcastObj.audioObj.paused) {
                window.podcastObj.ctrl.play(true)
              } else {
                window.podcastObj.ctrl.pause('APP #1')
              }
            } else {
              // 히스토리 없을 경우에 메인카드에 play버튼 클릭 시 서비스메인 로딩 팝업 표시
              if (!window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
                // 서비스메인 로딩 레이어 표시
                window.applicationFramework.applicationManager.getOwnerApplication(window.document).postMessage(JSON.stringify({value: true}), 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=LOADING', null)
              }
              // 곡 정보 요청
              // 방송 내 에피소드 목록 API
              podcastApi.getEpisodeList({
                'token': window.podcastObj.user.token,
                'count': 50,
                'startSeq': 0,
                'pid': window.podcastObj.popular.pid
              }, function (result) {
                console.log(result)
                // 최초 실행이면
                window.podcastObj.popular.episodeList = JSON.parse(JSON.stringify(result.data))
                // 방송 아이디 및 타이틀 세팅
                for (let i = 0; i < window.podcastObj.popular.episodeList.length; i++) {
                  window.podcastObj.popular.episodeList[i].pid = window.podcastObj.popular.pid
                  window.podcastObj.popular.episodeList[i].title = window.podcastObj.popular.title
                }
                // 에피소드 추가 및 재생
                util.addEpisodePlay(window.podcastObj.popular.episodeList[0])
                result = ''
              }, function (result) {
                logger.error(result)
                // 모든 팝업 닫기
                util.closeAllPopup()
                // 에러 팝업 표시
                popup.show(errorMsg.getProp(result))
              })
            }
            // 서비스로그 전송
            if (window.serviceAgent && window.serviceLog) {
              console.info('서비스로그 전송 : 현재 재생 중 이전')
              let svcDetailInfo = {}
              let item = 0
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
          } else {
            console.info('요금제 ratePayment 체크 PODCAST_PLAY_PAUSE_SET #1 ' + window.podcastObj.service.status.ratePayment)
          }
          break
        case 'PODCAST_NEXT_SET':
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            // 다음 재생
            window.podcastObj.ctrl.next()
            // 서비스로그 전송
            if (window.serviceAgent && window.serviceLog) {
              console.info('서비스로그 전송 : 서비스카드 다음')
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
          } else {
            console.info('요금제 ratePayment 체크 PODCAST_NEXT_SET #1 ' + window.podcastObj.service.status.ratePayment)
          }
          break
        case 'PODCAST_POPULAR_GET':
          // 인기 방송 조회
          util.getPopular()
          break
        case 'PODCAST_HISTORY_GET':
          // 히스토리 SET
          appMsg.postMessage('PODCAST_HISTORY_SET')
          break
        case 'PODCAST_PLAYER_SHOW_AUTO_PLAY':
          console.log('PODCAST_PLAYER_SHOW_AUTO_PLAY :: #1')
          // 화면 표시
          self.application.show()
          // 요금제 상태 체크
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            if (window.podcastObj.history.episodeList.length > 0) {
              console.log('PODCAST_PLAYER_SHOW_AUTO_PLAY :: #2')
              // 플레이어 화면 이동
              self.$router.push('/player')
              // 팟캐스트 이어 재생
              // window.podcastObj.ctrl.play(true)
            } else {
              console.log('PODCAST_PLAYER_SHOW_AUTO_PLAY :: #3')
              // 로딩 중 표시
              util.showLoading(false)
              // 인기방송 목록 화면 이동
              // 방송 내 에피소드 목록 API
              podcastApi.getEpisodeList({
                'token': window.podcastObj.user.token,
                'count': 50,
                'startSeq': 0,
                'pid': window.podcastObj.popular.pid
              }, function (result) {
                console.log(result)
                // 최초 실행이면
                window.podcastObj.popular.episodeList = JSON.parse(JSON.stringify(result.data))
                // 방송 아이디 및 타이틀 세팅
                for (let i = 0; i < window.podcastObj.popular.episodeList.length; i++) {
                  window.podcastObj.popular.episodeList[i].pid = window.podcastObj.popular.pid
                  window.podcastObj.popular.episodeList[i].title = window.podcastObj.popular.title
                }

                let preventPlay = util.checkAudioFocus()
                window.podcastObj.preventPlay = preventPlay
                // 에피소드 추가
                util.addEpisodePlay(window.podcastObj.popular.episodeList[0], preventPlay)
                result = ''
              }, function (result) {
                logger.error(result)
                // 모든 팝업 닫기
                util.closeAllPopup()
                // 에러 팝업 표시
                popup.show(errorMsg.getProp(result))
              })
              // 인기방송 목록 화면 이동
              // shown 이벤트에서 인기방송화면으로 라우팅되는 것을 막기위한 query
              self.$router.push('/player?isIgnoreRouting=true')
            }
          } else {
            console.info('요금제 ratePayment 체크 playBGM #1 ' + window.podcastObj.service.status.ratePayment)
            console.log('클러스터 에피소드 정보 전송 default')
            window.podcastAgent.sendClusterDefaultInfo('MODE')
          }
          // 서브카드 실행 여부
          isRunSubCard = true
          break
        case 'PODCAST_PLAYER_SHOW':
          console.log('PODCAST_PLAYER_SHOW :: #1')
          // 화면 표시
          // 현재 위치에서 show하게 되면 applicationShown 이벤트에서 라우팅 처리하는 부분과 타이밍 문제가 발생함
          // factory reset 후 네트워크 연결되지 않은 상태에서 아무것도 표시되지않은 player화면으로 이동하는 문제가 생김
          // self.application.show()
          // 요금제 상태 체크
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            if (window.podcastObj.history.episodeList.length > 0) {
              console.log('PODCAST_PLAYER_SHOW :: #2')
              // 플레이어 화면 이동
              self.$router.push('/player')
              // 화면 표시
              self.application.show()
              // 팟캐스트 이어 재생
              // 뮤직류 재생 정책 변경 - audioFocus 체크하여 자동재생 여부 판단
              if (util.checkAudioFocus(true)) {
                // audioFocus를 가지고 있음
                // ex) 재생 멈춘 뒤 날씨앱이 메인카드에 있는 경우
                console.log('[PODCAST_PLAYER_SHOW] audioFocus를 가지고 있어 자동재생 하지 않음')
                window.podcastObj.ctrl.pause()
              } else {
                // audioFocus 되찾는 경우
                // 자동재생
                console.log('[PODCAST_PLAYER_SHOW] audioFocus를 가지고 있지않으므로 자동재생')
                window.podcastObj.ctrl.play(true)
              }
              // window.podcastObj.ctrl.pause()
            } else if (window.podcastObj.popular.pid.trim() === '') {
              // factory reset할 경우 pid가 없을 때가 존재함
              util.getPopular(() => {
                let preventPlay = util.checkAudioFocus()
                window.podcastObj.preventPlay = preventPlay
                // 에피소드 추가
                util.addEpisodePlay(window.podcastObj.popular.episodeList[0], preventPlay)
                // 현재 재생 중 화면 이동
                self.$router.push('/player?isIgnoreRouting=true')
                // 화면 표시
                self.application.show()
              })
            } else {
              console.log('PODCAST_PLAYER_SHOW :: #3')
              // 로딩 중 표시
              util.showLoading(false)
              // 인기방송 목록 화면 이동
              // 방송 내 에피소드 목록 API
              podcastApi.getEpisodeList({
                'token': window.podcastObj.user.token,
                'count': 50,
                'startSeq': 0,
                'pid': window.podcastObj.popular.pid
              }, function (result) {
                console.log(result)
                // 최초 실행이면
                window.podcastObj.popular.episodeList = JSON.parse(JSON.stringify(result.data))
                // 방송 아이디 및 타이틀 세팅
                for (let i = 0; i < window.podcastObj.popular.episodeList.length; i++) {
                  window.podcastObj.popular.episodeList[i].pid = window.podcastObj.popular.pid
                  window.podcastObj.popular.episodeList[i].title = window.podcastObj.popular.title
                }
                // addEpisodePlay 내부에 audio.play에서 src가 set될 때 canplay에서 실질적인 play를 하기 때문에
                // window.podcastObj.preventPlay 를 false로 설정하여 canplay때 play되는 것을 막는다.
                // 뮤직류 재생 정책 변경 - audioFocus 체크하여 자동재생 여부 판단
                let preventPlay = util.checkAudioFocus()
                window.podcastObj.preventPlay = preventPlay
                // 에피소드 추가
                util.addEpisodePlay(window.podcastObj.popular.episodeList[0], preventPlay)
                // 현재 재생 중 화면 이동
                self.$router.push('/player?isIgnoreRouting=true')
                // 화면 표시
                self.application.show()
                // 로딩 중 숨김 [GRLGUP-3720][GRLGUP-3726] -> showLoading에서 서비스메인의 로딩팝업을 제어하려다가 발생한 이슈
                // util.hideLoading() -->> canplay에서 hideLoading을 호출하기 때문에 주석처리함
                result = ''
              }, function (result) {
                logger.error(result)
                // 모든 팝업 닫기
                util.closeAllPopup()
                // 에러 팝업 표시
                popup.show(errorMsg.getProp(result))
              })
            }
          } else {
            console.info('요금제 ratePayment 체크 playBGM #1 ' + window.podcastObj.service.status.ratePayment)
            console.log('클러스터 에피소드 정보 전송 default')
            window.podcastAgent.sendClusterDefaultInfo('MODE')
          }
          // 서브카드 실행 여부
          isRunSubCard = true
          break
        case 'PODCAST_POPULAR_SHOW':
          // 화면 표시
          self.application.show()
          // 서브카드 실행 여부
          isRunSubCard = true

          if (window.podcastObj.popular.channelList && window.podcastObj.popular.channelList.length > 0) {
            // Popular.vue에서 beforeDestroy가 될 때 channelList가 초기화 된다.
            // 제목
            window.podcastObj.popular.title = window.podcastObj.popular.channelList[0].title
            // 방송ID
            window.podcastObj.popular.pid = window.podcastObj.popular.channelList[0].pid
          }
          // 인기방송 목록 화면 이동
          self.$router.push('/popular')
          // 서브카드 실행 (2018.12.18 주석처리 : onPlay 이벤트시에만 runSubCard 실행)
          // appMsg.runSubCard('podcast-sub-1')
          break
        case 'PODCAST_BTCALL_GET':
          // BT Call 상태 SET
          appMsg.postMessage('PODCAST_BTCALL_SET')
          break
        case 'PODCAST_RUN_MAIN_CARD_SET':
          if (typeof message !== 'undefined') {
            // 메인가젯 실행 여부 세팅
            window.podcastObj.isRunMainCard = JSON.parse(message)
            // 라스트 모드 저장 (메인/서브카드 여부)
            window.podcastObj.lastMode.isRunMainCard = window.podcastObj.isRunMainCard
            // 팟빵 오브젝트 저장
            storage.savePodcastObj()
          }
          break
        case 'playBGM':
          console.log('playBGM !!!!! ')
          console.log('episodeList.length ' + window.podcastObj.history.episodeList.length)
          if (window.podcastObj.service.status.ratePayment === 'payment1') {
            // 서비스메인에서 실행해줘로 메시지 왔을 경우
            if (window.podcastObj.history.episodeList.length > 0) {
              // 재생/일시정지
              if (window.podcastObj.audioObj.paused) {
                window.podcastObj.ctrl.play(true)
              } else {
                window.podcastObj.ctrl.pause('PLAYER #1')
              }
            } else if (window.podcastObj.popular.pid.trim() === '') {
              // factory reset할 경우 pid가 없을 때가 존재함
              util.getPopular(() => {
                // 에피소드 추가 및 재생
                util.addEpisodePlay(window.podcastObj.popular.episodeList[0])
                self.$router.push('/player?isIgnoreRouting=true')
              })
            } else {
              // 로딩 중 표시
              util.showLoading(false)
              // 곡 정보 요청
              // 방송 내 에피소드 목록 API
              podcastApi.getEpisodeList({
                'token': window.podcastObj.user.token,
                'count': 50,
                'startSeq': 0,
                'pid': window.podcastObj.popular.pid
              }, function (result) {
                console.log(result)
                // 최초 실행이면
                window.podcastObj.popular.episodeList = JSON.parse(JSON.stringify(result.data))
                // 방송 아이디 및 타이틀 세팅
                for (let i = 0; i < window.podcastObj.popular.episodeList.length; i++) {
                  window.podcastObj.popular.episodeList[i].pid = window.podcastObj.popular.pid
                  window.podcastObj.popular.episodeList[i].title = window.podcastObj.popular.title
                }
                // 에피소드 추가 및 재생
                util.addEpisodePlay(window.podcastObj.popular.episodeList[0])
                self.$router.push('/player?isIgnoreRouting=true')
                result = ''
              }, function (result) {
                logger.error(result)
                // 모든 팝업 닫기
                util.closeAllPopup()
                // 에러 팝업 표시
                popup.show(errorMsg.getProp(result))
              })
            }
          } else {
            console.info('요금제 ratePayment 체크 playBGM #1 ' + window.podcastObj.service.status.ratePayment)
          }
          break
        default:
          break
      }
    },
    // 화면 표시 이벤트 초기화
    initApplicationShownEvent: function () {
      self = this
      this.application.addEventListener('ApplicationShown', function () {
        // 키패드 닫음
        if (window.vk && window.vk.isOpen) {
          window.vk.cancel()
        }
        // 서브카드 실행 (오디오 재생중인 앱이 없으면 runSubCard 실행)
        let json = self.application.getActiveAudioAppName()
        json = (json) ? JSON.parse(json) : ''
        let activeAudioAppName = json.AppName ? json.AppName : ''
        let isPlaying = json.IsPlaying ? json.IsPlaying : false
        console.log('[activeAudioAppName] : ' + activeAudioAppName)
        console.log('[isPlaying] : ' + isPlaying)
        if (!isPlaying) {
          appMsg.runSubCard('podcast-sub-1')
        }
        // 상태바 세팅
        let appName = ''
        try {
          appName = JSON.parse(self.application.getDescriptor().shortNameList).widgetShortName[0].name
        } catch (e) {
          appName = self.application.getDescriptor().getWidgetName('')
        }
        self.application.setStatusBarTitle(appName, self.application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png')
        // 네트워크 상태에 따라 back
        if (window.podcastObj.service.status.networkStatus !== '01') {
          self.application.back()
        }
        // [DEV2PRJ-2725] 팟캐스트 음성인식 안내 팝업은 mounted가 아닌 ApplicattionShown 이벤트에서 호출하는 것으로 수정
        if (util.isShowServicePopup()) {
          console.log('isShowServicePopup')
          // 0.1초 마다 체크
          window.popularInitTimer = setInterval(function () {
            if (window.podcastObj.popup.loading === null) {
              // 재귀 호출 해제
              clearInterval(window.popularInitTimer)
              // 모든 팝업 닫기
              util.closeAllPopup()
              console.log('팟캐스트 음성인식 안내 팝업')
              // 로그인 안내 팝업 표시
              popup.show({
                type: 'guide',
                title: '안내',
                content: '팟빵 서비스 앱은 터치로만 정상 이용할 수 있습니다.</br>음성으로 \'팟캐스트 틀어줘\'라고 할 경우에는</br>홈 화면 AI 플레이어에서 재생됩니다.</br>[INFOCONN 홈 → AI 플레이어]',
                subContent: '빠른 시일내로 업그레이드하여 이용에 불편이 없도록 하겠습니다. 감사합니다.',
                buttons: [{
                  label: '닫기',
                  // onClick: function () {
                  //   // 모든 팝업 닫기
                  //   util.closeAllPopup()
                  // }
                  onClick: null
                }]
              })
            }
          }, 100)
        }
        // [DEV2PRJ-2539] 팟빵에 진입시, 재생할 컨텐츠가 있는 경우는 모두 '현재 재생 중' 페이지로 이동
        // 요금제 상태 체크
        if (window.podcastObj.service.status.ratePayment === '' || window.podcastObj.service.status.ratePayment === 'payment1') {
          if (window.podcastObj.history.episodeList.length > 0) {
            console.log('applicationShown - history 존재함')
            // 플레이어 화면 이동
            self.$router.push('/player')
            // 팟캐스트 이어 재생
            // TODO: 뮤직류 재생 정책 변경 - audioFocus 체크하여 자동재생 여부 판단
            if (!util.checkAudioFocus(true)) {
              window.podcastObj.ctrl.play()
            }
            // window.podcastObj.ctrl.play() // 화면 이동만 하고 자동 재생하지 않음
          } else if (!self.$route.query.isIgnoreRouting) {
            console.log('[applicationShown] history 없음')
            // 인기방송 목록 화면 이동
            // TODO: 뮤직류 재생 정책 변경 - audioFocus 체크하여 자동재생 여부 판단
            if (util.checkAudioFocus()) {
              console.log('[applicationShown] audioFocus를 가지고 있어 인기방송으로 이동')
              self.$router.push('/popular')
            } else {
              // 인기방송 에피소드 받아와 재생 처리
              console.log('[applicationShown] audioFocus를 되찾아 자동재생')
              // 로딩 중 표시
              util.showLoading(false)
              // 인기방송 목록 화면 이동
              // 방송 내 에피소드 목록 API
              podcastApi.getEpisodeList({
                'token': window.podcastObj.user.token,
                'count': 50,
                'startSeq': 0,
                'pid': window.podcastObj.popular.pid
              }, function (result) {
                console.log(result)
                // 최초 실행이면
                window.podcastObj.popular.episodeList = JSON.parse(JSON.stringify(result.data))
                // 방송 아이디 및 타이틀 세팅
                for (let i = 0; i < window.podcastObj.popular.episodeList.length; i++) {
                  window.podcastObj.popular.episodeList[i].pid = window.podcastObj.popular.pid
                  window.podcastObj.popular.episodeList[i].title = window.podcastObj.popular.title
                }
                // 에피소드 추가 및 재생
                util.addEpisodePlay(window.podcastObj.popular.episodeList[0])
                result = ''
              }, function (result) {
                logger.error(result)
                // 모든 팝업 닫기
                util.closeAllPopup()
                // 에러 팝업 표시
                popup.show(errorMsg.getProp(result))
              })
              self.$router.push('/player')
            }
          }
        } else {
          console.info('요금제 ratePayment 체크 playBGM #1 ' + window.podcastObj.service.status.ratePayment)
          console.log('클러스터 에피소드 정보 전송 default')
          window.podcastAgent.sendClusterDefaultInfo('MODE')
        }
        console.log('isRunSubCard ::: ' + isRunSubCard)
        // 서브카드 업데이트
        if (isRunSubCard === false) {
          // 서브카드 실행 (2018.12.18 주석처리 : onPlay 이벤트시에만 runSubCard 실행)
          // appMsg.runSubCard('podcast-sub-1')
          // 서브카드 실행 여부
          isRunSubCard = true
        }
        // 서브카드 실행 여부 (초기화)
        isRunSubCard = false
      }, false)
    },
    // 서비스 상태 이벤트 초기화
    initServiceZoneStatusEvent: function () {
      // 네트워크 상태 (networkStatus) 00:비정상, 01:정상
      // CCSS 서버 연동 상태 (ccssStatus) 00:비정상, 01:정상
      // 요금제 정보 (ratePayment) basic: 기본 요금제, premium: 프리미엄 요금제, payment1: 최상위 요금제
      this.application.addEventListener('ServiceZoneStatus', function (status) {
        console.log(JSON.stringify(status))
        if (typeof status === 'string') {
          status = JSON.parse(status)
        }
        window.podcastObj.service.status.ratePayment = status.ratePayment
        if (window.podcastObj.service.status.ratePayment && window.podcastObj.service.status.ratePayment !== 'payment1') {
          // 요금제 정보 체크
          console.log('제공되지 않는 요금제로 팟캐스트 앱 종료', status)
          // 에피소드 재생중이면 일시정지
          if (!window.podcastObj.audioObj.paused) {
            // 일시정지
            window.podcastObj.ctrl.pause()
          }
          window.podcastObj.toast.show('현재 요금제에서 제공되지 않는 서비스입니다.')
          if (window.podcastObj.isRunMainCard) {
            if (window.podcastObj.service.status.networkStatus === '01') {
              window.podcastAgent.sendClusterDefaultInfo('MODE')
            } else {
              window.podcastAgent.sendClusterDefaultInfo('LAST')
            }
          }
          // 모든 팝업 닫기
          util.closeAllPopup()
          // 서비스메인으로 이동 (foreground인 경우만 메인으로 이동)
          if (window.applicationFramework && window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
            window.applicationFramework.applicationManager.getOwnerApplication(window.document).main()
          }
        }
        window.podcastObj.service.status.networkStatus = status.networkStatus
        if (window.podcastObj.service.status.networkStatus === '01') {
          storage.loadPodcastObj(true)
          if (window.podcastObj.lastMode.isActive === true && window.podcastObj.lastMode.isRecovered === false) {
            window.podcastObj.lastMode.isRecovered = true
            if (window.podcastObj.history.episodeList.length > 0) {
              window.podcastObj.ctrl.play(false)
            }
            // appMsg.runSubCard('podcast-sub-1')
          } else if (window.podcastObj.history.episodeList.length <= 0) {
            util.getPopular()
          } else {
            appMsg.postMessage('PODCAST_PLAYING_SET')
          }
        }
        /* else if (status && status.ccssStatus && status.ccssStatus === '00') {
          // CCSS 서버 연동상태 체크
          console.log('CCSS서버 연동상태 비정상으로 인한 팟캐스트 앱 종료', status)
          // 에피소드 재생중이면 일시정지
          if (!window.podcastObj.audioObj.paused) {
            // 일시정지
            window.podcastObj.ctrl.pause()
          }
          // 모든 팝업 닫기
          util.closeAllPopup()
          // 서비스메인으로 이동 (foreground인 경우만 메인으로 이동)
          if (window.applicationFramework && window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
            window.applicationFramework.applicationManager.getOwnerApplication(window.document).main()
          }
        } else if (status && status.networkStatus && status.networkStatus === '00') {
          // 네트워크 상태 체크
          console.log('네트워크 비정상으로 인한 팟캐스트 앱 종료', status)
          // 에피소드 재생중이면 일시정지
          if (!window.podcastObj.audioObj.paused) {
            // 일시정지
            window.podcastObj.ctrl.pause()
          }
          // 모든 팝업 닫기
          util.closeAllPopup()
          // 서비스메인으로 이동 (foreground인 경우만 메인으로 이동)
          if (window.applicationFramework && window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
            window.applicationFramework.applicationManager.getOwnerApplication(window.document).main()
          }
        } */
      }, false)
    },
    // 화면 숨김 이벤트 초기화
    initApplicationHidden: function () {
      this.application.addEventListener('ApplicationHidden', function () {
        // 히스토리 편집페이지에서 하드키로 앱 밖으로 이동시, 초기화
        window.podcastObj.history.isChoice = false
        util.closeCenterPopup()
      }, false)
    },
    // 라스트 모드 이벤트 초기화
    initLastMode: function () {
      self = this
      // Application 은 해당 Event로 status 가 들어오면 현재 page 를 저장하고, 실행중인 contents 를 중지 / 시작하여야 한다.
      // 1 : Save last page & Contents stop
      // 0 : start Contents
      this.application.addEventListener('PowerAccState', function (status) {
        console.log('PowerAccState 이벤트 수신 : ' + status)
        if (typeof status !== 'undefined' && status === 1) {
          window.podcastObj.lastMode.isPlaying = !window.podcastObj.audioObj.paused
          //
          window.podcastObj.lastMode.isRunMainCard = window.podcastObj.isRunMainCard
          console.log('window.podcastObj.lastMode.isRunMainCard :: ' + window.podcastObj.lastMode.isRunMainCard)
          // 재생 중이면
          if (!window.podcastObj.audioObj.paused) {
            // 일시정지
            window.podcastObj.ctrl.pause('APP #2')
          }
          // 팟캐스트 오브젝트 저장
          storage.savePodcastObj(true)
        } else if (typeof status !== 'undefined' && status === 0) {
          if (window.podcastObj.lastMode.isRunMainCard) {
            // 히스토리가 있고, 일시정지 상태이면
            if (window.podcastObj.history.episodeList.length > 0 && window.podcastObj.audioObj.paused) {
              if (window.podcastObj.lastMode.isPlaying) {
                window.podcastObj.ctrl.play(true)
              }
            }
          }
        }
      }, false)
      // Application 은 해당 Event를 받으면 종료 전 마지막 실행되었던 Application 이므로 LastSaveMode로 동작한다.
      this.application.addEventListener('ApplicationLastSaveMode', function () {
        console.log('[팟빵] ApplicationLastSaveMode 이벤트 수신')
        // pip화면에 연결중입니다. 갱신
        window.podcastAgent.sendClusterDefaultInfo('LAST')
        // 라스트 모드 활성화
        window.podcastObj.lastMode.isActive = true
        window.podcastObj.lastMode.isLastModeEvent = true
        console.log('window.podcastObj.history.episodeList.length :: ' + window.podcastObj.history.episodeList.length)
        console.log('window.podcastObj.audioObj.paused :: ' + window.podcastObj.audioObj.paused)
        console.log('window.podcastObj.lastMode.isRunMainCard :: ' + window.podcastObj.lastMode.isRunMainCard)
        console.log('window.podcastObj.service.status.ratePayment :: ', JSON.stringify(window.podcastObj.service.status.ratePayment))
        console.log('window.podcastObj.service.status.networkStatus :: ', JSON.stringify(window.podcastObj.service.status.networkStatus))
        if (window.podcastObj.service.status.ratePayment === 'payment1') {
          if (window.podcastObj.service.status.networkStatus === '01') {
            window.podcastObj.lastMode.isRecovered = true
            if (window.podcastObj.history.episodeList.length > 0) {
              window.podcastObj.ctrl.play(false)
            } else {
              // 재생할 컨텐츠가 없을 경우
              // '실시간 서비스를 이용해보세요' 표시
              window.podcastAgent.sendClusterDefaultInfo('MODE')
            }
            // appMsg.runSubCard('podcast-sub-1')
          }
          // 6초뒤에 재생 실행
          // setTimeout(function () {
          //  // always play, received lastsavemode Event (regardless of the gadget location)
          //  // if (window.podcastObj.lastMode.isRunMainCard) {
          //  if (window.podcastObj.history.episodeList.length > 0) {
          //    window.podcastObj.ctrl.play()
          //  }
          //  appMsg.runSubCard('podcast-sub-1')
          //  // }
          // }, 7000)
        } else {
          // 라스트모드에서 네트워크가 정상인지 비정상인지 판단할 수 없는 경우
          // 라스트 모드에서 음영지역일 때 네트워크 연결이 되어있지않다면 요금제 판단이 되지않는다.
          if (window.podcastObj.service.status.networkStatus === '01') {
            // ServiceZoneStatus에 대한 이벤트가 ApplicationLastSaveMode보다 먼저 올라온 경우
            // 요금제가 없고 네트워크가 연결된 상태면 요금제가입이 되어 있지않음
            // '실시간 서비스를 이용해보세요' 표시
            window.podcastAgent.sendClusterDefaultInfo('MODE')
          } else {
            console.log('ServiceZoneStatus 이벤트 호출 시 추가적으로 처리')
          }
          console.info('요금제 ratePayment 체크 ApplicationLastSaveMode #1 ' + window.podcastObj.service.status.ratePayment)
        }
      }, false)
    },
    // FullScreen 이벤트 초기화 (BM 전용)
    initFullScreenPip: function () {
      self = this
      // Application 은 해당 Event를 받으면 FullScreen으로 전환되어야 한다.
      this.application.addEventListener('FullScreenPIPRequest', function () {
        console.log('FullScreenPIPRequest 이벤트 수신')
        if (window.podcastObj.history.episodeList.length > 0) {
          // 플레이어 화면 이동
          self.$router.push('/player')
        } else {
          // 플레이어 화면 이동
          self.$router.push('/popular')
        }
        // 앱 F/G 전환
        self.application.fullscreen()
      }, false)
    },
    initApplicationUnloaded () {
      self = this
      this.application.addEventListener('ApplicationUnloaded', () => {
        console.log('ApplicationUnloaded 이벤트 수신')
        // 재생 여부 세팅
        window.podcastObj.lastMode.isPlaying = !window.podcastObj.audioObj.paused
        // 라스트 모드 저장 (메인/서브카드 여부)
        window.podcastObj.lastMode.isRunMainCard = window.podcastObj.isRunMainCard
        // 재생 중이면
        if (!window.podcastObj.audioObj.paused) {
          // 일시정지
          window.podcastObj.ctrl.pause('APP #3')
        }
        // 팟캐스트 오브젝트 저장
        storage.savePodcastObj()
        self.application.unloadedAck()
      })
    }
  },
  mounted () {
    // 라우터 초기화
    this.initRouter()
    // 프레이워크가 있으면
    if (window.applicationFramework) {
      // 어플리케이션
      this.application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
      self = this
      // 0.01초 후에 실행 (최초 로딩 시간에 영향 안되기 위한 비동기 접근)
      setTimeout(function () {
        // AIC 초기화
        self.initAIC()
        // 하드웨어키 초기화
        self.initHardKeyAction()
        // 화면 표시 이벤트 초기화
        self.initApplicationShownEvent()
        // 서비스 상태 이벤트 초기화
        self.initServiceZoneStatusEvent()
        // 화면 숨김 이벤트 초기화
        self.initApplicationHidden()
        // 라스트 모드 이벤트 초기화 (BM 전용)
        self.initLastMode()
        // FullScreen 이벤트 초기화 (BM 전용)
        self.initFullScreenPip()
        // crash 및 OOM 이벤트 초기화
        self.initApplicationUnloaded()
        // 서비스 상태값 요청
        self.application.requestServiceZoneStatus()
      }, 10)
    }
    // 토스트 표시 함수
    window.podcastObj.toast.show = this.toastShowFn
    // 토스트 숨김 함수
    window.podcastObj.toast.hide = this.toastHideFn
    // 팟캐스트 앱 종료
    window.podcastAppTerminate = this.podcastAppTerminate
    // New 뱃지 구독 방송 체크 (TODO: 기능 부활을 염두해서 주석처리만 함)
    // util.checkNewChannelList()
    // 최초 1회만 (BM 전용)
    if (window.podcastObj.history.episodeList.length > 0) {
      // 서브카드 추가 (최근 재생 에피소드)
      appMsg.addSubCard('podcast-sub-1')
    }
    // 카테고리 목록
    podcastApi.getCategory({
      'count': 30
    }, function (result) {
      console.log(result)
      window.podcastObj.popular.categoryList = result.data
      window.podcastObj.popular.categoryList.unshift({'category': '종합'})
    }, function (result) {
      logger.error(result)
      // 에러 팝업 표시
      popup.show(errorMsg.getProp(result))
    })
  }
}
</script>

<style lang="scss">
@import '~obigo-js-ui/dist/styles/reset.scss';
@import '~obigo-js-ui/dist/styles/icon.scss';
@import '~obigo-js-ui/dist/styles/theme.scss';

@font-face {
  font-family:'NotoSansCJKkr-Regular';
  src: local('Noto Sans CJK KR Regular');
}
@font-face {
  font-family:'NotoSansCJKkr-Medium';
  src: local('Noto Sans CJK KR Medium');
}
body{background: transparent;}
body, button {
	font-family: 'NotoSansCJKkr-Regular';
}
#app{
  overflow: hidden;
  position: relative;
  width: 1280px;
  height: 650px;
  font-family: 'NotoSansCJKkr-Regular';
}
.toastPopup {
  position: absolute;
  top: 40px;
  left: 0;
  z-index: 90;
  width: 100%;
  min-height: 70px;
  background-color: #000;
  border: 1px solid #9b9b9b;

  p {
    width: 100%;    
    line-height: 40px;
    padding: 15px 20px;
    font-size: 30px;
    color: #fff;
    text-align: center;
  } 
  
  &.full {
    width: 100%;
    margin-left: 0;
  }
}
</style>
