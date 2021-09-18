import Vue from 'vue'
import Canvas from '@/components/Canvas'

describe('Canvas.vue', () => {
  it('should render correct contents', () => {
    const Constructor = Vue.extend(Canvas)
    const vm = new Constructor().$mount()
    expect(vm.$el.querySelector('.hello h1').textContent)
      .toEqual('Welcome to Your Vue.js App')
  })
})
