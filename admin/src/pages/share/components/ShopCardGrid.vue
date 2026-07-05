<template>
  <div class="page-body">
    <el-scrollbar max-height="48rem">
      <div class="card-grid">
        <el-card
          v-for="shop in shops"
          :key="shop.id"
          class="shop-card"
          @click="$emit('click', shop)"
          :body-style="{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }"
          shadow="never">
          <div
            class="card-image"
            :style="shop.cover ? { backgroundImage: `url(${shop.cover})` } : {}">
            <div v-if="!shop.cover" class="card-image-placeholder" />
            <div class="category-badge">{{ shop.category }}</div>
          </div>

          <div class="card-body">
            <div class="card-title-row">
              <h3>{{ shop.name }}</h3>
              <div class="rating">
                <el-icon color="#f97316" :size="14"><StarFilled /></el-icon>
                <span>{{ shop.rating }}</span>
              </div>
            </div>

            <div class="card-meta">
              <span>
                <el-icon :size="14"><Location /></el-icon>
                {{ shop.distance }}
              </span>
              <span>{{ shop.price }}</span>
            </div>

            <div class="card-tags">
              <el-tag v-for="tag in shop.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>

            <p class="card-desc">"{{ shop.description }}"</p>

            <div class="card-footer">
              <div class="author">
                <el-avatar :size="24" class="author-avatar">{{ shop.author.charAt(0) }}</el-avatar>
                <span>{{ shop.author }} · {{ shop.date }}</span>
              </div>
              <div class="stats">
                <span class="stat-item" @click.stop="$emit('like', shop)">
                  <el-icon :size="16"><Pointer /></el-icon>
                  {{ shop.likes }}
                </span>
                <span class="stat-item">
                  <el-icon :size="16"><ChatLineRound /></el-icon>
                  {{ shop.comments }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-scrollbar>

    <el-empty v-if="!shops.length" description="没有找到匹配的探店" />
  </div>
</template>

<script setup lang="ts">
  import { StarFilled, Location, Pointer, ChatLineRound } from '@element-plus/icons-vue';
  import type { Shop } from '../types';

  defineProps<{ shops: Shop[] }>();
  defineEmits<{
    click: [shop: Shop];
    like: [shop: Shop];
  }>();
</script>

<style scoped lang="scss">
  .page-body {
    flex: 1;
    padding: 0 0 2rem;
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(20rem, 27rem));
      gap: 1.5rem;
      place-content: center;
      .shop-card {
        border-radius: 0.75rem;
        overflow: hidden;
        transition: box-shadow 0.2s;
        cursor: pointer;
        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .card-image {
          height: 12rem;
          background-size: cover;
          background-position: center;
          position: relative;
          background-image: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
          .card-image-placeholder {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
          }
          .category-badge {
            position: absolute;
            top: 0.75rem;
            left: 0.75rem;
            z-index: 1;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(4px);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #374151;
          }
        }
        .card-body {
          padding: 1.25rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          .card-title-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
            h3 {
              margin: 0;
              font-size: 1.125rem;
              font-weight: 700;
              color: var(--ep-text-color-primary);
            }
            .rating {
              display: flex;
              align-items: center;
              gap: 0.25rem;
              background: #fff7ed;
              padding: 0.125rem 0.5rem;
              border-radius: 0.25rem;
              border: 1px solid #fed7aa;
              flex-shrink: 0;
              span {
                font-size: 0.875rem;
                font-weight: 700;
                color: #ea580c;
              }
            }
          }
          .card-meta {
            display: flex;
            gap: 0.75rem;
            font-size: 0.75rem;
            color: var(--ep-text-color-secondary);
            margin-bottom: 0.75rem;
            span {
              display: flex;
              align-items: center;
              gap: 0.25rem;
            }
          }
          .card-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .card-desc {
            margin: 0 0 1rem;
            font-size: 0.875rem;
            line-height: 1.6;
            color: var(--ep-text-color-regular);
            flex: 1;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
          }
          .card-footer {
            padding-top: 1rem;
            border-top: 1px solid var(--ep-border-color-lighter);
            display: flex;
            justify-content: space-between;
            align-items: center;
            .author {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.75rem;
              color: var(--ep-text-color-secondary);
              .author-avatar {
                background: #e5e7eb;
                color: #6b7280;
                font-size: 0.75rem;
                font-weight: 700;
              }
            }
            .stats {
              display: flex;
              gap: 1rem;
              color: var(--ep-text-color-secondary);
              .stat-item {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.75rem;
                cursor: pointer;
                transition: color 0.2s;
                &:hover {
                  color: var(--ep-text-color-primary);
                }
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 1200px) {
    .card-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 768px) {
    .card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
