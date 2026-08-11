<script setup lang="ts">
definePage({
  name: 'about',
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '关于',
  },
})
</script>

<template>
  <view class="min-h-screen py-3">
    <view class="mx-3 mb-3 flex flex-col gap-2">
      <text class="text-6 font-bold wot-text-text-main">
        Stack Forge
      </text>
      <text class="text-3.5 leading-snug wot-text-text-secondary">
        stack-forge 是一个基于 pnpm workspace 的单仓库，整合 NestJS 后端、React 管理后台与 uni-app 移动端。
      </text>
    </view>

    <demo-block title="技术栈" transparent>
      <wd-cell-group border custom-class="rounded-2! overflow-hidden">
        <wd-cell title="后端" value="NestJS + Prisma" />
        <wd-cell title="管理后台" value="React + Ant Design" />
        <wd-cell title="移动端" value="uni-app + Wot UI" />
        <wd-cell title="共享类型" value="@stack-forge/contracts" />
      </wd-cell-group>
    </demo-block>

    <demo-block title="开发说明" transparent>
      <view class="rounded-3 p-5 wot-bg-filled-oppo">
        <text class="mb-3 block text-3.5 leading-relaxed wot-text-text-secondary">
          在仓库根目录执行 pnpm install 安装依赖，使用 pnpm dev:server 启动 API，再运行 pnpm dev:weapp:h5 或 pnpm dev:weapp 进行联调。
        </text>
        <text class="text-3.5 leading-relaxed wot-text-text-secondary">
          H5 开发模式下，/api 请求会通过 Vite 代理转发到本地后端；小程序端请配置 VITE_API_BASE_URL 指向可访问的后端地址。
        </text>
      </view>
    </demo-block>
  </view>
</template>
