import { parseTestTransportFromUrl } from '../UrlUtils';

describe(parseTestTransportFromUrl, () => {
  it('returns `null` without "testTransport"', () => {
    expect(parseTestTransportFromUrl('exp://exp.host/@snack/sdk')).toBeNull();
  });

  it('returns test transport when defined as query paramter', () => {
    expect(parseTestTransportFromUrl('exp://exp.host/@snack/sdk?testTransport=snackpub')).toBe(
      'snackpub'
    );
    expect(
      parseTestTransportFromUrl(
        'exp://exp.host/@johndoe/the-snack+4AQkc5pxqe?testTransport=snackpub'
      )
    ).toBe('snackpub');

    expect(
      parseTestTransportFromUrl(
        'exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824/?snack-channel=4AQkc5pxqe&testTransport=snackpub'
      )
    ).toBe('snackpub');
  });
});
