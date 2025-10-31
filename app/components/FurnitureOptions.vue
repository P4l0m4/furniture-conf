<script setup lang="ts">
defineEmits<{
  (e: "create-furniture", func: Function): void;
}>();

defineProps<{
  furnitureCatalog: Array<{
    type: string;
    factory: Function;
    icon: string;
  }>;
}>();
</script>
<template>
  <div class="options-overlay">
    <div
      class="options-overlay__option"
      v-for="furniture in furnitureCatalog"
      :key="furniture.type"
      @click="$emit('create-furniture', furniture.factory)"
    >
      <IconComponent :icon="furniture.icon" size="2rem" />
      {{ furniture.type }}
    </div>
  </div>
</template>
<style lang="postcss" scoped>
.options-overlay {
  width: 100%;
  padding: 0 2rem;
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  z-index: 1;
  overflow-x: scroll;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    top: 6rem;
    right: 4rem;
    bottom: initial;
    left: initial;
    padding: 0;
    width: fit-content;
    overflow-x: hidden;
  }

  &__option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    border-radius: 8px;
    width: 100%;
    transition: background-color 0.2s linear;

    &:hover {
      cursor: pointer;
      background-color: var(--primary-color);
    }

    @media (min-width: var(--big-tablet-screen)) {
      padding: 1rem;
    }
  }
}
</style>
