import { ref } from 'vue';
import { throttle } from '@/utils/tool';

// 视口宽高，不带滚动轴
const vw = ref(document.documentElement.clientWidth);
const vh = ref(document.documentElement.clientHeight);

window.addEventListener(
  'resize',
  throttle(() => {
    vw.value = document.documentElement.clientWidth;
    vh.value = document.documentElement.clientHeight;
  }, 200)
);

export default function useViewport() {
  return {
    vw,
    vh,
  };
}
