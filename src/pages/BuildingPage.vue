<template>
  <div class="notfound">
    <v-app>
      <div class="fill-height d-flex flex-column justify-center align-center">
        <img class="mb-4" width="170px" src="/images/WarningTriangle.svg" />
        <h2 class="mb-6">網頁維修中</h2>
        <v-btn color="primary" @click="$router.back()">返回上一頁</v-btn>
      </div>
    </v-app>
  </div>
</template>

<script setup></script>

<style scoped>
h2 {
  color: rgb(var(--v-theme-warning));
}
</style>
