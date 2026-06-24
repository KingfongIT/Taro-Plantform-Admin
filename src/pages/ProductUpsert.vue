<template>
  <v-form id="productForm" ref="form" @submit.prevent="onSubmitProduct" class="h-100">
    <div class="page-wrapper">
      <v-container class="pb-0 flex-grow-0 flex-shrink-0">
            <div class="main-title d-flex justify-space-between">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-btn
                    :width="100"
                    class="mr-4"
                    prepend-icon="arrow_back"
                    variant="tonal"
                    @click="$router.back()"
                    >返回</v-btn
                  >
                  <!-- <v-btn @click="checks">檢查</v-btn> -->
                  <h2>商品詳情</h2>
                </div>
                <v-btn
                  color="primary"
                  v-if="isEdit"
                  :prepend-icon="'edit'"
                  variant="flat"
                  form="productForm"
                  type="submit"
                  data-mode="edit"
                >
                  {{ '儲存' }}</v-btn
                >
                <v-btn
                  v-else
                  color="primary"
                  :prepend-icon="'add'"
                  variant="flat"
                  form="productForm"
                  type="submit"
                  data-mode="create"
                >
                  {{ '儲存' }}</v-btn
                >
              </div>
            </div>

            <v-tabs v-model="tab" color="primary" :style="{ borderBottom: '1px solid #e0e0e0' }">
              <v-tab width="200" value="setting" text="商品設定"></v-tab>
              <v-tab width="200" value="spectype" text="商品規格"></v-tab>
            </v-tabs>
          </v-container>

          <v-tabs-window v-model="tab" class="flex-grow-1 overflow-hidden">
            <!-- 商品設定 -->
            <v-tabs-window-item value="setting" eager ref="sectionSetting" class="h-100 overflow-y-auto">
              <v-container class="main">
                <h3 class="mb-4">商品設定</h3>

                <v-row>
                  <!-- 左欄 -->
                  <v-col cols="8" class="d-flex flex-column ga-6">
                    <!-- 基本設定 -->
                    <v-card class="pa-4">
                      <h4 class="mb-4">基本設定</h4>

                      <v-text-field
                        v-model="productModel.name"
                        :rules="[rules.required]"
                        label="商品名稱"
                      />

                      <v-row>
                        <v-col>
                          <v-autocomplete
                            v-model="selectedCategory"
                            :rules="[rules.required]"
                            :items="categoryOption"
                            item-title="name"
                            item-value="id"
                            label="商品分類"
                            return-object
                          />
                        </v-col>

                        <v-col>
                          <v-text-field
                            v-model="productModel.code"
                            :rules="[rules.required]"
                            :disabled="!selectedCategory"
                            label="商品代碼"
                          />
                        </v-col>
                      </v-row>
                    </v-card>

                    <!-- 預設分佣模板 -->
                    <v-card>
                      <v-card-title
                        ><h4>預設分佣模板</h4>
                        <span class="text-error text-caption"
                          >*這裡一變動商品規格內容會全部更新</span
                        ></v-card-title
                      >
                      <v-card-text>
                        <v-autocomplete
                          v-model="productModel.revenueShareSchemeId"
                          :items="revenueTemplateOption"
                          item-value="id"
                          item-title="schemeName"
                          placeholder="選擇分佣模板"
                        ></v-autocomplete>
                        <v-card color="primary" variant="outlined">
                          <v-card-title class="d-flex align-end">
                            <span class="mr-4">{{
                              revenueSchemeDetail?.schemeName ?? '模板名稱'
                            }}</span>
                            <div>
                              <div class="text-caption">
                                <span>創建時間:</span>
                                {{
                                  revenueSchemeDetail?.updatedAt
                                    ? useDateFormat(
                                        revenueSchemeDetail.updatedAt,
                                        'YYYY-MM-DD HH:mm',
                                      )
                                    : ''
                                }}
                              </div>
                            </div>
                          </v-card-title>
                          <v-card-text>
                            <v-table density="compact">
                              <thead class="bg-secondary">
                                <tr>
                                  <th class="text-left">項目</th>
                                  <th class="text-left">係數</th>
                                  <th class="text-left">試算</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>行政費</td>
                                  <td v-if="revenueSchemeDetail?.adminFeeType == 'PERCENT'">
                                    {{
                                      revenueSchemeDetail?.adminFeeValue
                                        ? revenueSchemeDetail?.adminFeeValue + '%'
                                        : '-'
                                    }}
                                  </td>
                                  <td v-else>
                                    {{
                                      revenueSchemeDetail?.adminFeeValue
                                        ? revenueSchemeDetail?.adminFeeValue
                                        : '-'
                                    }}
                                  </td>
                                  <td>-</td>
                                </tr>

                                <tr>
                                  <td>公司</td>
                                  <td>
                                    {{
                                      revenueSchemeDetail?.companyValue
                                        ? revenueSchemeDetail?.companyValue + '%'
                                        : '-'
                                    }}
                                  </td>
                                  <td>-</td>
                                </tr>

                                <tr>
                                  <td>乙方</td>
                                  <td>
                                    {{ formatShareValue(revenueSchemeDetail?.partnerShareValue, revenueSchemeDetail?.partnerShareType) }}
                                  </td>
                                  <td>-</td>
                                </tr>

                                <tr>
                                  <td>發放組織</td>
                                  <td v-if="revenueSchemeDetail?.isRevenueShare">
                                    <v-icon>check</v-icon>
                                  </td>
                                  <td v-else>-</td>
                                  <td>-</td>
                                </tr>

                                <tr>
                                  <td>管理費</td>
                                  <td v-if="revenueSchemeDetail?.managementFeeType == 'PERCENT'">
                                    {{
                                      revenueSchemeDetail?.managementFeeValue
                                        ? revenueSchemeDetail?.managementFeeValue + '%'
                                        : '-'
                                    }}
                                  </td>
                                  <td v-else>
                                    {{
                                      revenueSchemeDetail?.managementFeeValue
                                        ? revenueSchemeDetail?.managementFeeValue
                                        : '-'
                                    }}
                                  </td>
                                  <td>-</td>
                                </tr>

                                <tr>
                                  <td>使用費</td>
                                  <td v-if="revenueSchemeDetail?.usageFeeType == 'PERCENT'">
                                    {{
                                      revenueSchemeDetail?.usageFeeValue
                                        ? revenueSchemeDetail?.usageFeeValue + '%'
                                        : '-'
                                    }}
                                  </td>
                                  <td v-else>
                                    {{
                                      revenueSchemeDetail?.usageFeeValue
                                        ? revenueSchemeDetail?.usageFeeValue
                                        : '-'
                                    }}
                                  </td>
                                  <td>-</td>
                                </tr>

                                <tr>
                                  <td>顧問師</td>
                                  <td v-if="revenueSchemeDetail?.consultantType == 'PERCENT'">
                                    {{
                                      revenueSchemeDetail?.consultantValue
                                        ? revenueSchemeDetail?.consultantValue + '%'
                                        : '-'
                                    }}
                                  </td>
                                  <td v-else>
                                    {{
                                      revenueSchemeDetail?.consultantValue
                                        ? revenueSchemeDetail?.consultantValue
                                        : '-'
                                    }}
                                  </td>
                                  <td>-</td>
                                </tr>

                                <tr>
                                  <td>講師</td>
                                  <td v-if="revenueSchemeDetail?.lecturerType == 'PERCENT'">
                                    {{
                                      revenueSchemeDetail?.lecturerValue
                                        ? revenueSchemeDetail?.lecturerValue + '%'
                                        : '-'
                                    }}
                                  </td>
                                  <td v-else>
                                    {{
                                      revenueSchemeDetail?.lecturerValue
                                        ? revenueSchemeDetail?.lecturerValue
                                        : '-'
                                    }}
                                  </td>
                                  <td>-</td>
                                </tr>
                              </tbody>
                            </v-table>
                          </v-card-text>
                        </v-card>
                      </v-card-text>
                    </v-card>

                    <!-- 價格 -->
                    <v-card class="pa-4">
                      <h4 class="mb-4">商品費用</h4>
                      <span class="text-error text-caption"
                        >*原價輸入0，前台被槓掉的價格則不會顯示</span
                      >
                      <v-row>
                        <v-col cols="6">
                          <v-text-field
                            v-model="productModel.price"
                            :rules="[rules.required, rules.nonNegative]"
                            type="number"
                            min="0"
                            prefix="$"
                            label="原價"
                          />
                        </v-col>
                        <v-col cols="6">
                          <v-text-field
                            v-model="productModel.discountPrice"
                            :rules="[rules.required, rules.nonNegative]"
                            type="number"
                            min="0"
                            prefix="$"
                            label="售價"
                          />
                        </v-col>
                      </v-row>
                    </v-card>

                    <!-- 付款方式 -->
                    <v-card class="pa-4">
                      <h4 class="mb-4">付款方式</h4>
                      <v-input
                        :model-value="selectedPaymentMethod"
                        :rules="[rules.atLeastOne('請至少選一種付款方式')]"
                        hide-details="auto"
                        validate-on="submit"
                      >
                        <template #default>
                          <v-row>
                            <v-col cols="12" md="6" v-for="m in paymentMethodOption" :key="m.id">
                              <v-checkbox
                                color="primary"
                                :label="m.name"
                                :value="m.id"
                                v-model="selectedPaymentMethod"
                                hide-details
                              />
                            </v-col>
                          </v-row>
                        </template>
                      </v-input>
                    </v-card>

                    <!-- 商品內容 -->
                    <v-card class="pa-4">
                      <h4 class="mb-4">商品內容</h4>

                      <v-checkbox
                        v-model="productModel.isHtml"
                        color="primary"
                        label="程式碼編輯"
                        density="compact"
                      ></v-checkbox>

                      <v-textarea
                        v-model="productModel.description"
                        :rules="[rules.required]"
                        rows="20"
                        label="內容"
                        color="primary"
                      />
                    </v-card>
                  </v-col>

                  <!-- 右欄 -->
                  <v-col cols="4" class="d-flex flex-column ga-6">
                    <!-- 封面 -->
                    <v-card class="pa-4">
                      <h4 class="mb-4">商品封面</h4>
                      <v-file-input
                        v-model="file"
                        accept="image/*"
                        prepend-icon="add"
                        showSize
                        clearable
                        label="選擇圖片或拖曳到此"
                        :rules="fileRules"
                        @update:modelValue="onFileChange"
                      />
                      <div class="text-caption mt-2">僅限：圖檔，單檔上限 {{ 5 }}MB</div>
                      <v-expand-transition>
                        <div v-if="previewUrl" class="mt-4">
                          <v-card elevation="1">
                            <v-img :src="previewUrl" :aspect-ratio="1" height="260" />
                            <div class="pa-3 d-flex align-center">
                              <div class="text-truncate">
                                {{ file?.name }}
                                <span class="text-medium-emphasis"
                                  >（{{ formatSize(file?.size) }}）</span
                                >
                              </div>
                              <v-spacer />
                              <v-btn size="small" variant="text" @click="removeFile">移除</v-btn>
                            </div>
                          </v-card>
                        </div>
                      </v-expand-transition>
                    </v-card>

                    <!-- 狀態 -->
                    <v-card class="pa-4">
                      <h4 class="mb-2">商品狀態</h4>
                      <v-radio-group v-model="productModel.isActive" hide-details>
                        <v-radio label="上架" :value="true" color="primary" />
                        <v-radio label="下架" :value="false" color="primary" />
                      </v-radio-group>
                    </v-card>

                    <!-- 商品表單 -->
                    <v-card class="pa-4">
                      <h4 class="mb-2">商品表單</h4>
                      <v-checkbox
                        v-model="productModel.isForm"
                        label="此商品須填寫表單 "
                        color="primary"
                        hide-details
                      />
                    </v-card>

                    <!-- 警語 -->
                    <v-card class="pa-4">
                      <h4 class="mb-2">商品警語</h4>
                      <v-textarea
                        v-model="productModel.notice"
                        label="警語內容"
                        color="primary"
                        hide-details
                      />
                    </v-card>

                    <!-- 標籤 -->
                    <v-card class="pa-4">
                      <h4 class="mb-2">商品標籤</h4>
                      <v-text-field
                        v-model="inputTag"
                        label="建立標籤"
                        color="primary"
                        @keydown.enter.stop.prevent="addNewTag"
                        hide-details
                      >
                        <template #append-inner>
                          <v-icon @click.stop.prevent="addNewTag" color="primary"
                            >add_circle</v-icon
                          >
                        </template>
                      </v-text-field>

                      <div class="mt-2 d-flex ga-1 flex-wrap">
                        <v-chip
                          v-for="(tag, i) in list_tag"
                          :key="`${tag}-${i}`"
                          color="primary"
                          variant="outlined"
                          closable
                          @click:close.stop="removeTag(i)"
                        >
                          {{ tag }}
                        </v-chip>
                      </div>
                    </v-card>

                    <!-- 備註 -->
                    <v-card class="pa-4">
                      <h4 class="mb-2">商品備註</h4>
                      <v-textarea
                        v-model="productModel.note"
                        label="備註"
                        color="primary"
                        hide-details
                      />
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </v-tabs-window-item>

            <!-- 商品規格 -->
            <v-tabs-window-item value="spectype" eager ref="sectionSpecType" class="h-100">
              <v-container fluid class="h-100">
                <v-row class="h-100">
                  <!-- 左：規格 -->
                  <v-col cols="4" class="h-100 d-flex flex-column overflow-y-auto overflow-x-hidden">
                    <div class="mb-5 d-flex justify-space-between align-center">
                      <span class="text-h5">商品規格</span>
                      <v-btn
                        v-if="specTypes.length != 2"
                        variant="flat"
                        color="primary"
                        @click="addSpecType"
                        >新增規格</v-btn
                      >
                    </div>

                    <Draggable
                      :list="specTypes"
                      :animation="180"
                      handle=".type-handle"
                      item-key="clientTypeId"
                      @change="onTypesChange"
                    >
                      <template #item="{ element: typeElement, index: typeIndex }">
                        <v-col cols="12">
                          <v-card variant="flat" :color="specColor(typeIndex)" class="w-100">
                            <div class="d-flex justify-space-between align-center pa-3">
                              <div class="d-flex align-center flex-grow-1">
                                <v-btn
                                  tabindex="-1"
                                  icon="drag_indicator"
                                  class="type-handle"
                                  variant="text"
                                  size="x-small"
                                />
                                <v-textarea
                                  v-model="typeElement.specTypeName"
                                  auto-grow
                                  rows="1"
                                  filled
                                  :rules="[rules.required]"
                                  density="compact"
                                  variant="outlined"
                                  width="150"
                                  hide-details="auto"
                                />
                              </div>
                              <v-btn
                                tabindex="-1"
                                icon="delete"
                                variant="plain"
                                :disabled="specTypes.length <= 1"
                                @click="removeSpecType(typeIndex)"
                              />
                            </div>

                            <v-card-text>
                              <v-btn
                                class="mb-2 w-100"
                                prepend-icon="add"
                                color="primary"
                                variant="outlined"
                                @click="addSpecValue(typeIndex)"
                                >新增</v-btn
                              >

                              <Draggable
                                :list="typeElement.specValues"
                                :animation="180"
                                handle=".value-handle"
                                class="d-flex flex-column ga-1"
                                item-key="clientValueId"
                                @change="(e) => onValuesChange(typeIndex, e)"
                              >
                                <template #item="{ element: valueElement, index: valueIndex }">
                                  <v-card variant="flat" class="pa-1">
                                    <div class="d-flex align-center">
                                      <v-btn
                                        tabindex="-1"
                                        size="x-small"
                                        icon="drag_indicator"
                                        class="value-handle"
                                        variant="text"
                                      />
                                      <v-textarea
                                        v-model="valueElement.specValueName"
                                        auto-grow
                                        rows="1"
                                        filled
                                        :rules="[rules.required]"
                                        density="compact"
                                        variant="outlined"
                                        hide-details="auto"
                                        width="150"
                                      />
                                      <v-btn
                                        tabindex="-1"
                                        icon="delete"
                                        variant="plain"
                                        :disabled="typeElement.specValues.length <= 1"
                                        @click="removeSpecValue(typeIndex, valueIndex)"
                                      />
                                    </div>
                                  </v-card>
                                </template>
                              </Draggable>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </template>
                    </Draggable>
                  </v-col>

                  <!-- 右：變體 -->
                  <v-col
                    cols="8"
                    class="h-100 d-flex flex-column"
                    style="background: rgba(var(--v-theme-secondary))"
                  >
                    <div class="d-flex justify-space-between align-center mb-3">
                      <span class="text-h5">商品內容</span>
                      <div class="d-flex ga-2">
                        <v-text-field
                          v-model.number="batchValue"
                          type="number"
                          density="compact"
                          variant="underlined"
                          color="primary"
                          label="輸入更改數值"
                          hide-details
                          style="max-width: 160px"
                        />
                        <v-btn variant="outlined" color="primary" @click="batchSet('price')"
                          >修改全部價格</v-btn
                        >
                        <v-btn variant="outlined" color="primary" @click="batchSet('stockQty')"
                          >修改全部庫存</v-btn
                        >
                      </div>
                    </div>

                    <div class="flex-grow-1 overflow-y-auto overflow-x-hidden">
                      <v-row class="ma-0">
                        <v-col v-for="v in variants" :key="v.key" cols="12" class="px-0">
                          <v-card
                            variant="outlined"
                            class="variant-card"
                            :class="{ 'error-card': invalidVariantKeys.has(v.key) }"
                            :ref="(el) => setVariantCardRef(el, v.key)"
                            @click="openVariant(v)"
                          >
                            <v-card-item class="py-3">
                              <v-row no-gutters align="center">
                                <!-- 左：規格資訊 -->
                                <v-col cols="6" class="d-flex flex-column ga-2">
                                  <div class="d-flex align-center justify-space-between mb-1">
                                    <div class="d-flex flex-column">
                                      <span class="text-caption font-weight-medium">
                                        規格ID：{{ v.variantId ?? '—' }}
                                      </span>
                                      <span class="text-caption text-medium-emphasis">
                                        SKU：{{ v.sku || '—' }}
                                      </span>
                                    </div>
                                    <v-chip
                                      :color="v.isActive ? 'success' : 'grey'"
                                      size="small"
                                      variant="tonal"
                                    >
                                      {{ v.isActive ? '上架' : '下架' }}
                                    </v-chip>
                                  </div>

                                  <div class="d-flex flex-column ga-1">
                                    <v-chip size="small" :color="specColor(0)" variant="flat">
                                      {{ variantLabel(v, 'A') || '—' }}
                                    </v-chip>
                                    <v-chip
                                      v-if="v.specValueBId != null || v.specValueBKey"
                                      size="small"
                                      :color="specColor(1)"
                                      variant="flat"
                                    >
                                      {{ variantLabel(v, 'B') || '—' }}
                                    </v-chip>
                                  </div>
                                </v-col>

                                <!-- 中：庫存 -->
                                <v-col cols="2" class="text-body-2 text-center">
                                  <div class="text-caption mb-1">庫存數量</div>
                                  <div class="text-h6">
                                    {{ v.isStockQty ? v.stockQty : '--' }}
                                  </div>
                                </v-col>

                                <!-- 中右：費用 -->
                                <v-col cols="2" class="text-body-2 text-center">
                                  <div class="text-caption">費用</div>
                                  <div class="text-h6 text-primary">NT. {{ v.price ?? '--' }}</div>
                                </v-col>

                                <!-- 右：分潤模板 -->
                                <v-col cols="2" class="text-body-2 text-center">
                                  <div class="text-caption mb-1">分潤模板</div>
                                  <div class="text-h6">
                                    {{ schemeNameById(v.revenueShareSchemeId) || '未選擇' }}
                                  </div>
                                </v-col>
                              </v-row>
                            </v-card-item>

                            <v-card-actions>
                              <v-spacer />
                              <v-btn size="small" variant="text" @click.stop="openVariant(v)"
                                >設定</v-btn
                              >
                            </v-card-actions>
                          </v-card>
                        </v-col>
                      </v-row>
                    </div>
                  </v-col>
                </v-row>
              </v-container>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-form>

    <!-- 變體設定 Drawer -->
    <!-- :key="tempVariant?.key || 'no-variant'" -->
    <v-navigation-drawer
      v-model="variantDialog"
      location="right"
      temporary
      :width="680"
      class="variant-drawer scrollable-body-drawer"
      persistent
    >
          <div class="d-flex flex-column h-100">
            <v-toolbar flat class="flex-grow-0 flex-shrink-0">
              <v-toolbar-title class="font-weight-medium">規格內容</v-toolbar-title>
              <v-spacer />
            </v-toolbar>
            <v-divider class="flex-grow-0 flex-shrink-0" />

            <v-form
              v-if="tempVariant"
              :key="tempVariant.key"
              ref="variantForm"
              validate-on="input"
              class="d-flex flex-column flex-grow-1 overflow-hidden"
            >
              <v-container class="flex-grow-1 overflow-y-auto pt-4">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div>
                    <v-chip class="mr-2 mb-2" color="orange-lighten-5" variant="flat">{{
                      selLabels[0]
                    }}</v-chip>
                    <v-chip class="mb-2" v-if="selLabels[1]" color="green-lighten-5" variant="flat">{{
                      selLabels[1]
                    }}</v-chip>
                  </div>
                </div>

                <div class="d-flex flex-column ga-4">
              <!-- 基本資訊 -->
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">基本資訊</v-card-title>
                <v-divider />
                <v-card-text>
                  <v-row>
                    <v-col cols="8">
                      <v-text-field
                        v-model="tempVariant.sku"
                        label="SKU（商品編號）"
                        density="comfortable"
                        :rules="[rules.required]"
                        clearable
                      />
                    </v-col>
                    <v-col cols="4">
                      <v-switch
                        v-model="tempVariant.isActive"
                        inset
                        color="primary"
                        hide-details
                        label="上架"
                      />
                    </v-col>
                  </v-row>

                  <p class="text-error">*原價輸入0，前台被槓掉的價格則不會顯示</p>
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="tempVariant.price"
                        type="number"
                        min="0"
                        prefix="$"
                        label="原價"
                        density="comfortable"
                        :rules="[rules.required, rules.nonNegative]"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="tempVariant.discountPrice"
                        type="number"
                        min="0"
                        prefix="$"
                        label="售價"
                        density="comfortable"
                        :rules="[rules.required, rules.nonNegative]"
                        clearable
                      />
                    </v-col>
                  </v-row>

                  <p>庫存管理</p>
                  <v-row dense class="align-center">
                    <v-col cols="12" class="d-flex">
                      <v-switch
                        v-model="tempVariant.isStockQty"
                        color="primary"
                        inset
                        hide-details
                        label="啟用庫存管理"
                        @update:modelValue="onToggleStock"
                        class="mr-4"
                      />
                      <v-text-field
                        v-model.number="tempVariant.stockQty"
                        :disabled="!tempVariant.isStockQty"
                        type="number"
                        min="0"
                        label="庫存數量"
                        density="comfortable"
                        :rules="[(v) => !tempVariant.isStockQty || v >= 0 || '不可為負數']"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- 商品合約 -->
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">商品合約</v-card-title>
                <v-divider />
                <v-card-text>
                  <v-checkbox
                    v-model="tempVariant.isContract"
                    color="primary"
                    class="mb-2"
                    label="此商品須同意合約"
                    density="compact"
                    hide-details
                  ></v-checkbox>
                  <div v-if="tempVariant.isContract">
                    <v-text-field
                      v-model="tempVariant.contractName"
                      placeholder="合約名稱"
                      density="compact"
                    ></v-text-field>
                    <v-text-field
                      v-model="tempVariant.contractUrl"
                      placeholder="合約連結"
                      density="compact"
                      append-inner-icon="link"
                    ></v-text-field>
                    <v-textarea
                      v-model="tempVariant.contractDescription"
                      placeholder="合約說明"
                    ></v-textarea>
                  </div>
                </v-card-text>
              </v-card>

              <!-- 商品注意事項 -->
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">商品注意事項</v-card-title>
                <v-divider />
                <v-card-text>
                  <v-text-field
                    v-for="(warning, index) in tempVariant.warnings"
                    :key="index"
                    v-model="tempVariant.warnings[index]"
                    :label="`注意事項 ${index + 1}`"
                    hide-details
                    class="mb-2"
                  >
                    <!-- 右邊放刪除按鈕 -->
                    <template #append>
                      <v-btn
                        color="secondary"
                        icon="delete"
                        variant="flat"
                        @click="removeNote(index)"
                        v-if="tempVariant.warnings.length > 1"
                      />
                    </template>
                  </v-text-field>

                  <!-- 新增一個注意事項 -->
                  <v-btn prepend-icon="add" variant="text" color="primary" @click="addWarning">
                    新增
                  </v-btn>
                </v-card-text>
              </v-card>

              <!-- 分潤設定（略做排版精簡，樣式一致） -->
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">預設分佣模板</v-card-title>
                <v-divider />
                <v-card>
                  <v-card-text>
                    <v-autocomplete
                      v-model="tempVariant.revenueShareSchemeId"
                      :items="revenueTemplateOption"
                      item-value="id"
                      item-title="schemeName"
                      :rules="[rules.required]"
                      placeholder="選擇分佣模板"
                    ></v-autocomplete>
                    <v-card color="primary" variant="outlined">
                      <v-card-title class="d-flex align-end">
                        <span class="mr-4">{{
                          tempRevenueTemplate?.schemeName ?? '模板名稱'
                        }}</span>
                        <div>
                          <div class="text-caption">
                            <span>創建時間:</span>
                            {{
                              tempRevenueTemplate?.updatedAt
                                ? useDateFormat(tempRevenueTemplate?.updatedAt, 'YYYY-MM-DD HH:mm')
                                : ''
                            }}
                          </div>
                        </div>
                      </v-card-title>
                      <v-card-text>
                        <v-table density="compact">
                          <thead class="bg-secondary">
                            <tr>
                              <th class="text-left">項目</th>
                              <th class="text-left">係數</th>
                              <th class="text-left">試算</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>行政費</td>
                              <td v-if="tempRevenueTemplate?.adminFeeType == 'PERCENT'">
                                {{
                                  tempRevenueTemplate?.adminFeeValue
                                    ? tempRevenueTemplate?.adminFeeValue + '%'
                                    : '-'
                                }}
                              </td>
                              <td v-else>
                                {{
                                  tempRevenueTemplate?.adminFeeValue
                                    ? tempRevenueTemplate?.adminFeeValue
                                    : '-'
                                }}
                              </td>
                              <td>-</td>
                            </tr>

                            <tr>
                              <td>公司</td>
                              <td>
                                {{
                                  tempRevenueTemplate?.companyValue
                                    ? tempRevenueTemplate?.companyValue + '%'
                                    : '-'
                                }}
                              </td>
                              <td>-</td>
                            </tr>

                            <tr>
                              <td>乙方</td>
                              <td>
                                {{ formatShareValue(tempRevenueTemplate?.partnerShareValue, tempRevenueTemplate?.partnerShareType) }}
                              </td>
                              <td>-</td>
                            </tr>

                            <tr>
                              <td>發放組織</td>
                              <td v-if="tempRevenueTemplate?.isRevenueShare">
                                <v-icon>check</v-icon>
                              </td>
                              <td v-else>-</td>
                              <td>-</td>
                            </tr>

                            <tr>
                              <td>管理費</td>
                              <td v-if="tempRevenueTemplate?.managementFeeType == 'PERCENT'">
                                {{
                                  tempRevenueTemplate?.managementFeeValue
                                    ? tempRevenueTemplate?.managementFeeValue + '%'
                                    : '-'
                                }}
                              </td>
                              <td v-else>
                                {{
                                  tempRevenueTemplate?.managementFeeValue
                                    ? tempRevenueTemplate?.managementFeeValue
                                    : '-'
                                }}
                              </td>
                              <td>-</td>
                            </tr>

                            <tr>
                              <td>使用費</td>
                              <td v-if="tempRevenueTemplate?.usageFeeType == 'PERCENT'">
                                {{
                                  tempRevenueTemplate?.usageFeeValue
                                    ? tempRevenueTemplate?.usageFeeValue + '%'
                                    : '-'
                                }}
                              </td>
                              <td v-else>
                                {{
                                  tempRevenueTemplate?.usageFeeValue
                                    ? tempRevenueTemplate?.usageFeeValue
                                    : '-'
                                }}
                              </td>
                              <td>-</td>
                            </tr>

                            <tr>
                              <td>顧問師</td>
                              <td v-if="tempRevenueTemplate?.consultantType == 'PERCENT'">
                                {{
                                  tempRevenueTemplate?.consultantValue
                                    ? tempRevenueTemplate?.consultantValue + '%'
                                    : '-'
                                }}
                              </td>
                              <td v-else>
                                {{
                                  tempRevenueTemplate?.consultantValue
                                    ? tempRevenueTemplate?.consultantValue
                                    : '-'
                                }}
                              </td>
                              <td>-</td>
                            </tr>

                            <tr>
                              <td>講師</td>
                              <td v-if="tempRevenueTemplate?.lecturerType == 'PERCENT'">
                                {{
                                  tempRevenueTemplate?.lecturerValue
                                    ? tempRevenueTemplate?.lecturerValue + '%'
                                    : '-'
                                }}
                              </td>
                              <td v-else>
                                {{
                                  tempRevenueTemplate?.lecturerValue
                                    ? tempRevenueTemplate?.lecturerValue
                                    : '-'
                                }}
                              </td>
                              <td>-</td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-card-text>
                    </v-card>
                  </v-card-text>
                </v-card>
              </v-card>
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">等級設定</v-card-title>
                <v-divider />
                <v-card-text>
                  <v-number-input
                    v-model="tempVariant.level"
                    controlVariant="split"
                    defaultValue="0"
                    min="0"
                    density="comfortable"
                    hide-details
                  />
                </v-card-text>
              </v-card>
                </div>
              </v-container>

              <v-divider class="flex-grow-0 flex-shrink-0" />
              <div class="d-flex justify-end align-center pa-4 bg-white flex-grow-0 flex-shrink-0">
                <v-btn variant="text" class="mr-2" @click="variantDialog = false">取消</v-btn>
                <v-btn color="primary" @click="saveVariant">儲存</v-btn>
              </div>
            </v-form>
          </div>
        </v-navigation-drawer>
</template>

<script setup>
import Draggable from 'vuedraggable'
import { useRoute, useRouter } from 'vue-router'
import { onBeforeUnmount, onMounted, ref, reactive, watch, computed, nextTick, toRaw } from 'vue'
import api from '@/plugins/api'
import { useDialogStore } from '@/stores/dialog'
import { useProductRules } from '@/utils/rules'
import router from '@/router'
import { useDateFormat } from '@/utils/formatDate'

//檢查用
// function checks() {
//   console.log('商品明細', productModel.value)
//   // console.log('選擇的付款方式', selectedPaymentMethod.value)
//   // console.log('選擇的類別', selectedCategory.value)
//   // console.log('標籤', list_tag.value)
//   // console.log('類別清單', categoryOption.value)
//   // console.log('檔案', file.value)
//   // console.log('規格種類', specTypes.value)
//   console.log('變體', variants.value)
//   // console.log(invalidVariantKeys.value)
//   // console.log(selectedRevenueTemplate?.value)
//   // console.log(revenueSchemeDetail.value)
//   // console.log(warningJson.value)
// }

/* 變體的注意事項 */
const addWarning = () => {
  if (!Array.isArray(tempVariant.value.warnings)) {
    tempVariant.value.warnings = ['']
  } else {
    tempVariant.value.warnings.push('')
  }
}

const removeNote = (index) => {
  if (!Array.isArray(tempVariant.value.warnings)) return

  if (tempVariant.value.warnings.length === 1) {
    tempVariant.value.warnings[0] = ''
    return
  }

  tempVariant.value.warnings.splice(index, 1)
}

const route = useRoute()
const dialog = useDialogStore()
const rules = useProductRules()

const isContract = ref(false)

const tab = ref('setting')
const isEdit = ref(false)

/* 分潤模板 */
const revenueSchemeDetail = ref(null) // 從後端拿回來的單一模板內容
const loadingScheme = ref(false)

const selectedCategory = ref()
const selectedPaymentMethod = ref([])
const list_tag = ref([])
const productModel = ref({
  id: null,
  code: '',
  name: '',
  price: null,
  discountPrice: null,
  revenueShareSchemeId: null,
  isHtml: false,
  isForm: false,
  description: '',
  notice: '',
  coverId: null,
  note: '',
  isActive: true,
})

const variantForm = ref(null)
const tempRevenueTemplate = ref(null)

watch(
  () => productModel.value.revenueShareSchemeId,
  async (id) => {
    if (!id) {
      revenueSchemeDetail.value = null
      return
    }
    await fetchRevenueTemplateId(id)

    variants.value.forEach((v) => {
      if (!v.revenueShareSchemeId) {
        v.revenueShareSchemeId = id
      }
    })
  },
  { immediate: true }, // 編輯模式一進來就會抓一次
)

const specTypes = ref([
  {
    clientTypeId: crypto.randomUUID(),
    specTypeId: null,
    productId: null,
    specTypeName: '',
    sortOrder: 0,
    specValues: [
      {
        clientValueId: crypto.randomUUID(),
        specValueId: null,
        specTypeId: null,
        specValueName: '',
        sortOrder: 0,
      },
    ],
  },
])

const variants = ref([])

const revenueTemplateOption = ref([])
const paymentMethodOption = ref([])
const categoryOption = ref([])

/*============= 重新定義code ============= */
watch(
  selectedCategory,
  (newCat, oldCat) => {
    if (!newCat) return

    const newPrefix = (newCat.code ?? '').trim()
    const oldPrefix = (oldCat?.code ?? '').trim()
    const cur = productModel.value.code?.trim() ?? ''

    // 規則：
    // 1) 若目前 code 為空 → 直接套新前綴
    // 2) 若目前 code 以舊前綴開頭 → 置換成新前綴（保留後半段）
    // 3) 其他情況（使用者手改過、不符合前綴）→ 不自動覆蓋
    if (!cur) {
      productModel.value.code = newPrefix
    } else if (oldPrefix && cur.startsWith(oldPrefix)) {
      productModel.value.code = newPrefix + cur.slice(oldPrefix.length)
    } // else: 不動
  },
  { flush: 'sync' },
)
/*============= 新增/移除標籤 ============= */
const inputTag = ref('')
function addNewTag() {
  const input = inputTag.value.trim() ?? ''
  if (!input || list_tag.value.includes(input)) return
  list_tag.value.push(input)
  inputTag.value = ''
}

function removeTag(i) {
  list_tag.value.splice(i, 1)
}

/*============= 封面圖檔更新 ============= */
const file = ref(null)
const previewUrl = ref('')
const currentBlobUrl = ref('') // 目前掛著的 blob（server 來源）
let coverLoadVersion = 0 // 競態版本號，避免舊回應覆蓋新圖

//驗證規則
const fileRules = computed(() => {
  const base = [rules.fileTypes(['image/']), rules.maxSizeMB(5)]
  if (!isEdit.value) {
    // 新增：必填
    return [rules.requiredFile(), ...base]
  } else {
    return [...base]
  }
})

async function loadCoverBlobUrl(id) {
  coverLoadVersion++
  const v = coverLoadVersion

  if (currentBlobUrl.value) {
    URL.revokeObjectURL(currentBlobUrl.value)
    currentBlobUrl.value = ''
  }
  if (!id) {
    previewUrl.value = ''
    return
  }

  try {
    const res = await api.get(`File/${id}`, { responseType: 'blob' })
    if (v !== coverLoadVersion) return // 丟棄過期回應

    const url = URL.createObjectURL(res.data)
    currentBlobUrl.value = url
    previewUrl.value = url
  } catch (err) {
    dialog.showAxiosError(err, '照片抓取失敗')
    previewUrl.value = ''
  }
}
function normalizeToSingleFile(v) {
  if (!v) return null
  if (v instanceof File) return v
  if (Array.isArray(v)) return v[0] ?? null
  return null
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function revokePreview() {
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''

  if (currentBlobUrl.value) {
    URL.revokeObjectURL(currentBlobUrl.value)
    currentBlobUrl.value = ''
  }
}

async function onFileChange(val) {
  revokePreview()

  const f = normalizeToSingleFile(val)
  if (!f) {
    // 清掉檔案時，用現有 productModel.coverId 還原
    if (productModel.value.coverId) {
      await loadCoverBlobUrl(productModel.value.coverId)
    }
    return
  }

  // 用單一 File 做驗證
  const typeOk = rules.fileTypes(['image/'])(f) === true
  const sizeOk = rules.maxSizeMB(5)(f) === true
  if (!typeOk || !sizeOk) return

  // 顯示本地預覽
  previewUrl.value = URL.createObjectURL(f)
}

async function removeFile() {
  revokePreview()
  file.value = null
  if (productModel.value.coverId) {
    await loadCoverBlobUrl(productModel.value.coverId)
  }
}

/*============= 規格 ============= */
//將specTypes的sortOrder重新排序
function syncTypeSortOrders() {
  specTypes.value.forEach((item, idx) => {
    item.sortOrder = idx
  })
}

function syncValueSortOrders(typeIndex) {
  const arr = specTypes.value[typeIndex]?.specValues ?? []
  arr.forEach((v, idx) => {
    v.sortOrder = idx
  })
}

function onTypesChange(e) {
  if (e?.moved || e?.added || e?.removed) {
    syncTypeSortOrders()
    rebuildVariants()
  }
}

function onValuesChange(typeIndex, e) {
  if (e?.moved || e?.added || e?.removed) {
    syncValueSortOrders(typeIndex)
    rebuildVariants()
  }
}

function addSpecType() {
  specTypes.value.push({
    clientTypeId: crypto.randomUUID(),
    specTypeId: null,
    productId: null,
    specTypeName: '',
    sortOrder: 1,
    specValues: [
      {
        clientValueId: crypto.randomUUID(),
        specValueId: null,
        specTypeId: null,
        specValueName: '',
        sortOrder: 0,
      },
    ],
  })
  syncTypeSortOrders()
  rebuildVariants()
}

function removeSpecType(i) {
  specTypes.value.splice(i, 1)
  syncTypeSortOrders()
  rebuildVariants()
}

function addSpecValue(tIndex) {
  const t = specTypes.value[tIndex]
  t.specValues.push({
    clientValueId: crypto.randomUUID(),
    specValueId: null,
    specTypeId: null,
    specValueName: '',
    sortOrder: 0,
  })
  syncValueSortOrders(tIndex)
  rebuildVariants()
}

function removeSpecValue(tIndex, vIndex) {
  const t = specTypes.value[tIndex]
  t.specValues.splice(vIndex, 1)
  syncValueSortOrders(tIndex)
  rebuildVariants()
}
//定義顏色
function specColor(index) {
  return index === 0 ? 'orange-lighten-5' : 'green-lighten-5'
}

/* ------- 動態標籤更新 --------- */
const typeNameMap = computed(() => {
  const m = new Map()
  for (const t of specTypes.value) {
    m.set(idKey(t.specTypeId, t.clientTypeId), t.specTypeName || '')
  }
  return m
})

const valueNameMap = computed(() => {
  const m = new Map()
  for (const t of specTypes.value) {
    const tKey = idKey(t.specTypeId, t.clientTypeId)
    for (const v of t.specValues || []) {
      m.set(`${tKey}:${idKey(v.specValueId, v.clientValueId)}`, v.specValueName || '')
    }
  }
  return m
})

function variantLabel(v, side /* 'A' | 'B' */) {
  const tKey =
    v[`specType${side}Id`] != null ? String(v[`specType${side}Id`]) : v[`specType${side}Key`]
  const vKey =
    v[`specValue${side}Id`] != null ? String(v[`specValue${side}Id`]) : v[`specValue${side}Key`]
  if (!tKey || !vKey) return ''
  const typeName = typeNameMap.value.get(tKey) ?? ''
  const valueName = valueNameMap.value.get(`${tKey}:${vKey}`) ?? ''
  return `${typeName}-${valueName}`
}

/*============= 變體 ============= */
//批次修改價格庫存
const batchValue = ref(null)
function batchSet(field) {
  const val = Number(batchValue.value)
  if (Number.isNaN(val)) return
  for (const v of variants.value) {
    if (field === 'price') v.price = val
    if (field === 'stockQty') v.stockQty = val
  }
}

//設定key
function idKey(id, cid) {
  return id != null ? String(id) : `c:${cid}`
}

function makeComboKey(t1, v1, t2, v2) {
  const a = `${idKey(t1.specTypeId, t1.clientTypeId)}:${idKey(v1.specValueId, v1.clientValueId)}`
  if (!t2 || !v2) return a
  const b = `${idKey(t2.specTypeId, t2.clientTypeId)}:${idKey(v2.specValueId, v2.clientValueId)}`
  return `${a}||${b}`
}

//建立變體
async function rebuildVariants() {
  // 把 specTypes 依 sortOrder 排、每組 values 也排，避免順序髒
  const types = [...specTypes.value]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((t) => ({
      ...t,
      specValues: [...t.specValues].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }))

  const t1 = types[0]
  const t2 = types[1] // 可能不存在

  // 舊資料 map：key -> variant
  const oldMap = new Map(variants.value.map((v) => [v.key, v]))

  const next = []

  // 單規格
  if (t1 && (!t2 || !t2.specValues?.length)) {
    for (const v1 of t1.specValues || []) {
      const key = makeComboKey(t1, v1)
      const prev = oldMap.get(key)
      next.push({
        key,
        variantId: prev?.variantId ?? null,
        productId: null,

        // A 面：Id + Key（key 供前端/後端在無 Id 時對應）
        specTypeAId: t1.specTypeId ?? null,
        specTypeAKey: idKey(t1.specTypeId, t1.clientTypeId),
        specTypeAName: t1.specTypeName,
        specValueAId: v1.specValueId ?? null,
        specValueAKey: idKey(v1.specValueId, v1.clientValueId),
        specValueAName: v1.specValueName,

        specTypeBId: null,
        specTypeBKey: null,
        specTypeBName: null,
        specValueBId: null,
        specValueBKey: null,
        specValueBName: null,

        sku: prev?.sku ?? productModel.value.code,
        price: prev?.price ?? null,
        discountPrice: prev?.discountPrice ?? null,
        stockQty: prev?.stockQty ?? 0,
        isStockQty: prev?.isStockQty ?? false,
        isActive: prev?.isActive ?? true,
        isPublished: prev?.isPublished ?? true,
        isContract: prev?.isContract ?? false,
        contractName: prev?.contractName,
        contractUrl: prev?.contractUrl,
        contractDescription: prev?.contractDescription,
        warnings: prev?.warnings ?? [''],
        revenueShareSchemeId: prev?.revenueShareSchemeId ?? productModel.value.revenueShareSchemeId,
        level: prev?.level ?? 0,
      })
    }
  }

  // 雙規格（笛卡兒積）
  if (t1 && t2 && t1.specValues?.length && t2.specValues?.length) {
    for (const v1 of t1.specValues) {
      for (const v2 of t2.specValues) {
        const key = makeComboKey(t1, v1, t2, v2)
        const prev = oldMap.get(key)
        next.push({
          key,
          variantId: prev?.variantId ?? null,
          productId: null,

          // A
          specTypeAId: t1.specTypeId ?? null,
          specTypeAKey: idKey(t1.specTypeId, t1.clientTypeId),
          specTypeAName: t1.specTypeName,
          specValueAId: v1.specValueId ?? null,
          specValueAKey: idKey(v1.specValueId, v1.clientValueId),
          specValueAName: v1.specValueName,

          // B
          specTypeBId: t2.specTypeId ?? null,
          specTypeBKey: idKey(t2.specTypeId, t2.clientTypeId),
          specTypeBName: t2.specTypeName,
          specValueBId: v2.specValueId ?? null,
          specValueBKey: idKey(v2.specValueId, v2.clientValueId),
          specValueBName: v2.specValueName,

          sku: prev?.sku ?? productModel.value.code,
          price: prev?.price ?? null,
          discountPrice: prev?.discountPrice ?? null,
          stockQty: prev?.stockQty ?? 0,
          isStockQty: prev?.isStockQty ?? false,
          isActive: prev?.isActive ?? true,
          isPublished: prev?.isPublished ?? true,
          isContract: prev?.isContract ?? false,
          contractName: prev?.contractName,
          contractUrl: prev?.contractUrl,
          contractDescription: prev?.contractDescription,
          warnings: prev?.warnings ?? [''],
          revenueShareSchemeId:
            prev?.revenueShareSchemeId ?? productModel.value.revenueShareSchemeId,
          level: prev?.level ?? 0,
        })
      }
    }
  }

  // 依規格順序產生的順序就是顯示順序；你也可以在這裡 sort 一次
  variants.value = next
  variantCardRefs.value = Object.create(null)
}

/*============= 變體設定 Drawer 狀態與開關 ============= */
const variantDialog = ref(false)
const selectedVariantIndex = ref(-1)
const selectedVariant = computed(() => variants.value[selectedVariantIndex.value] || null)
const tempVariant = ref(null)

watch(
  () => tempVariant.value?.revenueShareSchemeId,
  async (id) => {
    if (!id) {
      tempRevenueTemplate.value = null
      return
    }
    await fetchTempRevenueTemplateId(id)
  },
  { immediate: false }, // 編輯模式一進來就會抓一次
)

const selLabels = computed(() => [
  variantLabel(selectedVariant.value || {}, 'A') || '',
  variantLabel(selectedVariant.value || {}, 'B') || '',
])

function onToggleStock(val) {
  if (!val) tempVariant.value.stockQty = 0
}

// 打開時把資料複製到暫存
function openVariant(v) {
  const i = variants.value.findIndex((x) => x.key === v.key)

  if (i === -1) return
  selectedVariantIndex.value = i
  // 深拷貝到暫存
  const raw = toRaw(variants.value[i])

  tempVariant.value = {
    ...toRaw(raw), // 或直接 ...src 也行
    warnings: Array.isArray(raw.warnings) && raw.warnings.length ? [...raw.warnings] : [''],
  }
  variantDialog.value = true
}

async function saveVariant() {
  // 1) 先驗證 Drawer 裡的表單
  const { valid } = await variantForm.value?.validate?.()
  if (!valid) {
    // 這裡可以選擇順便捲動到第一個錯誤欄位
    await nextTick()
    const el = variantForm.value?.$el ?? getEl(variantForm.value)
    const firstErr = el?.querySelector?.('.v-input--error')
    const firstInput = firstErr?.querySelector?.('input, textarea, [tabindex]:not([tabindex="-1"])')
    firstInput?.focus?.()
    firstInput?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    return
  }

  const i = selectedVariantIndex.value
  if (i < 0) return
  // 只把允許編輯的欄位回寫（避免把 key/spec 的識別覆蓋掉）
  const src = tempVariant.value
  const dst = variants.value[i]

  Object.assign(dst, {
    sku: src.sku,
    price: src.price,
    discountPrice: src.discountPrice,
    isStockQty: src.isStockQty,
    stockQty: src.stockQty,
    isActive: src.isActive,
    isPublished: src.isPublished,
    isContract: src.isContract,
    contractName: src.contractName,
    contractUrl: src.contractUrl,
    contractDescription: src.contractDescription,
    warnings: Array.isArray(src.warnings) ? src.warnings : [],
    revenueShareSchemeId: src.revenueShareSchemeId,
    level: src.level,
  })
  variantDialog.value = false
}

// 關閉就清乾淨
watch(variantDialog, (open) => {
  if (!open) {
    tempVariant.value = null
    selectedVariantIndex.value = -1
  }
})

/*============= 初始化抓取資料 ============= */

const schemeNameMap = computed(() => {
  const map = new Map()
  for (const s of revenueTemplateOption.value || []) {
    // s.id, s.schemeName 是你從 /RevenueShareScheme 拿回來的欄位
    map.set(s.id, s.schemeName)
  }
  return map
})

// 給 template 用的小工具（比較好讀）
function schemeNameById(id) {
  if (id == null) return ''
  return schemeNameMap.value.get(id) ?? ''
}

function formatShareValue(value, type) {
  if (value == null || value === '') return '-'
  return String(type || '').trim().toUpperCase() === 'FIXED' ? `NT$ ${value}` : `${value}%`
}

//抓分潤模板
async function fetchRevenueTemplate() {
  try {
    const { data } = await api.get(`/RevenueShareScheme`)
    revenueTemplateOption.value = data
  } catch (err) {
    dialog.showAxiosError(err, '分潤模板抓取失敗')
  }
}

async function fetchRevenueTemplateId(id) {
  loadingScheme.value = true
  try {
    const { data } = await api.get(`/RevenueShareScheme/${id}`)

    revenueSchemeDetail.value = data
  } catch (err) {
    dialog.showAxiosError(err, '分潤模板詳情抓取失敗')
  } finally {
    loadingScheme.value = false
  }
}

async function fetchTempRevenueTemplateId(id) {
  try {
    const { data } = await api.get(`/RevenueShareScheme/${id}`)
    tempRevenueTemplate.value = data
  } catch (error) {
    console.log(error)
  } finally {
  }
}

//抓支付方式
async function fetchPayment() {
  try {
    const { data } = await api.get(`/PaymentMethod/Get`)
    paymentMethodOption.value = data
  } catch (err) {
    dialog.showAxiosError(err, '支付方式抓取失敗')
  }
}

//抓商品類別
async function fetchCategory() {
  try {
    const { data } = await api.get(`/Category/Get`)
    categoryOption.value = data
  } catch (error) {
    dialog.showAxiosError(err, '商品類別抓取失敗')
  }
}

function toClientId() {
  return crypto.randomUUID()
}

function mapServerSpecTypes(serverSpecTypes) {
  return (serverSpecTypes || []).map((st, i) => ({
    clientTypeId: toClientId(),
    specTypeId: st.specTypeId,
    productId: st.productId ?? null,
    specTypeName: st.specTypeName ?? '',
    sortOrder: st.sortOrder ?? i,
    specValues: (st.specValues || []).map((sv, j) => ({
      clientValueId: toClientId(),
      specValueId: sv.specValueId,
      specTypeId: st.specTypeId,
      specValueName: sv.specValueName ?? '',
      sortOrder: sv.sortOrder ?? j,
    })),
  }))
}

// 把 specTypes 映射成查表：valueId -> { typeKey, valueKey }
function buildValueKeyMaps(specTypesArr) {
  const typeKeyByTypeId = new Map()
  const valueKeyByValueId = new Map()
  const typeIdByValueId = new Map()

  for (const t of specTypesArr) {
    const typeKey = t.specTypeId != null ? String(t.specTypeId) : `c:${t.clientTypeId}`
    typeKeyByTypeId.set(t.specTypeId ?? typeKey, typeKey)

    for (const v of t.specValues || []) {
      const valueKey = v.specValueId != null ? String(v.specValueId) : `c:${v.clientValueId}`
      valueKeyByValueId.set(v.specValueId ?? valueKey, valueKey)
      typeIdByValueId.set(v.specValueId ?? valueKey, t.specTypeId ?? typeKey)
    }
  }
  return { typeKeyByTypeId, valueKeyByValueId, typeIdByValueId }
}

function comboKeyFromValueIds(aId, bId, maps) {
  // aId 必有，bId 可能為 null
  const { typeKeyByTypeId, valueKeyByValueId, typeIdByValueId } = maps

  const aTypeId = typeIdByValueId.get(aId)
  const aTypeKey = typeKeyByTypeId.get(aTypeId)
  const aValueKey = valueKeyByValueId.get(aId)
  const partA = `${aTypeKey}:${aValueKey}`

  if (bId == null) return partA

  const bTypeId = typeIdByValueId.get(bId)
  const bTypeKey = typeKeyByTypeId.get(bTypeId)
  const bValueKey = valueKeyByValueId.get(bId)
  return `${partA}||${bTypeKey}:${bValueKey}`
}

function hydrateVariantsFromServer(serverVariants, specTypesArr) {
  // 先重建全組合，確保 variants.value 內含所有可能組合
  rebuildVariants()

  // 建立 valueId 對照，算 combo key
  const maps = buildValueKeyMaps(specTypesArr)

  // 讓查找速度更快
  const indexByKey = new Map(variants.value.map((v, i) => [v.key, i]))

  for (const sv of serverVariants) {
    const key = comboKeyFromValueIds(sv.specValueAid, sv.specValueBid ?? null, maps)
    const idx = indexByKey.get(key)
    if (idx == null) {
      // 後端有，但前端沒有對到（可能 spec 資料不同步），略過或 log
      console.warn('variant not matched by key:', key, sv)
      continue
    }

    let warnings = ['']
    if (typeof sv.warning === 'string' && sv.warning.trim()) {
      try {
        const parsed = JSON.parse(sv.warning)
        warnings = Array.isArray(parsed) && parsed.length ? parsed : ['']
      } catch (err) {
        console.warn('parse warning JSON failed:', sv.warning, err)
        warnings = ['']
      }
    }

    const dst = variants.value[idx]

    Object.assign(dst, {
      variantId: sv.variantId,
      productId: sv.productId,
      sku: sv.sku ?? '',
      price: sv.price ?? null,
      discountPrice: sv.discountPrice ?? null,
      isStockQty: !!sv.isStockQty,
      stockQty: sv.stockQty ?? 0,
      isActive: !!sv.isActive,
      isPublished: sv.isPublished ?? true,
      isContract: sv.isContract,
      contractName: sv.contractName,
      contractUrl: sv.contractUrl,
      contractDescription: sv.contractDescription,
      warnings,
      revenueShareSchemeId: sv.revenueShareSchemeId,
      level: sv.level ?? 0,
    })
  }
}

//編輯商品細節
async function fetchProduct(id) {
  const { data } = await api.get(`/Product/Get/${id}`)

  // 1) 基本欄位
  productModel.value.id = data.product.id
  productModel.value.code = data.product.code ?? ''
  productModel.value.name = data.product.name ?? ''
  productModel.value.revenueShareSchemeId = data.product.revenueShareSchemeId ?? null
  productModel.value.description = data.product.description ?? ''
  productModel.value.notice = data.product.notice ?? ''
  productModel.value.note = data.product.note ?? ''
  productModel.value.price = data.product.price ?? 0
  productModel.value.discountPrice = data.product.discountPrice ?? null
  productModel.value.isHtml = !!data.product.isHtml
  productModel.value.isForm = !!data.product.isForm
  productModel.value.isActive = !!data.product.isActive

  // 2) 類別/代碼
  const catgoryId = data.product.categoryId ?? null
  selectedCategory.value = categoryOption.value.find((c) => c.id === catgoryId) ?? null

  // 3) 封面/圖片（預覽）
  productModel.value.coverId = data.product.coverId ?? null
  await loadCoverBlobUrl(productModel.value.coverId)

  // 4) 付款方式
  selectedPaymentMethod.value = data.product.paymentSlugs ?? []

  // 5) 標籤
  list_tag.value = data.product.tags ?? []

  // 5) 規格/變體（SpecTypes）
  specTypes.value = mapServerSpecTypes(data.specType)
  hydrateVariantsFromServer(data.variants ?? [], specTypes.value)
}

onBeforeUnmount(() => {
  revokePreview()
})

onMounted(async () => {
  try {
    dialog.showLoading()
    await Promise.all([fetchRevenueTemplate(), fetchPayment(), fetchCategory()])

    const id = route.params.id ?? null

    if (id) {
      isEdit.value = true
      await fetchProduct(route.params.id)

      // 從訂單詳情「目前商品資料」帶 variantId 進來時，自動開啟該規格抽屜
      const targetVariantId = route.query.variantId ? Number(route.query.variantId) : null
      if (targetVariantId) {
        await nextTick()
        const targetVariant = variants.value.find((v) => v.variantId === targetVariantId)
        if (targetVariant) openVariant(targetVariant)
      }
    } else {
      isEdit.value = false
      // 新增模式：建立初始變體
      await rebuildVariants()
    }
  } catch (error) {
    dialog.showError('載入失敗', error?.response?.data || error?.message || '請稍後再試')
  } finally {
    dialog.hideLoading()
  }
})

/*============= 創建商品 ============= */

//查看目前送出的資料
function logFormData(fd) {
  const out = []
  for (const [key, val] of fd.entries()) {
    if (val instanceof File) {
      out.push({ key, file: val.name, type: val.type, size: val.size })
    } else {
      out.push({ key, value: val })
    }
  }
  // console.table(out)
}

// 將規格和規格值做成FormData
function appendSpecTypes(fd, specTypes) {
  specTypes.forEach((t, i) => {
    if (t.specTypeId != null) fd.append(`SpecTypes[${i}].SpecTypeId`, String(t.specTypeId))
    fd.append(`SpecTypes[${i}].ClientTypeId`, t.clientTypeId)
    fd.append(`SpecTypes[${i}].SpecTypeName`, t.specTypeName ?? '')
    fd.append(`SpecTypes[${i}].SortOrder`, String(t.sortOrder ?? i))

    t.specValues.forEach((v, j) => {
      if (v.specValueId != null)
        fd.append(`SpecTypes[${i}].SpecValues[${j}].SpecValueId`, String(v.specValueId))
      fd.append(`SpecTypes[${i}].SpecValues[${j}].ClientValueId`, v.clientValueId)
      fd.append(`SpecTypes[${i}].SpecValues[${j}].SpecValueName`, v.specValueName ?? '')
      fd.append(`SpecTypes[${i}].SpecValues[${j}].SortOrder`, String(v.sortOrder ?? j))
    })
  })
}

//將變體做成FormData
function appendVariants(fd, list) {
  list.forEach((v, k) => {
    if (v.variantId != null) fd.append(`Variants[${k}].VariantId`, String(v.variantId))

    // A/B 軸：Id 優先；沒有 Id 必送 key（形如 "c:<clientValueId>"）
    if (v.specValueAId != null) fd.append(`Variants[${k}].SpecValueAId`, String(v.specValueAId))
    else if (v.specValueAKey) fd.append(`Variants[${k}].SpecValueAKey`, v.specValueAKey)

    if (v.specValueBId != null) fd.append(`Variants[${k}].SpecValueBId`, String(v.specValueBId))
    else if (v.specValueBKey) fd.append(`Variants[${k}].SpecValueBKey`, v.specValueBKey)

    fd.append(`Variants[${k}].Sku`, v.sku ?? '')
    if (v.price != null) fd.append(`Variants[${k}].Price`, String(v.price))
    if (v.discountPrice != null) fd.append(`Variants[${k}].DiscountPrice`, String(v.discountPrice))
    fd.append(`Variants[${k}].IsStockQty`, String(!!v.isStockQty))
    fd.append(`Variants[${k}].StockQty`, String(v.stockQty ?? 0))
    fd.append(`Variants[${k}].IsActive`, String(!!v.isActive))
    fd.append(`Variants[${k}].IsPublished`, String(!!v.isPublished))
    fd.append(`Variants[${k}].IsContract`, String(!!v.isContract))
    fd.append(`Variants[${k}].ContractName`, v.contractName ?? '')
    fd.append(`Variants[${k}].ContractUrl`, v.contractUrl ?? '')
    fd.append(`Variants[${k}].ContractDescription`, v.contractDescription ?? '')
    fd.append(`Variants[${k}].Level`, v.level ?? 0)

    const warnings = Array.isArray(v.warnings) ? v.warnings : []
    fd.append(`Variants[${k}].Warning`, JSON.stringify(warnings))

    if (v.revenueShareSchemeId != null) {
      fd.append(`Variants[${k}].RevenueShareSchemeId`, String(v.revenueShareSchemeId))
    }
  })
}

function buildFormData(mode) {
  const fd = new FormData()

  //格式判斷工具
  const appendIf = (k, v) => {
    if (v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === ''))
      fd.append(k, String(v))
  }
  const appendBool = (k, b) => {
    if (typeof b === 'boolean') fd.append(k, String(b))
  }
  const appendNum = (k, n) => {
    if (n !== undefined && n !== null) fd.append(k, Number(n))
  }

  if (isEdit.value) {
    appendIf('id', productModel.value.id ?? null)
  }

  appendIf('code', productModel.value.code?.trim())
  appendIf('name', productModel.value.name?.trim())
  appendNum('price', productModel.value.price)
  appendNum('discountPrice', productModel.value.discountPrice)
  appendNum('revenueShareSchemeId', productModel.value.revenueShareSchemeId)
  appendBool('isHtml', productModel.value.isHtml)
  appendBool('isForm', productModel.value.isForm)
  appendIf('description', productModel.value.description)
  appendIf('notice', productModel.value.notice)
  appendIf('note', productModel.value.note?.trim())
  appendBool('isActive', productModel.value.isActive)

  if (selectedCategory.value?.id != null) {
    appendNum('categoryId', selectedCategory.value.id)
  }

  selectedPaymentMethod.value.forEach((slug) => appendNum('PaymentSlugs', slug))

  list_tag.value.forEach((t) => appendIf('tags', t?.trim()))

  const f = normalizeToSingleFile(file.value)
  if (f) fd.append('image', f, f.name)

  appendSpecTypes(fd, specTypes.value)
  appendVariants(fd, variants.value)

  return fd
}

/*============= 驗證跳到錯誤tab視窗 ============= */

const form = ref(null) //對應form裡面的ref

// 各分頁的根節點
const sectionSetting = ref(null)
const sectionSpecType = ref(null)

function getEl(x) {
  // 某些元件 ref 會拿到 component instance，要取 $el
  return x && x.$el ? x.$el : x
}

// 找出第一個有錯誤欄位的分頁
function findFirstErrorTab() {
  const order = ['setting', 'spectype'] // 想讓誰先被檢查就排前面
  const roots = {
    setting: getEl(sectionSetting.value),
    spectype: getEl(sectionSpecType.value),
  }
  // Vuetify 3 驗證錯誤時會出現 .v-input--error 或 .v-messages__message
  const sel = '.v-input--error, .v-messages__message'
  for (const key of order) {
    const root = roots[key]
    if (root && root.querySelector(sel)) return key
  }
  return null
}

// 切到分頁後，聚焦第一個錯誤欄位並捲動到視窗中央
function focusFirstErrorIn(tabKey) {
  const root = tabKey === 'setting' ? getEl(sectionSetting.value) : getEl(sectionSpecType.value)
  if (!root) return
  const errContainer = root.querySelector('.v-input--error') || root
  const target = errContainer.querySelector(
    'input, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
  )
  requestAnimationFrame(() => {
    target && target.focus && target.focus()
    target &&
      target.scrollIntoView &&
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// 驗證一筆 variant，回傳錯誤訊息陣列（空陣列=合法）
function variantErrors(v) {
  const errs = []
  // SKU
  if (!v.sku || !String(v.sku).trim()) errs.push('SKU 必填')

  // 價格
  if (v.price == null || v.price === '' || v.price < 0) {
    errs.push('定價必填且不可為負數')
  }
  if (v.discountPrice == null || v.discountPrice === '' || v.discountPrice < 0) {
    errs.push('售價必填且不可為負數')
  }
  // 新增：售價不得高於定價
  // if (v.price != null && v.discountPrice != null && Number(v.discountPrice) > Number(v.price)) {
  //   errs.push('售價不得高於定價')
  // }

  // 庫存
  if (v.isStockQty && (v.stockQty == null || v.stockQty === '' || Number(v.stockQty) < 0)) {
    errs.push('庫存必填且不可為負數')
  }

  return errs
}

const invalidVariantKeys = computed(() => {
  return new Set(variants.value.filter((v) => variantErrors(v).length > 0).map((v) => v.key))
})

const variantCardRefs = ref(Object.create(null))
function setVariantCardRef(el, key) {
  if (!el) return
  variantCardRefs.value[key] = el
}

async function onSubmitProduct(e) {
  //表單驗證不過無法送出
  const { valid } = await form.value?.validate?.()
  if (!valid) {
    // 2) 讓錯誤訊息先渲染到 DOM，再去找錯誤節點
    await nextTick()
    const firstTab = findFirstErrorTab()
    if (firstTab) {
      tab.value = firstTab
      focusFirstErrorIn(firstTab)
    }
    return
  }
  //變體檢查
  const badKeys = [...invalidVariantKeys.value]
  if (badKeys.length) {
    tab.value = 'spectype'
    await nextTick()
    const el = variantCardRefs.value[badKeys[0]]
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    dialog.showError('請完成變體設定', '有變體缺少必要欄位（例如 SKU），請修正後再送出。')
    return
  }

  //載入dialog
  dialog.showLoading()

  const mode = e?.submitter?.dataset?.mode ?? 'create'
  const url = mode === 'create' ? '/Product/Create' : `/Product/Update/${productModel.value.id}`
  const fd = buildFormData(mode)
  logFormData(fd)
  try {
    if (mode == 'create') {
      const res = await api.post(url, fd)
      router.push({ name: 'Product' })
    } else {
      const res = await api.put(url, fd)
      window.location.reload()
    }
  } catch (error) {
    dialog.showError(
      isEdit.value ? '更新失敗' : '建立失敗',
      error?.response?.data || error?.message || '請稍後再試',
    )
  } finally {
    dialog.hideLoading()
  }
}
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
}

.error-card {
  border: thin solid red;
}

:deep(.v-window__container) {
  height: 100% !important;
}

.scrollable-body-drawer :deep(.v-navigation-drawer__content) {
  overflow-y: hidden !important;
}
</style>
