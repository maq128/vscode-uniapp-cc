<template>
  <view>
    <!-- #ifdef H5 -->
    <view>仅在 H5 平台生效</view>
    <!-- #endif -->
    <!-- #ifdef APP -->
    <view>仅在 APP 平台生效</view>
    <!-- #endif -->
    <!-- #ifdef H5 || APP -->
    <view>在 H5 或 APP 平台生效</view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <view>仅在非 H5 平台生效</view>
    <!-- #endif -->
    <!-- #ifndef APP -->
    <view>仅在非 APP 平台生效</view>
    <!-- #endif -->
    <!-- #ifndef APP || H5 -->
    <view>在非 H5 且非 APP 平台生效</view>
    <!-- #endif -->

    <view class="message">{{ config.message }}</view>
  </view>
</template>

<script>
const config = {
  message: '缺省在所有平台生效',
  // #ifdef H5
  message: '仅在 H5 平台生效',
  // #endif
  // #ifdef APP
  message: '仅在 APP 平台生效',
  // #endif
  // #ifdef H5 || APP
  message: '在 H5 或 APP 平台生效',
  // #endif
  // #ifndef H5
  message: '仅在非 H5 平台生效',
  // #endif
  // #ifndef APP
  message: '仅在非 APP 平台生效',
  // #endif
  // #ifndef APP || H5
  message: '在非 H5 且非 APP 平台生效',
  // #endif
}

export default {
  data() {
    return {
      config
    }
  }
}
</script>

<style>
.message:before {
  content: '缺省在所有平台生效';
  /* #ifdef H5 */
  content: '仅在 H5 平台生效';
  /* #endif */
  /* #ifdef APP */
  content: '仅在 APP 平台生效';
  /* #endif */
  /* #ifdef H5 || APP */
  content: '在 H5 或 APP 平台生效';
  /* #endif */
  /* #ifndef H5 */
  content: '仅在非 H5 平台生效';
  /* #endif */
  /* #ifndef APP */
  content: '仅在非 APP 平台生效';
  /* #endif */
  /* #ifndef APP || H5 */
  content: '在非 H5 且非 APP 平台生效';
  /* #endif */
}
</style>