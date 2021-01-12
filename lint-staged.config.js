const { quote: escape } = require('shell-quote');
const isWin = process.platform === 'win32';

module.exports = {
  '*.+(js|jsx|ts|tsx)': filenames => {
    const escapedFileNames = isWin ? filenames : escape(filenames);
    const filenamesForESLint = filenames.join(' ');

    return [
      `prettier --write ${escapedFileNames}`,
      `eslint --cache --fix --quiet ${filenamesForESLint}`,
    ];
  },

  '*.+(json|yml|yaml|css|less|scss|md|graphql|mdx)': filenames => {
    const escapedFileNames = isWin ? filenames : escape(filenames);

    return [
      //
      `prettier --write ${escapedFileNames}`,
    ];
  },
};
