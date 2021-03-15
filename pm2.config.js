module.exports = {
  apps: [
    {
      name: 'Express',
      script:
        'tsc --project server && node -r dotenv/config server-build/server',
      watch: ['build/assets.json', 'server'],
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
    {
      name: 'CSS',
      script: 'postcss app/styles --base app/styles --dir app/styles/dist -w',
      ignore_watch: ['.'],
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
