<template>
  <v-layout>
    <SideNav />
    <v-main>
      <router-view />
    </v-main>
    <!-- Token過期警告組件 -->
    <!-- <TokenExpiryWarning /> -->
  </v-layout>
</template>
<script setup>
import SideNav from '@/components/SideNavComponent.vue'
import TokenExpiryWarning from '@/components/TokenExpiryWarning.vue'
</script>
<style lang="scss">
.main-title {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  h2 {
    display: flex;
    height: 64px;
    align-items: center;
    color: rgb(var(--v-theme-primary));
    font-size: 23px;
    font-weight: 400;
  }
}
</style>
