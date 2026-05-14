# JWT 自動登出機制說明

## 功能概述

本系統實現了完整的JWT自動登出機制，當token授權失敗或過期時會自動登出用戶並跳轉到登入頁面。

## 實現的功能

### 1. API 回應攔截器 (`src/plugins/api.js`)

- 自動攔截所有API請求的401錯誤
- 當收到401錯誤時自動清除認證狀態並跳轉到登入頁面
- 在請求前自動夾帶JWT token

### 2. Token 有效性檢查 (`src/stores/auth.js`)

- 新增 `isTokenValid` getter：檢查token是否有效（未過期）
- 新增 `getTokenRemainingTime` getter：獲取token剩餘時間（分鐘）
- 新增 `checkAndCleanInvalidToken` 方法：檢查並清理無效token
- 新增定時檢查機制：每分鐘檢查一次token狀態

### 3. 路由守衛增強 (`src/router/index.js`)

- 在每次路由切換時檢查token有效性
- 如果發現無效token，自動登出並跳轉到登入頁面

### 4. 應用程式啟動檢查 (`src/main.js`)

- 應用程式啟動時檢查token有效性
- 如果token有效，自動啟動token檢查機制

### 5. Token過期警告組件 (`src/components/TokenExpiryWarning.vue`)

- 當token即將在5分鐘內過期時顯示警告對話框
- 提供重新登入和稍後處理選項
- 顯示剩餘時間

## 觸發自動登出的情況

1. **API 401錯誤**：當向ASP.NET後端發送請求時收到401未授權錯誤
2. **Token過期**：JWT token的exp時間已過期
3. **Token解析錯誤**：JWT token格式不正確或無法解析
4. **路由切換檢查**：每次路由切換時發現無效token

## 使用方式

### 基本使用

系統會自動處理所有JWT相關的認證檢查，無需額外配置。

### 自定義檢查

```javascript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 手動檢查token有效性
if (!authStore.isTokenValid) {
  console.log('Token已過期')
}

// 獲取剩餘時間
const remainingMinutes = authStore.getTokenRemainingTime
console.log(`Token還剩 ${remainingMinutes} 分鐘`)

// 手動清理無效token
authStore.checkAndCleanInvalidToken()
```

## 配置選項

### 修改檢查頻率

在 `src/stores/auth.js` 的 `startTokenCheck` 方法中修改檢查間隔：

```javascript
// 預設每分鐘檢查一次 (60000ms)
this.tokenCheckInterval = setInterval(() => {
  // 檢查邏輯
}, 60000)
```

### 修改警告時間

在 `src/components/TokenExpiryWarning.vue` 中修改警告觸發時間：

```javascript
// 預設5分鐘前開始警告
const showWarning = computed(() => {
  const remainingMinutes = authStore.getTokenRemainingTime
  return remainingMinutes > 0 && remainingMinutes <= 5
})
```

## 安全特性

1. **自動清理**：無效token會被自動清除
2. **多重檢查**：API層、路由層、定時檢查多層防護
3. **用戶提醒**：token即將過期時主動提醒用戶
4. **錯誤處理**：完善的錯誤處理機制

## 注意事項

1. 確保ASP.NET後端在token無效時返回401狀態碼
2. JWT token必須包含 `exp` 字段（過期時間）
3. 系統會自動處理所有認證相關的錯誤，無需手動處理
4. 警告組件只在Dashboard頁面顯示，如需全局顯示請調整組件位置

## 測試建議

1. 測試token過期情況
2. 測試API 401錯誤情況
3. 測試token解析錯誤情況
4. 測試警告組件顯示情況
