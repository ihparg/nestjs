import { createStore } from 'vuex'
import route from './route'
import schema from './schema'
import global from './global'

export default createStore({
  modules: {
    route,
    schema,
    global,
  },
})
