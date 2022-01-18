import fetch from '@/utils/fetch'

const mutations = {
  CHANGE_STATUS(state, { id, status }) {
    const route = state.data.find(d => d.id === id)
    route.status = status
    state.data = [...state.data]
  },
  REMOVE(state, id) {
    state.data = state.data.filter(d => d.id !== id)
  },
  SET_ROUTE(state, route) {
    const index = state.data.findIndex(d => d.id === route.id)
    if (index >= 0) state.data[index] = route
    else state.data.push(route)
  },
  SET_RESOLVES(state, resolves) {
    state.resolves = resolves
  },
}

const actions = {
  async fetchList({ state }) {
    if (state.data) return
    const data = await fetch.get('/dev/route')
    state.data = data
  },

  async save({ state }, { data, success }) {
    const route = await fetch.post('/dev/route/save', data)

    if (data.id) state.data = state.data.filter(d => d.id !== data.id)
    state.data = [...state.data, route]

    if (success) success(route)
  },
}

const getters = {
  sortedRoutes(state) {
    if (!state.data) return null
    return state.data.sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method))
  },
}

export default {
  namespaced: true,
  actions,
  mutations,
  getters,
}
