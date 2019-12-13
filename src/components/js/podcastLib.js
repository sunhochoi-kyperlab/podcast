'use strict'

/**
 * 팟캐스트 라이브러리
 *
 * audio : 오디오 관련 함수
 *  - init : 오디오 초기화
 *  - prev : 이전 재생
 *  - play : 재생/일시정지
 *  - next : 다음 재생
 *  - seekUp : 이전 에피소드 탐색
 *  - seekDown : 다음 에피소드 탐색
 * storage : 로컬저장소 관련 함수
 *  - loadPodcastObj : 팟캐스트 오브젝트 로드
 *  - savePodcastObj : 팟캐스트 오브젝트 저장
 * util
 *  - setDate : 날짜 포멧팅
 *  - isToday : 오늘 여부 (오늘이면 true, 아니면 false)
 *  - addEpisodePlay : 히스토리에 에피소드 추가 및 재생
 *  - updatePlayingInfoByIndex : seekUp/Down에서 탐색된 info를 업데이트
 *  - updateEpisodeIndex: playlist에서 현 에피소드의 index를 검색
 */
import popup from '../popup'
import { logger } from './commonLib'
import { podcastApi, errorMsg } from './podcastApi'

// 애플리케이션
let application
// 앱 아이디
let appId
// 앱 이름
let appName = ''
if (window.applicationFramework) {
  application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
  appId = application.getDescriptor().id
  console.log('appId : ' + appId)
  try {
    appName = JSON.parse(application.getDescriptor().shortNameList).widgetShortName[0].name
  } catch (e) {
    appName = application.getDescriptor().getWidgetName('')
  }
}

let audio = {
  // loadstart 이벤트 여부
  isLoadstart: false,
  // 전송한 currentTime (앱간통신 빈도수를 줄이기 위함)
  sendCurrentTime: '00:00',
  // 오디오 초기화
  init: function () {
    // 오디오 오브젝트 없으면
    if (window.podcastObj.audioObj === null) {
      // 팝업 초기화
      window.podcastObj.popup.loading = null
      // 오디오 오브젝트
      window.podcastObj.audioObj = document.getElementById('audio')
      console.log('audio Object initialize')
      window.applicationFramework.applicationManager.getOwnerApplication(window.document).addEventListener('AudioFocusChanged', (state) => {
        logger.info('[podcastLib] AudioFocusChanged')
        if (window.podcastObj.modeCtrl.calledCanPlay && window.podcastObj.modeCtrl.audioFocusChanged && state === 1) {
          if (window.podcastObj.audioObj) {
            window.podcastObj.audioObj.dispatchEvent(new Event('canplay'))
          }
        }
        window.podcastObj.modeCtrl.audioFocusChanged = false
      })
      // 이전 재생
      window.podcastObj.ctrl.prev = function () {
        logger.info('window.podcastObj.ctrl.prev() 실행')
        // 이전 다음 선택 여부
        // 서비스메인 로딩 레이어 표시는 showLoading에서 처리함
        if (!window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          // 서비스메인 로딩 레이어 표시
          window.applicationFramework.applicationManager.getOwnerApplication(window.document).postMessage(JSON.stringify({value: true}), 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=LOADING', null)
        }
        // 이전
        audio.prev()
      }
      // 재생 함수
      window.podcastObj.ctrl.play = function (flag = true) {
        logger.info('window.podcastObj.ctrl.play() 실행')
        logger.info('play flag = ' + flag)
        if (window.podcastObj.playing.fileUrl === '') {
          console.log('재생 URL 없음')
          return
        }

                // OSD 토스트 데이터 전송
        // option) NORMAL = 0 (PIP나 자기화면인 경우 표시하지 않음)
        // option) ALWAYS = 1 (항상 표시)
        // option) COLOR_RED = 16 (붉은색으로 표시)
        // AF 상태 : AF_UNKNOWN = 0
        // AF 상태 : AF_ACTIVATE = 1
        // AF 상태 : AF_SUSPEND = 2
        let afState = (window.applicationFramework.getAppFrameworkState && window.applicationFramework.getAppFrameworkState()) || 0
        let appState = window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible
        // 자동재생인경우 OSD 표시 안함
        console.log('[isPlayingEnd] = ' + window.podcastObj.playing.isPlayingEnd)
        if (!window.podcastObj.playing.isPlayingEnd) {
          if (!window.podcastObj.playing.etitle && window.podcastObj.playing.title) {
            if (afState === 1) {
              console.log('OSD #3 : ctrl.play')
              if (!appState) {
                application.setOsdStatusBarContent(appName, application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png', '재생한 히스토리가 없습니다', '', 1)
              }
            } else if (afState === 2) {
              console.log('OSD #4 : ctrl.play')
              application.setOsdStatusBarContent(appName, application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png', '재생한 히스토리가 없습니다', '', 0)
            }
          } else if (window.podcastObj.playing.etitle) {
            if (afState === 2) {
              // AF가 suspend 일 때 (PIP화면)
              setTimeout(() => {
                util.showOsd('OSD #5 : ctrl.play', 0)
              }, 1000)
            }
          }
        }
        window.applicationFramework.applicationManager.getOwnerApplication(window.document).requestAudioFocus('main', false)
        // 오디오 소스 체크
        if (window.podcastObj.audioObj.src !== window.podcastObj.playing.fileUrl) {
          console.log('[ctrl.play] src #1 : ' + window.podcastObj.audioObj.src)
          // 로딩 중 표시
          util.showLoading(false)
          // 재생 중이면 일시정지
//          window.podcastObj.ctrl.pause()
          // 오디오 소스 세팅 (canplay 이벤트시 자동 재생)
          // window.applicationFramework.applicationManager.getOwnerApplication(window.document).requestAudioFocus('main', false)
          window.podcastObj.audioObj.src = window.podcastObj.playing.fileUrl
        } else if (Number.isNaN(window.podcastObj.audioObj.duration)) {
          // duration이 NaN인 경우
          // loadstart 후 error가 발생하여 미디어를 다운로드 받지 못하여 재생할 최소한의 buffer가 없는 경우
          // showLoading은 loadstart에서 호출됨
          window.podcastObj.audioObj.removeAttribute('src')
          window.podcastObj.audioObj.src = window.podcastObj.playing.fileUrl
        } else {
          console.log('[ctrl.play] src #2 : ' + window.podcastObj.audioObj.src)
          // 재생
          // do not replay music if already play finish when obtain audio focus by mode change or av on/off
          if (window.podcastObj.audioObj.currentTime === 0 || window.podcastObj.audioObj.duration !== window.podcastObj.audioObj.currentTime || flag) {
            // 재생
            window.podcastObj.audioObj.play(flag)
          } else {
            appMsg.runSubCard('podcast-sub-1')
          }
        }
      }
      // 일시정지 함수
      window.podcastObj.ctrl.pause = function (log) {
        if (typeof log === 'undefined') {
          logger.info('[podcastLib] podcastObj.ctrl.pause() 실행')
        } else {
          logger.info('[podcastLib] podcastObj.ctrl.pause() 실행 : ' + log)
        }
        if (!window.podcastObj.audioObj.paused) {
          // 일시정지
          window.podcastObj.audioObj.pause()
        }
      }
      // 다음 재생
      window.podcastObj.ctrl.next = function () {
        logger.info('window.podcastObj.ctrl.next() 실행')
        // 서비스메인 로딩 레이어 표시는 showLoading에서 처리함
        if (!window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          // 서비스메인 로딩 레이어 표시
          window.applicationFramework.applicationManager.getOwnerApplication(window.document).postMessage(JSON.stringify({value: true}), 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=LOADING', null)
        }
        // 다음
        audio.next()
      }
      // SEEK_UP
      window.podcastObj.ctrl.seekUp = function () {
        logger.info('window.podcastObj.ctrl.seekUp() 실행')
        audio.seekUp()
        // PIP화면에서 seekUp long press 시 PIP 화면 갱신
        if (window.applicationFramework.getAppFrameworkState() === 2) {
          window.podcastAgent.sendClusterDisplayInfo(0)
        }
      }
      // SEEK_DOWN
      window.podcastObj.ctrl.seekDown = function () {
        logger.info('window.podcastObj.ctrl.seekDown() 실행')
        audio.seekDown()
        // PIP화면에서 seekDown long press 시 PIP 화면 갱신
        if (window.applicationFramework.getAppFrameworkState() === 2) {
          window.podcastAgent.sendClusterDisplayInfo(0)
        }
      }
      /**
       * 오디오 이벤트 세팅 (아래의 이벤트들을 핸들링합니다. 2019-04-16)
       * - loadstart: Fires when the browser starts looking for the audio/video
       * - loadeddata: Fires when the browser has loaded the current frame of the audio/video
       * - loadedmetadata: Fires when the browser has loaded meta data for the audio/video
       * - canplay: Fires when the browser can start playing the audio/video
       * - canplaythrough: Fires when the browser can play through the audio/video without stopping for buffering
       * - play: Fires when the audio/video has been started or is no longer paused
       * - progress: Fires when the browser is downloading the audio/video
       * - timeupdate: Fires when the current playback position has changed
       * - ended: Fires when the current playlist is ended
       * - error: Fires when an error occurred during the loading of an audio/video
       * - pause: Fires when the audio/video has been paused
       * - abort: Fires when the loading of an audio/video is aborted
       * - waiting: Fires when the video stops because it needs to buffer the next frame
       */
      window.podcastObj.audioObj.addEventListener('loadstart', function () {
        logger.audioEvent('[오디오 이벤트 수신] loadstart')
        util.showLoading(false)
        audio.isLoadstart = true
      })
      window.podcastObj.audioObj.addEventListener('loadeddata', function () {
        logger.audioEvent('[오디오 이벤트 수신] loadeddata')
      })
      window.podcastObj.audioObj.addEventListener('loadedmetadata', function () {
        logger.audioEvent('[오디오 이벤트 수신] loadedmetadata')
      })
      window.podcastObj.audioObj.addEventListener('canplay', function () {
        logger.audioEvent('[오디오 이벤트 수신] canplay')
        window.podcastObj.modeCtrl.calledCanPlay = true
        if (window.podcastObj.preventPlay) {
          logger.audioEvent('canplay시 pause')
          window.podcastObj.preventPlay = false
          window.podcastObj.audioObj.pause()
          util.closeAllPopup()
        } else {
          // loadstart 이벤트로 진행된 상태인지 체크
          console.log('audio.isLoadstart: ' + audio.isLoadstart)
          console.log('window.podcastObj.audioObj.currentTime: ' + window.podcastObj.audioObj.currentTime)
          console.log('window.podcastObj.playing.currentTimeOrigin: ' + window.podcastObj.playing.currentTimeOrigin)
          // ACC ON 상태일 경우에만 재생 요청
          if (audio.isLoadstart) {
            audio.isLoadstart = false
            if (window.podcastObj.playing.currentTimeOrigin > 0) {
              // GRLGUP-3591 [
              if (window.podcastObj.audioObj.currentTime === 0) {
                window.podcastObj.playing.currentTimeOrigin -= 3
                if (window.podcastObj.playing.currentTimeOrigin < 0) {
                  window.podcastObj.playing.currentTimeOrigin = 0
                }
              }
              // ]
              // 재생시간 설정
              window.podcastObj.audioObj.currentTime = window.podcastObj.playing.currentTimeOrigin
            }
          }
          // audio focus가 podcast에 있을 경우만 재생
          if (util.checkAudioFocus(true)) {
            // currentTime이 0일 경우에만 재생
            if (window.podcastObj.audioObj.currentTime === 0) {
              if (window.applicationFramework.applicationManager.getOwnerApplication(window.document).getAudioFocusStatus() !== 0) {
                console.log('canplay - 처음부터 재생')
                // 재생 시작
                window.podcastObj.audioObj.play(true)
              }
            } else if (window.podcastObj.playing.currentTimeOrigin > 0) {
              // setTimeout(function () {
              console.log('canplay - 이어재생')
              // 재생 시작
              window.podcastObj.audioObj.play(false)
              // }, 100)
            }
            // (waiting 이벤트로 활성화된) 로딩 중 숨김
            util.hideLoading()
          }
        }
      })
      window.podcastObj.audioObj.addEventListener('canplaythrough', function () {
        logger.audioEvent('[오디오 이벤트 수신] canplaythrough')
      })
      window.podcastObj.audioObj.addEventListener('play', function () {
        logger.audioEvent('[오디오 이벤트 수신] play')
        if (!window.podcastObj.audioObj.src) {
          console.log('재생 정보가 없는데 play 이벤트가 올라오는 경우 강제 정지')
          window.podcastObj.audioObj.pause()
          window.podcastObj.style.playClass = 'play'
          return
        }
        // 로딩 중 숨김
        util.hideLoading()
        window.podcastObj.isAudioSourceLoading = false
        // 서브카드 실행 (218.12.18 : 오디오 재생시에만 runSubCard 실행)
        appMsg.runSubCard('podcast-sub-1')
        window.applicationFramework.applicationManager.getOwnerApplication(window.document).postMessage(JSON.stringify({value: false}), 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=LOADING', null)
        // 재생/일시정지 클래스 변경
        window.podcastObj.style.playClass = 'pause'
        // hardkey관련 BM 전용
        if (!window.podcastObj.isLongPress) {
          // 스타일 SET
          appMsg.postMessage('PODCAST_STYLE_SET')
        }
        // 스타일 전송 카운트
        // let sendStyleCnt = 0
        // 초기화
        if (typeof window.sendStyleTimer !== 'undefined') {
          // 스타일 타이머 해제
          clearInterval(window.sendStyleTimer)
          // 스타일 전송 카운트
          // sendStyleCnt = 0
        }
        // remove retry process
        // window.sendStyleTimer = setInterval(function () {
        //   if (sendStyleCnt < 6) {
        //     // hardkey관련 BM 전용
        //     if (!window.podcastObj.isLongPress) {
        //       // 스타일 SET
        //       appMsg.postMessage('PODCAST_STYLE_SET')
        //     }
        //     // 스타일 전송 카운트 증가
        //     sendStyleCnt++
        //   } else {
        //     // 초기화
        //     if (typeof window.sendStyleTimer !== 'undefined') {
        //       // 스타일 타이머 해제
        //       clearInterval(window.sendStyleTimer)
        //       // 스타일 전송 카운트
        //       sendStyleCnt = 0
        //     }
        //   }
        // }, 500)
        // 클러스터 에피소드 정보 전송 (BM 전용)
        if (window.podcastAgent) {
          window.podcastAgent.sendClusterDisplayInfo(1)
        }
        // 재생 완료 여부 초기화
        window.podcastObj.playing.isPlayingEnd = false
        // 처음/마지막 에피소드 여부 초기화
        window.podcastObj.isFirstLastEpisode = false

        // let afState = (window.applicationFramework.getAppFrameworkState && window.applicationFramework.getAppFrameworkState()) || 0
        // console.log('[afState] = ' + afState)
        // if (afState === 1) {
        //   // AF ForeGround
        //   // F/G 앱이 팟빵이 아닐 경우 OSD 출력
        //   let _topVisibleAppID = window.applicationFramework.applicationManager.getTopVisibleAppID()
        //   let _podcastAppID = window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().id
        //   console.log('[_topVisibleAppID] = ' + _topVisibleAppID)
        //   console.log('[_podcastAppID] = ' + _podcastAppID)
        //   if (_topVisibleAppID !== '' && _topVisibleAppID !== _podcastAppID && _topVisibleAppID !== 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher') {
        //     util.showOsd('[OSD] #1 : ctrl.play', 1)
        //     _topVisibleAppID = null
        //     _podcastAppID = null
        //   }
        // } else if (afState === 2) {
        //   util.showOsd('[OSD] #2 : ctrl.play', 0)
        // }
      })
      window.podcastObj.audioObj.addEventListener('progress', function (e) {
        // console.log('[오디오 이벤트 수신] src', window.podcastObj.audioObj.src)
        // console.log('[오디오 이벤트 수신] buffered', window.podcastObj.audioObj.buffered.end(0))
        // logger.audioEvent('[오디오 이벤트 수신] progress', e)
        // bufferPos 사용하는 곳은 없으므로 주석처리함
        // 프로그래스바 버퍼시간 그래프 업데이트
        // if (window.podcastObj.audioObj.buffered.length > 0) {
        //   let bufferPos = Math.ceil(window.podcastObj.audioObj.buffered.end(0) / window.podcastObj.audioObj.duration * 100)
        //   if (bufferPos >= 100) {
        //     bufferPos = 100
        //   } else {
        //     bufferPos = bufferPos - 4
        //     if (bufferPos < 0) {
        //       bufferPos = 0
        //     }
        //   }
        //   window.podcastObj.playing.bufferPos = bufferPos + '%'
        // }
      })
      window.podcastObj.audioObj.addEventListener('suspend', function (e) {
        // 네트워크 속도가 느릴 경우 progressive download가 되지 않고 정지될 경우 현재 이벤트가 올라옴
        logger.audioEvent('[오디오 이벤트 수신] Progressive Download 정지 됨')
        // audio.isLoadstart = false
        // window.podcastObj.audioObj.pause()
        // window.podcastObj.style.playClass = 'play'
        util.hideLoading()
        // window.podcastObj.toast.show('콘텐츠가 재생 정보가 유효하지 않습니다.')
      })
      window.podcastObj.audioObj.addEventListener('durationchange', function () {
        // 총 플레이시간 업데이트 [GRLGUP-4012]
        // 서버로 부터 받아온 데이터를 playing 오브젝트에 세팅할 때 서버에서 받은 duration을 우선 세팅하고
        // 서버로부터 받은 duration 보다 실제 duration이 더 많을 때만 새로 duration을 계산하도록 한다.
        if (typeof window.podcastObj.audioObj.duration !== 'undefined' && window.podcastObj.audioObj.duration > 0 &&
          window.podcastObj.playing.durationOrigin <= window.podcastObj.audioObj.duration) {
          // [GRLGUP-3854]
          console.log('duration 갱신')
          let dTime = Math.floor(window.podcastObj.audioObj.duration)
          let dHour = Math.floor((dTime % (60 * 60 * 60)) / (60 * 60))
          if (dHour < 10) {
            dHour = '0' + dHour
          }
          let dMinute = Math.floor((dTime % (60 * 60)) / 60)
          if (dMinute < 10) {
            dMinute = '0' + dMinute
          }
          let dSecond = Math.floor(dTime % 60)
          if (dSecond < 10) {
            dSecond = '0' + dSecond
          }
          if (dHour > 0) {
            window.podcastObj.playing.duration = dHour + ':' + dMinute + ':' + dSecond
          } else {
            window.podcastObj.playing.duration = dMinute + ':' + dSecond
          }
          // 총 재생 시간 (오리지널)
          window.podcastObj.playing.durationOrigin = window.podcastObj.audioObj.duration
        }
      })
      window.podcastObj.audioObj.addEventListener('timeupdate', function () {
        logger.debug('[오디오 이벤트 수신] timeupdate') // verbose
        if (!window.podcastObj.audioObj.src) {
          console.log('재생 정보가 없는데 timeupdate 이벤트가 올라오는 경우 강제 정지')
          window.podcastObj.audioObj.pause()
          window.podcastObj.style.playClass = 'play'
          return
        }
        // 재생시간 업데이트
        if (typeof window.podcastObj.audioObj.currentTime !== 'undefined' && window.podcastObj.audioObj.currentTime > 0) {
          if (window.podcastObj.audioObj.duration !== window.podcastObj.playing.durationOrigin) {
            console.log(window.podcastObj.audioObj.duration + ' / ' + window.podcastObj.playing.durationOrigin)
            console.log('durationchange')
            window.podcastObj.playing.durationOrigin = window.podcastObj.audioObj.duration
            window.podcastObj.audioObj.dispatchEvent(new Event('durationchange'))
          }
          if (Math.floor(window.podcastObj.audioObj.currentTime) > window.podcastObj.audioObj.duration) {
            // currentTime이 실제 duration 보다 커서 총 재생 시간보다 현재 재생 시간이 많아지는 것을 방지
            // ex) duration이 48:54 인데 currentTIme이 48:55가 되는 경우
            console.log('currentTime이 duration보다 클 경우 return')
            return
          }
          // [GRLGUP-3854]
          let dTime = Math.floor(window.podcastObj.audioObj.duration)
          let cTime = Math.floor(window.podcastObj.audioObj.currentTime)
          let cHour = Math.floor((cTime % (60 * 60 * 60)) / (60 * 60))
          if (cHour < 10) {
            cHour = '0' + cHour
          }
          let cMinute = Math.floor((cTime % (60 * 60)) / 60)
          if (cMinute < 10) {
            cMinute = '0' + cMinute
          }
          let cSecond = Math.floor(cTime % 60)
          if (cSecond < 10) {
            cSecond = '0' + cSecond
          }
          if (dTime > 3600) {
            window.podcastObj.playing.currentTime = cHour + ':' + cMinute + ':' + cSecond
          } else {
            window.podcastObj.playing.currentTime = cMinute + ':' + cSecond
          }
          window.podcastObj.playing.currentTimeOrigin = window.podcastObj.audioObj.currentTime
        }
        // 현재 재생중인 시간 (오리지널)
        window.podcastObj.playing.currentTimeOrigin = window.podcastObj.audioObj.currentTime
        // 프로그래스바 재생시간 그래프 업데이트
        let nowPos = Math.floor(window.podcastObj.audioObj.currentTime / window.podcastObj.audioObj.duration * 100)
        if (!window.podcastObj.isPlayerHead) {
          window.podcastObj.playing.nowPos = nowPos + '%'
          // let trackPercent = (playheadX / 720) * 100
          let playheadX = Math.floor((nowPos / 100) * 720)
          window.podcastObj.playing.playheadX = playheadX
        }
        // 팟캐스트 오브젝트 저장
        // storage.savePodcastObj()
        // 이전에 전송한 시간과 다르면 전송
        if (audio.sendCurrentTime !== window.podcastObj.playing.currentTime) {
          // 전송한 시간 세팅
          audio.sendCurrentTime = window.podcastObj.playing.currentTime
          // 재생정보 SET
          appMsg.postMessage('PODCAST_PLAYING_SET')
          // 클러스터 상태 정보 전송 (BM 전용)
          if (window.podcastAgent && !window.podcastObj.audioObj.paused) {
            window.podcastAgent.sendClusterNotifyInfo(0)
            // move to hardkey listner callback
            // if (window.podcastObj.needSendCluster) {
            //   // 클러스터 전송
            //   window.podcastAgent.sendClusterDisplayInfo(1)
            //   // 클러스터 전송 필요 초기화
            //   window.podcastObj.needSendCluster = false
            // }
          }
        }
      })
      window.podcastObj.audioObj.addEventListener('ended', function () {
        logger.audioEvent('[오디오 이벤트 수신] ended')
        // 에피소드 재생 완료 상태 세팅
        window.podcastObj.playing.isPlayingEnd = true
        // 재생/일시정지 클래스 변경
        window.podcastObj.style.playClass = 'play'
        // [GRLGUP-4114] 이슈가 재현이 되지않아 주석처리
        // // playing 객체 일부 초기화
        // window.podcastObj.playing.currentTime = '00:00'
        // window.podcastObj.playing.currentTimeOrigin = 0
        // window.podcastObj.playing.bufferPos = '0%'
        // window.podcastObj.playing.nowPos = '0%'
        // window.podcastObj.playing.playheadX = 0
        // hardkey관련 BM 전용
        if (!window.podcastObj.isLongPress) {
          // 스타일 SET
          appMsg.postMessage('PODCAST_STYLE_SET')
        }
        // 다음 곡 호출
        // audio.next()
        // 메인화면에서 곡이 끝날 경우 서비스메인 로딩팝업을 띄우기 위함
        window.podcastObj.ctrl.next()
        // 클러스터 상태 정보 전송 (BM 전용)
        if (window.podcastAgent) {
          window.podcastAgent.sendClusterNotifyInfo(2)
        }
        // 팟캐스트 오브젝트 저장
        storage.savePodcastObj()
        // 팟캐스트 재생정보 SET
        appMsg.postMessage('PODCAST_PLAYING_SET')
      })
      window.podcastObj.audioObj.addEventListener('error', function (e) {
        logger.audioEvent('[오디오 이벤트 수신] error')
        console.error(e)
        console.log('audio src error 값 확인 : ' + window.podcastObj.audioObj.error)
        // 히스토리 없을 경우에 메인카드에 play버튼 클릭 시
        if (!window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
          // 서비스메인 로딩 레이어 제거
          window.applicationFramework.applicationManager.getOwnerApplication(window.document).postMessage(JSON.stringify({value: false}), 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=LOADING', null)
          appMsg.postMessage('SEND_PLAY_ERROR_MESSAGE_TO_MAIN_CARD')
        }
        if (window.podcastObj.playing.eid) {
          // 모든 팝업 닫기
          util.closeAllPopup()
          // 토스트 팝업 표시
          window.podcastObj.toast.show('팟캐스트 재생이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.')
        }
        // OSD 토스트 데이터 전송
        // option) NORMAL = 0 (PIP나 자기화면인 경우 표시하지 않음)
        // option) ALWAYS = 1 (항상 표시)
        let appState = window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible
        // Audio src값이 손상되었을 경우에만
        if (window.podcastObj.audioObj.error.code === 3 || window.podcastObj.audioObj.error.code === 4) {
          if (!appState) {
            // App BackGround
            application.setOsdStatusBarContent(appName, application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png', '서비스 상태가 불안정합니다.', '', 0)
          }
        }
        // timeout, remove loading
        if (window.podcastObj.audioObj.error.code === 2 || window.podcastObj.audioObj.error.code === 6 || window.podcastObj.audioObj.error.code === 7) {
          util.hideLoading()
          if (!appState) {
            // App BackGround
            application.setOsdStatusBarContent(appName, application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png', '서비스 상태가 불안정합니다.', '', 0)
          }
          if (window.podcastObj.audioObj.error.code === 7) {
            let src = window.podcastObj.audioObj.src
            window.podcastObj.audioObj.removeAttribute('src')
            window.podcastObj.audioObj.src = src
          }
        }
        // 재생/일시정지 클래스 변경
        window.podcastObj.style.playClass = 'play'
        // hardkey관련 BM 전용
        if (!window.podcastObj.isLongPress) {
          // 스타일 SET
          appMsg.postMessage('PODCAST_STYLE_SET')
        }
        // 클러스터 상태 정보 전송 (BM 전용)
        if (window.podcastAgent) {
          window.podcastAgent.sendClusterNotifyInfo(2)
        }
      })
      window.podcastObj.audioObj.addEventListener('pause', function () {
        logger.audioEvent('[오디오 이벤트 수신] pause')
        // 재생/일시정지 클래스 변경
        window.podcastObj.style.playClass = 'play'
        // hardkey관련 BM 전용
        if (!window.podcastObj.isLongPress) {
          // 스타일 SET
          appMsg.postMessage('PODCAST_STYLE_SET')
        }
        // 클러스터 상태 정보 전송 (BM 전용)
        // GRLGUP-3994 PIP화면에서 AI player 재생 중 팟빵 앱으로 전환 시 팟빵 음원이 세팅되기 전 시간이 업데이트 되기 때문에 아래를 주석처리함
        // if (window.podcastAgent) {
        //   window.podcastAgent.sendClusterNotifyInfo(1)
        // }
        // 팟캐스트 오브젝트 저장
        storage.savePodcastObj()
      })
      window.podcastObj.audioObj.addEventListener('blocked', function () {
        logger.audioEvent('[오디오 이벤트 수신] blocked')
        // 재생/일시정지 클래스 변경
        window.podcastObj.style.playClass = 'play'
        // hardkey관련 BM 전용
        if (!window.podcastObj.isLongPress) {
          // 스타일 SET
          appMsg.postMessage('PODCAST_STYLE_SET')
        }
        // 클러스터 상태 정보 전송 (BM 전용)
        // GRLGUP-3994 PIP화면에서 AI player 재생 중 팟빵 앱으로 전환 시 팟빵 음원이 세팅되기 전 시간이 업데이트 되기 때문에 아래를 주석처리함
        // if (window.podcastAgent) {
        //   window.podcastAgent.sendClusterNotifyInfo(1)
        // }
        // 팟캐스트 오브젝트 저장
        storage.savePodcastObj()
      })
      window.podcastObj.audioObj.addEventListener('abort', function (e) {
        logger.audioEvent('[오디오 이벤트 수신] abort')
        console.log(e)
        console.log('window.podcastObj.audioObj.src        : ' + window.podcastObj.audioObj.src)
        console.log('window.podcastObj.audioObj.currentSrc : ' + window.podcastObj.audioObj.currentSrc)
        // 재생/일시정지 클래스 변경
        window.podcastObj.style.playClass = 'play'
        // hardkey관련 BM 전용
        if (!window.podcastObj.isLongPress) {
          // 스타일 SET
          appMsg.postMessage('PODCAST_STYLE_SET')
        }
        // 클러스터 상태 정보 전송 (BM 전용)
        if (window.podcastAgent) {
          window.podcastAgent.sendClusterNotifyInfo(2)
        }
      })
      window.podcastObj.audioObj.addEventListener('waiting', function () {
        logger.audioEvent('[오디오 이벤트 수신] waiting')
        // 140. 접속지연 되는 경우(버퍼링) 애니메이션 또는 이미지 등이 필요함
        // (waiting 이벤트를 받으면) 로딩 중 표시
        util.showLoading(false)
      })
    }
  },
  // 이전 재생
  prev: function () {
    logger.info('[podcastLib] prev 실행')
    if (!window.podcastObj.isLongPress && !window.podcastObj.isComplete) {
      if (window.podcastObj.playing.currentTimeOrigin >= 6) {
        window.podcastObj.audioObj.currentTime = 0
        window.podcastObj.playing.currentTimeOrigin = 0
        audio.play()
        return
      }
    }
    // 방송 ID가 없으면
    if (typeof window.podcastObj.playing.pid === 'undefined' || window.podcastObj.playing.pid === '') {
      return
    }
    // 에피소드 ID가 없으면
    if (typeof window.podcastObj.playing.eid === 'undefined' || window.podcastObj.playing.eid === '') {
      return
    }
    // [DEV2PRJ-2339] hardkey가 isLongPress이면 seekDown에서 핸들링
    // 로딩 중 표시
    util.showLoading(false)
    console.log('[prev] window.podcastObj.playing.pid : ' + window.podcastObj.playing.pid)
    console.log('[prev] window.podcastObj.playing.eid : ' + window.podcastObj.playing.eid)
    // 이전 에피소드 정보
    podcastApi.getEpisodeInfo({
      'pid': window.podcastObj.playing.pid,
      'eid': window.podcastObj.playing.eid,
      'type': 'prev',
      'token': window.podcastObj.user.token
    }, function (result) {
      console.log(result)
      if (result.data.length > 0) {
        // 추가 및 재생
        // Url이 같으면서 업데이트 되어야하는 경우는 다음/이전버튼 선택 시
        // 같은 Url이 업데이트 될 수 있도록 현재 시간을 쿼리로 추가
        window.podcastObj.playing.imageUrl = result.data[0].imageUrl
        util.addEpisodePlay(result.data[0])
      } else {
        // 처음/마지막 에피소드 여부 설정
        window.podcastObj.isFirstLastEpisode = true
        // 로딩 중 숨김
        util.hideLoading()

        let afState = (window.applicationFramework.getAppFrameworkState && window.applicationFramework.getAppFrameworkState()) || 0
        let appState = window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible
        if (afState === 1) {
          // AF가 active된 상태
          if (!appState) {
            // 앱이 visible이지 않은 상태
            // 서비스 메인 토스트 팝업 제공
            appMsg.postMessage('PODCAST_FIRSTEPISODE_TOAST_SHOW')
          } else {
            // 앱이 visible일 때
            // playlist 화면과 searchResult 화면은 full화면이기 때문에 toast팝업에 full class를 세팅
            let isToastFull = window.podcastObj.currentPage === '/playlist' || window.podcastObj.currentPage === '/searchResult' || false
            window.podcastObj.toast.show('첫번째 에피소드입니다.', isToastFull ? 'full' : '')
          }
        } else if (afState === 2) {
          // AF가 suspend 일 때 (PIP화면)
          application.setOsdStatusBarContent(appName, application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png', '첫번째 에피소드입니다.', '', 1)
        }
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
  },
  // 에피소드 정보 세팅 및 재생
  play: function (item) {
    logger.info('[podcastLib] play 실행')
    if (!window.podcastObj.preventPlay) {
      window.applicationFramework.applicationManager.getOwnerApplication(window.document).requestAudioFocus('main', false)
    }
    // 재생 정보 확인
    if (typeof item === 'undefined') {
      // 방송 ID가 없으면
      if (typeof window.podcastObj.playing.pid === 'undefined' || window.podcastObj.playing.pid === '') {
        return
      }
      // 에피소드 ID가 없으면
      if (typeof window.podcastObj.playing.eid === 'undefined' || window.podcastObj.playing.eid === '') {
        return
      }
      // 재생 정보로 대체
      item = window.podcastObj.playing
    }
    // 재생중인 에피소드와 동일한지 체크
    // [DEV2PRJ-2339] => 탐색 기능 추가에 따라 아래 비교 로직 변경 (TODO: 추가 설명 필요)
    if (window.podcastObj.audioObj.src === item.fileUrl) { // window.podcastObj.playing.eid === item.eid
      logger.info('[podcastLib] #1')
      if (window.podcastObj.isFirstLastEpisode) {
        window.podcastObj.playing.pid = item.pid
        window.podcastObj.playing.title = item.title
        window.podcastObj.playing.eid = item.eid
        window.podcastObj.playing.etitle = item.etitle
        window.podcastObj.playing.fileUrl = util.checkFileUrl(item)
        window.podcastObj.playing.imageUrl = util.checkImgUrl(item)
        window.podcastObj.playing.createdDate = item.createdDate
        window.podcastObj.playing.currentTime = '00:00'
        window.podcastObj.playing.currentTimeOrigin = 0
        window.podcastObj.playing.duration = '00:00'
        window.podcastObj.playing.durationOrigin = 0
        window.podcastObj.playing.bufferPos = '0%'
        window.podcastObj.playing.nowPos = '0%'
        window.podcastObj.playing.playheadX = 0
        window.podcastObj.audioObj.currentTime = 0
        window.podcastObj.audioObj.src = util.checkFileUrl(item)
      } else {
        // hardkey관련 BM 전용
        if (!window.podcastObj.isLongPress) {
          // 로딩 중 숨김
          util.hideLoading()
          // ACC ON 상태일 경우에만 재생 요청
          // 재생
          window.podcastObj.audioObj.play(true)
        } else {
          // 재생 요청인데 LongPress임
          console.warn('[play] requested when long pressing')
        }
      }
    } else { // play 요청된 에피소드(item.fileUrl)가 현재 재생중인 에피소드(audioObj.src)와 동일하지 않음
      logger.info('[podcastLib] #2')
      setTimeout(function () {
        // 기본정보 세팅
        window.podcastObj.playing.pid = item.pid
        window.podcastObj.playing.title = item.title
        window.podcastObj.playing.eid = item.eid
        window.podcastObj.playing.etitle = item.etitle
        window.podcastObj.playing.fileUrl = util.checkFileUrl(item)
        window.podcastObj.playing.imageUrl = util.checkImgUrl(item)
        window.podcastObj.playing.createdDate = item.createdDate
        window.podcastObj.playing.currentTime = '00:00'
        window.podcastObj.playing.currentTimeOrigin = 0
        window.podcastObj.playing.duration = '00:00'
        window.podcastObj.playing.durationOrigin = 0
        window.podcastObj.playing.bufferPos = '0%'
        window.podcastObj.playing.nowPos = '0%'
        window.podcastObj.playing.playheadX = 0
        // 재생 중이면 일시정지
        // window.podcastObj.ctrl.pause()
        // 재생 URL 세팅 (canplay 이후 자동 재생됨)

        // seekDown/Up long press의 경우 episodeList를 기반으로 playing 객체가 변경되고 이때 audio.play 가 호출되어
        // 서버로 부터 받아온 객체가 아닌 기존 playing 객체를 세팅한다. (이때 item에는 duration값이 존재하지 않는다.)
        if (item.duration) {
          let durationResult = util.convertTimeFormat(item.duration)
          if (durationResult) {
            // 서버로 부터 받은 duration이 포맷이 유효한 경우에만 세팅
            window.podcastObj.playing.duration = durationResult.duration
            window.podcastObj.playing.durationOrigin = durationResult.durationOrigin
          }
        }
        window.podcastObj.audioObj.src = util.checkFileUrl(item)
//        // hardkey관련 BM 전용
//        if (window.podcastObj.isLongPress) {
//          // 클러스터 상태 정보 전송 (BM 전용)
//          if (window.podcastAgent) {
//            window.podcastAgent.sendClusterDisplayInfo(1)
//          }
//        } else {
//        }
        window.podcastObj.isComplete = false
      }, 1000)
      logger.info('[podcastLib] #3')
      // OSD 전송
      let afState = (window.applicationFramework.getAppFrameworkState && window.applicationFramework.getAppFrameworkState()) || 0
      // 이전/다음으로 재생 됬을 경우 OSD 표시 안함
      setTimeout(function () {
        // 자동재생인경우 OSD 표시 안함
        if (!window.podcastObj.playing.isPlayingEnd) {
          if (afState === 1) {
            // AF ForeGround
            // F/G 앱이 팟빵이 아닐 경우 OSD 출력
            if (window.applicationFramework.applicationManager.getTopVisibleAppID() !== '' && window.applicationFramework.applicationManager.getTopVisibleAppID() !== window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().id && window.applicationFramework.applicationManager.getTopVisibleAppID() !== 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher') {
              util.showOsd('[OSD] #1 : play', 1)
            }
          } else if (afState === 2) {
            util.showOsd('[OSD] #2 : play', 0)
          }
        }
      }, 1000)
    }
    // 팟캐스트 오브젝트 저장
    storage.savePodcastObj()
    // 팟캐스트 재생정보 SET
    appMsg.postMessage('PODCAST_PLAYING_SET')
    // [DEV2PRJ-2339] => 플레이 리스트 진입시 가져오던 리스트를 팟빵 재생 시 가져오도록 변경
    // 재생목록이 없거나, 현재 방송과 다르면
    if (window.podcastObj.playlist.episodeList.length === 0 || window.podcastObj.playlist.pid !== item.pid) {
      console.log('[DEV2PRJ-2339] 플레이 리스트 진입시 가져오던 리스트를 팟빵 재생 시 가져오도록 변경 (재생목록이 없거나, 현재 방송과 다르다면)')
      podcastApi.getEpisodeList({
        'token': window.podcastObj.user.token,
        'count': 50,
        'startSeq': 0,
        'pid': item.pid,
        'sort': window.podcastObj.playlist._sort === 'F' ? 'asc' : 'desc' // 첫회 듣기에는 오래된 순으로 가져와야하기 때문
      }, function (result) {
        console.log('getEpisodeList success:', result)
        // 방송 아이디 및 타이틀
        window.podcastObj.playlist.pid = item.pid
        window.podcastObj.playlist.title = item.title
        // 에피소드 목록 세팅
        window.podcastObj.playlist.episodeList = JSON.parse(JSON.stringify(result.data))
        // 방송 아이디 및 타이틀 세팅
        for (let i = 0; i < window.podcastObj.playlist.episodeList.length; i++) {
          window.podcastObj.playlist.episodeList[i].pid = item.pid
          window.podcastObj.playlist.episodeList[i].title = item.title
        }
        // 정렬은 재생목록에서 처리
        // 인덱스 관련 처리
        util.updateEpisodeIndex(item)
        result = ''
      }, function (result) {
        logger.error(result)
        // 에러 팝업 표시 TODO: 어떤 문구를 표시할지 스펙 확인 필요
      })
    } else {
      console.log('get stated episodeList (no ajax call)')
      // 인덱스 관련 처리
      util.updateEpisodeIndex(item)
    }
  },
  // 다음 재생
  next: function () {
    logger.info('[podcastLib] next 실행')
    // 방송 ID가 없으면
    if (typeof window.podcastObj.playing.pid === 'undefined' || window.podcastObj.playing.pid === '') {
      return
    }
    // 에피소드 ID가 없으면
    if (typeof window.podcastObj.playing.eid === 'undefined' || window.podcastObj.playing.eid === '') {
      return
    }
    // [DEV2PRJ-2339] hardkey가 isLongPress이면 seekDown에서 핸들링
    // 로딩 중 표시
    util.showLoading(false)
    console.log('[next] window.podcastObj.playing.pid : ' + window.podcastObj.playing.pid)
    console.log('[next] window.podcastObj.playing.eid : ' + window.podcastObj.playing.eid)
    // 다음 에피소드 정보
    podcastApi.getEpisodeInfo({
      'pid': window.podcastObj.playing.pid,
      'eid': window.podcastObj.playing.eid,
      'type': 'next',
      'token': window.podcastObj.user.token
    }, function (result) {
      console.log(result)
      if (result.data.length > 0) {
        // 추가 및 재생
        // Url이 같으면서 업데이트 되어야하는 경우는 다음/이전버튼 선택 시
        // 같은 Url이 업데이트 될 수 있도록 현재 시간을 쿼리로 추가
        window.podcastObj.playing.imageUrl = result.data[0].imageUrl
        util.addEpisodePlay(result.data[0])
      } else {
        console.log('window.podcastObj.isFirstLastEpisode : ' + window.podcastObj.isFirstLastEpisode)
        // 처음/마지막 에피소드 여부 설정
        window.podcastObj.isFirstLastEpisode = true

        // 로딩 중 숨김
        util.hideLoading()
        // TODO: 앱의 상태 체크 필요
        let afState = (window.applicationFramework.getAppFrameworkState && window.applicationFramework.getAppFrameworkState()) || 0
        let appState = window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible
        if (afState === 1) {
          // AF가 active된 상태
          if (!appState) {
            // 앱이 visible이지 않은 상태
            // 서비스 메인 토스트 팝업 제공
            appMsg.postMessage('PODCAST_LASTEPISODE_TOAST_SHOW')
          } else {
            // 앱이 visible일 때
            // playlist 화면과 searchResult 화면은 full화면이기 때문에 toast팝업에 full class를 세팅
            let isToastFull = window.podcastObj.currentPage === '/playlist' || window.podcastObj.currentPage === '/searchResult' || false
            window.podcastObj.toast.show('마지막 에피소드입니다.', isToastFull ? 'full' : '')
          }
        } else if (afState === 2) {
          // AF가 suspend 일 때 (PIP화면)
          application.setOsdStatusBarContent(appName, application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png', '마지막 에피소드입니다.', '', 1)
        }
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
  },
  // 이전 에피소드 탐색
  seekUp: function () {
    logger.info('[podcastLib] seekUp 실행')
    if (window.podcastObj.playlist._sort === 'L') {
      if (window.podcastObj.playlist.episodeIndex === window.podcastObj.playlist.episodeList.length - 1) {
        console.warn('상태 저장된 에피소드 목록의 첫번째 에피소드 도착 (최신순 나열의 마지막 인덱스)')
        // 실제 재생은 SEEK_UP H/W Key Release 이벤트에서 처리
      } else {
        // 최신순으로 나열된 에피소드 목록에서 이전이란 인덱스가 증가함을 뜻함
        util.updatePlayingInfoByIndex(++window.podcastObj.playlist.episodeIndex)
      }
    } else if (window.podcastObj.playlist._sort === 'F') {
      if (window.podcastObj.playlist.episodeIndex === 0) {
        console.warn('상태 저장된 에피소드 목록의 첫번째 에피소드 도착 (오래된 순 나열의 처음 인덱스)')
        // 실제 재생은 SEEK_UP H/W Key Release 이벤트에서 처리
      } else {
        // 오래된 순으로 나열된 에피소드 목록에서 다음이란 인덱스가 감소함을 뜻함
        util.updatePlayingInfoByIndex(--window.podcastObj.playlist.episodeIndex)
      }
    }
  },
  // 다음 에피소드 탐색
  seekDown: function () {
    logger.info('[podcastLib] seekDown 실행')
    if (window.podcastObj.playlist._sort === 'L') {
      if (window.podcastObj.playlist.episodeIndex === 0) {
        console.warn('상태 저장된 에피소드 목록의 마지막 에피소드 도착 (최신순 나열의 처음 인덱스)')
        // 실제 재생은 SEEK_DOWN H/W Key Release 이벤트에서 처리
      } else {
        // 최신순으로 나열된 에피소드 목록에서 다음이란 인덱스가 감소함을 뜻함
        util.updatePlayingInfoByIndex(--window.podcastObj.playlist.episodeIndex)
      }
    } else if (window.podcastObj.playlist._sort === 'F') {
      if (window.podcastObj.playlist.episodeIndex === window.podcastObj.playlist.episodeList.length - 1) {
        console.warn('상태 저장된 에피소드 목록의 마지막 에피소드 도착 (오래된 순 나열의 마지막 인덱스)')
        // 실제 재생은 SEEK_UP H/W Key Release 이벤트에서 처리
      } else {
        // 오래된 순으로 나열된 에피소드 목록에서 다음이란 인덱스가 증가함을 뜻함
        util.updatePlayingInfoByIndex(++window.podcastObj.playlist.episodeIndex)
      }
    }
  }
}

// 로컬 저장소
let storage = {
  // 팟캐스트 오브젝트 로드
  loadPodcastObj: function (playing = false) {
    if (playing) {
      // 재생중인 에피소드
      if (window.podcastObj.playingbackup) {
        console.log(JSON.stringify(window.podcastObj.playingbackup))
        window.podcastObj.playing = JSON.parse(JSON.stringify(window.podcastObj.playingbackup))
        delete window.podcastObj.playingbackup
      }
    } else {
      // 재생중인 에피소드
      if (localStorage.getItem('window.podcastObj.playing') !== null) {
        console.log(localStorage.getItem('window.podcastObj.playing'))
        if (window.podcastObj.service.status.networkStatus !== '01') {
          window.podcastObj.playingbackup = JSON.parse(localStorage.getItem('window.podcastObj.playing'))
        } else {
          window.podcastObj.playing = JSON.parse(localStorage.getItem('window.podcastObj.playing'))
        }
      }
      // 재생목록 정렬 순서가 있으면
      if (localStorage.getItem('window.podcastObj.playlist.sort') !== null) {
        window.podcastObj.playlist.sort = JSON.parse(localStorage.getItem('window.podcastObj.playlist.sort'))
      } else {
        window.podcastObj.playlist.sort = 'L' // 최신순
      }
      // 히스토리 정렬 순서가 있으면
      if (localStorage.getItem('window.podcastObj.history.sort') !== null) {
        window.podcastObj.history.sort = JSON.parse(localStorage.getItem('window.podcastObj.history.sort'))
      } else {
        window.podcastObj.history.sort = 'L' // 최근 재생 순
      }
      // 히스토리가 있으면
      if (localStorage.getItem('window.podcastObj.history.episodeList') !== null) {
        // 히스토리
        let episodeList = JSON.parse(localStorage.getItem('window.podcastObj.history.episodeList'))
        for (let i = 0; i < episodeList.length; i++) {
          window.podcastObj.history.episodeList[i] = episodeList[i]
        }
      }
      // 인기 방송 카테고리
      window.podcastObj.popular.category = localStorage.getItem('window.podcastObj.popular.category') ? localStorage.getItem('window.podcastObj.popular.category') : '종합'
      // 라스트 모드 재생 중 여부 (BM전용)
      if (localStorage.getItem('window.podcastObj.lastMode.isPlaying') !== null) {
        window.podcastObj.lastMode.isPlaying = JSON.parse(localStorage.getItem('window.podcastObj.lastMode.isPlaying'))
      }
      // 라스트 모드 화면표시 여부 (BM전용)
      if (localStorage.getItem('window.podcastObj.lastMode.isShow') !== null) {
        window.podcastObj.lastMode.isShow = JSON.parse(localStorage.getItem('window.podcastObj.lastMode.isShow'))
      }
      // 라스트 모드 메인/서브카드 여부 화면표시 여부
      if (localStorage.getItem('window.podcastObj.lastMode.isRunMainCard') !== null) {
        window.podcastObj.lastMode.isRunMainCard = JSON.parse(localStorage.getItem('window.podcastObj.lastMode.isRunMainCard'))
      }
      // 음성인식 안내 팝업 화면표시 여부
      if (localStorage.getItem('window.podcastObj.servicePopup.isShow') !== null) {
        window.podcastObj.servicePopup.isShow = JSON.parse(localStorage.getItem('window.podcastObj.servicePopup.isShow'))
      }
    }
  },
  // 팟캐스트 오브젝트 저장
  savePodcastObj: function (isPowerAcc = false) {
    try {
      // 재생중인 에피소드
      if (isPowerAcc && window.podcastObj.playing.title === '' && window.podcastObj.playingbackup) {
        localStorage.setItem('window.podcastObj.playing', JSON.stringify(window.podcastObj.playingbackup))
      } else {
        localStorage.setItem('window.podcastObj.playing', JSON.stringify(window.podcastObj.playing))
      }
      // 재생목록 정렬 순서
      localStorage.setItem('window.podcastObj.playlist.sort', JSON.stringify(window.podcastObj.playlist.sort))
      // 히스토리
      localStorage.setItem('window.podcastObj.history.episodeList', JSON.stringify(window.podcastObj.history.episodeList))
      // 히스토리 정렬 순서
      localStorage.setItem('window.podcastObj.history.sort', JSON.stringify(window.podcastObj.history.sort))
      // 인기 방송 카테고리
      localStorage.setItem('window.podcastObj.popular.category', window.podcastObj.popular.category)
      // 라스트 모드 재생 중 여부 (BM전용)
      localStorage.setItem('window.podcastObj.lastMode.isPlaying', JSON.stringify(window.podcastObj.lastMode.isPlaying))
      // 라스트 모드 화면표시 여부 (BM전용)
      localStorage.setItem('window.podcastObj.lastMode.isShow', JSON.stringify(window.podcastObj.lastMode.isShow))
      // 라스트 모드 메인/서브카드 여부 (BM전용)
      localStorage.setItem('window.podcastObj.lastMode.isRunMainCard', JSON.stringify(window.podcastObj.lastMode.isRunMainCard))
      // 음성인식 안내 팝업 화면표시 여부
      localStorage.setItem('window.podcastObj.servicePopup.isShow', JSON.stringify(window.podcastObj.servicePopup.isShow))
    } catch (e) {
      console.error(e)
      console.error('로컬스토로지 용량 부족으로 히스토리 초기화')
      // 재생 중이면 일시정지
      if (!window.podcastObj.audioObj.paused) {
        window.podcastObj.audioObj.pause()
        window.podcastObj.style.playClass = 'play'
      }
      // 히스토리 초기화
      window.podcastObj.history.episodeList = []
      // 팟캐스트 오브젝트 저장
      window.podcastObj.savePodcastObj()
      // 페이지 이동
      window.podcastObj.router.push('/history')
      // 토스트 팝업 표시
      window.podcastObj.toast.show('로컬스토로지 용량 부족으로 히스토리 초기화')
    }
  },
  // 히스토리 존재 여부
  isHistory: function () {
    // 히스토리가 있으면
    if (localStorage.getItem('window.podcastObj.history.episodeList') !== null) {
      if (JSON.parse(localStorage.getItem('window.podcastObj.history.episodeList')).length > 0) {
        return true // 있음
      } else {
        return false // 없음
      }
    } else {
      return false // 없음
    }
  },
  // NEW 뱃지 목록 정리
  clearNewBadgeList: function () {
    // New 뱃지 방송 목록
    window.podcastObj.subscript.newChannelList = []
    localStorage.setItem('window.podcastObj.subscript.newChannelList', JSON.stringify(window.podcastObj.subscript.newChannelList))
    // New 뱃지 에피소드 목록
    window.podcastObj.subscript.newEpisodeList = []
    localStorage.setItem('window.podcastObj.subscript.newEpisodeList', JSON.stringify(window.podcastObj.subscript.newEpisodeList))
  }
}

// 유틸리티
let util = {
  convertTimeFormat: function (str) {
    if (/[^0-9]/g.test(str)) {
      // 숫자 제외하고 리턴
      return null
    }
    let duration, durationOrigin
    var arr = str.split('')
    let newStr = arr.map((value, index, array) => {
      if (index % 2 === 0) {
        return value + arr[index + 1]
      }
    }).filter(value => {
      return value
    })
    // str 이 '020543' 인 경우
    // hour 는 2, min 는 5, sec 는 43
    let hour = parseInt(newStr[0])
    let min = parseInt(newStr[1])
    let sec = parseInt(newStr[2])
    if (hour > 0) {
      duration = newStr.join(':')
    } else {
      newStr.shift()
      duration = newStr.join(':')
    }
    hour = hour * 60 * 60
    min = min * 60
    durationOrigin = hour + min + sec
    return {
      duration,
      durationOrigin
    }
  },
  checkAudioFocus: function (isUsingLastAppName = false) {
    let app = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
    let json = app.getActiveAudioAppName()
    json = (json) ? JSON.parse(json) : ''
    let activeAudioAppName = isUsingLastAppName ? (json.LastAppName ? json.LastAppName : '') : (json.AppName ? json.AppName : '')
    // let audioFocusStatus = json.AudioFocusStatus
    let appName = app.getDescriptor().getWidgetName('en-us')
    // if (audioFocusStatus === 0) {
    //   // native가 audioFocus를 가지고 있음
    //   return false
    // }
    return appName === activeAudioAppName
  },
  // OSD 표시
  showOsd: function (name, option) {
    //
    if (!window.podcastObj.service.telephony.state) {
      let appName = ''
      let osdEpisodeNameStr = window.podcastObj.playing.etitle + '-' + window.podcastObj.playing.title
      try {
        appName = JSON.parse(window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().shortNameList).widgetShortName[0].name
      } catch (e) {
        appName = window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().getWidgetName('')
      }
      console.log(name + ' : ' + osdEpisodeNameStr + ' : 1')
      window.applicationFramework.applicationManager.getOwnerApplication(window.document).setOsdStatusBarContent(appName, window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png', osdEpisodeNameStr, '', option)
    } else {
      console.log('podcast : calling')
    }
  },
  // 로딩 중 표시
  showLoading: function (isAutoHide) {
    console.log('로딩 중 표시')
    // 이미 로딩 팝업이 있으면
    if (window.podcastObj.popup.loading) {
      return
    }
    // 로딩 팝업 타이머 있으면
    if (window.loadingPopupTimer) {
      clearTimeout(window.loadingPopupTimer)
    }
    window.podcastObj.popup.loading = popup.show({
      'type': 'loading',
      'title': ''
    })
    if (typeof isAutoHide === 'undefined') {
      isAutoHide = true
    }
    if (isAutoHide) {
      setTimeout(function () {
        if (window.podcastObj.popup && window.podcastObj.popup.loading && window.podcastObj.popup.loading.close) {
          window.podcastObj.popup.loading.close()
        } else {
          util.closeAllPopup()
        }
        window.podcastObj.popup.loading = null
      }, 300)
    } else {
      // 최대 10초 후 자동 닫기
      window.loadingPopupTimer = setTimeout(function () {
        // 모든 팝업 닫기
        util.closeAllPopup()
        window.podcastObj.popup.loading = null
        // 서비스메인 로딩 레이어 해제
        window.applicationFramework.applicationManager.getOwnerApplication(window.document).postMessage(JSON.stringify({value: false}), 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=LOADING', null)
      }, 10 * 1000)
    }
  },
  // 로딩 중 숨김
  hideLoading: function () {
    console.log('로딩 중 숨김')
    // 모든 팝업 닫기
    util.closeAllPopup()
    // 로딩 중 팝업
    window.podcastObj.popup.loading = null
    // 서비스메인 로딩 레이어 해제
    window.applicationFramework.applicationManager.getOwnerApplication(window.document).postMessage(JSON.stringify({value: false}), 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=LOADING', null)
  },
  // 날짜 포멧팅
  setDate: function (rawDate) {
    if (rawDate === null || typeof rawDate === 'undefined' || rawDate === '') {
      return rawDate
    } else if (rawDate.substring(0, 4) !== util.getToday().substring(0, 4)) {
      return rawDate.substring(0, 4) + '년'
    } else if (rawDate.length === 14) {
      return rawDate.substring(4, 6) + '월 ' + rawDate.substring(6, 8) + '일'
    } else if (rawDate.length === 8) {
      return rawDate.substring(0, 4) + '.' + rawDate.substring(4, 6) + '.' + rawDate.substring(6, 8)
    } else {
      return rawDate
    }
  },
  // 오늘 날짜 데이터 (기본: yyyymmdd)
  getToday: function () {
    let d = util.getDate()
    let yyyy = d.getFullYear()
    let mm = d.getMonth() + 1
    if (mm < 10) {
      mm = '0' + mm
    }
    let dd = d.getDate()
    if (dd < 10) {
      dd = '0' + dd
    }
    return yyyy + '' + mm + '' + dd
  },
  // 오늘 날짜이면 true, 아니면 false
  isToday: function (rawDate) {
    if (rawDate === null || typeof rawDate === 'undefined') {
      return false
    } else if (rawDate.length >= 8) {
      if (util.getToday() === rawDate.substring(0, 8)) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  },
  // 히스토리에 에피소드 추가 및 재생
  addEpisodePlay: function (_item, isNotSendAudioRequest) {
    let item = Object.assign({}, _item)
    console.log('addEpisodePlay!!!!!!!')
    console.log(JSON.stringify(item))
    // [GRLGUP-3588] item 유효성 검사 추가
    if (Object.keys(item).length === 0) {
      console.warn('[GRLGUP-3588] item 값이 없는 에피소드에 대한 재생 요청이 되었음')
      return false
    }
    // if (!window.podcastObj.modeCtrl.audioFocusChanged && window.applicationFramework.applicationManager.getOwnerApplication(window.document).getAudioFocusStatus() === 0 && window.applicationFramework.getAppFrameworkState() === 1) {
    window.podcastObj.modeCtrl.audioFocusChanged = true
    window.podcastObj.modeCtrl.calledCanPlay = false
    if (!isNotSendAudioRequest) {
      // isNotSendAudioRequest 플래그를 두는 이유
      // AI플레이어가 오디오 포커스를 가지고 히스토리가 없는 경우의 팟캐스트 서브카드를 눌러 진입 시
      // 인기방송 첫번째 에피소드를 set하기 때문에 addEpisodePlay가 호출되면서 AI 플레이어가 정지된다.
      window.applicationFramework.applicationManager.getOwnerApplication(window.document).requestAudioFocus('main', false)
    }
    // }
    // 재생 중이면
//    if (!window.podcastObj.audioObj.paused) {
//      window.podcastObj.style.playClass = 'play'
//      window.podcastObj.audioObj.pause()
//    }
    let seq = function () {
      let d = util.getDate()
      return parseInt(d.getTime())
    }
    // 시간 세팅
    item.rownum = seq()
    // 중복 검사
    let isItem = false
    for (let i = 0; i < window.podcastObj.history.episodeList.length; i++) {
      if (window.podcastObj.history.episodeList[i].eid === item.eid) {
        window.podcastObj.history.episodeList[i] = item
        isItem = true
        break
      }
    }
    // 기존에 없으면 추가
    if (isItem === false) {
      window.podcastObj.history.episodeList.push(item)
    }
    // 최대 에피소드수
    let episodeListLimit = 300
    // 배열 복사
    let target = window.podcastObj.history.episodeList.slice()
    // 최대 300 에피소드 넘었는지 확인 (FIFO 정책 적용)
    if (window.podcastObj.history.episodeList.length > episodeListLimit) {
      // 최근 재생 순
      target.sort(function (a, b) {
        return b.rownum - a.rownum
      })
      // 300건만 취함
      target = target.slice(0, episodeListLimit)
    }
    // 재정렬
    if (window.podcastObj.history.sort === 'L') {
      // 최근 재생 순
      target.sort(function (a, b) {
        return b.rownum - a.rownum
      })
    } else {
      // 오래된 재생 순
      target.sort(function (a, b) {
        return a.rownum - b.rownum
      })
    }
    // 히스토리 데이터 교체(복사)
    window.podcastObj.history.episodeList = target.slice()
    // 배열 초기화
    target = []
    // 팟캐스트 오브젝트 저장
    storage.savePodcastObj()
    // 재생
    audio.play(item)
    // 히스토리 목록에 없다가 추가된 경우 (BM 전용)
    if (window.podcastObj.history.episodeList.length === 1) {
      // 서브카드 추가 (최근 재생 에피소드)
      appMsg.addSubCard('podcast-sub-1')
    }
    appMsg.postMessage('PODCAST_HISTORY_SET')
  },
  // [DEV2PRJ-2339] seekUp/Down에서 탐색된 info를 업데이트
  updatePlayingInfoByIndex: function (index) {
    console.log('updatePlayingInfoByIndex:', index)
    let newInfo = window.podcastObj.playlist.episodeList[index]
    console.log('newInfo:', newInfo)
    window.podcastObj.playing.pid = newInfo.pid
    window.podcastObj.playing.title = newInfo.title
    window.podcastObj.playing.eid = newInfo.eid
    window.podcastObj.playing.etitle = newInfo.etitle
    window.podcastObj.playing.createdDate = newInfo.createdDate
    window.podcastObj.playing.fileUrl = util.checkFileUrl(newInfo)
    newInfo = null
  },
  // [DEV2PRJ-2339] updateEpisodeIndex
  updateEpisodeIndex: function (data) {
    console.log('updateEpisodeIndex:', data)
    let eIndex = window.podcastObj.playlist.episodeList.findIndex(
      episode => episode.eid === data.eid
    )
    if (eIndex === -1) { // no element passed
      console.warn('no element passed => list update required')
      // console.log('old episodeList:', JSON.stringify(window.podcastObj.playlist.episodeList))
      // NOTE: 히스토리를 통해 53번째(기본 인덱스에서 넘어가는) 곡 요청시 기본 50개곡 다음 인덱스에 바로 추가되는 것은 이슈 아님
      window.podcastObj.playlist.episodeList = window.podcastObj.playlist.episodeList.concat(JSON.parse(JSON.stringify(data)))
      // console.log('new episodeList:', JSON.stringify(window.podcastObj.playlist.episodeList))
      // 방송 아이디 및 타이틀 세팅 필요?
      // 재귀 호출
      util.updateEpisodeIndex(data)
      /**
       * [GRLGUP-3680] 플레이리스트에 현재 재생중인 컨텐츠가 없음
       * episodeList가 업데이트되고 현재 화면이 playlist라면 Playlist.vue의 로컬 리스트(_episodeList)를 업데이트하여 DOM이 변경되게끔 한다.
       * 좋은 구조 아님, 리팩토링 필요함
       */
      if (window.podcastObj.currentPage === '/playlist') {
        window.podcastObj.playlist._episodeList = Object.assign([], window.podcastObj.playlist.episodeList)
        window.podcastObj.playlist._episodeList.sort((a, b) => a.createdDate < b.createdDate ? 1 : -1)
      }
    } else {
      window.podcastObj.playlist.episodeIndex = eIndex
      console.warn('episodeIndex:', window.podcastObj.playlist.episodeIndex)
      eIndex = null
    }
  },
  // 히스토리 정렬
  sortHistory: function () {
    // 배열 복사
    let target = window.podcastObj.history.episodeList.slice()
    // 초기화
    window.podcastObj.history.episodeList = []
    // 최대 300 에피소드 넘었는지 확인 (FIFO 정책 적용)
    // 재정렬
    if (window.podcastObj.history.sort === 'L') {
      // 최근 재생 순
      target.sort(function (a, b) {
        return b.rownum - a.rownum
      })
    } else {
      // 오래된 재생 순
      target.sort(function (a, b) {
        return a.rownum - b.rownum
      })
    }
    window.podcastObj.history.episodeList = target
  },
  // 모든 팝업 닫음
  closeAllPopup: function () {
    while (popup.closeTopPopup()) {}
  },
  closeCenterPopup: function () {
    popup.closeCenterPopup()
  },
  // New 뱃지 구독 방송 체크
  checkNewChannelList: function () {
    console.log('checkNewChannelList')
    // 로그인 여부 체크
    if (window.podcastObj.user.isLogin) {
      // 구독 방송 목록 API
      podcastApi.getSubscription({
        'token': window.podcastObj.user.token,
        'count': 1000,
        'startSeq': 0
      }, function (result) {
        console.log(result)
        // 구독 목록
        let resultList = result.data
        // 유효한 방송 목록
        let newChannelList = []
        // 유효한 에피소드 목록
        let newEpisodeList = []
        // (예: 관리 중인 구독 방송 데이터인데 팟빵사이트 또는 팟빵앱에서 구독 취소한 경우)
        for (let i = 0; i < resultList.length; i++) {
          // 방송 검사
          for (let j = 0; j < window.podcastObj.subscript.newChannelList.length; j++) {
            // 오늘 날짜이고 유효한 방송인 경우
            if (util.isToday(window.podcastObj.subscript.newChannelList[j].date) && window.podcastObj.subscript.newChannelList[j].pid === resultList[i].pid) {
              // 유효한 방송에 추가
              newChannelList.push(window.podcastObj.subscript.newChannelList[j])
              // 에피소드 검사
              for (let k = 0; k < window.podcastObj.subscript.newEpisodeList.length; k++) {
                // 오늘 날짜이고 유효한 에피소드인 경우
                if (util.isToday(window.podcastObj.subscript.newEpisodeList[k].date) && window.podcastObj.subscript.newEpisodeList[k].pid === resultList[i].pid) {
                  newEpisodeList.push(window.podcastObj.subscript.newEpisodeList[k])
                }
              }
              break
            }
          }
        }
        window.podcastObj.subscript.newChannelList = newChannelList
        window.podcastObj.subscript.newEpisodeList = newEpisodeList
        // 구독 목록 추가
        for (let i = 0; i < resultList.length; i++) {
          // 오늘 날짜이면
          if (util.isToday(resultList[i].updatedDate)) {
            // New 뱃지 구독 방송 목록에 추가 (함수 내에서 중복 체크함)
            util.addNewChannelList(resultList[i].pid)
          }
        }
        // 구독 목록 초기화
        resultList = []
        // 유효한 방송 목록 초기화
        newChannelList = []
        // 유효한 에피소드 목록 초기화
        newEpisodeList = []
        // New 뱃지 여부 (메뉴)
        util.isNewForMenu()
        // 정리
        result = null
      }, function (result) {
        logger.error(result)
        // New 뱃지 여부 (메뉴)
        util.isNewForMenu()
        // 정리
        result = null
      })
    }
  },
  // New 뱃지 여부 (메뉴)
  isNewForMenu: function () {
    // New 여부
    let isNew = false
    // 로그인 여부 체크
    if (window.podcastObj.user.isLogin) {
      // 오늘 데이터 목록
      let newChannelList = []
      // 오늘 날짜
      let today = util.getToday()
      // 오늘 이외의 날짜 데이터 삭제
      let channelObj = {}
      for (let i = 0; i < window.podcastObj.subscript.newChannelList.length; i++) {
        channelObj = window.podcastObj.subscript.newChannelList[i]
        // 오늘 날짜 데이터이면
        if (channelObj.date === today) {
          // 오늘 데이터 목록에 추가
          newChannelList.push(channelObj)
          // 에피소드 재생 전이면
          if (channelObj.isPlayed === false) {
            // 신규 업데이트 있음
            isNew = true
          }
        }
      }
      // 오늘 날짜 데이터로 변경
      window.podcastObj.subscript.newChannelList = newChannelList
      newChannelList = []
      channelObj = {}
    }
    // 뱃지(NEW) 업데이트
    if (isNew) {
      appMsg.updateBadge('N')
    } else {
      appMsg.updateBadge('')
    }
    // 업데이트 여부 세팅
    window.podcastObj.subscript.isNewMenu = isNew
    // 팟캐스트 오브젝트 저장
    storage.savePodcastObj()
  },
  // New 뱃지 여부 (방송)
  isNewForChannel: function (pid) {
    // 오늘 날짜
    let today = util.getToday()
    let channelObj = {}
    // 데이터 검사
    for (let i = 0; i < window.podcastObj.subscript.newChannelList.length; i++) {
      channelObj = window.podcastObj.subscript.newChannelList[i]
      // 오늘 날짜 데이터이면
      if (channelObj.date === today && channelObj.pid === pid) {
        // 에피소드 재생 전이면
        if (channelObj.isPlayed === false) {
          // 신규 업데이트 있음
          return true
        }
      }
    }
    channelObj = {}
    // 신규 업데이트 없음
    return false
  },
  // New 배지 여부 (에피소드)
  isNewForEpisode: function (pid, eid) {
    // 오늘 날짜
    let today = util.getToday()
    let episodeObj = {}
    // 데이터 검사
    for (let i = 0; i < window.podcastObj.subscript.newEpisodeList.length; i++) {
      episodeObj = window.podcastObj.subscript.newEpisodeList[i]
      // 오늘 날짜 데이터이면
      if (episodeObj.date === today && episodeObj.pid === pid && episodeObj.eid === eid) {
        // 에피소드 재생 전이면
        if (episodeObj.isPlayed === false) {
          // 신규 업데이트 있음
          return true
        }
      }
    }
    episodeObj = {}
    // 신규 업데이트 없음
    return false
  },
  // New 뱃지 구독 방송 목록에 추가 (함수 내에서 중복체크)
  // 이 함수를 호출하기 전 해당 방송이 오늘 날짜에 해당하는지 체크가 있어야 함
  addNewChannelList: function (pid) {
    // 데이터 여부 검사
    for (let i = 0; i < window.podcastObj.subscript.newChannelList.length; i++) {
      if (window.podcastObj.subscript.newChannelList[i].pid === pid) {
        // 종료
        return
      }
    }
    // 방송 오브젝트 생성
    let channelObj = {
      date: util.getToday(),
      pid: pid,
      isPlayed: false
    }
    // 구독 방송 신규 업데이트
    window.podcastObj.subscript.newChannelList.push(channelObj)
    // 신규 업데이트 있음
    window.podcastObj.subscript.isNewMenu = true
    // 방송 오브젝트 생성
    channelObj = {}
    // 팟캐스트 오브젝트 저장
    storage.savePodcastObj()
    // 팟캐스트 재생정보 SET
    appMsg.postMessage('PODCAST_PLAYING_SET')
  },
  // New 뱃지 구독 방송 에피소드 목록에 추가 (함수 내에서 중복체크)
  // 이 함수를 호출하기 전 해당 방송이 오늘 날짜에 해당하는지 체크가 있어야 함
  addNewEpisodeList: function (pid, eid) {
    logger.info('[podcastLib] addNewEpisodeList 실행')
    // 데이터 여부 검사
    for (let i = 0; i < window.podcastObj.subscript.newEpisodeList.length; i++) {
      if (window.podcastObj.subscript.newEpisodeList[i].pid === pid && window.podcastObj.subscript.newEpisodeList[i].eid === eid) {
        // 종료
        return
      }
    }
    // New 뱃지 구독 방송 목록에 추가 (함수 내에서 중복 체크)
    util.addNewChannelList(pid)
    // 에피소드 오브젝트 생성
    let episodeObj = {
      date: util.getToday(),
      pid: pid,
      eid: eid,
      isPlayed: false
    }
    // 구독 방송 신규 업데이트
    window.podcastObj.subscript.newEpisodeList.push(episodeObj)
    // 신규 업데이트 있음
    window.podcastObj.subscript.isNewMenu = true
    // 에피소드 오브젝트 초기화
    episodeObj = {}
    // 팟캐스트 오브젝트 저장
    storage.savePodcastObj()
  },
  // New 뱃지 방송 목록에서 삭제
  removeNewChannel: function (pid) {
    // 오늘 날짜
    let today = util.getToday()
    // New 뱃지 방송 목록
    let newChannelList = []
    // 데이터 정리
    let channelObj = {}
    for (let i = 0; i < window.podcastObj.subscript.newChannelList.length; i++) {
      channelObj = window.podcastObj.subscript.newChannelList[i]
      // 오늘 날짜 데이터이고 해당 방송이 아니면
      if (channelObj.date === today && channelObj.pid !== pid) {
        // 데이터 목록에 추가
        newChannelList.push(channelObj)
      }
    }
    // 데이터로 변경
    window.podcastObj.subscript.newChannelList = newChannelList
    // New 뱃지 에피소드 목록
    let newEpisodeList = []
    // 데이터 정리
    let episodeObj = {}
    for (let i = 0; i < window.podcastObj.subscript.newEpisodeList.length; i++) {
      episodeObj = window.podcastObj.subscript.newEpisodeList[i]
      // 오늘 날짜 데이터이고 해당 방송이 아니면
      if (episodeObj.date === today && episodeObj.pid !== pid) {
        // 데이터 목록에 추가
        newEpisodeList.push(episodeObj)
      }
    }
    // 데이터로 변경
    window.podcastObj.subscript.newEpisodeList = newEpisodeList
     // New 뱃지 방송 목록 초기화
    newChannelList = []
    // 데이터 정리 초기화
    channelObj = {}
    // 팟캐스트 오브젝트 저장
    storage.savePodcastObj()
    // New 뱃지 구독 방송 체크 (TODO: 기능 부활을 염두해서 주석처리만 함)
    // util.checkNewChannelList()
  },
//  // New 뱃지 구독 방송 에피소드에서 삭제
//  removeNewEpisode: function (pid, eid) {
//    console.log('removeNewEpisode : pid : ' + pid + ', eid : ' + eid)
//    // 오늘 데이터 목록
//    let newEpisodeList = []
//    // 오늘 날짜
//    let today = util.getToday()
//    // 오늘 이외의 날짜 데이터 삭제
//    let episodeObj = {}
//    for (let i = 0; i < window.podcastObj.subscript.newEpisodeList.length; i++) {
//      episodeObj = window.podcastObj.subscript.newEpisodeList[i]
//      // 오늘 날짜 데이터이고 해당 방송이 아니면
//      if (episodeObj.date === today && episodeObj.pid !== pid && episodeObj.eid !== eid) {
//        // 오늘 데이터 목록에 추가
//        newEpisodeList.push(episodeObj)
//      }
//    }
//    // 데이터로 변경
//    window.podcastObj.subscript.newEpisodeList = newEpisodeList
//    // 팟캐스트 오브젝트 저장
//    storage.savePodcastObj()
//    // 해당 방송 내 New 에피소드가 다 지워졌는지 확인
//    let isNewForChannel = false
//    for (let i = 0; i < window.podcastObj.subscript.newEpisodeList.length; i++) {
//      // 해당 방송이면
//      if (window.podcastObj.subscript.newEpisodeList[i].pid === pid) {
//        isNewForChannel = true
//        break
//      }
//    }
//    if (isNewForChannel === false) {
//      // New 뱃지 구독 방송에서 삭제
//      util.removeNewChannel(pid)
//    }
//  },
  // New 뱃지 에피소드 재생
  playNewEpisode: function (pid, eid) {
    console.log('playNewEpisode : pid : ' + pid + ', eid : ' + eid)
    // New 에피소드 데이터 변경
    for (let i = 0; i < window.podcastObj.subscript.newEpisodeList.length; i++) {
      // 에피소드 정보가 일치하면
      if (window.podcastObj.subscript.newEpisodeList[i].pid === pid && window.podcastObj.subscript.newEpisodeList[i].eid === eid) {
        // 재생 여부 변경
        window.podcastObj.subscript.newEpisodeList[i].isPlayed = true
        // 팟캐스트 오브젝트 저장
        storage.savePodcastObj()
        break
      }
    }
    // 해당 방송 내 잔여 New 에피소드 데이터 검사
    let isNewForChannel = false
    for (let i = 0; i < window.podcastObj.subscript.newEpisodeList.length; i++) {
      // 해당 방송이면
      if (window.podcastObj.subscript.newEpisodeList[i].pid === pid && window.podcastObj.subscript.newEpisodeList[i].isPlayed === false) {
        isNewForChannel = true
        break
      }
    }
    if (isNewForChannel === false) {
      for (let i = 0; i < window.podcastObj.subscript.newChannelList.length; i++) {
        // 채널이 동일하면
        if (window.podcastObj.subscript.newChannelList[i].pid === pid) {
          // 재생 여부 변경
          window.podcastObj.subscript.newChannelList[i].isPlayed = true
          // 팟캐스트 오브젝트 저장
          storage.savePodcastObj()
          // New 뱃지 여부 (메뉴)
          util.isNewForMenu()
          return
        }
      }
    }
  },
  // HTML 특수 문자를 HTML 태그로 변환
  getHtmlString: function (rawData) {
    if (typeof rawData !== 'undefined' && rawData !== null) {
      rawData = rawData.replace(/&lt;/gi, '<')
      rawData = rawData.replace(/&gt;/gi, '>')
      rawData = rawData.replace(/&apos;/gi, '\'')
      rawData = rawData.replace(/&quot;/gi, '"')
      rawData = rawData.replace(/&amp;/gi, '&')
    }
    return rawData
  },
  // HTML 태그를 HTML 특수 문자로 변환
  setHtmlString: function (rawData) {
    if (typeof rawData !== 'undefined' && rawData !== null) {
      rawData = rawData.replace(/</gi, '&lt;')
      rawData = rawData.replace(/>/gi, '&gt;')
      rawData = rawData.replace(/'/gi, '&apos;')
      rawData = rawData.replace(/"/gi, '&quot;')
    }
    return rawData
  },
  // 음성인식 기능 제한 안내 팝업 표시 여부 (최초 1회)
  isShowServicePopup: function () {
    // 서비스 안내 팝업
    if (window.podcastObj.servicePopup.isShow) {
      return false
    } else {
      // [GRLGUP-3917] [LGU+][BM][팟캐스트] 최초 실행 팝업과 네트워크 오류 팝업이 겹쳐서 출력됨
      if (window.podcastObj.service.status.networkStatus !== '01') {
        console.log('[GRLGUP-3917] [LGU+][BM][팟캐스트] 최초 실행 팝업과 네트워크 오류 팝업이 겹쳐서 출력됨')
        return false
      } else {
        // 표시 여부 세팅
        window.podcastObj.servicePopup.isShow = true
        // 팟캐스트 오브젝트 저장
        storage.savePodcastObj()
        return true
      }
    }
  },
  // 비프음 (BM전용)
  beep: function () {
    if (typeof window.applicationFramework !== 'undefined') {
      window.applicationFramework.applicationManager.getOwnerApplication(window.document).beep()
    }
  },
  // 인기 방송 조회
  getPopular (callback = () => {}) {
    // 카테고리별 인기 방송 API
    podcastApi.getPopular({
      'count': 20,
      'startSeq': 0,
      'category': window.podcastObj.popular.category
    }, function (result) {
      if (typeof result.data !== 'undefined') {
        // 인기방송 목록
        window.podcastObj.popular.channelList = JSON.parse(JSON.stringify(result.data))
        if (window.podcastObj.popular.channelList.length > 0) {
          podcastApi.getEpisodeList({
            'token': window.podcastObj.user.token,
            'count': 50,
            'startSeq': 0,
            'pid': window.podcastObj.popular.channelList[0].pid
          }, function (result) {
            // 인기 방송 상세 목록 체크
            if (typeof result.data !== 'undefined' && result.data.length > 0) {
              // 인기 방송 상세 목록 세팅
              window.podcastObj.popular.episodeList = JSON.parse(JSON.stringify(result.data))
              window.podcastObj.popular.episodeList[0].pid = window.podcastObj.popular.channelList[0].pid
              window.podcastObj.popular.episodeList[0].title = window.podcastObj.popular.channelList[0].title
              window.podcastObj.popular.pid = window.podcastObj.popular.channelList[0].pid
              window.podcastObj.popular.title = window.podcastObj.popular.channelList[0].title
            } else {
              console.log(result)
            }
            // 인기 방송 SET
            appMsg.postMessage('PODCAST_POPULAR_SET')
            appMsg.postMessage('PODCAST_POPULAR_CATEGORY_SET')
            callback()
            result = ''
          }, function (result) {
            console.log(result)
          })
        }
      } else {
        console.log('인기방송 데이터 없음')
      }
      // 정리
      result = null
    }, function (result) {
      // 정리
      result = null
    })
  },
  // 구독 방송 조회
  getSubscription: function () {
    // 로그인 상태이면
    if (window.podcastObj.user.isLogin) {
      // 구독 방송 조회 API
      podcastApi.getSubscription({
        'token': window.podcastObj.user.token,
        'count': 20,
        'startSeq': 0
      }, function (result) {
        // 구독 방송 목록 체크
        if (typeof result.data !== 'undefined' && result.data.length > 0) {
          // 구독 방송 목록 세팅
          window.podcastObj.subscript.channelList = JSON.parse(JSON.stringify(result.data))
          // 구독 방송 목록이 있으면
          if (window.podcastObj.subscript.channelList.length > 0) {
            // 방송 내 에피소드 목록 API
            podcastApi.getEpisodeList({
              'token': window.podcastObj.user.token,
              'count': 50,
              'startSeq': 0,
              'pid': window.podcastObj.subscript.channelList[0].pid
            }, function (result) {
              console.log(result)
              // 방송 내 에피소드 목록 체크
              if (typeof result.data !== 'undefined' && result.data.length > 0) {
                // 방송 내 에피소드 목록 세팅
                window.podcastObj.subscript.episodeList = JSON.parse(JSON.stringify(result.data))
                window.podcastObj.subscript.episodeList[0].pid = window.podcastObj.subscript.channelList[0].pid
                window.podcastObj.subscript.episodeList[0].title = window.podcastObj.subscript.channelList[0].title
                window.podcastObj.subscript.pid = window.podcastObj.subscript.channelList[0].pid
                window.podcastObj.subscript.title = window.podcastObj.subscript.channelList[0].title
                // 구독 방송 SET
                appMsg.postMessage('PODCAST_SUBSCRIPTION_SET')
                appMsg.postMessage('PODCAST_SUBSCRIPTION_NEW_SET')
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
          } else {
            // 구독 방송 SET
            appMsg.postMessage('PODCAST_SUBSCRIPTION_SET')
            appMsg.postMessage('PODCAST_SUBSCRIPTION_NEW_SET')
          }
          // 구독 방송 목록 New 체크 용 (TODO: 기능 부활을 염두해서 주석처리만 함)
          // setTimeout(function () {
          //  util.checkNewChannelList()
          // }, 100)
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
    } else {
      // 구독 방송 SET
      appMsg.postMessage('PODCAST_SUBSCRIPTION_SET')
    }
  },
  /**
   * 이미지 정보 체크
   * @param {object} item: podcastObj.playing
   * @return {string} podcastObj.playing.imageUrl
   */
  checkImgUrl: function (item) {
    if (item.pid) {
      if (typeof item.imageUrl === 'undefined' || item.imageUrl === '' || item.imageUrl === '/img/trans.png') {
        item.imageUrl = podcastApi.getServerUrl() + '/img/' + JSON.parse(JSON.stringify(item.pid))
        console.log('[GRLGUP-3739] 앨범아트 방어코드 실행 => imageUrl:', item.imageUrl)
      }
    } else {
      item.imageUrl = ''
      console.warn('checkImgUrl: pid 유효하지 않음')
    }
    return item.imageUrl
  },
  // 파일 정보 체크
  checkFileUrl: function (item) {
    // 파일 정보가 없으면
    if (!item.fileUrl) {
      if (item.pid && item.eid) {
        item.fileUrl = podcastApi.getServerUrl() + '/file/' + item.pid + '/' + item.eid
      } else {
        return ''
      }
    }
    return item.fileUrl
  },
  // 활성화 (CSS의 :active가 원활하게 지원되지 않는 곳에 사용)
  active: function (ref, callback) {
    // console.log('active -----------')
    // console.log(ref)
    // 비프음 처리
    util.beep()
    // 활성화
    if (typeof ref !== 'undefined' && typeof ref.classList !== 'undefined' && typeof ref.classList.add !== 'undefined') {
      ref.classList.add('active')
    }
    // 0.1초 후
    setTimeout(function () {
      // 비활성화
      if (typeof ref !== 'undefined' && typeof ref.classList !== 'undefined' && typeof ref.classList.remove !== 'undefined') {
        ref.classList.remove('active')
      }
      // callback 함수가 있으면
      if (typeof callback === 'function') {
        callback()
      }
    }, 100)
  },
  // 타임존 계산해서 Date 반환
  getDate: function () {
    let date = new Date()
    let dateTime = date.getTime() + ((date.getTimezoneOffset() - (-540)) * 60 * 1000) // -540은 한국표준시
    return new Date(dateTime)
  }
}

// 메시지 (앱간 통신)
let appMsg = {
  // 포스트 메시지 전송
  postMessage: function (aicMessage) {
    logger.appMsg('postMessage : ' + aicMessage)
    if (window.applicationFramework) {
      if (!application) {
        application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
      }
      switch (aicMessage) {
        case 'PODCAST_PLAYING_GET':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_PLAYING_SET':
          application.postMessage(JSON.stringify(window.podcastObj.playing), window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_STYLE_GET':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_STYLE_SET':
          application.postMessage(JSON.stringify(window.podcastObj.style), window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_PREV_SET':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_PLAY_PAUSE_SET':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_NEXT_SET':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_POPULAR_GET':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_POPULAR_SET':
          application.postMessage(JSON.stringify(window.podcastObj.popular.episodeList), window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_POPULAR_CATEGORY_SET':
          application.postMessage(JSON.stringify(window.podcastObj.popular.channelList), window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_HISTORY_GET':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_HISTORY_SET':
          application.postMessage(JSON.stringify(window.podcastObj.history.episodeList), window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_PLAYER_SHOW_AUTO_PLAY':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_PLAYER_SHOW':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_POPULAR_SHOW':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_LASTEPISODE_TOAST_SHOW':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_FIRSTEPISODE_TOAST_SHOW':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_RUN_MAIN_CARD_GET':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'PODCAST_RUN_MAIN_CARD_SET':
          application.postMessage(JSON.stringify(window.podcastObj.isRunMainCard), window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'SEND_NETWORK_ERROR_MESSAGE_TO_MAIN_CARD':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        case 'SEND_PLAY_ERROR_MESSAGE_TO_MAIN_CARD':
          application.postMessage('', window.msgObj.aicOrigin + aicMessage, null)
          break
        default:
          break
      }
    }
  },
  // 뱃지(NEW) 업데이트
  updateBadge: function (message) {
    if (window.applicationFramework) {
      if (!application) {
        application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
      }
      application.postMessage(message, 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=updateBadge', null)
    }
  },
  // 서브카드 실행 업데이트 (BM전용)
  runSubCard: function (message) {
    if (window.applicationFramework) {
      if (!application) {
        application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
      }
      application.postMessage(message, 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=runSubCard', null)
    }
  },
  // 서브카드 추가 업데이트 (BM전용)
  addSubCard: function (message) {
    if (window.applicationFramework) {
      if (!application) {
        application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
      }
      application.postMessage(message, 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=addSubCard', null)
    }
  },
  // 서브카드 삭제 업데이트 (BM전용)
  removeSubCard: function (message) {
    if (window.applicationFramework) {
      if (!application) {
        application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
      }
      application.postMessage(message, 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=removeSubCard', null)
    }
  },
  // 서브카드 위치 업데이트 (BM전용)
  moveSubCard: function (message) {
    if (window.applicationFramework) {
      if (!application) {
        application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
      }
      application.postMessage(message, 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=moveSubCard', null)
    }
  }
}

export { audio, storage, util, appMsg }
