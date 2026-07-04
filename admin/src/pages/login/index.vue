<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 品牌头部 -->
      <div class="card-header">
        <div class="brand-icon">
          <el-icon :size="28"><i-mynaui:cloud-download /></el-icon>
        </div>
        <h1>Local-CloudPan</h1>
        <p>局域网文件管理与聊天</p>
      </div>

      <!-- 登录/注册 Tab -->
      <div class="card-body">
        <div class="tab-switch">
          <button
            :class="{ active: mode === 'login' }"
            @click="mode = 'login'"
          >登录</button>
          <button
            :class="{ active: mode === 'register' }"
            @click="mode = 'register'"
          >注册</button>
        </div>

        <el-form @submit.prevent="submit">
          <el-form-item>
            <el-input
              v-model="username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              @click="submit"
              :loading="submitting"
              class="submit-btn"
            >
              {{ mode === 'login' ? '登 录' : '注 册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <p class="switch-hint" v-if="mode === 'login'">
          还没有账号？
          <a href="javascript:;" @click="mode = 'register'">立即注册</a>
        </p>
        <p class="switch-hint" v-else>
          已有账号？
          <a href="javascript:;" @click="mode = 'login'">返回登录</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
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
  min-height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 品牌头部 */
.card-header {
  background: #111827;
  padding: 2rem 2rem 1.5rem;
  text-align: center;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #60a5fa;
  margin-bottom: 0.75rem;
}

.card-header h1 {
  margin: 0 0 0.25rem;
  font-size: 1.35rem;
  font-weight: 600;
  color: #fff;
}

.card-header p {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

/* 表单区域 */
.card-body {
  padding: 1.75rem 2rem 2rem;
}

.tab-switch {
  display: flex;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  background: #f3f4f6;
  padding: 3px;
}

.tab-switch button {
  flex: 1;
  padding: 0.5rem 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-switch button.active {
  background: #fff;
  color: #111827;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.submit-btn {
  width: 100%;
  --ep-button-bg-color: #111827;
  --ep-button-border-color: #111827;
  --ep-button-hover-bg-color: #1f2937;
  --ep-button-hover-border-color: #1f2937;
  letter-spacing: 0.5em;
}

.switch-hint {
  text-align: center;
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0;
}

.switch-hint a {
  color: #111827;
  font-weight: 500;
  text-decoration: none;
}

.switch-hint a:hover {
  text-decoration: underline;
}
</style>
