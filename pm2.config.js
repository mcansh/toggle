module.exports = {
  apps: [
    {
      name: 'Express',
      script: 'tsc --project server && node server-build/server',
      watch: ['remix.config.js', 'app', 'server'],
      watch_options: {
        followSymlinks: false,
      },
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'Remix',
      script: 'remix run',
      ignore_watch: ['.'],
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
