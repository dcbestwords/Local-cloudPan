<template>
  <div class="chat-container">
    <!-- 左侧-联系人列表（在线用户） -->
    <div class="contacts-sidebar">
      <div class="sidebar-header">
        <h2>在线用户</h2>
        <span class="connection-status" :class="{ connected: isConnected }">
          {{ isConnected ? '已连接' : '连接中...' }}
        </span>
      </div>
      <div class="contacts-list" v-if="contacts.length">
        <div
          v-for="contact in contacts"
          :key="contact.username"
          class="contact-item"
          :class="{ active: contact.username === curContact }"
          @click="switchContact(contact.username)"
        >
          <div class="contact-avatar">{{ contact.username[0] }}</div>
          <div class="contact-info">
            <span class="contact-name">{{ contact.username }}</span>
            <div class="contact-status">在线</div>
          </div>
        </div>
      </div>
      <div class="empty-contacts" v-else>
        <p>暂无在线用户</p>
      </div>
    </div>

    <!-- 右侧-消息区域 -->
    <div class="message-area">
      <div class="place-container" v-if="!curContact">
        <p class="place-title">选择一个用户开始聊天</p>
      </div>
      <template v-else>
        <div class="messages-container" ref="msgContainerRef">
          <div
            v-for="msg in currentMessages"
            :key="msg.id"
            class="message"
            :class="{ 'message-self': msg.isSelf }"
          >
            <div class="message-content">
              <p>{{ msg.content }}</p>
              <span class="message-time">{{ msg.time }}</span>
            </div>
          </div>
        </div>

        <div class="message-input">
          <el-input
            class="input-field"
            v-model="newMessage"
            placeholder="输入消息..."
            @keyup.enter="send"
          />
          <el-button type="primary" class="message-button" @click="send">
            <el-icon :size="24"><i-mynaui:send-solid /></el-icon>
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useWebSocket } from '@/composables/useWebSocket';
import { useChatDB } from '@/composables/useChatDB';

defineOptions({ name: 'chat' });

const { sendMessage, onMessage, isConnected, contacts } = useWebSocket();
const { getMessages, saveMessage } = useChatDB();

const curContact = ref('');
const currentMessages = ref<Message[]>([]);
const newMessage = ref('');
const msgContainerRef = ref<HTMLElement>();

// 切换联系人时加载历史消息
watch(curContact, async (username) => {
  if (username) {
    currentMessages.value = await getMessages(username);
    await nextTick();
    scrollToBottom();
  }
});

function scrollToBottom() {
  const el = msgContainerRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function switchContact(username: string) {
  curContact.value = username;
}

async function send() {
  const content = newMessage.value.trim();
  if (!content || !curContact.value) return;
  if (!isConnected.value) {
    ElMessage.warning('未连接到服务器，请稍后重试');
    return;
  }

  const msg: Message = {
    contact: curContact.value,
    content,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    isSelf: true,
  };
  await saveMessage(msg);
  currentMessages.value.push(msg);
  sendMessage(curContact.value, content);
  newMessage.value = '';
  await nextTick();
  scrollToBottom();
}

// 接收实时消息
onMessage(({ from, content, time }) => {
  if (from === curContact.value) {
    currentMessages.value.push({ contact: from, content, time, isSelf: false });
    scrollToBottom();
  }
  // 即使不是当前联系人也要存到 DB（已在 useWebSocket 中处理），此处只需更新 UI
  // ponytail: 如果消息来自当前联系人则展示，否则只落 DB 不展示（下次切换时加载）
});
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  padding: 0;
  height: calc(100vh - 4rem);
  text-align: left;
  overflow: hidden;

  .contacts-sidebar {
    width: 16rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--ep-border-color-lighter);

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      h2 { font-size: 1.25rem; font-weight: 600; color: var(--ep-text-color-primary); margin: 0; }
      .connection-status {
        font-size: 0.75rem;
        color: #e6a23c;
        &.connected { color: #67c23a; }
      }
    }
    .contacts-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .contact-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        &:hover { background-color: var(--ep-file-hover); }
        &.active { background-color: var(--ep-file-hover); }

        .contact-avatar {
          width: 2.5rem; height: 2.5rem;
          background-color: #e6e8eb;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-right: 12px; color: #606266;
        }
        .contact-info {
          flex: 1 1 0%; min-width: 0;
          .contact-name { font-weight: 500; color: var(--ep-text-color-primary); display: block; }
          .contact-status { font-size: 0.75rem; color: #67c23a; }
        }
      }
    }
    .empty-contacts {
      flex: 1;
      display: flex; justify-content: center; align-items: center;
      color: var(--ep-text-color-secondary);
    }
  }
}

.message-area {
  flex: 1; display: flex; flex-direction: column;

  .place-container {
    flex: 1; display: flex; justify-content: center; align-items: center;
    .place-title { color: #909399; }
  }

  .messages-container {
    flex: 1; padding: 1.25rem; overflow-y: auto;

    .message {
      margin-bottom: 1.25rem; display: flex;
      .message-content {
        max-width: 70%; padding: 0.75rem 1rem;
        background-color: var(--ep-fill-color-light);
        border-radius: 0.5rem; position: relative;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        p { margin: 0; color: var(--ep-text-color-primary); line-height: 1.5; }
        .message-time {
          font-size: 0.75rem; color: var(--ep-text-color-secondary);
          margin-top: 4px; display: block;
        }
      }
    }
    .message-self {
      flex-direction: row-reverse;
      .message-content {
        background-color: var(--ep-color-primary);
        p { color: #fff; }
      }
    }
  }

  .message-input {
    display: flex; align-items: center; padding: 1.5rem;
    border-top: 1px solid var(--ep-border-color-lighter);
    .input-field {
      border-radius: 0.375rem; border-width: 1px;
      width: 100%; height: 2.5rem; font-size: 1rem;
      color: var(--ep-text-color-placeholder);
      background-color: var(--ep-fill-color-light);
      margin-right: 0.75rem;
    }
    .message-button { width: 3rem; height: 2.5rem; }
  }
}

:deep(.el-textarea__inner) { resize: none; }
</style>
