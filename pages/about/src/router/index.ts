import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("../views/Home.vue"),
    name: "About",
    meta: {
      hidden: true,
      title: "图谱",
      noTagsView: true,
    },
  },
  {
    path: "/sub",
    component: () => import("../views/Sub.vue"),
    name: "Sub",
    meta: {
      hidden: true,
      title: "编辑节点",
      noTagsView: true,
    },
  },
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory("/about"),
  strict: true,
  routes: routes as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

export default router;
