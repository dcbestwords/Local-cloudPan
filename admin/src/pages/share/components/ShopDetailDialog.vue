<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="1000px"
    align-center
    :show-close="false">
    <div class="detail-container" v-if="shop" :key="shop.id">
      <button @click="$emit('update:visible', false)" class="detail-close-btn">
        <el-icon :size="20"><Close /></el-icon>
      </button>

      <!-- 左侧图片 -->
      <div class="detail-left">
        <div
          v-if="shop.cover"
          class="detail-image"
          :style="{ backgroundImage: `url(${shop.cover})` }" />
        <div v-else class="detail-image detail-image-empty">
          <el-icon :size="48" class="text-gray-600"><Picture /></el-icon>
          <span>暂无照片</span>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="detail-right">
        <div class="detail-author">
          <el-avatar :size="40" class="author-avatar-lg">{{ shop.author.charAt(0) }}</el-avatar>
          <div>
            <div class="font-bold">{{ shop.author }}</div>
            <div class="text-xs text-gray-400">{{ shop.date }}</div>
          </div>
        </div>

        <div class="detail-scroll">
          <h2 class="detail-name">{{ shop.name }}</h2>

          <div class="detail-meta">
            <div class="rating rating-lg">
              <el-icon color="#f97316" :size="14"><StarFilled /></el-icon>
              <span>{{ shop.rating }}</span>
            </div>
            <span>
              <el-icon :size="14"><Location /></el-icon>
              {{ shop.distance }}
            </span>
            <span>{{ shop.price }}</span>
          </div>

          <p class="detail-desc">{{ shop.description }}</p>

          <div class="detail-tags">
            <el-tag v-for="tag in shop.tags" :key="tag" size="small"># {{ tag }}</el-tag>
          </div>

          <!-- 评论区 -->
          <div class="comment-section">
            <h3>共 {{ shop.commentsList?.length || 0 }} 条评论</h3>
            <div v-if="shop.commentsList?.length">
              <div v-for="(comment, idx) in shop.commentsList" :key="idx" class="comment-item">
                <el-avatar :size="32" class="comment-avatar">
                  {{ comment.user.charAt(0) }}
                </el-avatar>
                <div class="comment-body">
                  <div class="comment-header">
                    <span class="comment-user">{{ comment.user }}</span>
                    <span class="comment-date">{{ comment.date }}</span>
                  </div>
                  <span class="comment-text">{{ comment.content }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-400 text-sm py-8">暂无评论，快来抢沙发~</div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="detail-footer">
          <div class="detail-actions">
            <button
              @click="$emit('toggleLike')"
              class="action-btn"
              :class="{ liked: shop.isLiked }">
              <el-icon :size="26"><Pointer /></el-icon>
              <span>{{ shop.likes }}</span>
            </button>
            <div class="action-btn">
              <el-icon :size="26"><ChatLineRound /></el-icon>
              <span>{{ shop.comments }}</span>
            </div>
          </div>

          <div class="comment-input-row">
            <el-input
              :model-value="commentText"
              @update:model-value="$emit('update:commentText', $event)"
              placeholder="说点什么..."
              class="comment-input"
              @keyup.enter="$emit('submitComment')"
              :input-style="{ boxShadow: 'none', background: 'transparent' }" />
            <el-button
              type="primary"
              link
              :disabled="!commentText?.trim()"
              @click="$emit('submitComment')">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
  import {
    Close,
    Picture,
    StarFilled,
    Location,
    Pointer,
    ChatLineRound,
  } from '@element-plus/icons-vue';
  import type { Shop } from '../types';

  defineProps<{ visible: boolean; shop: Shop | null; commentText: string }>();
  defineEmits<{
    'update:visible': [value: boolean];
    'update:commentText': [value: string];
    toggleLike: [];
    submitComment: [];
  }>();
</script>

<style scoped lang="scss">
  .detail-container {
    display: flex;
    height: 40rem;
    background: #fff;
    position: relative;
    .detail-close-btn {
      height: 2.25rem;
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 50;
      padding: 0.5rem;
      background: rgba(243, 244, 246, 0.9);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: #4b5563;
      transition: all 0.2s;
      &:hover {
        background: #e5e7eb;
        color: #111827;
      }
    }
    .detail-left {
      width: 60%;
      background: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      .detail-image {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
      }
      .detail-image-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        gap: 1rem;
      }
    }
    .detail-right {
      width: 40%;
      display: flex;
      flex-direction: column;
      border-left: 1px solid #f3f4f6;
      .detail-author {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1.25rem;
        border-bottom: 1px solid #f3f4f6;
        flex-shrink: 0;
        .author-avatar-lg {
          background: #e5e7eb;
          color: #6b7280;
          font-weight: 700;
        }
      }
      .detail-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 1.25rem;
        .detail-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem;
        }
        .detail-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
          span {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          .rating {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            background: #fff7ed;
            padding: 0.125rem 0.5rem;
            border-radius: 0.25rem;
            border: 1px solid #fed7aa;
            span {
              font-weight: 700;
              color: #ea580c;
            }
          }
          .rating-lg {
            font-size: 0.875rem;
          }
        }
        .detail-desc {
          color: #374151;
          font-size: 0.938rem;
          line-height: 1.8;
          white-space: pre-wrap;
          margin: 0 0 1.5rem;
        }
        .detail-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          margin-bottom: 1.5rem;
        }
        .comment-section {
          h3 {
            font-size: 0.938rem;
            font-weight: 600;
            color: #111827;
            margin: 0 0 1rem;
          }
          .comment-item {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1.25rem;
            .comment-avatar {
              background: #f3f4f6;
              color: #6b7280;
              font-size: 0.75rem;
              font-weight: 700;
              flex-shrink: 0;
            }
            .comment-body {
              flex: 1;
              .comment-header {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                margin-bottom: 0.25rem;
                .comment-user {
                  font-size: 0.875rem;
                  font-weight: 600;
                  color: #4b5563;
                }
                .comment-date {
                  font-size: 0.75rem;
                  color: #9ca3af;
                }
              }
              .comment-text {
                font-size: 0.875rem;
                color: #374151;
                line-height: 1.5;
              }
            }
          }
        }
      }
      .detail-footer {
        padding: 1rem 1.25rem;
        border-top: 1px solid #f3f4f6;
        background: #fff;
        flex-shrink: 0;
        .detail-actions {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
          padding: 0 0.5rem;
          .action-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: none;
            background: transparent;
            cursor: pointer;
            color: #4b5563;
            font-size: 1.125rem;
            padding: 0;
            transition: color 0.2s;
            &:hover {
              color: #111827;
            }
            &.liked {
              color: #ef4444;
            }
          }
        }
        .comment-input-row {
          display: flex;
          align-items: center;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 1.5rem;
          padding: 0.25rem 1rem;
          transition:
            border-color 0.2s,
            background 0.2s;
          &:focus-within {
            border-color: #9ca3af;
            background: #fff;
          }
          .comment-input {
            flex: 1;
            &:deep(.el-input__wrapper) {
              box-shadow: none !important;
              background: transparent !important;
            }
          }
        }
      }
    }
  }

  .font-bold {
    font-weight: 700;
  }
  .text-xs {
    font-size: 0.75rem;
  }
  .text-gray-400 {
    color: #9ca3af;
  }
  .text-gray-600 {
    color: #4b5563;
  }
  .text-center {
    text-align: center;
  }
</style>
