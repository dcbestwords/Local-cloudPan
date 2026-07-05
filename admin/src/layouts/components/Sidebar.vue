<template>
  <el-menu class="custom-menu" :default-active="route.path" collapse router>
    <div class="top-nav">
      <el-menu-item index="/home" class="h-4">
        <el-icon :size="30" style="width: 100%"><i-mynaui:home /></el-icon>
        <template #title>主页</template>
      </el-menu-item>
      <el-menu-item index="/sharePan" class="h-4">
        <el-icon :size="30" style="width: 100%"><i-mynaui:folder-two /></el-icon>
        <template #title>网盘</template>
      </el-menu-item>
      <el-menu-item index="/chat" class="h-4">
        <el-icon :size="30" style="width: 100%"><i-mynaui:chat-messages /></el-icon>
        <template #title>聊天</template>
      </el-menu-item>
      <el-menu-item index="/share" class="h-4">
        <el-icon :size="30" style="width: 100%"><i-mynaui:store /></el-icon>
        <template #title>探店</template>
      </el-menu-item>
    </div>

    <div class="bottom-nav">
      <el-menu-item index="4" class="h-4">
        <el-icon :size="30" style="width: 100%"><i-mynaui:cog /></el-icon>
        <template #title>设置</template>
      </el-menu-item>
      <el-menu-item index="5" class="h-4">
        <el-icon :size="30" style="width: 100%"><i-mynaui:user-circle /></el-icon>
        <template #title>个人信息</template>
      </el-menu-item>
      <el-menu-item @click="toggleDark()" class="h-4">
        <button class="toggle-btn" style="height: var(--ep-menu-item-height)">
          <el-icon :size="30" style="width: 100%">
            <i-mynaui:sun v-if="isDark" />
            <i-mynaui:moon v-else />
          </el-icon>
        </button>
      </el-menu-item>
    </div>
  </el-menu>
</template>

<script lang="ts" setup>
  import { toggleDark, isDark } from '@/composables/dark';
  import { useRoute } from 'vue-router';

  const route = useRoute();
</script>

<style scoped>
  .custom-menu {
    width: 5vw;
    padding: 1rem;
    min-width: 4rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    --ep-menu-bg-color: #f3f4f6;
  }
  html.dark .custom-menu {
    --ep-menu-bg-color: #1f2937;
  }

  .h-4 {
    height: 4.5rem;
  }
  .toggle-btn {
    width: 100%;
    border-style: none;
    background-color: transparent;
    cursor: pointer;
  }
  :deep(.ep-menu-item) {
    border-radius: 0.5rem;
  }
</style>
