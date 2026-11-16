# Snack browser compiler

Opt-in compiler, package resolver, persistent project store, and isolated RSC executor.
The existing Snack website and save APIs own editing and persistence; this package
contains no replacement editor or application server.

Use Node 22.23.5. Run `npm ci`, `npm test`, `npm run typecheck`, and
`npm run build:compiler` here. The full `npm run build` also builds the web player
and requires the SDK 58 runtime dependencies installed in `../../runtime`.
The runtime and editor integration are separate stacked PRs.

The compiler runs in a dedicated worker; evaluated project code runs in an
opaque-origin sandboxed iframe. Metro's resolver/transform pieces use a virtual
filesystem, not the host filesystem. Native `.node` binaries and host processes
are unsupported. Package support still requires compatibility testing; this is
an opt-in draft, not a claim of universal npm compatibility.

`vendor/expo/provenance.json` records the exact vendored transforms and licenses.
Generated bundles and historical test results are not committed.
