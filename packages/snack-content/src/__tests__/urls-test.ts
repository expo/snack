import {
  createSnackRuntimeUrl,
  createEASUpdateSnackRuntimeUrl,
  createClassicUpdateSnackRuntimeUrl,
  parseEASUpdateSnackRuntimeUrl,
  parseClassicUpdateSnackRuntimeUrl,
} from '../urls';

describe(createSnackRuntimeUrl, () => {
  const channel = 'xy!z1_';

  it('creates classic updates url with "channel" and "sdkVersion"', () => {
    expect(createSnackRuntimeUrl({ channel, sdkVersion: '49.0.1' })).toMatchInlineSnapshot(
      `"exp://exp.host/@snack/sdk.49.0.0-xy!z1_"`,
    );
  });

  it('creates eas update url with "channel" and "sdkVersion" >= 50', () => {
    expect(createSnackRuntimeUrl({ channel, sdkVersion: '50.0.0' })).toMatchInlineSnapshot(
      `"exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?snack-channel=xy%21z1_&runtime-version=exposdk%3A50.0.0"`,
    );
  });
});

describe(createEASUpdateSnackRuntimeUrl, () => {
  const channel = 'xy!z1_';
  const snack = 'JxS_FUOcGz';

  it('creates url with "channel"', () => {
    expect(createEASUpdateSnackRuntimeUrl({ channel })).toMatchInlineSnapshot(
      '"exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?snack-channel=xy%21z1_"',
    );
  });

  it('creates url with "channel" and "sdkVersion"', () => {
    expect(createEASUpdateSnackRuntimeUrl({ channel, sdkVersion: '50.0.1' })).toMatchInlineSnapshot(
      '"exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?snack-channel=xy%21z1_&runtime-version=exposdk%3A50.0.0"',
    );
  });

  it('creates url with "channel, "sdkVersion", and "snack"', () => {
    expect(
      createEASUpdateSnackRuntimeUrl({ channel, snack, sdkVersion: 50 }),
    ).toMatchInlineSnapshot(
      '"exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?snack=JxS_FUOcGz&snack-channel=xy%21z1_&runtime-version=exposdk%3A50.0.0"',
    );
  });
});

describe(parseEASUpdateSnackRuntimeUrl, () => {
  const channel = 'xy%21z1_';
  const snack = 'JxS_FUOcGz';
  const sdkVersion = 'exposdk%3A50.0.0';

  it('parses url without any parameters', () => {
    expect(
      parseEASUpdateSnackRuntimeUrl('exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824'),
    ).toMatchInlineSnapshot(`Object {}`);
  });

  it('parses url with "channel"', () => {
    expect(
      parseEASUpdateSnackRuntimeUrl(
        `exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?snack-channel=${channel}`,
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "channel": "xy!z1_",
      }
    `);
  });

  it('parses url with "channel" and "sdkVersion"', () => {
    expect(
      parseEASUpdateSnackRuntimeUrl(
        `exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?snack-channel=${channel}&runtime-version=${sdkVersion}`,
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "channel": "xy!z1_",
        "sdkVersion": "50.0.0",
      }
    `);
  });

  it('parses url with "channel", "sdkVersion", and "snack"', () => {
    expect(
      parseEASUpdateSnackRuntimeUrl(
        `exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?snack-channel=${channel}&runtime-version=${sdkVersion}&snack=${snack}`,
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "channel": "xy!z1_",
        "sdkVersion": "50.0.0",
        "snack": "JxS_FUOcGz",
      }
    `);
  });

  it('parses redirected url with "channel", "sdkVersion", and "snack"', () => {
    expect(
      parseEASUpdateSnackRuntimeUrl(
        `exp://snack.expo.app?snack-channel=${channel}&runtime-version=${sdkVersion}&snack=${snack}`,
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "channel": "xy!z1_",
        "sdkVersion": "50.0.0",
        "snack": "JxS_FUOcGz",
      }
    `);
  });
});

describe(createClassicUpdateSnackRuntimeUrl, () => {
  const channel = 'qWeqG1!';

  it('creates url using format "exp://exp.host/@snack/sdk.<sdkVersion>-<channel>"', () => {
    expect(
      createClassicUpdateSnackRuntimeUrl({ channel, sdkVersion: '49.0.9' }),
    ).toMatchInlineSnapshot('"exp://exp.host/@snack/sdk.49.0.0-qWeqG1!"');
  });

  it('creates url using format "exp://exp.host/@snack/<snack>+<channel>"', () => {
    expect(
      createClassicUpdateSnackRuntimeUrl({ snack: 'snack-name', sdkVersion: '48.0.0' }),
    ).toMatchInlineSnapshot('"exp://exp.host/@snack/snack-name"');

    expect(
      createClassicUpdateSnackRuntimeUrl({ channel, snack: 'snack-name', sdkVersion: '47.0.0' }),
    ).toMatchInlineSnapshot('"exp://exp.host/@snack/snack-name+qWeqG1!"');
  });

  it('creates url using format "exp://exp.host/@<owner>/<name>+<channel>"', () => {
    expect(
      createClassicUpdateSnackRuntimeUrl({
        snack: '@owner-name/snack-name',
        sdkVersion: '48.0.0',
      }),
    ).toMatchInlineSnapshot('"exp://exp.host/@owner-name/snack-name"');

    expect(
      createClassicUpdateSnackRuntimeUrl({
        channel,
        snack: '@owner-name/snack-name',
        sdkVersion: '48.0.0',
      }),
    ).toMatchInlineSnapshot('"exp://exp.host/@owner-name/snack-name+qWeqG1!"');
  });

  it('throws for format "exp://exp.host/@snack/sdk.<sdkVersion>-<channel>" without "sdkVersion"', () => {
    expect(() => createClassicUpdateSnackRuntimeUrl({ channel })).toThrowError(
      'Cannot create classic updates URL with only "channel", "sdkVersion" is required',
    );
  });

  it('throws without "snack" or "channel"', () => {
    expect(() => createClassicUpdateSnackRuntimeUrl({})).toThrowError(
      'Cannot create classic updates URL without "channel" or "snack"',
    );
  });
});

describe(parseClassicUpdateSnackRuntimeUrl, () => {
  it('parses url without any paramters', () => {
    expect(parseClassicUpdateSnackRuntimeUrl('exp://exp.host')).toMatchInlineSnapshot(`Object {}`);
  });

  it('parses url using format "exp://exp.host/@snack/sdk.<sdkVersion>-<channel>"', () => {
    expect(parseClassicUpdateSnackRuntimeUrl('exp://exp.host/@snack/sdk.49.0.0-qWeqG1!'))
      .toMatchInlineSnapshot(`
      Object {
        "channel": undefined,
        "sdkVersion": "@snack",
      }
    `);
  });

  it('parses url using format "exp://exp.host/@snack/<snack>+<channel>"', () => {
    // We ignore these formats, as we can't determine the Snack without owner
    expect(
      parseClassicUpdateSnackRuntimeUrl('exp://exp.host/@snack/snack-name'),
    ).toMatchInlineSnapshot(`Object {}`);

    expect(parseClassicUpdateSnackRuntimeUrl('exp://exp.host/@snack/snack-name+qWeqG1!'))
      .toMatchInlineSnapshot(`
      Object {
        "channel": "snack-name",
        "sdkVersion": "@snack",
      }
    `);
  });

  it('parses url using format "exp://exp.host/@<owner>/<name>+<channel>"', () => {
    expect(parseClassicUpdateSnackRuntimeUrl('exp://exp.host/@owner-name/snack-name+qWeqG1!'))
      .toMatchInlineSnapshot(`
      Object {
        "channel": "snack-name",
        "sdkVersion": "@owner-name",
      }
    `);
  });
});
