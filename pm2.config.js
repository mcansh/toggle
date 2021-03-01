module.exports = {
  apps: [
    {
      name: 'Express',
      script: 'index.js',
      watch: ['remix.config.js', 'app'],
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
