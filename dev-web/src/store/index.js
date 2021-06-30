import { createStore } from 'vuex'
import route from './route'
import schema from './schema'

export default createStore({
  modules: {
    route,
    schema,
  },
})
