<script setup lang="ts">
defineProps(["error"]);
</script>

<template>
  <div class="error">
    <div class="error__message">
      <h1 class="subtitles">Oooops... erreur {{ error.statusCode }}</h1>
      <template v-if="error === 404">
        <h2 class="paragraphs">Cette page n'existe pas.</h2>
      </template>
      <template v-else-if="error === 403">
        <h2 class="paragraphs">
          Le lien de confirmation de votre email a expiré.
        </h2>
      </template>

      <NuxtLink to="/"> Retour à la page d'accueil</NuxtLink>
    </div>
  </div>
</template>
<style lang="postcss" scoped>
.error {
  .error__message {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 2rem;
    padding: 4rem 1rem;
    height: 100vh;
    text-align: center;

    h2 {
      font-weight: var(--regular);
      font-size: 1rem;
      color: var(--text-color-alt);
    }

    button {
      padding: 1rem 1.75rem;
    }
  }
}
</style>
