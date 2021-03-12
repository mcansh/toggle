const path = require('path');

module.exports = {
  extends: ['@mcansh/eslint-config/typescript'],
  parserOptions: {
    project: [
      path.join(process.cwd(), 'app/tsconfig.json'),
      path.join(process.cwd(), 'server/tsconfig.json'),
    ],
  },
  rules: {
    'import/extensions': ['error', { css: 'always' }],
    'import/no-unresolved': ['error', { ignore: ['.css$'] }],
    'import/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: 'img:*',
            group: 'internal',
          },
          {
            pattern: 'url:*',
            group: 'internal',
          },
          {
            pattern: 'css:*',
            group: 'internal',
          },
        ],
      },
    ],
  },
};
