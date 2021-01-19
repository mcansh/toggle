const tsconfig = require('./tsconfig.json');

const paths = tsconfig.references.map(ref => ref.path);

module.exports = {
  apps: [
    {
      name: 'TypeScript',
      script: 'tsc -b -w --preserveWatchOutput',
      watch: paths,
      autorestart: false,
    },
    {
      name: 'Express',
      script: 'server-build/index.js',
      ignore_watch: ['app/**/*.css'],
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
    {
      name: 'Tailwind',
      script: 'postcss styles --base styles --dir app/ -w',
      ignore_watch: ['.'],
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
