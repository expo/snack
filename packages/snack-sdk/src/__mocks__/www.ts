import Router from '@koa/router';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

import type { SnackFiles } from '..';

export default function createWww() {
  const app = new Koa();
  app.use(bodyParser());
  const router = new Router();
  router.post('/--/api/v2/snack/save', (ctx) => {
    try {
      // @ts-ignore
      const code: SnackFiles = ctx.request.body.code;
      if (!code['App.js'] && !code['App.tsx']) {
        throw new Error('Invalid entry point');
      }
      const key = '@snack-sdk/test';
      ctx.body = {
        id: key,
        key,
        hashId: '00000000',
      };
    } catch (e: any) {
      ctx.status = 500;
      ctx.body = e.message;
    }
  });
  router.post('/--/api/v2/snack/uploadAsset', (ctx) => {
    const hash = 'FDFDFDFDFDFDFD';
    ctx.body = {
      url: `https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/${hash}`,
      hash,
    };
  });
  router.get('/--/api/v2/versions/latest', (ctx) => {
    ctx.body = {
      data: {
        sdkVersions: {
          '44.0.0': {
            iosClientUrl: 'https://dpq5q02fu5f55.cloudfront.net/Exponent-2.23.2.tar.gz',
            releaseNoteUrl: 'https://blog.expo.dev/expo-sdk-44-4c4b8306584a',
            relatedPackages: {
              jest: '^26.6.3',
              typescript: '~4.3.5',
              '@babel/core': '^7.12.9',
              '@types/react': '~17.0.21',
              '@types/react-dom': '~17.0.9',
              'react-native-web': '0.17.1',
              'babel-preset-expo': '9.0.2',
              '@types/react-native': '~0.64.12',
              '@expo/webpack-config': '~0.16.2',
              'react-native-unimodules': '~0.15.0',
            },
            androidClientUrl: 'https://d1ahtucjixef4r.cloudfront.net/Exponent-2.23.2.apk',
            iosClientVersion: '2.23.2',
            expoReactNativeTag: 'sdk-44.0.0',
            androidClientVersion: '2.23.2',
            facebookReactVersion: '17.0.1',
            facebookReactNativeVersion: '0.64.3',
            packagesToInstallWhenEjecting: {
              'react-native': 'https://github.com/expo/react-native/archive/sdk-44.0.0.tar.gz',
              'react-native-unimodules': '0.15.0',
            },
          },
          '45.0.0': {
            iosClientUrl: 'https://dpq5q02fu5f55.cloudfront.net/Exponent-2.24.3.tar.gz',
            releaseNoteUrl: 'https://blog.expo.dev/expo-sdk-45-f4e332954a68',
            relatedPackages: {
              jest: '^26.6.3',
              typescript: '~4.3.5',
              '@babel/core': '^7.12.9',
              '@expo/config': '~6.0.19',
              '@types/react': '~17.0.21',
              '@types/react-dom': '~17.0.11',
              'react-native-web': '0.17.7',
              'babel-preset-expo': '~9.1.0',
              '@types/react-native': '~0.67.6',
              '@expo/config-plugins': '^4.1.0',
              '@expo/webpack-config': '~0.16.21',
              '@expo/prebuild-config': '^4.0.0',
              'expo-modules-autolinking': '~0.8.1 || ~0.9.0',
            },
            androidClientUrl: 'https://d1ahtucjixef4r.cloudfront.net/Exponent-2.24.6.apk',
            iosClientVersion: '2.24.3',
            expoReactNativeTag: 'sdk-45.0.0',
            androidClientVersion: '2.24.6',
            facebookReactVersion: '17.0.2',
            facebookReactNativeVersion: '0.68.2',
            packagesToInstallWhenEjecting: {
              'react-native': 'https://github.com/expo/react-native/archive/sdk-45.0.0.tar.gz',
              'react-native-unimodules': '0.15.0',
            },
          },
          '46.0.0': {
            beta: 'true',
            iosClientUrl: 'https://dpq5q02fu5f55.cloudfront.net/Exponent-2.25.1.tar.gz',
            relatedPackages: {
              jest: '^26.6.3',
              typescript: '^4.6.3',
              '@babel/core': '^7.18.6',
              '@expo/config': '^7.0.0',
              '@types/react': '~18.0.0',
              '@types/react-dom': '~18.0.0',
              'react-native-web': '~0.18.7',
              'babel-preset-expo': '~9.2.0',
              '@types/react-native': '~0.69.1',
              '@expo/config-plugins': '^5.0.0',
              '@expo/webpack-config': '^0.17.0',
              '@expo/prebuild-config': '^5.0.1',
              'expo-modules-autolinking': '~0.10.1',
            },
            androidClientUrl: 'https://d1ahtucjixef4r.cloudfront.net/Exponent-2.25.1.apk',
            iosClientVersion: '2.25.1',
            expoReactNativeTag: 'sdk-46.0.0',
            androidClientVersion: '2.25.1',
            facebookReactVersion: '18.0.0',
            facebookReactNativeVersion: '0.69.3',
            packagesToInstallWhenEjecting: {
              'react-native': 'https://github.com/expo/react-native/archive/sdk-46.0.0.tar.gz',
              'react-native-unimodules': '0.15.0',
            },
          },
        },
      },
    };
  });
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}
