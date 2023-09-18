import { TEST_SDK_VERSION } from '../../configs/sdk';
import constructAppetizeURL from '../constructAppetizeURL';

it('constructs appetize URL', () => {
  expect(
    constructAppetizeURL({
      type: 'embedded',
      experienceURL: `exp://exp.host/@snack/sdk.${TEST_SDK_VERSION}-456a768`,
      platform: 'ios',
      previewQueue: 'main',
    }),
  ).toMatchSnapshot();
  expect(
    constructAppetizeURL({
      type: 'website',
      experienceURL: `exp://exp.host/@snack/sdk.${TEST_SDK_VERSION}-456a768`,
      platform: 'android',
      autoplay: true,
      scale: 2,
      payerCode: 'asdf',
      previewQueue: 'secondary',
    }),
  ).toMatchSnapshot();
});
