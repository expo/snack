import './unit.setup';
import { cleanUnusedLockfiles } from '../src/__e2e__/bundleAsync';

// These integration tests needs to validate if the packages are being bundled properly.
// To validate `bundle.js` from `<package>@<version`, we need to use the bundle size.
// It's an indicator of the bundled content, e.g. when it's 0 something is wrong

// Unfortunately, when a nested dependency is updated the bundled code changes in size.
// To prevent raising false alerts, we need to manage lockfiles for each tested `<package>@<version>`.
//   - Lockfiles are generated by Yarn and copied to `__snapshots__/lockfiles` by `bundleAsync` (after installing)
//   - When we have an existing lockfile, `bundleAsync` restores it just before installing
//   - `bundleAsync` keeps track of all used lockfiles, to auto-clean the repo when tests changes.
afterAll(() => cleanUnusedLockfiles());
