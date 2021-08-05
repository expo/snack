module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/embed.js', destination: '/api/embed.js' },
      { source: '/web-player/:path*', destination: '/api/web-player/:path*' },
    ];
  },
  env: {
    SERVER_URL: 'http://expo.test',
    LEGACY_SERVER_URL: 'http://expo.io.test',
    API_SERVER_URL: 'http://localhost:3020',
    SNACK_SEGMENT_KEY: '',
    SNACK_AMPLITUDE_KEY: '',
    LEGACY_SNACK_SERVER_URL: 'http://snack.expo.io.test',
    SNACK_SERVER_URL: 'http://snack.expo.test',
    SNACK_WEBPLAYER_URL: 'https://snack-web-player-staging.s3.us-west-1.amazonaws.com',
    SNACK_WEBPLAYER_CDN: 'https://d1qt8af2b3kxj0.cloudfront.net',
    IMPORT_SERVER_URL: 'http://localhost:3022',
    // NODE_ENV: 'development', // Not allowed
    DEPLOY_ENVIRONMENT: 'staging',
    // Needed for service-worker and Sentry
    //BUILD_TIMESTAMP: JSON.stringify(Date.now()),
  },
};
