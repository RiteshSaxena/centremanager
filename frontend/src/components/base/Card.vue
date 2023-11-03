<template>
  <div class="card">
    <div class="card-header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  border: none;
  border-radius: 10px;

  .card-header {
    padding-top: 15px;
    border-radius: 10px;
    border: none;
    background: white;
    font-weight: 700;
    font-size: 14px;
    line-height: 21px;
  }
}
</style>
