<template>
  <div class="share-page">
    <!-- 顶部标题栏 -->
    <header class="page-header">
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索店铺或标签..."
          :prefix-icon="Search"
          clearable />
        <el-button type="primary" :icon="Plus" @click="dialogVisible = true">发布新探店</el-button>
      </div>
    </header>

    <!-- 卡片网格 -->
    <ShopCardGrid :shops="filteredShops" @click="openDetail" @like="likeShop" />

    <!-- 发布弹窗 -->
    <PublishDialog v-model:visible="dialogVisible" @submit="handlePublish" />

    <!-- 详情弹窗 -->
    <ShopDetailDialog
      v-model:visible="detailVisible"
      :shop="activeShop"
      v-model:comment-text="newComment"
      @toggle-like="toggleDetailLike"
      @submit-comment="submitComment" />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { ElMessage } from 'element-plus';
  import { Search, Plus } from '@element-plus/icons-vue';
  import ShopCardGrid from './components/ShopCardGrid.vue';
  import PublishDialog from './components/PublishDialog.vue';
  import ShopDetailDialog from './components/ShopDetailDialog.vue';
  import type { Shop, PostForm } from './types';

  defineOptions({ name: 'share' });

  const searchQuery = ref('');
  const dialogVisible = ref(false);
  const detailVisible = ref(false);
  const activeShop = ref<Shop | null>(null);
  const newComment = ref('');

  const mockShops = ref<Shop[]>([
    {
      id: 1,
      name: '老张牛肉面馆',
      category: '面馆',
      rating: 4.8,
      distance: '1.2km',
      price: '人均 ¥25',
      tags: ['牛肉面', '老字号', '分量足'],
      description:
        '开了二十年的老店，牛肉软烂入味，汤头浓郁，面条劲道。每次来都要排队，但绝对值得！',
      author: '小王',
      date: '07-01',
      likes: 128,
      comments: 32,
      cover: 'https://picsum.photos/580',
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
      description:
        '藏在居民区里的宝藏咖啡馆，老板是SCA认证咖啡师。手冲耶加雪菲花香四溢，环境安静适合自习。',
      author: '小李',
      date: '06-28',
      likes: 89,
      comments: 15,
      cover: 'https://picsum.photos/580',
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
      cover: 'https://picsum.photos/580',
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
      cover: 'https://picsum.photos/580',
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
      cover: 'https://picsum.photos/580',
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
      cover: 'https://picsum.photos/580',
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

  function handlePublish(form: PostForm) {
    const shop: Shop = {
      id: Date.now(),
      name: form.name,
      category: form.category,
      rating: form.rating || 0,
      distance: form.distance || '未知',
      price: form.price ? `人均 ¥${form.price}` : '未知',
      tags: form.tags.length ? form.tags : ['新店'],
      description: form.description,
      author: localStorage.getItem('username') || '匿名',
      date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      likes: 0,
      comments: 0,
      cover: form.cover || '',
      commentsList: [],
    };
    mockShops.value.unshift(shop);
    ElMessage.success('发布成功！');
  }
</script>

<style scoped>
  .share-page {
    height: calc(100vh - 6rem);
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .page-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 1.25rem 2rem;
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
</style>
