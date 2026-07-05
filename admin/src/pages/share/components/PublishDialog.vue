<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="发布新探店"
    width="600px"
    top="5vh">
    <el-form :model="form" label-width="80px" label-position="left">
      <el-form-item label="店铺名称" required>
        <el-input v-model="form.name" placeholder="请输入店铺名称" />
      </el-form-item>

      <el-form-item label="菜品类型" required>
        <el-select
          v-model="form.category"
          placeholder="请选择或输入类型"
          filterable
          allow-create
          class="w-full">
          <el-option v-for="cat in CATEGORIES" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </el-form-item>

      <el-form-item label="人均消费">
        <el-input v-model="form.price" placeholder="例如: 85">
          <template #append>元/人</template>
        </el-input>
      </el-form-item>

      <el-form-item label="距离">
        <el-input v-model="form.distance" placeholder="例如: 1.5km" />
      </el-form-item>

      <el-form-item label="综合评分">
        <el-rate v-model="form.rating" allow-half class="mt-1" />
      </el-form-item>

      <el-form-item label="标签">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          placeholder="添加标签"
          class="w-full" />
      </el-form-item>

      <el-form-item label="封面图片">
        <el-input v-model="form.cover" placeholder="输入图片URL" />
      </el-form-item>

      <el-form-item label="探店评价" required>
        <el-input
          type="textarea"
          :rows="4"
          v-model="form.description"
          placeholder="分享你的就餐体验..." />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="submit">确认发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { reactive, watch } from 'vue';
  import { ElMessage } from 'element-plus';
  import type { ShareForm } from '../types';
  import { emptyPostForm } from '../types';

  const CATEGORIES = [
    '面馆',
    '咖啡/轻食',
    '川菜/快餐',
    '日料/寿司',
    '甜品/奶茶',
    '韩料',
    '素食',
    '火锅',
  ];

  const props = defineProps<{ visible: boolean }>();
  const emit = defineEmits<{
    'update:visible': [value: boolean];
    submit: [form: ShareForm];
  }>();

  const form = reactive<ShareForm>(emptyPostForm());

  // 每次打开重置表单
  watch(
    () => props.visible,
    (v) => {
      if (v) Object.assign(form, emptyPostForm());
    },
  );

  function submit() {
    if (!form.name || !form.category || !form.description) {
      ElMessage.warning('请填写店铺名称、菜品类型和探店评价');
      return;
    }
    emit('submit', { ...form });
    emit('update:visible', false);
  }
</script>

<style scoped>
  .w-full {
    width: 100%;
  }
</style>
