<template>
  <div class="share-page">
    <!-- 顶部标题栏 -->
    <header class="page-header">
      <div>
        <h2>探店分享</h2>
        <p>发现教研室周边的美食与好去处</p>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索店铺或标签..."
          :prefix-icon="Search"
          clearable
        />
        <el-button type="primary" :icon="Plus" @click="showForm = true">发布新探店</el-button>
      </div>
    </header>

    <!-- 瀑布流内容区 -->
    <div class="page-body">
      <div class="card-grid">
        <el-card
          v-for="shop in filteredShops"
          :key="shop.id"
          class="shop-card"
          :body-style="{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }"
          shadow="never"
        >
          <!-- 图片区域 -->
          <div class="card-image">
            <div class="category-badge">{{ shop.category }}</div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-body">
            <div class="card-title-row">
              <h3>{{ shop.name }}</h3>
              <div class="rating">
                <el-icon color="#f97316" :size="14"><StarFilled /></el-icon>
                <span>{{ shop.rating }}</span>
              </div>
            </div>

            <div class="card-meta">
              <span><el-icon :size="14"><Location /></el-icon>{{ shop.distance }}</span>
              <span>{{ shop.price }}</span>
            </div>

            <div class="card-tags">
              <el-tag
                v-for="tag in shop.tags"
                :key="tag"
                size="small"
                type="info"
              >{{ tag }}</el-tag>
            </div>

            <p class="card-desc">"{{ shop.description }}"</p>

            <!-- 底部 -->
            <div class="card-footer">
              <div class="author">
                <el-avatar :size="24" class="author-avatar">
                  {{ shop.author.charAt(0) }}
                </el-avatar>
                <span>{{ shop.author }} · {{ shop.date }}</span>
              </div>
              <div class="stats">
                <span class="stat-item" @click="likeShop(shop)">
                  <el-icon :size="16"><Pointer /></el-icon> {{ shop.likes }}
                </span>
                <span class="stat-item">
                  <el-icon :size="16"><ChatLineRound /></el-icon> {{ shop.comments }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!filteredShops.length" description="没有找到匹配的探店" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Search,
  Plus,
  StarFilled,
  Location,
  Pointer,
  ChatLineRound,
} from '@element-plus/icons-vue';

defineOptions({ name: 'share' });

interface Shop {
  id: number;
  name: string;
  category: string;
  rating: number;
  distance: string;
  price: string;
  tags: string[];
  description: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
}

const searchQuery = ref('');
const showForm = ref(false);

const mockShops = ref<Shop[]>([
  {
    id: 1,
    name: '老张牛肉面馆',
    category: '面馆',
    rating: 4.8,
    distance: '1.2km',
    price: '人均 ¥25',
    tags: ['牛肉面', '老字号', '分量足'],
    description: '开了二十年的老店，牛肉软烂入味，汤头浓郁，面条劲道。每次来都要排队，但绝对值得！',
    author: '小王',
    date: '07-01',
    likes: 128,
    comments: 32,
  },
  {
    id: 2,
    name: '巷子深 · 精品咖啡馆',
    category: '咖啡',
    rating: 4.6,
    distance: '0.8km',
    price: '人均 ¥38',
    tags: ['手冲', '精品豆', '安静'],
    description: '藏在居民区里的宝藏咖啡馆，老板是SCA认证咖啡师。手冲耶加雪菲花香四溢，环境安静适合自习。',
    author: '小李',
    date: '06-28',
    likes: 89,
    comments: 15,
  },
  {
    id: 3,
    name: '蜀味轩川菜馆',
    category: '川菜',
    rating: 4.5,
    distance: '2.1km',
    price: '人均 ¥55',
    tags: ['水煮鱼', '麻辣', '聚餐'],
    description: '正宗川味，水煮鱼片嫩滑，麻婆豆腐下饭神器。适合教研室聚餐，量大实惠。',
    author: '小张',
    date: '06-25',
    likes: 203,
    comments: 48,
  },
  {
    id: 4,
    name: '阿美奶茶铺',
    category: '奶茶',
    rating: 4.7,
    distance: '0.5km',
    price: '人均 ¥16',
    tags: ['珍珠奶茶', '手作', '性价比'],
    description: '现煮黑糖珍珠Q弹有嚼劲，奶盖咸甜适中。下午茶首选，外卖也很快。',
    author: '小陈',
    date: '07-02',
    likes: 156,
    comments: 23,
  },
  {
    id: 5,
    name: '韩式炸鸡啤酒屋',
    category: '韩料',
    rating: 4.4,
    distance: '1.8km',
    price: '人均 ¥48',
    tags: ['炸鸡', '啤酒', '夜宵'],
    description: '韩式甜辣炸鸡外酥里嫩，配上冰啤酒简直完美。加班后的深夜食堂。',
    author: '小赵',
    date: '06-30',
    likes: 176,
    comments: 41,
  },
  {
    id: 6,
    name: '素食记',
    category: '素食',
    rating: 4.3,
    distance: '1.5km',
    price: '人均 ¥32',
    tags: ['素食', '健康', '清新'],
    description: '精致的素食小馆，口味清淡却不寡淡，推荐招牌素狮子头和菌菇汤。',
    author: '小周',
    date: '06-27',
    likes: 67,
    comments: 12,
  },
]);

const filteredShops = computed(() => {
  if (!searchQuery.value) return mockShops.value;
  const q = searchQuery.value.toLowerCase();
  return mockShops.value.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)) ||
      s.category.toLowerCase().includes(q),
  );
});

function likeShop(shop: Shop) {
  shop.likes++;
}
</script>

<style scoped>
.share-page {
  height: calc(100vh - 6rem);
  display: flex;
  flex-direction: column;
  text-align: left;
}

/* 顶部栏 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  border-bottom: 1px solid var(--ep-border-color-lighter);
  flex-shrink: 0;
}

.page-header h2 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ep-text-color-primary);
}

.page-header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ep-text-color-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-input {
  width: 16rem;
}

/* 内容区域 */
.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  max-width: 80rem;
  margin: 0 auto;
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

/* 卡片 */
.shop-card {
  border: 1px solid var(--ep-border-color-lighter);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.shop-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-image {
  height: 12rem;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  position: relative;
}

.category-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.card-body {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.card-title-row h3 {
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
}

.rating span {
  font-size: 0.875rem;
  font-weight: 700;
  color: #ea580c;
}

.card-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--ep-text-color-secondary);
  margin-bottom: 0.75rem;
}

.card-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  color: var(--ep-text-color-regular);
  line-height: 1.6;
  flex: 1;
}

/* 底部 */
.card-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--ep-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--ep-text-color-secondary);
}

.author-avatar {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 700;
}

.stats {
  display: flex;
  gap: 1rem;
  color: var(--ep-text-color-secondary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: color 0.2s;
}

.stat-item:hover {
  color: var(--ep-text-color-primary);
}
</style>
