import Vue from 'vue'
import Home from 'src/components/Home'

describe('Home.vue', () => {
  it('should render correct contents', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: (h) => h(Home)
    })
    expect(vm.$el.querySelector('.contents').textContent.trim())
      .to.equal('Basic')
  })
})
