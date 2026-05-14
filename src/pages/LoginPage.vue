<template>
  <v-container fluid class="h-screen pa-0">
    <div class="left">
      <!-- 左上區塊 -->
      <div class="leftTop">
        <div class="title">
          <h2>小芋頭<br />內容管理系統</h2>
          <p>Tinytaro Content Management System</p>
        </div>
      </div>
      <!-- 左下區塊 -->
      <div class="leftBottom">
        <v-img max-width="600" aspect-ratio="16/9" cover src="/images/Login.svg"></v-img>
      </div>
    </div>
    <div class="right">
      <!-- 右上區塊 -->
      <div class="rightTop">
        <div class="title">
          <p>
            <i>
              Tinytaro Content <br />
              Management System</i
            >
          </p>
        </div>
      </div>
      <!-- 右下區塊 -->
      <div class="rightBottom">
        <v-card max-width="448" rounded="lg">
          <h2 class="text-center mb-6">管理員登入</h2>
          <form @keydown.enter.prevent="onLogin">
            <v-text-field
              v-model="username"
              class="mb-1"
              density="compact"
              placeholder="帳號"
              variant="outlined"
              autofocus
            ></v-text-field>
            <v-text-field
              v-model="password"
              class="mb-1"
              :append-inner-icon="visible ? 'visibility_off' : 'visibility'"
              :type="visible ? 'text' : 'password'"
              density="compact"
              placeholder="密碼"
              variant="outlined"
              @click:append-inner="visible = !visible"
            ></v-text-field>
            <v-btn size="large" variant="tonal" block @click="onLogin"> 登入 </v-btn>
          </form>
        </v-card>
      </div>
    </div>
  </v-container>
</template>
<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
// 數據
const username = ref('')
const password = ref('')
const visible = ref(false)

//登入邏輯
function onLogin() {
  console.log('點擊登入按鈕')
  auth.login(username.value, password.value)
}
</script>

<style scoped lang="scss">
.v-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #0a2b5c;

  .left {
    height: 100vh;

    .leftTop {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 50vh;

      .title {
        color: white;

        h2 {
          font-size: 96px;
          font-weight: 500;
          line-height: 125%;
        }

        p {
          font-size: 23px;
        }
      }
    }

    .leftBottom {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 50vh;

      .v-img {
        bottom: 0;
      }
    }
  }

  .right {
    height: 100vh;

    .rightTop {
      margin-bottom: 30px;
      width: 948px;
      height: 200px;

      .title p {
        color: #001d46;
        font-size: 99px;
        font-weight: 900;
        line-height: 95%;
      }
    }

    .rightBottom {
      margin-bottom: 10px;
      .v-card {
        padding: 80px 40px;

        h2 {
          font-size: 34px;
        }

        .v-btn {
          background: rgb(var(--v-theme-primary));
          color: white;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .v-container {
    display: flex;
    flex-direction: column;

    .leftBottom {
      display: none !important;
    }

    .rightTop {
      display: none;
    }

    .rightBottom {
      padding: 10px;
      .v-card {
        margin-bottom: 10px;
      }
    }
  }
}
</style>
