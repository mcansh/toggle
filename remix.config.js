// Make sure you turn on "Automatically expose System Environment Variables" in the Vercel console here:
// https://vercel.com/<username>/<app-name>/settings/environment-variables
const isLocalDev =
  process.env.VERCEL_ENV !== 'production' &&
  process.env.VERCEL_ENV !== 'preview';

module.exports = {
  appDirectory: isLocalDev ? 'app' : 'app-build',
  browserBuildDirectory: 'public/build',
  publicPath: '/build/',
  serverBuildDirectory: 'app-build',
  devServerPort: 8002,
};
