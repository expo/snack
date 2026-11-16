# Browser compiler review and rollout

The stack adds an optional compiler to the existing Snack SDK, editor, runtime and
transport. Snackager remains the default. It does not replace Snack accounts,
Snackpub, the saved-Snack API or S3 storage, and does not add a standalone service.

## Review order

1. SDK 58 runtime and runtime-shell/library compatibility.
2. Compiler contract and Session lifecycle.
3. Worker adapter: cancellation, deadlines, asset conversion and browser host.
4. Artifact delivery: existing S3 upload API, references, integrity checks,
   capability negotiation and saved launch metadata.
5. Compiler: npm resolution, virtual filesystem, transforms, caching, graph
   generation and an opaque-origin executor. Vendored sources carry provenance.
6. Runtime: SDK 58 graph/Flight client, assets, live and saved launches.
7. Editor: compiler diagnostics, SDK selection, static assets and rollout gate.
8. Validation: reproducible builds and browser integration tests.

Review each PR against its immediate parent. Merge from the bottom upward,
retargeting each child after its parent lands. None of the drafts enables rollout.

## Execution and storage

The editor owns the compiler worker. The worker resolves dependencies and transforms
source using a virtual filesystem; it can use either the custom compiler or Metro
inside the worker. Execution crosses a MessagePort into a sandboxed opaque-origin
iframe/worker. The browser host enforces deadlines and terminates timed-out workers.
The web player renders inside another sandboxed iframe with generated CSP hashes.

The SDK publishes validated graph artifacts and sends references over Snackpub.
The runtime advertises support for `snack-worker-graph@1` before compiled delivery.
Web preview can receive inline graphs. Native runtime launches require both SDK 58
and the explicit worker marker; ordinary launches select the existing App.

Artifact publication uses the existing Snack code-upload API and S3. Saves retain
original source and dependencies and add `manifest.workerArtifact`. Uploaded graphs
are checked against their reference before execution. There is no R2 migration or
replacement backend in this stack.

## Build and local validation

Use Node 22.23.5 and Yarn 1.22.22. From the repository root:

```sh
yarn install --frozen-lockfile --ignore-scripts
yarn turbo build --filter '{./website}^...'
yarn --cwd runtime install --frozen-lockfile
yarn --cwd runtime build:worker
yarn --cwd runtime test:worker
npm ci --prefix experimental/browser-backend
npm --prefix experimental/browser-backend test
npm --prefix experimental/browser-backend run typecheck
yarn --cwd website build:worker
yarn workspace snack-sdk test --runInBand
yarn --cwd website test --runInBand
yarn --cwd website tsc --noEmit
cd experimental/browser-backend
npx playwright install chromium webkit
npm run test:browser
RSC_BACKEND=metro npm run test:browser
RSC_BROWSER=webkit npm run test:browser
```

The browser test starts and closes its own localhost asset server. It exercises the
real compiler and player, package resolution, uploaded assets, interaction, reload,
edits and source saving. Save/API responses are mocked; npm downloads are live.
It asserts that no Snackager request occurs. CI installs browser system libraries.

The runtime uses a generated Flight client; `build:worker` must precede a direct
Expo export. Runtime start/deploy scripts and the shared runtime CI setup generate
it automatically. Exporting builds bundles; it does not publish an EAS update.

## Gate and deployment inputs

Build and run the website with `SNACK_WORKER_COMPILER=1` to make the implementation
available. Build compiler assets with `yarn --cwd website build:worker` and include
`website/worker-compiler` alongside the website build. Generated assets must travel
together because CSP hashes are derived from their contents. Existing deployment
images do not automatically install the optional compiler toolchain.

Set `SNACK_WORKER_RUNTIME_ENDPOINT` at website build time to an SDK 58 runtime
release containing this client. A worker editor URL uses
`?compiler=worker&sdkVersion=58.0.0`. The rollout configuration also must permit it:

- `SNACK_WORKER_ROLLOUT=off` (default), `opt-in`, or `on`.
- Alternatively, `SNACK_WORKER_ROLLOUT_FILE` names a JSON file, read per HTML request:
  `{"mode":"opt-in","artifacts":false}`. Invalid/missing configuration disables it.
- Artifact publication additionally requires `SNACK_WORKER_ARTIFACTS=1` at build
  and runtime, plus `artifacts:true` in the file or
  `SNACK_WORKER_PUBLISH_ARTIFACTS=1` without a file.

Atomically replace the rollout file with `{"mode":"off","artifacts":false}` to
stop new worker sessions without rebuilding. Existing tabs keep their selected
compiler until reloaded. This is not an emergency termination of running code.

## Required before production rollout

- Validate Expo Go SDK 58 on physical iOS and Android through the deployed runtime,
  including reconnects, saved launches, assets and runtime errors.
- Verify the actual saved-Snack API preserves `manifest.workerArtifact`, S3 access
  and CORS, publication limits and Snackpub reference delivery in staging.
- Package compiler assets in the production image and exercise deployment/rollback
  with the real website configuration and runtime release URL.
- Audit the executor and preview boundary under production CSP and supported
  browsers. Native user code has Expo Go's existing capability boundary.
- Measure package compatibility, cold-start costs, memory and concurrency against
  a representative Snack corpus. The integration test is not full feature parity.

Native `.node` binaries, host processes/sockets/filesystems and unavailable device
modules are not browser-compatible. Runtime JavaScript adapters have a separate
non-strict check; compiler/protocol TypeScript checks are strict. No production
traffic, external artifact upload, physical-device run or deployment is implied by
the automated tests.
