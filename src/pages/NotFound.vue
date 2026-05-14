<template>
  <div class="notfound">
    <v-app>
      <div class="fill-height d-flex flex-column justify-center align-center">
        <img class="mb-4" :max-width="155" aspect-ratio="1/1" cover src="/images/NotFound.svg" />
        <p class="mb-6">內容已被刪除或關閉</p>
        <v-btn color="primary" @click="$router.back()">返回上一頁</v-btn>
      </div>
    </v-app>
  </div>
</template>

<style scoped>
p {
  color: rgb(var(--v-theme-gray_100));
}
</style>
