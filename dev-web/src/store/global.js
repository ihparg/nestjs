import fetch from '@/utils/fetch'

const actions = {
  async fetchConfig({ state }) {
    const config = await fetch.get('/dev/route/config')
    state.config = config
  },
}

const getters = {
  config(state) {
    return state.config
  },
}

export default {
  namespaced: true,
  actions,
  getters,
}
