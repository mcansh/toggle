const { quote: escape } = require('shell-quote');
const { CLIEngine } = require('eslint');

const cli = new CLIEngine({});
const isWin = process.platform === 'win32';

module.exports = {
  '**/*.{js,jsx,ts,tsx}': filenames => {
    const escapedFileNames = filenames
      .map(filename => `"${isWin ? filename : escape([filename])}"`)
      .join(' ');

    const filesForEslint = filenames
      .filter(file => !cli.isPathIgnored(file))
      .map(f => `"${f}"`)
      .join(' ');

    return [
      `prettier --write ${escapedFileNames}`,
      `eslint --cache --fix --quiet ${filesForEslint}`,
    ];
  },

  '*.+(json,yml,yaml,htm,css,less,scss,md,graphql,mdx)': filenames => {
    const escapedFileNames = filenames
      .map(filename => `"${isWin ? filename : escape([filename])}"`)
      .join(' ');

    return [`prettier --write ${escapedFileNames}`];
  },
};
