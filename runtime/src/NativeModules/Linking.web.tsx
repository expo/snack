export default {
  async getInitialURL(): Promise<string> {
    return new URL(document.URL).searchParams.get('initialUrl') ?? document.URL;
  },

  addEventListener(_type: string, _handler: (event: { url: string }) => void): void {
    // nop;
  },

  removeEventListener(_type: string, _handler: (event: { url: string }) => void): void {
    // nop;
  },
};

export function isVerbose(): boolean {
  const value = new URL(document.URL).searchParams.get('verbose');
  return value === null ? __DEV__ : value === 'true' || value === '1';
}
