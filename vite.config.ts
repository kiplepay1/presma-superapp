import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: base './' makes the build work whether it's served
// from a project page (username.github.io/repo/) or a user/org root page.
export default defineConfig({
  plugins: [react()],
  base: './',
})
