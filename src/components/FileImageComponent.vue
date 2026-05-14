<template>
  <v-img
    :src="imgSrc"
    :lazy-src="fallbackImg"
    :error-src="fallbackImg"
    cover
    max-width="300"
    max-height="300"
    class="cursor-pointer"
    @click="openInNewTab"
  />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { getFileBlob } from '@/utils/getFileBlob'

const props = defineProps({
  fileId: { type: String, default: null },
})

const fallbackImg = '/images/No_Img.png'
const imgSrc = ref(fallbackImg)

let objectUrl = null

async function loadImage(id) {
  if (!id) {
    imgSrc.value = fallbackImg
    return
  }

  try {
    const res = await getFileBlob(id) // axios request
    const blob = res.data

    // 清除舊 URL 以免 memory leak
    if (objectUrl) URL.revokeObjectURL(objectUrl)

    objectUrl = URL.createObjectURL(blob)
    imgSrc.value = objectUrl
  } catch (err) {
    console.error(err)
    imgSrc.value = fallbackImg // 若抓不到 → fallback
  }
}

// 另開分頁
async function openInNewTab() {
  // 沒有 id → 開預設圖
  if (!props.fileId) {
    window.open(fallbackImg, '_blank')
    return
  }

  try {
    const res = await getFileBlob(props.fileId) // 再抓一次，這次是專門給新分頁用
    const blob = new Blob([res.data], {
      type: res.headers['content-type'] || 'image/png',
    })

    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // ⚠ 不要馬上 revoke，不然新分頁可能來不及載入
    // 可以用 setTimeout 稍微延後
    setTimeout(() => URL.revokeObjectURL(url), 60 * 1000)
  } catch (err) {
    console.error(err)
    window.open(fallbackImg, '_blank')
  }
}

watch(() => props.fileId, loadImage)

onMounted(() => loadImage(props.fileId))

onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})
</script>
