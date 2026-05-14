<template>
  <div v-if="items.length === 0">無推薦人</div>
  <v-treeview
    v-else
    :indent-lines="true"
    :items="items"
    item-title="referredName"
    item-value="referredAccountGuid"
    item-children="children"
    activatable
    :load-children="loadChildren"
    :separate-roots="true"
  >
    <template #title="{ item }">
      <div class="d-flex align-center ga-2">
        <v-chip>{{ item.referredEmail }}</v-chip>
        <span>{{ item.referredName }}</span>
      </div>
    </template>
  </v-treeview>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useDialogStore } from '@/stores/dialog'
import api from '@/plugins/api'

const props = defineProps({
  rootGuid: { type: String, required: true },
})

const dialog = useDialogStore()
const items = ref([])

// 避免同一個節點展開時重複打 API
const childrenLoaded = ref(new Set())

function mapRowToItem(r) {
  const hasKids = !!r.hasChildren
  return {
    ...r,
    // ✅ 沒孩子就 null -> 不會出現展開箭頭
    // ✅ 有孩子先給 [] -> 代表可展開，展開時再載入
    children: hasKids ? [] : null,
  }
}

// 打 API 拿某個 guid 的下線（回傳 array）
async function fetchChildren(guid) {
  const { data } = await api.get('/OrgTree/children', { params: { referrerGuid: guid } })

  // ✅ 兼容後端回 object / array
  const rows = Array.isArray(data) ? data : data ? [data] : []
  return rows
}

// ✅ Treeview 會在你展開節點時呼叫這個函式
async function loadChildren(item) {
  const guid = item.referredAccountGuid

  // 沒孩子：直接告訴 treeview 沒得載
  if (!item.hasChildren) {
    item.children = null
    return []
  }

  // 已載入過：直接回傳現有 children
  if (childrenLoaded.value.has(guid)) {
    return item.children || []
  }

  dialog.showLoading()
  try {
    const rows = await fetchChildren(guid)

    // 若後端回空，代表其實沒有孩子 -> 降級成 leaf，箭頭消失
    if (!rows.length) {
      item.hasChildren = false
      item.children = null
      childrenLoaded.value.add(guid)
      return []
    }

    const children = rows.map(mapRowToItem)

    // ✅ 關鍵：塞回「被展開的那個節點」底下
    item.children = children
    childrenLoaded.value.add(guid)

    return children
  } catch (error) {
    dialog.showAxiosError('查詢錯誤', error)
    // 失敗時不要讓它卡在可展開但沒內容
    return []
  } finally {
    dialog.hideLoading()
  }
}

// 初始載入 root 的第一層
onMounted(async () => {
  dialog.showLoading()
  try {
    const rows = await fetchChildren(props.rootGuid)
    items.value = rows.map(mapRowToItem)
  } catch (error) {
    dialog.showAxiosError('查詢錯誤', error)
  } finally {
    dialog.hideLoading()
  }
})
</script>
