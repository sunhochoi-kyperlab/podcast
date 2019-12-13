/**
 * 서비스 로그 라이브러리
 *
 * 모든 인포앱에서 동일하게 사용할 예정
 * - 마지막 업데이트 일시 : 2018-10-29
 */

// 순서번호 (중복처리 가능)
let sequence = 1

// 로그 유틸
let logUtil = {
  // 시퀀스
  sequence: function () {
    return sequence++
  },
  // 로그 생성 시간
  logTime: function () {
    let d = new Date()
    let yyyy = '' + d.getFullYear()
    let mm = d.getMonth() + 1
    if (mm < 10) {
      mm = '0' + mm
    } else {
      mm = '' + mm
    }
    let dd = d.getDate()
    if (dd < 10) {
      dd = '0' + dd
    } else {
      dd = '' + dd
    }
    let hh = d.getHours()
    if (hh < 10) {
      hh = '0' + hh
    } else {
      hh = '' + hh
    }
    let mi = d.getMinutes()
    if (mi < 10) {
      mi = '0' + mi
    } else {
      mi = '' + mi
    }
    let ss = d.getSeconds()
    if (ss < 10) {
      ss = '0' + ss
    } else {
      ss = '' + ss
    }
    return yyyy + mm + dd + hh + mi + ss
  }
}

// 로그 Body
let logBody = {
  log: [{
    // 순서번호 <*SA에서 자동 추가로 주석처리>
    // seq: 0,
    // 로그 생성 시간
    logTime: '',
    // 디바이스
    device: {
      // 디바이스 종류 (PND, AVN) <*SA에서 자동 추가로 주석처리>
      // deviceType: '',
      // 서비스에이전트 버전 <*SA에서 자동 추가로 주석처리>
      // saVer: '',
      // 제조사 (SY:쌍용, TW:팅크웨어) <*SA에서 자동 추가로 주석처리>
      // carOem: 'SY',
      // 앱 종류
      appType: 'PODBBANG_APP',
      // 앱 버전
      appVer: ''
    },
    // 차량 CTN <*SA에서 자동 추가로 주석처리>
    // ctn: '',
    // 고유번호 (PND: UICCID, AVN:차대번호) <*SA에서 자동 추가로 주석처리>
    // serial: '',
    // 네트워크 타입 (LTE, wifi) <*SA에서 자동 추가로 주석처리>
    // nwType: '',
    // GPS X 좌표값 <*SA에서 자동 추가로 주석처리>
    // posX: '0',
    // GPS Y 좌표값 <*SA에서 자동 추가로 주석처리>
    // posY: '0',
    // 이용 방법 (voice: 음성, touch: 화면터치)
    useType: '',
    // 카테고리 0
    category0: '',
    // 아이템
    item: '',
    // 값 타입 (TEXT, NUMBER, DATE: yyyymmddhhmiss, BOOLEAN: Y/N)
    type: 'NUMBER',
    // 값
    value: '1'
  }]
}

// 서비스 로그
let serviceLog = {
  // 로그 시간 반환
  logTime: function () {
    return logUtil.logTime()
  },
  // 메시지 Body 반환
  getBody: function (useType, category0, item, svcDetailInfo) {
    // Body
    let body = JSON.parse(JSON.stringify(logBody))
    // 순차 번호 <*SA에서 자동 추가로 주석처리>
    // body.log[0].seq = logUtil.sequence()
    // 로그 생성 시간
    body.log[0].logTime = svcDetailInfo.svcTime
    // 디바이스 종류 (PND, AVN) <*SA에서 자동 추가로 주석처리>
    // body.log[0].device.deviceType = JSON.parse(window.applicationFramework.util.getSystemInfo()).type
    // 앱 버전
    body.log[0].device.appVer = window.applicationFramework.applicationManager.getOwnerApplication(window.document).getDescriptor().version
    // 차량 CTN <*SA에서 자동 추가로 주석처리>
    // body.log[0].ctn = JSON.parse(window.applicationFramework.util.getSystemInfo()).ctn
    // 고유번호 (PND: UICCID, AVN:차대번호) <*SA에서 자동 추가로 주석처리>
    // body.log[0].serial = JSON.parse(window.applicationFramework.util.getSystemInfo()).iccid
    // 이용 방법 (voice: 음성, touch: 화면터치)
    body.log[0].useType = useType
    // 카테고리 0
    body.log[0].category0 = ('' + category0)
    // 아이템
    body.log[0].item = ('' + item)
    // 상세 정보
    body.log[0].svcDetailInfo = svcDetailInfo
    return body
  }
}

if (window.applicationFramework) {
  window.serviceLog = serviceLog
}
