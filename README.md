# React Native iOS initial accessibility focus reproduction

This minimal Expo/React Native app demonstrates a screen-reader focus difference between iOS VoiceOver and Android TalkBack during native-stack navigation.

The destination screen keeps this accessibility traversal order:

1. Back
2. Title
3. Home
4. Requested body target
5. Next body action

On mount, the app requests accessibility focus on **Requested body target**. The desired behavior is for the screen-reader cursor to start there while preserving the traversal order above.

## Environment

- Expo 54
- React Native 0.81.5
- React 19.1.0
- React Navigation 7.3.18
- React Navigation native stack 7.18.10
- React Native Screens 4.16.0
- New Architecture enabled
- Stack animation disabled

## Run on an iPhone

VoiceOver behavior should be tested on a physical device.

```bash
npm install
npm run ios
```

Enable VoiceOver before reproducing:

1. Open iOS Settings.
2. Select Accessibility → VoiceOver.
3. Enable VoiceOver.
4. Launch the app.

## Reproduce

1. On the home screen, focus one of the demo buttons.
2. Activate **Open with legacy tag focus**.
3. Listen for which element VoiceOver focuses first and how long it takes to reach **Requested body target**.
4. Go back.
5. Repeat with **Open with renderer ref focus**.

The two modes use:

- `findNodeHandle` + `AccessibilityInfo.setAccessibilityFocus`
- `AccessibilityInfo.sendAccessibilityEvent(hostInstance, 'focus')`

The Metro console records when the app sends the focus request:

```text
[a11y-focus] Requesting renderer-ref focus at 1000ms
```

The relevant observation is whether VoiceOver first focuses a different element and only later moves to the requested target. React Native 0.81 does not expose a public `onAccessibilityFocus` callback for measuring the receiving side, so the VoiceOver announcement is the source of truth in this reproduction.

## Expected behavior

- The requested body target receives the initial VoiceOver focus.
- No intermediate element receives focus.
- Traversal order remains Back → Title → Home → Requested body target → Next body action.

## Why accessibility order is not a substitute

Moving the body target to the beginning of `experimental_accessibilityOrder` changes the full traversal order. This reproduction specifically needs to preserve the existing order while choosing a different starting point.

## Scope

This project contains no application-specific code, assets, APIs, or business logic. It exists only to reproduce and measure initial accessibility focus behavior.
