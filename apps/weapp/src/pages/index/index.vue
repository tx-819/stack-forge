<script setup lang="ts">
definePage({
  name: 'home',
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '首页',
  },
})

const {
  theme,
  toggleTheme,
  currentThemeColor,
  showThemeColorSheet,
  themeColorOptions,
  openThemeColorPicker,
  closeThemeColorPicker,
  selectThemeColor,
  setFollowSystem,
} = useManualTheme()

const isDark = computed({
  get() {
    return theme.value === 'dark'
  },
  set() {
    toggleTheme()
  },
})

function handleThemeColorSelect(option: any) {
  selectThemeColor(option)
}
</script>

<template>
  <view class="box-border py-3">
    <view class="mx-3 box-border rounded-3 px-4 py-6 text-center wot-bg-filled-oppo">
      <text class="mb-3 block text-left text-5 font-bold wot-text-text-main">
        Stack Forge
      </text>
      <text class="mb-3 block text-left text-30rpx leading-relaxed wot-text-text-secondary">
        基于 uni-app、Vue 3 与 Wot UI 的移动端应用，接入 stack-forge 后端与共享类型。
      </text>
      <text class="block text-left text-3 leading-relaxed wot-text-text-auxiliary">
        在仓库根目录运行 pnpm dev:weapp:h5 或 pnpm dev:weapp 开始开发。
      </text>
    </view>

    <demo-block title="基础设置" transparent>
      <wd-cell-group border custom-class="rounded-2! overflow-hidden">
        <wd-cell title="暗黑模式">
          <wd-switch v-model="isDark" size="18px" />
        </wd-cell>
        <wd-cell title="跟随系统">
          <wd-button size="small" @click="setFollowSystem(true)">
            跟随系统
          </wd-button>
        </wd-cell>
        <wd-cell title="选择主题色" is-link @click="openThemeColorPicker">
          <view class="flex items-center justify-end gap-2">
            <view
              class="h-4 w-4 rounded-full"
              :style="{ backgroundColor: currentThemeColor.primary }"
            />
            <text>{{ currentThemeColor.name }}</text>
          </view>
        </wd-cell>
      </wd-cell-group>
    </demo-block>

    <wd-action-sheet
      v-model="showThemeColorSheet"
      title="选择主题色"
      :close-on-click-action="true"
      @cancel="closeThemeColorPicker"
    >
      <view class="px-4 pb-4">
        <view
          v-for="option in themeColorOptions"
          :key="option.value"
          class="flex items-center justify-between border-b py-3 wot-border-border-main last:border-b-0"
          @click="handleThemeColorSelect(option)"
        >
          <view class="flex items-center gap-3">
            <view
              class="h-6 w-6 border-2 rounded-full wot-border-border-main"
              :style="{ backgroundColor: option.primary }"
            />
            <text class="text-4 wot-text-text-main">
              {{ option.name }}
            </text>
          </view>
          <wd-icon
            v-if="currentThemeColor.value === option.value"
            name="check"
            :color="option.primary"
            size="20px"
          />
        </view>
      </view>
      <wd-gap :height="50" />
    </wd-action-sheet>
  </view>
</template>
