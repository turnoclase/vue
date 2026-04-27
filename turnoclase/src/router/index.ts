import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'conexion',
      component: () => import('@/views/ConexionView.vue'),
    },
    {
      path: '/turno',
      name: 'turno',
      component: () => import('@/views/TurnoView.vue'),
    },
  ],
})

export default router
