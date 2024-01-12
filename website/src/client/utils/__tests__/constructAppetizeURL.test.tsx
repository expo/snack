import { TEST_SDK_VERSION } from '../../configs/sdk';
import constructAppetizeURL, { getAppetizeConfig } from '../constructAppetizeURL';

describe(constructAppetizeURL, () => {
  it('constructs appetize URL', () => {
    expect(
      constructAppetizeURL({
        type: 'embedded',
        experienceURL: `exp://exp.host/@snack/sdk.${TEST_SDK_VERSION}-456a768`,
        platform: 'ios',
        previewQueue: 'main',
        sdkVersion: TEST_SDK_VERSION,
      })
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
        sdkVersion: TEST_SDK_VERSION,
      })
    ).toMatchSnapshot();
  });
});

describe(getAppetizeConfig, () => {
  it('returns config for test sdk version', () => {
    expect(getAppetizeConfig(TEST_SDK_VERSION)).toMatchObject({
      url: expect.any(String),
      main: expect.objectContaining({
        android: expect.any(String),
        ios: expect.any(String),
      }),
      secondary: expect.objectContaining({
        android: expect.any(String),
        ios: expect.any(String),
      }),
    });
  });

  it('throws for non-configured sdk version', () => {
    expect(() => getAppetizeConfig('1.0.0' as any)).toThrow(
      'No Appetize config found for SDK 1.0.0'
    );
  });
});
