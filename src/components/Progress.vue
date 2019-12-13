<template>
  <div class="progress">
    <div class="track" @click="trackClick">
      <div class="time">
        <span class="play">{{ playing.currentTime || '00:00'}}</span>
        <span class="total">{{ playing.duration || '00:00'}}</span>
      </div>
      <span class="bg">
          <span class="playhead" :style="{ 'transform': `translateX(${playing.playheadX}px) translateZ(0)` }" ref="playhead"></span>
          <span class="now" :style="{ 'width': playing.nowPos }"></span>
      </span>
      <!-- <span class="playhead" :style="{ 'left': playing.nowPos }" ref="playhead"></span> -->
    </div>
  </div>
</template>
<script>
// 플레이헤드 X
let playheadX = 0
// 플레이헤드 Down 여부
let isPlayheadDown = false

export default {
  name: 'progress',
  data () {
    return window.podcastObj
  },
  mounted () {
    // 이벤트 등록
    this.$refs.playhead.addEventListener('touchstart', this.touchstartHandler, true)
    window.addEventListener('touchmove', this.touchmoveHandler)
    window.addEventListener('touchend', this.touchendHandler)
  },
  beforeDestroy () {
    // 이벤트 해제
    this.$refs.playhead.removeEventListener('touchstart', this.touchstartHandler, true)
    window.removeEventListener('touchmove', this.touchmoveHandler)
    window.removeEventListener('touchend', this.touchendHandler)
  },
  methods: {
    // 터치 이벤트 핸들러
    touchstartHandler (e) {
      // 짧게 드래그 시 터치이벤트와 클릭이벤트가 발생한다. 클릭이벤트가 터치보다 더 늦게 발생
      // 터치이벤트 발생 시 클릭 이벤트를 막기 위함
      e.stopPropagation()
      e.preventDefault()
      isPlayheadDown = true
      // this.$refs.playhead.$el.style['will-change'] = 'left'
      this.$refs.playhead.style['will-change'] = 'transform'
    },
    touchmoveHandler (e) {
      e.preventDefault()
      // isPlayheadDown Player.vue 내에 드래그 및 클릭을 구분하기 위한 값
      if (isPlayheadDown === true) {
        // 플레이헤드 선택여부
        // window.podcastObj.isPlayerHead는 PodcastLib.js내에 timeupdate 이벤트가 발생할 때
        // 드래그 중이라면 프로그레스 바의 업데이트를 방지하기 위한 값
        window.podcastObj.isPlayerHead = true
        this.movePlayhead(e)
      }
    },
    touchendHandler () {
      if (isPlayheadDown) {
        // 플레이헤드 선택여부
        window.podcastObj.isPlayerHead = false
        // 트랙 클릭
        // this.trackClick(playheadX)
        window.podcastObj.playing.playheadX = playheadX
        if (window.podcastObj.audioObj.currentTime !== 0) {
          let trackPercent = (playheadX / 720) * 100 // 720 : BM 기준
          let currentTime = window.podcastObj.playing.durationOrigin * trackPercent / 100
          // 재생 시점 세팅
          window.podcastObj.audioObj.currentTime = currentTime
          // 재생
          window.podcastObj.ctrl.play(true)
          // 플레이헤드 Down 여부
          isPlayheadDown = false
        }
      }
      this.$refs.playhead.style['will-change'] = 'auto'
    },
    // progress 클릭
    trackClick (evt) {
      if (isPlayheadDown) {
        return
      }
      if (typeof evt === 'object') {
        if (evt.clientX) {
          playheadX = evt.clientX - 500 // 500 : BM 기준
          playheadX = Math.floor(playheadX)
          // 플레이 헤드 이동
          if (this.$refs.playhead && this.$refs.playhead.style) {
            // this.$refs.playhead.style.position = 'absolute'
            // this.$refs.playhead.style.left = playheadX + 'px'
            this.$refs.playhead.style.transition = null
            this.$refs.playhead.style.transform = `translateX(${playheadX}px) translateZ(0)`
            // (playheadX / 720) * 100
          }
        }
      }
      window.podcastObj.playing.playheadX = playheadX
      if (window.podcastObj.audioObj.currentTime !== 0) {
        let trackPercent = (playheadX / 720) * 100 // 720 : BM 기준
        let currentTime = window.podcastObj.playing.durationOrigin * trackPercent / 100
        // 재생 시점 세팅
        window.podcastObj.audioObj.currentTime = currentTime
        // 재생
        window.podcastObj.ctrl.play(true)
      }
    },
    movePlayhead (evt) {
      let x = evt.changedTouches[0].pageX - 500 // 500 : BM 기준
      x = Math.floor(x)
      if (x < 0) {
        x = 0
      }
      if (x > 720) { // 720 : BM 기준
        x = 720
      }
      if (this.$refs.playhead && this.$refs.playhead.style) {
        if (x !== window.podcastObj.playing.playheadX) {
          this.$refs.playhead.style.transition = null
          this.$refs.playhead.style.transform = `translateX(${x}px) translateZ(0)`
        }
        // this.$refs.playhead.style.position = 'absolute'
        // this.$refs.playhead.style.left = x + 'px'
        // this.$refs.playhead.style.transition = null
        // this.$refs.playhead.style.transform = `translateX(${playheadX}px) translateZ(0)`
      }
      playheadX = x
      if (window.podcastObj.audioObj.currentTime !== 0) {
        let trackPercent = (playheadX / 720) * 100 // 720 : BM 기준
        window.podcastObj.playing.nowPos = trackPercent + '%'
      }
      window.podcastObj.playing.playheadX = playheadX
    }
  }
}
</script>

<style lang="scss">
@import '../scss/common.scss';

.progress {
  .track {
    
    span {
      display: block;
      height: 3px;
      border-radius: 3px;
    }
    
    .now {
      position: absolute;
      left: 0;
      top: 0;
      background-color: #fff;
    }
    
    .bg {
      position: relative;
      width: 100%;
      background-color: #2c2d3c;

    }
    
    .playhead {
      position: absolute;
      top: -39px;
      left: 0;
      width: 80px;
      height: 80px;
      z-index: 100;
      margin-left: -40px;
      background-image: url('../img/icon_playlist.png');
      background-position: -240px 0;
      
      &:active, &.active {
        // background-position: -360px -100px;
      }
      
      &.dis {
        background-position: -360px -200px;
      }
    }
  }
  .time {
    overflow: hidden;
    
    span {
      display: block;
      font-family: 'NotoSansCJKkr-Medium' !important;
      margin-bottom: 24px;
      height: 28px;
      font-size: 24px;
      line-height: 28px;
      color: #fff;

      &.play {
        float: left;
      }

      &.total {
        float: right;
      }
    }
  }
}
</style>