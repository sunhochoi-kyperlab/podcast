'use strict'

import { logger } from './commonLib'
import { podcastApi } from './podcastApi'

// 애플리케이션
let application
// 앱 아이디
let appId
if (window.applicationFramework) {
  application = window.applicationFramework.applicationManager.getOwnerApplication(window.document)
  appId = application.getDescriptor().id
  console.log('appId : ' + appId)
}

// 클러스터 전송 이미지
// let clusterImg

// 팟캐스트 에이전트
let podcastAgent = {
  isInitServiceAgent: false,
  isInitCloud: false,
  isInitAi: false,
  isInitCluster: false,
  isInitTelephony: false,
  isInitDeveloper: false,
  clusterImg: document.createElement('IMG'),
  initialize: function () {
    // 서비스에이전트 체크
    if (typeof window.serviceAgent === 'undefined') {
      return
    }
    // AI 초기화
    window.ai.init(appId, function (open) {
      podcastAgent.isInitAi = true
      console.log('window.ai.init: open: ' + open)
      // 디렉티브 리스너 등록 (BM only)
      application.addEventListener('DirectiveDataReceived', function () {
        let result = application.getDirectiveData()
        console.log('DirectiveDataReceived: ' + result)
        if (result) {
          // 디렉티브 수신
          podcastAgent.directiveListener(JSON.parse(result))
          // 디렉티브 수신 성공 ACK
          application.setDirectiveResult(application.DIRECTIVE_RESULT_OK)
        }
      }, false)
      // 디렉티브 데이터 조회
      let result = application.getDirectiveData()
      console.log('application.getDirectiveData(): ' + result)
      // 디렉티브 리스너에 전달
      if (typeof result !== 'undefined' && result !== null && result !== '') {
        podcastAgent.directiveListener(JSON.parse(result))
        // 디렉티브 수신 성공 ACK
        application.setDirectiveResult(application.DIRECTIVE_RESULT_OK)
      }
    }, function (close) {
      console.log('window.ai.init: close: ' + close)
    }, function (error) {
      console.log('window.ai.init: error: ' + error)
    })
    // 자동화 검증 초기화
    window.developer.init(appId, function (open) {
      podcastAgent.isInitDeveloper = true
      console.log('window.developer.init: open: ' + open)
      // 자동화 검증 리스너 등록
      window.developer.addListener('engineerMode', '', podcastAgent.engineerModeListener)
    }, function (close) {
      console.log('window.developer.init: close: ' + close)
    }, function (error) {
      console.log('window.developer.init: error: ' + error)
    })
    // 서비스 에이전트 초기화
    window.serviceAgent.init(appId, function (open) {
      podcastAgent.isInitServiceAgent = true
      console.log('window.serviceAgent.init: open: ' + open)
    }, function (close) {
      console.log('window.serviceAgent.init: close: ' + close)
    }, function (error) {
      console.log('window.serviceAgent.init: error: ' + error)
    })
    // cluster 초기화
    window.cluster.init(appId, function (open) {
      podcastAgent.isInitCluster = true
      console.log('window.cluster.init: open: ' + open)
    }, function (close) {
      console.log('window.cluster.init: close ' + close)
    }, function (error) {
      console.log('window.cluster.init: error ' + error)
    })
    // telephony 초기화
    window.telephony.init(appId, function (open) {
      podcastAgent.isInitTelephony = true
      console.log('window.telephony.init: open: ' + open)
      window.telephony.addListener('callMgr_callState', null, (data) => {
        if (data.state === 'Idle') {
          window.podcastObj.service.telephony.state = false
        } else {
          window.podcastObj.service.telephony.state = true
        }
      })
    }, function (close) {
      console.log('window.telephony.init: close ' + close)
    }, function (error) {
      console.log('window.telephony.init: error ' + error)
    })
    // 전역 오브젝트로 할당
    window.podcastAgent = podcastAgent
    console.log('podcastAgent: init: complete')
  },
  // 클러스터 곡 정보 전송 (BM전용)
  sendClusterDisplayInfo: function (state, needDefaultImage) {
    logger.info('[podcastAgent] sendClusterDisplayInfo')
    // 앱 이름
    let appName = ''
    try {
      appName = JSON.parse(application.getDescriptor().shortNameList).widgetShortName[0].name
    } catch (e) {
      appName = application.getDescriptor().getWidgetName('')
    }
    let dataObj = {}
    dataObj.Item = 'Music'
    dataObj.Data = {}
    dataObj.Data.AppInfo = {}
    dataObj.Data.AppInfo.AppName = '팟빵'
    dataObj.Data.AppInfo.AppTitle = appName
    dataObj.Data.AppInfo.AppTitleIcon = application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png'
    dataObj.Data.ContentInfo = {}
    dataObj.Data.ContentInfo.Title = window.podcastObj.playing.etitle
    dataObj.Data.ContentInfo.Artist = window.podcastObj.playing.title
    dataObj.Data.ContentInfo.FileName = ''
    dataObj.Data.ContentInfo.Album = ''
    dataObj.Data.ContentInfo.Position = Math.floor(window.podcastObj.playing.currentTimeOrigin)
    dataObj.Data.ContentInfo.Duration = Math.floor(window.podcastObj.playing.durationOrigin)
    dataObj.Data.ContentInfo.MusicState = state // Play:0, Pause:1, Stop:2

    if (needDefaultImage) {
      dataObj.Data.ContentInfo.Title = dataObj.Data.ContentInfo.Title + ' '
      dataObj.Data.ContentInfo.AlbumArt = application.getDescriptor().localURI.split('file://')[1] + 'img_default.png'
      window.cluster.set('cluster_displayInfo', dataObj, function (result) {
        console.log(' - Default 클러스터로 앨범 이미지 전송 완료')
      })
    }
    // 이미지 OBJ 생성
    // clusterImg = document.createElement('IMG')
    this.clusterImg.src = window.podcastObj.playing.imageUrl
    // 이미지 로딩 완료시
    this.clusterImg.onload = function () {
      // 클러스터 OBJ 생성
      let imagPath = this.saveImage(1, 110, 110)
      // 저장된 이미지 경로가 있으면
      if (imagPath) {
        console.log('클러스터 전송용 이미지 생성 : ' + imagPath)
        dataObj.Data.ContentInfo.AlbumArt = imagPath
      } else {
        console.log('클러스터 저장된 이미지 경로 없어 디폴트 이미지 세팅')
        // 기본 이미지 세팅
        dataObj.Data.ContentInfo.AlbumArt = application.getDescriptor().localURI.split('file://')[1] + 'img_default.png'
      }
      dataObj.Data.ContentInfo.Title = window.podcastObj.playing.etitle
      dataObj.Data.ContentInfo.Artist = window.podcastObj.playing.title
      console.log('클러스터 전송 데이터 : ' + JSON.stringify(dataObj))
      // 클러스터 전송
      window.cluster.set('cluster_displayInfo', dataObj, function (result) {
        if (result) {
          console.log(result)
        }
      })
      // clusterImg = null
    }
    // 이미지 로딩 에러시
    this.clusterImg.onerror = function () {
      console.log('클러스터 이미지 정보 오류로 디폴트 이미지로 세팅')
      // 기본 이미지 세팅
      dataObj.Data.ContentInfo.AlbumArt = application.getDescriptor().localURI.split('file://')[1] + 'img_default.png'
      console.log('클러스터 전송 데이터 : ' + JSON.stringify(dataObj))
      // 클러스터 전송
      window.cluster.set('cluster_displayInfo', dataObj, function (result) {
        if (result) {
          console.log('클러스터 이미지 정보 오류로 디폴트 이미지 전송 완료')
        }
      })
    }
    if (!window.podcastObj.isLongPress) {
      window.podcastObj.isLongClick = false
    }
  },
  // 클러스터 상태 정보 전송 (BM전용)
  sendClusterNotifyInfo: function (state) {
    logger.debug('[podcastAgent] sendClusterNotifyInfo')
    let dataObj = {}
    // cluster_displayInfo와 cluster_notiInfo 규격 다름 주의
    dataObj.Item = 'Music'
    dataObj.Data = {}
    dataObj.Data.Position = Math.floor(window.podcastObj.playing.currentTimeOrigin)
    dataObj.Data.Duration = Math.floor(window.podcastObj.playing.durationOrigin)
    dataObj.Data.MusicState = state // Play:0, Pause:1, Stop:2
    logger.debug(dataObj)
    // 클러스터 전송
    window.cluster.set('cluster_notiInfo', dataObj, function (result) {
      if (result) {
        logger.debug(result)
      }
    })
  },
  // 클러스터 기본 정보 전송 (BM전용)
  sendClusterDefaultInfo: function (type) {
    logger.info('[podcast] sendClusterDefaultInfo')
    // 앱 이름
    let appName = ''
    try {
      appName = JSON.parse(application.getDescriptor().shortNameList).widgetShortName[0].name
    } catch (e) {
      appName = application.getDescriptor().getWidgetName('')
    }
    let dataObj = {}
    dataObj.Item = 'Photo'
    dataObj.Data = {}
    dataObj.Data.AppInfo = {}
    dataObj.Data.AppInfo.AppName = '팟빵'
    dataObj.Data.AppInfo.AppTitle = appName
    dataObj.Data.AppInfo.AppTitleIcon = application.getDescriptor().localURI.split('file://')[1] + 'icon_indicator.png'
    dataObj.Data.ContentInfo = {}
    // 이미지 OBJ 생성
    console.log('this.application.getDescriptor().localURI :: ' + application.getDescriptor().localURI)
    // 클러스터 OBJ 생성
    let imagPath = application.getDescriptor().localURI.split('file://')[1] + 'default_pip.png'
    console.log('클러스터 전송용 이미지 생성 : ' + imagPath)
    if (type === 'MODE') {
      // 모드키 전환시
      dataObj.Data.ContentInfo.Title = '실시간 서비스를 이용해보세요.'
      dataObj.Data.ContentInfo.GuideText = '실시간 서비스를 이용해보세요.'
    } else if (type === 'LAST') {
      // 라스트모드
      dataObj.Data.ContentInfo.Title = '연결 중 입니다.'
      dataObj.Data.ContentInfo.GuideText = '연결 중 입니다.'
    }
    dataObj.Data.ContentInfo.Artist = ''
    dataObj.Data.ContentInfo.FileName = ''
    dataObj.Data.ContentInfo.Album = ''
    dataObj.Data.ContentInfo.AlbumArt = imagPath
    // dataObj.Data.ContentInfo.Photo = imagPath
    dataObj.Data.ContentInfo.Position = 0
    dataObj.Data.ContentInfo.Duration = 0
    dataObj.Data.ContentInfo.MusicState = 0 // Play:0, Pause:1, Stop:2
    console.log(dataObj)
    if (window.podcastObj.service.status.ratePayment === '' || window.podcastObj.service.status.ratePayment === 'payment1') {
      if (window.podcastObj.history.episodeList.length > 0) {
        window.podcastObj.audioObj.play(true)
      }
    } else {
      console.info('요금제 ratePayment 체크 sendClusterDefaultInfo : 16018 #1 ' + window.podcastObj.service.status.ratePayment)
    }
    // 클러스터 전송
    window.cluster.set('cluster_displayInfo', dataObj, function (result) {
      if (result) {
        console.log(result)
      }
    })
  },
  // 자동화 검증 리스너
  engineerModeListener: function (isEngineerMode) {
    logger.info('[podcastAgent] engineerModeListener')
    if (isEngineerMode) {
      podcastAgent.getDeveloperTestResult()
      .then(function (data) {
        console.log('정답지 : ', data)
        // 버전 체크
        podcastAgent.loggingDeveloperTestResult('Version', data.version, application.getDescriptor().version)
        // 서버 URL 체크
        podcastAgent.loggingDeveloperTestResult('ServerUrl', data.server_url, podcastApi.getServerUrl())
      })
      .catch(function (err) {
        // 오류 처리
        console.log(err)
      })
    }
  },
  // 자동화 테스트 결과 로깅 (아래 로깅 포멧 자체가 규격임 / 함부로 수정하면 안됨)
  loggingDeveloperTestResult: function (featureName, expected, actual) {
    console.log('[Developer Test] ' + application.getDescriptor().id + ' (' + podcastAgent.getTimeStamp() + ') > ' + featureName + ' ' + (expected === actual ? 'success' : 'fail') + ' (expected: ' + expected + ' / actual: ' + actual + ')')
  },
  // 자동화 검증 developerTestResult GET
  getDeveloperTestResult: function () {
    logger.info('[podcastAgent] getDeveloperTestResult')
    return new Promise(function (resolve, reject) {
      // 정답지 요청
      window.developer.get('developerTestResult', null, resolve, reject)
    })
  },
  getTimeStamp: function () {
    let date = new Date()

    let fullDate =
      podcastAgent.leadingZeros(date.getFullYear(), 4) + '-' +
      podcastAgent.leadingZeros(date.getMonth() + 1, 2) + '-' +
      podcastAgent.leadingZeros(date.getDate(), 2) + ' ' +
      podcastAgent.leadingZeros(date.getHours(), 2) + ':' +
      podcastAgent.leadingZeros(date.getMinutes(), 2) + ':' +
      podcastAgent.leadingZeros(date.getSeconds(), 2)

    return fullDate
  },
  leadingZeros: function (number, digits) {
    let zero = ''
    number = number.toString()
    if (number.length < digits) {
      for (let i = 0; i < digits - number.length; i++) {
        zero += '0'
      }
    }
    return zero + number
  }
}

// podcastAgent 초기화
if (window.applicationFramework && typeof window.podcastAgent === 'undefined') {
  // podcastAgent 초기화
  podcastAgent.initialize()
}
