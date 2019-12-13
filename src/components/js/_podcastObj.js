'use strict'

// 템플릿 오브젝트
let templateObj = {
  // 현재 재생중인 정보
  playing: {
    // 팟캐스트 ID
    pid: '',
    // 팟캐스트 제목
    title: '',
    // 에피소드 ID
    eid: '',
    // 에피소드 제목
    etitle: '',
    // 재생 URL
    fileUrl: '',
    // 이미지 URL
    imageUrl: '',
    // 현재 재생중인 시간
    currentTime: '00:00',
    // 현재 재생중인 시간 (오리지널)
    currentTimeOrigin: 0,
    // 총 재생 시간
    duration: '00:00',
    // 총 재생 시간 (오리지널)
    durationOrigin: 0,
    // 버퍼 위치 %
    bufferPos: '0%',
    // 현재 위치 %
    nowPos: '0%',
    // 현재 위치 px
    playheadX: 0,
    // 에피소드 등록일
    createdDate: '',
    // 재생 완료 여부
    isPlayingEnd: false
  }
}

window.templateObj = templateObj

// 팟캐스트 오브젝트
let podcastObj = {
  // longPress 여부 (BM 전용)
  isLongPress: false,
  // H/W SEEK UP/DOWN 여부 (BM 전용)
  isLongClick: false,
  // 요청완료 여부 (BM 전용)
  isComplete: false,
  // 현재 페이지
  currentPage: '/player',
  // 오디오 오브젝트
  audioObj: null,
  // 메인카드 실행 여부 (BM 전용)
  isRunMainCard: false,
  // 플레이어헤드 선택여부
  isPlayerHead: false,
  // 클러스터 전송 필요여부 (BM 전용)
  needSendCluster: false,
  // 오디오소스 로딩 여부
  isAudioSourceLoading: false,
  // 처음/마지막 에피소드 여부
  isFirstLastEpisode: false,
  // 현재 재생중인 정보
  playing: {
    // 템플릿 오브젝트에서 주입
  },
  style: {
    // 재생/일시정지
    playClass: ''
  },
  // 검색
  search: {
    // 방송 목록
    channelList: [],
    // 에피소드 목록
    episodeList: [],
    // 검색어
    keyword: '',
    // 검색 여부
    isSearch: false
  },
  // 재생목록
  playlist: {
    // 에피소드 목록
    episodeList: [],
    // 임시 에피소드 목록
    _episodeList: [],
    // 정렬순서 (L:최신순, F:오래된 순)
    sort: 'L',
    // 임시 정렬순서
    _sort: 'L',
    // 에피소드 인덱스
    episodeIndex: 0
  },
  // 히스토리
  history: {
    // 에피소드 목록
    episodeList: [],
    // 정렬순서 (L:최근 재생 순, F:오래된 재생 순)
    sort: 'L',
    // 삭제여부
    isDelete: false,
    // 에피소드 삭제 목록
    episodeDeleteList: [],
    // 선택모드여부
    isChoice: false
  },
  // 인기 방송
  popular: {
    // 카테고리
    category: '종합',
    // 카테고리 목록
    categoryList: [],
    // 방송 목록
    channelList: [],
    // 에피소드 목록
    episodeList: [],
    // 팟캐스트 ID
    pid: '',
    // 타이틀
    title: '',
    // 시작 SEQ
    startSeq: 0
  },
  // 콘트롤 함수
  ctrl: {
    // 이전 재생
    prev: function () {
      return true
    },
    // 재생/일시정지
    play: function () {
      return true
    },
    // 다음 재생
    next: function () {
      return true
    },
    // SEEK_UP
    seekUp: function () {
      return true
    },
    // SEEK_DOWN
    seekDown: function () {
      return true
    }
  },
  // 사용자
  user: {
    // 로그인 여부
    isLogin: false,
    // 로그인 토큰
    token: ''
  },
  // 토스트
  toast: {
    // 토스트 표시 여부
    isToastShow: false,
    // 토스트 내용
    toastContent: '',
    // 토스트 Class (기본:'', FULL:'full')
    toastClass: '',
    // 표시
    show: function () {},
    // 숨기
    hide: function () {}
  },
  // 팝업
  popup: {
    // 로딩 팝업
    loading: {},
    // API 팝업
    api: {}
  },
  // 음성인식 안내
  servicePopup: {
    // 서비스 안내 팝업 표시 여부
    isShow: false
  },
  // 라우터
  router: {
    // push
    push: function (path) {
    }
  },
  // 서비스
  service: {
    // 상태
    status: {
      // 요금제 상태 체크
      ratePayment: '',
      // 네트워크 상태 체크
      networkStatus: ''
    },
    // 전화 연결 상태
    telephony: {
      state: false
    }
  },
  // 라스트모드 (BM전용)
  lastMode: {
    // 활성화 여부
    isActive: false,
    // 화면 표시 여부
    isShow: false,
    // 재생 중 여부
    isPlaying: false,
    // 메인카드 실행 여부 (BM 전용)
    isRunMainCard: false,
    // 라스트모드 복구 유무
    isRecovered: false,
    // 라스트모드 수신 여부
    isLastModeEvent: false
  },
  // Mode 키 처리를 위한 Obj
  modeCtrl: {
    // canplay 호출 여부
    calledCanply: false,
    // audio focus 요청 여부
    audioFocusChanged: false
  }
}

// 템블레이트 오브젝트에서 주입
podcastObj.playing = JSON.parse(JSON.stringify(window.templateObj.playing))

window.podcastObj = podcastObj

// 메시지 오브젝트 (앱간 통신)
let msgObj = {
  // AIC 기원
  aicOrigin: 'http://www.lguplus.co.kr/bm/SYMC/C300/podcast?filter-name=',
  // AIC 메시지
  aicMessage: [
    // 재생정보 GET
    'PODCAST_PLAYING_GET',
    // 재생정보 SET
    'PODCAST_PLAYING_SET',
    // 스타일 GET
    'PODCAST_STYLE_GET',
    // 스타일 SET
    'PODCAST_STYLE_SET',
    // 이전 에피소드 SET
    'PODCAST_PREV_SET',
    // 재생/일시정지 SET
    'PODCAST_PLAY_PAUSE_SET',
    // 다음 에피소드 SET
    'PODCAST_NEXT_SET',
    // 플레이어 자동재생하며 화면 표시
    'PODCAST_PLAYER_SHOW_AUTO_PLAY',
    // 플레이어 멈춤 화면 표시
    'PODCAST_PLAYER_SHOW',
    // 인기 방송 GET
    'PODCAST_POPULAR_GET',
    // 인기 방송 SET
    'PODCAST_POPULAR_SET',
    // 인기 방송 카테고리 SET
    'PODCAST_POPULAR_CATEGORY_SET',
    // 히스토리 GET
    'PODCAST_HISTORY_GET',
    // 히스토리 SET
    'PODCAST_HISTORY_SET',
    // 인기 방송 PLAY
    'PODCAST_POPULAR_PLAY',
    // 히스토리 화면 표시
    'PODCAST_PLAYLIST_SHOW',
    // 인기방송 화면 표시
    'PODCAST_POPULAR_SHOW',
    // 마지막 에피소드 토스트제공
    'PODCAST_LASTEPISODE_TOAST_SHOW',
    // 첫번째 에피소드 토스트제공
    'PODCAST_FIRSTEPISODE_TOAST_SHOW',
    // 메인카드 실행 여부 GET
    'PODCAST_RUN_MAIN_CARD_GET',
    // 메인카드 실행 여부 SET
    'PODCAST_RUN_MAIN_CARD_SET',
    // 서비스메인 BGM요청
    'playBGM',
    // 메인카드에 에러 메세지 전달
    'SEND_NETWORK_ERROR_MESSAGE_TO_MAIN_CARD',
    'SEND_PLAY_ERROR_MESSAGE_TO_MAIN_CARD'
  ]
}

window.msgObj = msgObj
