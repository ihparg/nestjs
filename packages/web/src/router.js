import { createRouter, createWebHashHistory } from 'vue-router'
import Schema from './views/schema/index.vue'
import SchemaDetail from './views/schema/detail.vue'
import Route from './views/route/index.vue'
import RouteDetail from './views/route/detail.vue'

const routes = [
  { path: '/', redirect: '/route' },
  { path: '/schema', component: Schema },
  { path: '/schema/:name', component: SchemaDetail },
  { path: '/route', component: Route },
  { path: '/route/:rid', component: RouteDetail },
]

export const history = createWebHashHistory()

export default createRouter({
  history,
  routes,
})
