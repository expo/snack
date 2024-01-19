import { createRuntimeUrl, parseRuntimeUrl } from '../urls';

const snack = 'xxxxxx';
const channel = 'AsZ12sasd11G';

describe(createRuntimeUrl, () => {
  it('returns null with only "sdkVersion"', () => {
    expect(createRuntimeUrl({ sdkVersion: 69 })).toBeNull();
  });

  it(`returns url with "sdkVersion" and "snack"`, () => {
    expect(createRuntimeUrl({ sdkVersion: 69, snack })).toMatchInlineSnapshot(
      `"exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk%3A69.0.0&channel-name=production&snack=xxxxxx"`,
    );
  });

  it(`returns url with "sdkVersion" and "channel"`, () => {
    expect(createRuntimeUrl({ sdkVersion: 69, channel })).toMatchInlineSnapshot(
      `"exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk%3A69.0.0&channel-name=production&snack-channel=AsZ12sasd11G"`,
    );
  });

  it(`returns url with "sdkVersion", "snack", and "channel"`, () => {
    expect(createRuntimeUrl({ sdkVersion: 69, snack, channel })).toMatchInlineSnapshot(
      `"exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk%3A69.0.0&channel-name=production&snack=xxxxxx&snack-channel=AsZ12sasd11G"`,
    );
  });

  it(`returns url with "sdkVersion", "snack", and "channel" using custom "endpoint"`, () => {
    expect(
      createRuntimeUrl({ sdkVersion: 69, snack, channel, endpoint: 'u-dev.expo.test/xxx' }),
    ).toMatchInlineSnapshot(
      `"exp://u-dev.expo.test/xxx?runtime-version=exposdk%3A69.0.0&channel-name=production&snack=xxxxxx&snack-channel=AsZ12sasd11G"`,
    );
  });
});

describe(parseRuntimeUrl, () => {
  it('returns null with only "sdkVersion"', () => {
    expect(parseRuntimeUrl('exp://u.expo.dev/xxx?runtime-version=exposdk:69.0.0')).toBeNull();
  });

  it('returns info with "sdkVersion" and "snack"', () => {
    expect(parseRuntimeUrl('exp://u.expo.dev/xxx?runtime-version=exposdk:69.0.0&snack=snackid'))
      .toMatchInlineSnapshot(`
      Object {
        "channel": undefined,
        "sdkVersion": 69,
        "snack": "snackid",
      }
    `);
  });

  it('returns info with "sdkVersion" and "channel"', () => {
    expect(
      parseRuntimeUrl(
        'exp://u.expo.dev/xxx?runtime-version=exposdk:69.0.0&snack-channel=channelid',
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "channel": "channelid",
        "sdkVersion": 69,
        "snack": undefined,
      }
    `);
  });

  it('returns info with "sdkVersion", "snack", and "channel"', () => {
    expect(
      parseRuntimeUrl(
        'exp://u.expo.dev/xxx?runtime-version=exposdk:69.0.0&snack=snackid&snack-channel=channelid',
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "channel": "channelid",
        "sdkVersion": 69,
        "snack": "snackid",
      }
    `);
  });
});
