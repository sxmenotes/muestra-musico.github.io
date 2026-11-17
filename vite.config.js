import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/muestra-musico.github.io/' : '/',
}));

