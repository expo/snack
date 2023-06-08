import { sanitizeFilePath } from '../path';

describe(sanitizeFilePath, () => {
  it('removes leading `/`', () => {
    expect(sanitizeFilePath('/components/Button.js')).toBe('components/Button.js');
  });

  it('removes leading `./`', () => {
    expect(sanitizeFilePath('./components/Button.js')).toBe('components/Button.js');
  });

  it('removes leading `module://`', () => {
    expect(sanitizeFilePath('module://components/Button.js')).toBe('components/Button.js');
  });

  // This could happen during Babel transpilation, not sure why though
  it('removes leading `module:/`', () => {
    expect(sanitizeFilePath('module:/components/Button.js')).toBe('components/Button.js');
  });
});
