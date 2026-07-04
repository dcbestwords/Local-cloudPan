<template>
  <el-menu
    class="sidebar-menu"
    :default-active="route.path"
    collapse
    router
  >
    <!-- 顶部导航 -->
    <div class="top-nav">
      <el-tooltip
        v-for="item in topItems"
        :key="item.path"
        :content="item.label"
        placement="right"
        effect="dark"
      >
        <el-menu-item :index="item.path">
          <el-icon :size="22">
            <component :is="item.icon" />
          </el-icon>
        </el-menu-item>
      </el-tooltip>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-nav">
      <el-tooltip content="深色模式" placement="right" effect="dark">
        <el-menu-item @click="toggleDark()">
          <el-icon :size="22">
            <i-mynaui:sun v-if="isDark" />
            <i-mynaui:moon v-else />
          </el-icon>
        </el-menu-item>
      </el-tooltip>

      <el-tooltip content="退出登录" placement="right" effect="dark">
        <el-menu-item @click="logout">
          <el-icon :size="22">
            <SwitchButton />
          </el-icon>
        </el-menu-item>
      </el-tooltip>
    </div>
  </el-menu>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router';
import { toggleDark, isDark } from '@/composables/dark';
import { SwitchButton } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const topItems = [
  { path: '/home', label: '主页', icon: 'i-mynaui:home' },
  { path: '/sharePan', label: '网盘', icon: 'i-mynaui:folder-two' },
  { path: '/chat', label: '聊天', icon: 'i-mynaui:chat-messages' },
];

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  router.push('/login');
}
</script>

<style scoped>
.sidebar-menu {
  width: 5rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
}

.sidebar-menu :deep(.el-menu-item) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  margin: 0.375rem auto;
  border-radius: 0.75rem;
  width: 3rem;
  height: 3rem;
  color: #6b7280;
  transition: all 0.2s;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: #e5e7eb;
  color: #1f2937;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #fff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* dark mode */
html.dark .sidebar-menu {
  background: #1f2937;
  border-color: #374151;
}
html.dark .sidebar-menu :deep(.el-menu-item) {
  color: #9ca3af;
}
html.dark .sidebar-menu :deep(.el-menu-item:hover) {
  background: #374151;
  color: #e5e7eb;
}
html.dark .sidebar-menu :deep(.el-menu-item.is-active) {
  background: #111827;
  color: #f9fafb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.top-nav,
.bottom-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 0;
}
</style>
