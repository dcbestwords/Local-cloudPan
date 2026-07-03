<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Local-CloudPan</h1>
      <el-tabs v-model="mode" class="login-tabs">
        <el-tab-pane label="登录" name="login" />
        <el-tab-pane label="注册" name="register" />
      </el-tabs>
      <el-form @submit.prevent="submit">
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit" :loading="submitting" style="width:100%">
            {{ mode === 'login' ? '登录' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();
const mode = ref('login');
const username = ref('');
const password = ref('');
const submitting = ref(false);

async function submit() {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  submitting.value = true;
  try {
    const path = mode.value === 'login' ? '/auth/login' : '/auth/register';
    const res: any = await request.post(path, {
      username: username.value,
      password: password.value,
    });
    localStorage.setItem('token', res.token);
    localStorage.setItem('username', res.username);
    router.push('/home');
  } catch {
    // 错误已在拦截器中提示
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--ep-bg-color-page);
}
.login-card {
  width: 360px;
  padding: 2rem;
  background: var(--ep-bg-color);
  border-radius: 0.5rem;
  box-shadow: var(--ep-box-shadow-base);
}
.login-card h1 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--ep-text-color-primary);
}
</style>
