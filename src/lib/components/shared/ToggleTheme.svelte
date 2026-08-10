<script>
    import { Sun, Moon } from '@lucide/svelte';

    import { theme } from '$lib/stores/theme.svelte.js';
</script>

<button
    onclick     = {() => theme.toggle()}
    class       = "p-2 rounded-xl text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) transition-all duration-200 ml-auto"
    aria-label  = {theme.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    title       = {theme.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
>
    {#if theme.isDark}
        <Sun size={20} />
    {:else}
        <Moon size={20} />
    {/if}
</button>
