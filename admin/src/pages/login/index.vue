<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 标题 -->
      <div class="card-title">
        <h1>教研室交流平台</h1>
        <p>{{ mode === 'login' ? '欢迎回来，请登录您的账号' : '注册新账号加入教研室' }}</p>
      </div>

      <!-- 表单 -->
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="真实姓名" v-if="mode === 'register'">
          <el-input v-model="realName" placeholder="请输入姓名" size="large" />
        </el-form-item>

        <el-form-item label="账号/用户名">
          <el-input v-model="username" placeholder="请输入账号" size="large" />
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="label-row">
              <span>密码</span>
              <a v-if="mode === 'login'" class="forgot-link">忘记密码?</a>
            </div>
          </template>
          <el-input
            v-model="password"
            type="password"
            show-password
            placeholder="请输入密码"
            size="large"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          native-type="submit"
          :loading="submitting"
        >
          {{ mode === 'login' ? '登 录' : '注 册' }}
        </el-button>
      </el-form>

      <!-- 切换 -->
      <div class="switch-row">
        <el-link type="info" :underline="false" @click="toggleMode">
          {{ mode === 'login' ? '没有账号？点击注册' : '已有账号？返回登录' }}
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();
const mode = ref<'login' | 'register'>('login');
const username = ref('');
const password = ref('');
const realName = ref('');
const submitting = ref(false);

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login';
}

async function submit() {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  if (mode.value === 'register' && !realName.value) {
    ElMessage.warning('请输入真实姓名');
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
.login-page {
  min-height: 100vh;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 28rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 2rem;
}

.card-title {
  text-align: center;
  margin-bottom: 2.5rem;
}

.card-title h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.card-title p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.forgot-link {
  font-size: 0.75rem;
  color: #9ca3af;
  text-decoration: none;
  cursor: pointer;
}

.forgot-link:hover {
  color: #111827;
}

.submit-btn {
  width: 100%;
  margin-top: 1rem;
}

.switch-row {
  text-align: center;
  margin-top: 1.5rem;
}
</style>
