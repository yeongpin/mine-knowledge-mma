import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Markdown from '../views/Markdown.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    props: route => ({
      action: route.query.action
    })
  },
  {
    path: '/markdown',
    name: 'markdown',
    component: Markdown,
    props: route => ({
      id: route.query.id,
      isFolder: route.query.isFolder,
      path: route.query.path,
      isNew: route.query.isNew
    })
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 