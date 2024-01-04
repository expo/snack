import { parseExperienceURL } from '../UrlUtils';

describe(parseExperienceURL, () => {
  it('should parse snack url', () => {
    const result = parseExperienceURL('exp://exp.host/@snack/sdk.47.0.0-4AQkc5pxqe');
    expect(result?.channel).toBe('4AQkc5pxqe');
    expect(result?.testTransport).toBe(null);
  });

  it('should parse snack url with testTransport', () => {
    const result = parseExperienceURL(
      'exp://exp.host/@snack/sdk.47.0.0-4AQkc5pxqe?foo=foo&testTransport=snackpub&bar=bar',
    );
    expect(result?.channel).toBe('4AQkc5pxqe');
    expect(result?.testTransport).toBe('snackpub');
  });

  it('should parse account snack full name url', () => {
    const result = parseExperienceURL('exp://exp.host/@johndoe/the-snack+4AQkc5pxqe');
    expect(result?.channel).toBe('4AQkc5pxqe');
    expect(result?.testTransport).toBe(null);
  });

  it('should parse account snack full name url with testTransport', () => {
    const result = parseExperienceURL(
      'exp://exp.host/@johndoe/the-snack+4AQkc5pxqe?foo=foo&testTransport=snackpub&bar=bar',
    );
    expect(result?.channel).toBe('4AQkc5pxqe');
    expect(result?.testTransport).toBe('snackpub');
  });

  it('should return null for account snack full name url without channel', () => {
    const result = parseExperienceURL('exp://exp.host/@johndoe/the-snack');
    expect(result).toBe(null);
  });

  it('should return null for invalid url', () => {
    const result = parseExperienceURL('exp://exp.host/');
    expect(result).toBe(null);
  });
});
