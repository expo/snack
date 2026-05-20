const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });

// Node 21+ exposes a built-in `globalThis.navigator` whose `platform` reflects the host OS
// (e.g. "MacIntel" on macOS). Source code that derives platform-specific behavior from
// `navigator.platform` therefore produces host-dependent output in tests. Pin a fixed
// non-Mac value so snapshots are stable across developer machines and CI.
Object.defineProperty(globalThis, 'navigator', {
  value: { platform: 'Linux x86_64', userAgent: 'jest' },
  configurable: true,
  writable: true,
});
