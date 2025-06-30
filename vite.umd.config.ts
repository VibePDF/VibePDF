import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'VibePDF',
      fileName: 'vibepdf',
      formats: ['umd']
    },
    outDir: 'dist/umd',
    sourcemap: true,
    minify: true
  }
});