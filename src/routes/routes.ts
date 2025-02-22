import { createRouter, createWebHistory } from 'vue-router'
import Weather from '@/components/WeatherApp.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: Weather, name: 'Home' },
  { path: '/:pathMatch(.*)*', redirect: '/home' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
