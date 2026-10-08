# iOS VoiceOver initial focus after native-stack navigation

Minimal React Native reproduction for delayed or overridden programmatic
VoiceOver focus after pushing a page with React Navigation's native stack.

The bug under test is **page navigation**, not modal presentation. The app also
contains a React Native core `Modal` control to show that the same
`AccessibilityInfo.sendAccessibilityEvent(target, 'focus')` call can focus the
same body content promptly after `Modal.onShow`.

## Environment

- React Native 0.87.1
- React Navigation native stack 7.20.0
- react-native-screens 4.28.0
- Hermes
- Bare React Native workflow, debug build
- Physical iPhone XS, iOS 18.7.10

## Run

Use Node.js 22.13 or newer.

```sh
npm install
cd ios && pod install && cd ..
npm start -- --reset-cache
```

In another terminal:

```sh
npm run ios -- --device
```

## Reproduce

1. Enable VoiceOver on a physical iPhone.
2. Launch the app.
3. Activate **Open native-stack page**.
4. After the native-stack `transitionEnd` event reports that opening has
   completed, the app waits for one animation frame plus 50 ms and calls
   `AccessibilityInfo.sendAccessibilityEvent(target, 'focus')` for **Requested
   body target**.
5. Go back and repeat several times.

Actual behavior: VoiceOver commonly focuses another element first (often the
first header item), then moves to the requested body target noticeably later;
occasionally the request is not honored. The timing varies between runs.

Expected behavior: once the native-stack opening transition has completed, the
requested body target should receive VoiceOver focus promptly and
deterministically.

For comparison, activate **Open core Modal control**. It makes the same focus
request after `Modal.onShow` and usually focuses the body target immediately.

Each request is logged with an `[a11y-focus]` prefix. The log records when the
request is sent; VoiceOver's actual focus arrival is observed on the device.
