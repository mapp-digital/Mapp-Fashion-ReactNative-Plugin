# Changelog

All notable changes to `mapp-fashion-react-native-sdk` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the project uses [Semantic Versioning](https://semver.org/). Before 1.0.0, a
minor version bump can contain breaking changes.

## [0.2.0] - Unreleased

This release moves Fashion from Snowplow React Native tracker 2.x to 4.x, which
replaces Snowplow's native Android/iOS tracker with a JavaScript tracker.
Fashion's hooks and their arguments are unchanged, but installing it needs the
steps under **Upgrading from 0.1.x**.

### Upgrading from 0.1.x

1. Remove `@snowplow/react-native-tracker` from your app's dependencies. Fashion
   now installs the Snowplow version it needs.
2. Remove any `patch-package` patches for `@snowplow/react-native-tracker` 2.x
   (for example the Kotlin nullability patch). Do not apply them to 4.x.
3. Install the new peer dependencies:
   - Expo: `npx expo install @react-native-async-storage/async-storage react-native-get-random-values`
   - Bare React Native: `npm install @react-native-async-storage/async-storage@^2.0.0 react-native-get-random-values@^2.0.0`
4. Pass your app's real version and build number to `DressipiProvider`, using
   the new `appVersion` and `appBuild` props (for example from
   `expo-application`). Snowplow 4 no longer reads them automatically.
5. Rebuild the native app (`expo prebuild` / `pod install`, then a new build).

### Changed

- **Breaking:** Snowplow tracker upgraded from `^2.1.1` to `4.10.2`, and
  `@snowplow/tracker-core` `4.10.2` added. Both are regular dependencies.
- **Breaking:** peer dependency ranges narrowed to the versions that are
  tested:
  - `react-native`: `>=0.60.0` → `>=0.85.0`
  - `react`: `>=16.8.0` → `>=19.2.3`
- **Breaking:** new required peer dependencies:
  `@react-native-async-storage/async-storage` `^2.0.0` (Snowplow 4 stores its
  session and event queue there) and `react-native-get-random-values`
  `^1.11.0 || ^2.0.0`.
- Tracker initialization is now asynchronous and runs in a React effect.
  Events tracked before it finishes are queued, but only after consent.
- Public types no longer reference Snowplow types. `OrderEventPayload` and
  `PageViewEventPayload` are now Fashion's own types with the same fields.
  The internal tracker type is `FashionTracker` instead of Snowplow's
  `ReactNativeTracker`.
- Development environment: React Native 0.86.3 (the version used by Expo SDK 57) and React 19.2.8.

### Kept the same

- Collector endpoint `https://<domain>/t/t`, POST, Base64 encoding.
- Tracker namespace (`dressipi`, or `EXPO_PUBLIC_SNOWPLOW_TRACKER_NAMESPACE`),
  `appId`, and `networkUserId`.
- All Dressipi event schemas and payloads.
- Orders are still sent as the legacy `ti`/`tr` transaction events, rebuilt
  through `@snowplow/tracker-core`.
- Lifecycle (background/foreground), install, session, platform, screen and
  deep-link contexts remain enabled.

### Added

- `appVersion` and `appBuild` props on `DressipiProvider` for the mobile
  application context.
- Consent withdrawal, a change of identity or configuration, and provider
  unmount now stop the tracker. They discard its queued events, cancel
  in-flight requests and delete Fashion's Snowplow keys from AsyncStorage.
  Snowplow storage keys are scoped to `fashion:<namespace>:`.
- Events whose payload is still being built when consent is withdrawn are
  dropped.
- `npm run test:tracker` (`scripts/check-tracker.cjs`): sends every Fashion
  event through the real Snowplow 4 serializer and emitter and checks the
  resulting requests. The platform and collector are simulated.
- Unit tests for the Snowplow 4 adapter and the provider's tracker lifecycle.

### Removed

- The `browser` field that redirected `axios` to its private
  `axios/dist/browser/axios.cjs` bundle.
- Snowplow 2 native features that 4.x does not have: native screen-view
  autotracking (Android Activity / iOS UIViewController) and some automatic
  platform context fields.

### Known differences and limitations

- Sessions and queued events stored by Snowplow 2 are not migrated. After
  upgrading, the first launch starts a new Snowplow session and may send a
  new install event. Rolling back to 0.1.x does not read the 0.2.0 storage.
- Re-initializing the tracker (after consent withdrawal and re-acceptance, or
  an identity change) starts a new session.
- Keep one `DressipiProvider` mounted for the app's lifetime.
- Events queued while the device is offline are not resent as soon as the
  network returns. They are sent together with the next tracked event.
  Snowplow 2's native emitter resent them on reconnect.
- Screen and deep-link contexts are attached only after a screen-view or
  deep-link event has been tracked.
- Not yet verified: captured request payloads compared with 0.1.x, backend
  enrichment acceptance, iOS builds, Android release builds, offline retry,
  and upgrade from an existing 0.1.x install.
- `mapp-intelligence-reactnative-plugin` 2.0.0 declares
  `react-native <0.86.0`. Apps using it on Expo SDK 57 need an npm `overrides`
  entry until that package widens its range.

## [0.1.5] and earlier

Snowplow React Native tracker 2.x. See the git history for details.
