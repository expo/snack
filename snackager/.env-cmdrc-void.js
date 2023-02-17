// todo:
/**
 * -      PATH: process.env.PATH,
+      PATH: "/Applications/Sublime Text.app/Contents/SharedSupport/bin:/Users/user/.rbenv/shims:/Users/user/.nvm/versions/node/v16.18.1/bin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Library/Apple/usr/bin:/Applications/Wireshark.app/Contents/MacOS:/Users/user/Library/Android/sdk/emulator:/Users/user/Library/Android/sdk/platform-tools",
 */
module.exports = (async function () {
  return {
    development: {
      NODE_ENV: 'development',
      S3_REGION: 'us-west-1',
      SENTRY_DSN: '',
      REDIS_URL: 'redis://default:eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81@127.0.0.1:6379',
      CLOUDFRONT_URL: 'https://ductmb1crhe2d.cloudfront.net',
      IMPORTS_S3_BUCKET: 'snack-git-imports-staging',
      S3_BUCKET: 'snackager-artifacts-staging',
      API_SERVER_URL: 'https://staging.exp.host', // todo: http://localhost:3000
      IMPORT_SERVER_URL: 'http://localhost:3012', // https://staging.snackager.expo.io
      AWS_ACCESS_KEY_ID: '_', // AWS is not used since we use DEBUG_LOCAL_FILES
      AWS_SECRET_ACCESS_KEY: '_',
    },
    test: { NODE_ENV: 'test' },
    production: { NODE_ENV: 'production' },
  };
})();
