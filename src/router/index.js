import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Pregnancy Suite',
    component: Home
  },
  {
    path: '/contraction-timer',
    name: 'Contraction Timer',
    component: () => import('../views/ContractionTimer.vue')
  },
  {
    path: '/diaper-logger',
    name: 'Diaper Logger',
    component: () => import('../views/DiaperLogger.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
