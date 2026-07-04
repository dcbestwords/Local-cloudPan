<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <Sidebar />

    <div class="right-area">
      <!-- 主标题和副标题 -->
      <div class="title-wrapper">
        <h1 class="main-title">{{ route.meta.title }}</h1>
        <span class="subtitle">{{ route.meta.subtitle }}</span>
      </div>
      <!-- 内容区 -->
      <div class="main-container">
        <MainContent></MainContent>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import MainContent from './components/MainContent.vue';
  import Sidebar from './components/Sidebar.vue';
  import { useRoute } from 'vue-router';
  const route = useRoute();
</script>

<style scoped>
  .app-container {
    text-align: center;
    display: flex;
    width: 100%;
    height: 100vh;
    color: var(--ep-text-color-primary);
  }

  .right-area {
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .main-container {
    width: 100%;
    padding: 0 2rem;
    text-align: center;
  }

  .title-wrapper {
    width: 100%;
    height: 6rem;
    padding: 1.25rem 2rem;
    border-bottom: 1px solid #e6e7eb;
    text-align: left;
  }
  .title-wrapper .main-title {
    font-size: 1.5rem;
    line-height: 1.75rem;
    font-weight: 700;
    color: var(--ep-text-color-primary);
    margin-bottom: 0.25rem;
  }
  .title-wrapper .subtitle {
    line-height: 1.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
</style>
