import { Snack, defaultConfig } from '..';

switch (process.env.SNACK_ENV) {
  case 'local':
    defaultConfig.apiURL = 'http://localhost:3000';
    defaultConfig.snackagerURL = 'https://localhost:3001';
    break;
  case 'staging':
    defaultConfig.apiURL = 'https://staging.exp.host';
    defaultConfig.snackagerURL = 'https://staging.snackager.expo.io';
    break;
}

export * from '..';
export default Snack;

test('skip', () => {});
