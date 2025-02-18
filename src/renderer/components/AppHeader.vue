<template>
  <header>
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
const title = import.meta.env.VITE_APP_TITLE
</script> 