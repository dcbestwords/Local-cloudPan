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
        <el-button type="primary" :icon="Plus" @click="dialogVisible = true">发布新探店</el-button>
      </div>
    </header>

    <!-- 卡片网格 -->
    <div class="page-body">
      <div class="card-grid">
        <el-card
          v-for="shop in filteredShops"
          :key="shop.id"
          class="shop-card cursor-pointer"
          @click="openDetail(shop)"
          :body-style="{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }"
          shadow="never"
        >
          <div class="card-image" :style="shop.cover ? { backgroundImage: `url(${shop.cover})` } : {}">
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
              <span><el-icon :size="14"><Location /></el-icon>{{ shop.distance }}</span>
              <span>{{ shop.price }}</span>
            </div>

            <div class="card-tags">
              <el-tag v-for="tag in shop.tags" :key="tag" size="small" type="info">{{ tag }}</el-tag>
            </div>

            <p class="card-desc">"{{ shop.description }}"</p>

            <div class="card-footer">
              <div class="author">
                <el-avatar :size="24" class="author-avatar">{{ shop.author.charAt(0) }}</el-avatar>
                <span>{{ shop.author }} · {{ shop.date }}</span>
              </div>
              <div class="stats">
                <span class="stat-item" @click.stop="likeShop(shop)">
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

      <el-empty v-if="!filteredShops.length" description="没有找到匹配的探店" />
    </div>

    <!-- 发布新探店弹窗 -->
    <el-dialog v-model="dialogVisible" title="发布新探店" width="600px" top="5vh">
      <el-form :model="postForm" label-width="80px" label-position="left">
        <el-form-item label="店铺名称" required>
          <el-input v-model="postForm.name" placeholder="请输入店铺名称" />
        </el-form-item>

        <el-form-item label="菜品类型" required>
          <el-select v-model="postForm.category" placeholder="请选择或输入类型" filterable allow-create class="w-full">
            <el-option label="面馆" value="面馆" />
            <el-option label="咖啡/轻食" value="咖啡/轻食" />
            <el-option label="川菜/快餐" value="川菜/快餐" />
            <el-option label="日料/寿司" value="日料/寿司" />
            <el-option label="甜品/奶茶" value="甜品/奶茶" />
            <el-option label="韩料" value="韩料" />
            <el-option label="素食" value="素食" />
            <el-option label="火锅" value="火锅" />
          </el-select>
        </el-form-item>

        <el-form-item label="人均消费">
          <el-input v-model="postForm.price" placeholder="例如: 85"><template #append>元/人</template></el-input>
        </el-form-item>

        <el-form-item label="距离">
          <el-input v-model="postForm.distance" placeholder="例如: 1.5km" />
        </el-form-item>

        <el-form-item label="综合评分">
          <el-rate v-model="postForm.rating" allow-half class="mt-1" />
        </el-form-item>

        <el-form-item label="标签">
          <el-select v-model="postForm.tags" multiple filterable allow-create placeholder="添加标签" class="w-full" />
        </el-form-item>

        <el-form-item label="封面图片">
          <el-input v-model="postForm.cover" placeholder="输入图片URL" />
        </el-form-item>

        <el-form-item label="探店评价" required>
          <el-input type="textarea" :rows="4" v-model="postForm.description" placeholder="分享你的就餐体验..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPost">确认发布</el-button>
      </template>
    </el-dialog>

    <!-- 探店详情弹窗 -->
    <el-dialog v-model="detailVisible" width="1000px" align-center class="detail-dialog" :show-close="false" top="5vh">
      <div class="detail-container" v-if="activeShop">
        <!-- 关闭按钮 -->
        <button @click="detailVisible = false" class="detail-close-btn">
          <el-icon :size="20"><Close /></el-icon>
        </button>

        <!-- 左侧图片 -->
        <div class="detail-left">
          <div v-if="activeShop.cover" class="detail-image" :style="{ backgroundImage: `url(${activeShop.cover})` }" />
          <div v-else class="detail-image detail-image-empty">
            <el-icon :size="48" class="text-gray-600"><Picture /></el-icon>
            <span>暂无照片</span>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="detail-right">
          <!-- 作者 -->
          <div class="detail-author">
            <el-avatar :size="40" class="author-avatar-lg">{{ activeShop.author.charAt(0) }}</el-avatar>
            <div>
              <div class="font-bold">{{ activeShop.author }}</div>
              <div class="text-xs text-gray-400">{{ activeShop.date }}</div>
            </div>
          </div>

          <!-- 详情 -->
          <div class="detail-scroll">
            <h2 class="detail-name">{{ activeShop.name }}</h2>

            <div class="detail-meta">
              <div class="rating rating-lg">
                <el-icon color="#f97316" :size="14"><StarFilled /></el-icon>
                <span>{{ activeShop.rating }}</span>
              </div>
              <span><el-icon :size="14"><Location /></el-icon>{{ activeShop.distance }}</span>
              <span>{{ activeShop.price }}</span>
            </div>

            <p class="detail-desc">{{ activeShop.description }}</p>

            <div class="detail-tags">
              <el-tag v-for="tag in activeShop.tags" :key="tag" size="small"># {{ tag }}</el-tag>
            </div>

            <!-- 评论区 -->
            <div class="comment-section">
              <h3>共 {{ activeShop.commentsList?.length || 0 }} 条评论</h3>
              <div v-if="activeShop.commentsList?.length">
                <div v-for="(comment, idx) in activeShop.commentsList" :key="idx" class="comment-item">
                  <el-avatar :size="32" class="comment-avatar">{{ comment.user.charAt(0) }}</el-avatar>
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
              <button @click="toggleDetailLike" class="action-btn" :class="{ liked: activeShop.isLiked }">
                <el-icon :size="26"><Pointer /></el-icon>
                <span>{{ activeShop.likes }}</span>
              </button>
              <div class="action-btn">
                <el-icon :size="26"><ChatLineRound /></el-icon>
                <span>{{ activeShop.comments }}</span>
              </div>
            </div>

            <div class="comment-input-row">
              <el-input
                v-model="newComment"
                placeholder="说点什么..."
                class="comment-input"
                @keyup.enter="submitComment"
                :input-style="{ boxShadow: 'none', background: 'transparent' }"
              />
              <el-button type="primary" link :disabled="!newComment.trim()" @click="submitComment">
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Search,
  Plus,
  StarFilled,
  Location,
  Pointer,
  ChatLineRound,
  Close,
  Picture,
} from '@element-plus/icons-vue';

defineOptions({ name: 'share' });

interface Comment {
  user: string;
  date: string;
  content: string;
}

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
  cover: string;
  commentsList?: Comment[];
  isLiked?: boolean;
}

const searchQuery = ref('');
const dialogVisible = ref(false);
const detailVisible = ref(false);
const activeShop = ref<Shop | null>(null);
const newComment = ref('');

const postForm = reactive({
  name: '',
  category: '',
  price: '',
  distance: '',
  rating: 0,
  tags: [] as string[],
  cover: '',
  description: '',
});

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
    cover: '',
    commentsList: [
      { user: '小李', date: '07-02', content: '真的超级好吃，每次路过必去！' },
      { user: '小张', date: '07-03', content: '牛肉面爱好者狂喜，汤底太绝了。' },
    ],
  },
  {
    id: 2,
    name: '巷子深 · 精品咖啡馆',
    category: '咖啡/轻食',
    rating: 4.6,
    distance: '0.8km',
    price: '人均 ¥38',
    tags: ['手冲', '精品豆', '安静'],
    description: '藏在居民区里的宝藏咖啡馆，老板是SCA认证咖啡师。手冲耶加雪菲花香四溢，环境安静适合自习。',
    author: '小李',
    date: '06-28',
    likes: 89,
    comments: 15,
    cover: '',
    commentsList: [],
  },
  {
    id: 3,
    name: '蜀味轩川菜馆',
    category: '川菜/快餐',
    rating: 4.5,
    distance: '2.1km',
    price: '人均 ¥55',
    tags: ['水煮鱼', '麻辣', '聚餐'],
    description: '正宗川味，水煮鱼片嫩滑，麻婆豆腐下饭神器。适合教研室聚餐，量大实惠。',
    author: '小张',
    date: '06-25',
    likes: 203,
    comments: 48,
    cover: '',
    commentsList: [
      { user: '小王', date: '06-26', content: '上周教研室聚餐去的，大家都说好吃！' },
      { user: '小赵', date: '06-27', content: '水煮鱼份量很足，四个人吃到撑。' },
    ],
  },
  {
    id: 4,
    name: '阿美奶茶铺',
    category: '甜品/奶茶',
    rating: 4.7,
    distance: '0.5km',
    price: '人均 ¥16',
    tags: ['珍珠奶茶', '手作', '性价比'],
    description: '现煮黑糖珍珠Q弹有嚼劲，奶盖咸甜适中。下午茶首选，外卖也很快。',
    author: '小陈',
    date: '07-02',
    likes: 156,
    comments: 23,
    cover: '',
    commentsList: [],
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
    cover: '',
    commentsList: [],
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
    cover: '',
    commentsList: [],
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

function openDetail(shop: Shop) {
  activeShop.value = shop;
  newComment.value = '';
  detailVisible.value = true;
}

function toggleDetailLike() {
  if (!activeShop.value) return;
  if (activeShop.value.isLiked) {
    activeShop.value.isLiked = false;
    activeShop.value.likes--;
  } else {
    activeShop.value.isLiked = true;
    activeShop.value.likes++;
  }
}

function submitComment() {
  const content = newComment.value.trim();
  if (!content || !activeShop.value) return;
  if (!activeShop.value.commentsList) activeShop.value.commentsList = [];
  activeShop.value.commentsList.push({
    user: localStorage.getItem('username') || '匿名',
    date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    content,
  });
  activeShop.value.comments++;
  newComment.value = '';
}

function submitPost() {
  if (!postForm.name || !postForm.category || !postForm.description) {
    ElMessage.warning('请填写店铺名称、菜品类型和探店评价');
    return;
  }
  const shop: Shop = {
    id: Date.now(),
    name: postForm.name,
    category: postForm.category,
    rating: postForm.rating || 0,
    distance: postForm.distance || '未知',
    price: postForm.price ? `人均 ¥${postForm.price}` : '未知',
    tags: postForm.tags.length ? postForm.tags : ['新店'],
    description: postForm.description,
    author: localStorage.getItem('username') || '匿名',
    date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    likes: 0,
    comments: 0,
    cover: postForm.cover || '',
    commentsList: [],
  };
  mockShops.value.unshift(shop);
  dialogVisible.value = false;
  ElMessage.success('发布成功！');
  // 重置表单
  Object.assign(postForm, { name: '', category: '', price: '', distance: '', rating: 0, tags: [], cover: '', description: '' });
}
</script>

<style scoped>
.share-page {
  height: calc(100vh - 6rem);
  display: flex;
  flex-direction: column;
  text-align: left;
}

/* ====== 顶部栏 ====== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  border-bottom: 1px solid var(--ep-border-color-lighter);
  flex-shrink: 0;
}
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.25rem; font-weight: 700; color: var(--ep-text-color-primary); }
.page-header p  { margin: 0; font-size: 0.875rem; color: var(--ep-text-color-secondary); }
.header-actions { display: flex; align-items: center; gap: 1rem; }
.search-input    { width: 16rem; }

/* ====== 卡片网格 ====== */
.page-body  { flex: 1; overflow-y: auto; padding: 2rem; }
.card-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 80rem; margin: 0 auto; }
@media (max-width: 1200px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px)  { .card-grid { grid-template-columns: 1fr; } }

.shop-card { border: 1px solid var(--ep-border-color-lighter); border-radius: 0.75rem; overflow: hidden; transition: box-shadow 0.2s; }
.shop-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }

.card-image {
  height: 12rem;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  position: relative;
  background-size: cover;
  background-position: center;
}
.card-image-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
}
.category-badge {
  position: absolute; top: 0.75rem; left: 0.75rem;
  background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);
  padding: 0.25rem 0.5rem; border-radius: 0.25rem;
  font-size: 0.75rem; font-weight: 600; color: #374151; z-index: 1;
}

.card-body     { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
.card-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.card-title-row h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: var(--ep-text-color-primary); }

.rating {
  display: flex; align-items: center; gap: 0.25rem;
  background: #fff7ed; padding: 0.125rem 0.5rem; border-radius: 0.25rem;
  border: 1px solid #fed7aa; flex-shrink: 0;
}
.rating span { font-size: 0.875rem; font-weight: 700; color: #ea580c; }

.card-meta { display: flex; gap: 0.75rem; font-size: 0.75rem; color: var(--ep-text-color-secondary); margin-bottom: 0.75rem; }
.card-meta span { display: flex; align-items: center; gap: 0.25rem; }

.card-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.card-desc { margin: 0 0 1rem; font-size: 0.875rem; color: var(--ep-text-color-regular); line-height: 1.6; flex: 1; }

.card-footer { padding-top: 1rem; border-top: 1px solid var(--ep-border-color-lighter); display: flex; justify-content: space-between; align-items: center; }
.author { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--ep-text-color-secondary); }
.author-avatar { background: #e5e7eb; color: #6b7280; font-size: 0.75rem; font-weight: 700; }
.stats { display: flex; gap: 1rem; color: var(--ep-text-color-secondary); }
.stat-item { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; cursor: pointer; transition: color 0.2s; }
.stat-item:hover { color: var(--ep-text-color-primary); }

.cursor-pointer { cursor: pointer; }
.w-full { width: 100%; }

/* ====== 详情弹窗 ====== */
.detail-container {
  display: flex;
  height: 650px;
  background: #fff;
  position: relative;
}

.detail-close-btn {
  position: absolute; top: 1rem; right: 1rem; z-index: 50;
  padding: 0.5rem; background: rgba(243,244,246,0.9); backdrop-filter: blur(4px);
  border: none; border-radius: 50%; cursor: pointer;
  color: #4b5563; transition: all 0.2s;
}
.detail-close-btn:hover { background: #e5e7eb; color: #111827; }

.detail-left {
  width: 60%; background: #111827;
  display: flex; align-items: center; justify-content: center;
}
.detail-image {
  width: 100%; height: 100%;
  background-size: cover; background-position: center;
}
.detail-image-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #6b7280; gap: 1rem;
}

.detail-right {
  width: 40%; display: flex; flex-direction: column;
  border-left: 1px solid #f3f4f6;
}

.detail-author {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1.25rem; border-bottom: 1px solid #f3f4f6; flex-shrink: 0;
}
.author-avatar-lg { background: #e5e7eb; color: #6b7280; font-weight: 700; }

.detail-scroll { flex: 1; overflow-y: auto; padding: 1.25rem; }

.detail-name { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 1rem; }

.detail-meta { display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem; }
.detail-meta span { display: flex; align-items: center; gap: 0.25rem; }
.rating-lg { font-size: 0.875rem; }

.detail-desc { color: #374151; font-size: 0.938rem; line-height: 1.8; white-space: pre-wrap; margin-bottom: 1.5rem; }

.detail-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f3f4f6; margin-bottom: 1.5rem; }

/* 评论 */
.comment-section h3 { font-size: 0.938rem; font-weight: 600; color: #111827; margin: 0 0 1rem; }

.comment-item { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
.comment-avatar { background: #f3f4f6; color: #6b7280; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
.comment-body { flex: 1; }
.comment-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem; }
.comment-user { font-size: 0.875rem; font-weight: 600; color: #4b5563; }
.comment-date { font-size: 0.75rem; color: #9ca3af; }
.comment-text { font-size: 0.875rem; color: #374151; line-height: 1.5; }

/* 底部操作 */
.detail-footer {
  padding: 1rem 1.25rem; border-top: 1px solid #f3f4f6;
  background: #fff; flex-shrink: 0;
}
.detail-actions { display: flex; gap: 1.5rem; margin-bottom: 1rem; padding: 0 0.5rem; }
.action-btn {
  display: flex; align-items: center; gap: 0.5rem;
  border: none; background: transparent; cursor: pointer;
  color: #4b5563; font-size: 1.125rem;
  padding: 0; transition: color 0.2s;
}
.action-btn:hover { color: #111827; }
.action-btn.liked { color: #ef4444; }

.comment-input-row {
  display: flex; align-items: center;
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 1.5rem;
  padding: 0.25rem 1rem;
  transition: border-color 0.2s, background 0.2s;
}
.comment-input-row:focus-within { border-color: #9ca3af; background: #fff; }
.comment-input { flex: 1; }
.comment-input :deep(.el-input__wrapper) { box-shadow: none !important; background: transparent !important; }
</style>
