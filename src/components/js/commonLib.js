/**
 * 공통 라이브러리
 *
 * logger: 로거
 *  - debug      : DEBUG 로그 출력
 *  - info       : INFO 로그 출력
 *  - error      : ERROR 로그 출력
 *  - appMsg     : 앱간 통신 로그 출력
 *  - audioEvent : 오디오 이벤트 로그 출력
 *  - serviceLog : 서비스로그 로그 출력
 *  - method     : 메소드 호출시 로그 출력
 *  - load       : 로드시 로그 출력
 */

// 로거
var logger = {
  // debug 출력
  debug: function (val) {
    // console.debug(val) // verbose
  },
  // info 출력
  info: function (val) {
    console.info(val)
  },
  // error 출력
  error: function (val) {
    console.error(val)
  },
  // 앱간 통신
  appMsg: function (val) {
    if (val === 'postMessage : PODCAST_PLAYING_SET') {
      // do nothing (verbose)
    } else {
      console.info('[appMsg] ' + val)
    }
  },
  // 오디오 이벤트 수신
  audioEvent: function (val) {
    console.info('[audioEvent] ' + val)
  },
  // 서비스 로그
  serviceLog: function (val) {
    if (typeof val === 'object') {
      val = JSON.stringify(val)
    }
    console.log('[serviceLog] ' + val)
  },
  // 메소드 호출시 로그 출력
  method: function (ctx, val) {
    console.log('[' + ctx.history.current.path + '] ' + val)
  },
  // 로드시 로그 출력
  load: function (ctx, val) {
    console.log('[' + ctx.history.current.path + '] ' + val)
  }
}

export { logger }
