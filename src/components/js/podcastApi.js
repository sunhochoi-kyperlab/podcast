'use strict'

import ajax from 'obigo-js-ui/src/libs/ajax'
import { logger } from './commonLib'
import { appMsg, storage, util } from './podcastLib'
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

// 팟캐스트 API
let podcastApi = {
  // 서버 URL
  getServerUrl: function () {
    // 개발계
    // return 'https://api-test.podbbang.com'
    // 상용계
    return 'https://api-ex.podbbang.com'
  },
  // 서비스 URL
  getServiceUrl: function () {
    return podcastApi.getServerUrl() + '/lgupcc'
  },
  // 인기 순위 / 카테고리별 인기 순위 목록
  getPopular: function (params, success, fail) {
    // 0.01초 후에 실행 (최초 로딩 시간에 영향 안되기 위한 비동기 접근)
    setTimeout(function () {
      logger.info('[podcastApi] getPopular')
      // 기본 파라미터
      let ajaxParams = {
        requestHeader: {
          'X-Podbbang': 'LGUPLUSCC'
        },
        url: podcastApi.getServiceUrl() + '/top',
        data: {
          token: '',
          count: 20,
          startSeq: 0,
          category: '',
          max: 1000
        }
      }
      // 파라미터 세팅
      if (typeof params.token !== 'undefined') {
        ajaxParams.data.token = params.token
      }
      if (typeof params.count !== 'undefined') {
        ajaxParams.data.count = params.count
      }
      if (typeof params.startSeq !== 'undefined') {
        ajaxParams.data.startSeq = params.startSeq
      }
      if (typeof params.category !== 'undefined') {
        if (params.category === '종합') {
          params.category = ''
        }
        ajaxParams.data.category = params.category
      }
      if (typeof params.max !== 'undefined') {
        ajaxParams.data.max = params.max
      }
      console.log('getPopular.ajaxParams : ', ajaxParams)
      // AJAX 호출
      ajax.post(ajaxParams).then(function (data) {
        success(JSON.parse(data.data))
        data = null
      }, function (data) {
        fail(data)
        data = null
      })
      ajaxParams = null
      params = null
    }, 10)
  },
  // 구독 목록 (최신 업데이트 순) : 회원전용
  getSubscription: function (params, success, fail) {
    // 0.01초 후에 실행 (최초 로딩 시간에 영향 안되기 위한 비동기 접근)
    setTimeout(function () {
      logger.info('[podcastApi] getSubscription')
      // 기본 파라미터
      let ajaxParams = {
        requestHeader: {
          'X-Podbbang': 'LGUPLUSCC'
        },
        url: podcastApi.getServiceUrl() + '/subscriptionlist',
        data: {
          token: '',
          count: 20,
          startSeq: 0,
          max: 1000
        }
      }
      // 파라미터 세팅
      if (typeof params.token !== 'undefined') {
        ajaxParams.data.token = params.token
      }
      if (typeof params.count !== 'undefined') {
        ajaxParams.data.count = params.count
      }
      if (typeof params.startSeq !== 'undefined') {
        ajaxParams.data.startSeq = params.startSeq
      }
      if (typeof params.max !== 'undefined') {
        ajaxParams.data.max = params.max
      }
      console.log('getSubscription.ajaxParams : ', ajaxParams)
      // AJAX 호출
      ajax.post(ajaxParams).then(function (data) {
        success(JSON.parse(data.data))
        data = null
      }, function (data) {
        fail(data)
        data = null
      })
      ajaxParams = null
      params = null
    }, 10)
  },
  // 구독 목록 편집
  editSubscription: function (params, success, fail) {
    // 0.01초 후에 실행 (최초 로딩 시간에 영향 안되기 위한 비동기 접근)
    setTimeout(function () {
      logger.info('[podcastApi] editSubscription')
      // 기본 파라미터
      let ajaxParams = {
        requestHeader: {
          'X-Podbbang': 'LGUPLUSCC'
        },
        url: podcastApi.getServiceUrl() + '/subscription',
        data: {
          token: '',
          pid: 0,
          action: 'add'
        }
      }
      // 파라미터 세팅
      if (typeof params.token !== 'undefined') {
        ajaxParams.data.token = params.token
      }
      if (typeof params.pid !== 'undefined') {
        ajaxParams.data.pid = params.pid
      }
      if (typeof params.action !== 'undefined') {
        ajaxParams.data.action = params.action
      }
      console.log('editSubscription.ajaxParams : ', ajaxParams)
      // AJAX 호출
      ajax.post(ajaxParams).then(function (data) {
        success(JSON.parse(data.data))
        data = null
      }, function (data) {
        fail(data)
        data = null
      })
      ajaxParams = null
      params = null
    }, 10)
  },
  // 에피소드 재생 정보 (다음/이전/다음날짜/이전날짜 에피소드 재생정보 요청 포함)
  getEpisodeInfo: function (params, success, fail) {
    // 0.01초 후에 실행 (최초 로딩 시간에 영향 안되기 위한 비동기 접근)
    setTimeout(function () {
      logger.info('[podcastApi] getEpisodeInfo')
      // 기본 파라미터
      let ajaxParams = {
        requestHeader: {
          'X-Podbbang': 'LGUPLUSCC'
        },
        url: podcastApi.getServiceUrl() + '/episode',
        data: {
          token: '',
          pid: 0,
          eid: 0,
          type: ''
        }
      }
      // 파라미터 세팅
      if (typeof params.token !== 'undefined') {
        ajaxParams.data.token = params.token
      }
      if (typeof params.pid !== 'undefined') {
        ajaxParams.data.pid = params.pid
      }
      if (typeof params.eid !== 'undefined') {
        ajaxParams.data.eid = params.eid
      }
      if (typeof params.type !== 'undefined') {
        ajaxParams.data.type = params.type
      }
      console.log('getEpisodeInfo.ajaxParams : ', ajaxParams)
      // AJAX 호출
      ajax.post(ajaxParams).then(function (data) {
        success(JSON.parse(data.data))
        data = null
      }, function (data) {
        fail(data)
        data = null
      })
      ajaxParams = null
      params = null
    }, 10)
  },
  // 방송 내 에피소드 목록
  getEpisodeList: function (params, success, fail) {
    // 0.01초 후에 실행 (최초 로딩 시간에 영향 안되기 위한 비동기 접근)
    setTimeout(function () {
      logger.info('[podcastApi] getEpisodeList')
      // 기본 파라미터
      let ajaxParams = {
        requestHeader: {
          'X-Podbbang': 'LGUPLUSCC'
        },
        url: podcastApi.getServiceUrl() + '/episodelist',
        data: {
          token: '',
          count: 50,
          startSeq: 0,
          pid: 0,
          sort: 'desc'
        }
      }
      // 파라미터 세팅
      if (typeof params.token !== 'undefined') {
        ajaxParams.data.token = params.token
      }
      if (typeof params.count !== 'undefined') {
        ajaxParams.data.count = params.count
      }
      if (typeof params.startSeq !== 'undefined') {
        ajaxParams.data.startSeq = params.startSeq
      }
      if (typeof params.pid !== 'undefined') {
        ajaxParams.data.pid = params.pid
      }
      if (typeof params.sort !== 'undefined') {
        ajaxParams.data.sort = params.sort
      }
      console.log('getEpisodeList.ajaxParams : ' + JSON.stringify(ajaxParams))
      // AJAX 호출
      ajax.post(ajaxParams).then(function (data) {
        success(JSON.parse(data.data))
        data = null
      }, function (data) {
        fail(data)
        data = null
      })
      ajaxParams = null
      params = null
    }, 10)
  },
  // 팟캐스트 키워드 청취
  searchKeyword: function (params, success, fail) {
    // 0.01초 후에 실행 (최초 로딩 시간에 영향 안되기 위한 비동기 접근)
    setTimeout(function () {
      logger.info('[podcastApi] searchKeyword')
      // 기본 파라미터
      let ajaxParams = {
        requestHeader: {
          'X-Podbbang': 'LGUPLUSCC'
        },
        url: podcastApi.getServiceUrl() + '/search',
        data: {
          token: '',
          keyword: '',
          maxRanking: 100
        }
      }
      // 파라미터 세팅
      if (typeof params.token !== 'undefined') {
        ajaxParams.data.token = params.token
      }
      if (typeof params.keyword !== 'undefined') {
        ajaxParams.data.keyword = params.keyword
      }
      if (typeof params.date !== 'undefined') {
        ajaxParams.data.date = params.date
      }
      if (typeof params.maxRanking !== 'undefined') {
        ajaxParams.data.maxRanking = params.maxRanking
      }
      console.log('searchKeyword.ajaxParams : ', ajaxParams)
      // AJAX 호출
      ajax.post(ajaxParams).then(function (data) {
        if (data.data) {
          success(JSON.parse(data.data))
          data = null
        }
      }, function (data) {
        fail(data)
        data = null
      })
      ajaxParams = null
      params = null
    }, 10)
  },
  // 카테고리 목록
  getCategory: function (params, success, fail) {
    // 0.01초 후에 실행 (최초 로딩 시간에 영향 안되기 위한 비동기 접근)
    setTimeout(function () {
      logger.info('[podcastApi] getCategory')
      // 기본 파라미터
      let ajaxParams = {
        requestHeader: {
          'X-Podbbang': 'LGUPLUSCC'
        },
        url: podcastApi.getServiceUrl() + '/category',
        data: {
          count: 30
        }
      }
      // 파라미터 세팅
      if (typeof params.count !== 'undefined') {
        ajaxParams.data.count = params.count
      }
      console.log('getCategory.ajaxParams : ', ajaxParams)
      // AJAX 호출
      ajax.post(ajaxParams).then(function (data) {
        success(JSON.parse(data.data))
        data = null
      }, function (data) {
        fail(data)
      })
      ajaxParams = null
      params = null
    }, 10)
  }
}

// 에러 메시지
let errorMsg = {
  // 에러 메시지 프로퍼티 오브젝트 반환
  getProp: function (result) {
    // result.status 값이 있으면
    if (typeof result.status !== 'undefined') {
      switch (result.status) {
        case 204:
          return {
            title: '알림',
            content: '요청하신 컨텐츠 정보가 존재하지 않습니다.',
            buttons: [{
              label: '닫기',
              onClick: function () {
                // 모든 팝업 닫기
                util.closeAllPopup()
              }
            }]
          }
        case 400:
          return {
            title: '잘못된 요청',
            content: '요청하신 컨텐츠 정보가 잘못되었습니다.',
            buttons: [{
              label: '닫기',
              onClick: function () {
                // 모든 팝업 닫기
                util.closeAllPopup()
              }
            }]
          }
        case 401:
          return {
            title: '사용자 인증 오류',
            content: '매니저앱에서 팟빵 로그인 상태를 확인하세요.',
            buttons: [{
              label: '닫기',
              onClick: function () {
                // NEW 뱃지 목록 초기화
                storage.clearNewBadgeList()
                // 모든 팝업 닫기
                util.closeAllPopup()
              }
            }]
          }
        case 404:
          return {
            title: '요청 페이지 없음',
            content: '요청하신 페이지가 존재하지 않습니다.',
            buttons: [{
              label: '닫기',
              onClick: function () {
                // 모든 팝업 닫기
                util.closeAllPopup()
                // 앱 종료
                // window.podcastAppTerminate()
              }
            }]
          }
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
        case 505:
          return {
            title: '서버 통신 오류',
            content: '서버와 연결이 원활하지 않습니다.',
            buttons: [{
              label: '닫기',
              onClick: function () {
                // 모든 팝업 닫기
                util.closeAllPopup()
                // 앱 종료
                // window.podcastAppTerminate()
              }
            }]
          }
        default:
          // 히스토리 없을 경우에 메인카드에 play버튼 클릭 시
          if (!window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible) {
            // 서비스메인 로딩 레이어 제거
            window.applicationFramework.applicationManager.getOwnerApplication(window.document).postMessage(JSON.stringify({value: false}), 'http://www.lguplus.co.kr/bm/SYMC/C300/launcher?filter-name=LOADING', null)
            appMsg.postMessage('SEND_NETWORK_ERROR_MESSAGE_TO_MAIN_CARD')
          }
          window.podcastObj.toast.show('네트워크 지연(중단)으로 서비스 접속이 어렵습니다. 잠시 후 다시 시도해 주세요.')
          // OSD 토스트 데이터 전송
          // option) NORMAL = 0 (PIP나 자기화면인 경우 표시하지 않음)
          // option) ALWAYS = 1 (항상 표시)
          let appState = window.applicationFramework.applicationManager.getOwnerApplication(window.document).visible
          // Audio src값이 손상되었을 경우에만
          if (window.podcastObj.audioObj && window.podcastObj.audioObj.error && (window.podcastObj.audioObj.error.code === 3 || window.podcastObj.audioObj.error.code === 4)) {
            console.log('audio src error값 확인 : ' + window.podcastObj.audioObj.error.code)
            if (!appState) {
              console.log('[podcastApi] errorMsg.getProp: visible 하지 않은 앱에서 서비스 상태가 불안정하다는 팝업을 표시')
              // App BackGround
              application.setOsdStatusBarContent(appName, application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png', '서비스 상태가 불안정합니다.', '', 0)
            }
          } else {
            console.log('audio src error값이 유효하지 않으므로 OSD toast popup 표시하지 않음')
          }
          return null
      }
    } else {
      console.log('TODO 에러 처리해야 함')
    }
  }
}

export { podcastApi, errorMsg }
