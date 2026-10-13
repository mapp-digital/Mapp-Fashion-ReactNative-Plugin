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
  Events tracked before it finishes are queued and sent once it's ready.
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
- Consent handling:
  - Before a consent decision and while consent is rejected, nothing is sent.
    Events tracked meanwhile are kept in memory and sent, with the user's
    network user ID, once the user consents.
  - On withdrawal, Fashion stops sending new events to Snowplow; they are kept
    in memory for a possible re-consent. Events Snowplow already holds are
    still delivered, and its stored queue and session are kept.

### Added

- `tnuid` is sent alongside `nuid` with the same value, as in 0.1.x.
- `lang`, `tz` and `res` (physical pixels) are sent again, and `mobile_context`
  gets `resolution` in physical pixels, `isPortrait` and `language`. They come
  from React Native, so no extra native dependency is needed.
- `appVersion` and `appBuild` props on `DressipiProvider` for the mobile
  application context.
- A change of identity or configuration, and provider unmount, stop the
  current tracker: they discard its queued events, cancel in-flight requests
  and delete Fashion's Snowplow keys from AsyncStorage. Snowplow storage keys
  are scoped to `fashion:<namespace>:`.
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

### Fixed

- The identify event's error message now says that both `email` and
  `customerId` are required. It previously said "either", although both were
  already required. Behaviour is unchanged.

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
  deep-link event has been tracked. The `screen` and `screen_summary`
  contexts and the automatic `screen_view` events from Snowplow 2 are no
  longer sent.
- The network user ID is sent in both `nuid` (new in Snowplow 4) and `tnuid`
  (as in 0.1.x).
- Less device data: `mobile_context` no longer includes carrier, network type,
  battery, storage or memory. These need native code that Snowplow 4 doesn't
  have. `lang` is now a locale tag such as `en-GB` (0.1.x sent the language
  name, e.g. `English`), and `mobile_context.language` is the same locale
  tag instead of a 3-letter code such as `eng`.
- After consent withdrawal, the Snowplow tracker is removed once it has
  delivered its pending events, so no further automatic background/foreground
  events are sent. 0.1.x left the native tracker running.
- Background/foreground events follow React Native `AppState`, so Android
  activity switches can produce extra lifecycle events.
- Not yet verified: backend enrichment acceptance, iOS (including iOS
  request payloads), Android release builds, and upgrade from an existing
  0.1.x install. Android request payloads were compared with 0.1.5 on an
  emulator.
- `mapp-intelligence-reactnative-plugin` 2.0.0 declares
  `react-native <0.86.0`. Apps using it on Expo SDK 57 need an npm `overrides`
  entry until that package widens its range.

## [0.1.5] and earlier

Snowplow React Native tracker 2.x. See the git history for details.
