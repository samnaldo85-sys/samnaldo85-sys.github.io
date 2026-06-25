import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function getBasePath() {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) return '/';

  const repoName = repository.split('/')[1];
  return repoName.endsWith('.github.io') ? '/' : `/${repoName}/`;
}

export default defineConfig({
  plugins: [react()],
  base: getBasePath(),
});
