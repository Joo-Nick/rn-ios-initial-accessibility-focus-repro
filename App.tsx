import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type RootStackParamList = {
  Home: undefined;
  FocusDemo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
let nextTrialId = 1;

function requestBodyFocus(
  target: React.ComponentRef<typeof View> | null,
  source: 'core-modal' | 'native-stack',
) {
  const trialId = nextTrialId++;

  requestAnimationFrame(() => {
    setTimeout(() => {
      if (target === null) {
        console.log(`[a11y-focus] trial=${trialId} source=${source} target-not-mounted`);
        return;
      }

      console.log(
        `[a11y-focus] trial=${trialId} source=${source} requestedAt=${Date.now()}ms`,
      );
      AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
    }, 50);
  });
}

function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen component={HomeScreen} name="Home" />
        <Stack.Screen component={FocusDemoScreen} name="FocusDemo" />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const modalTargetRef = useRef<React.ComponentRef<typeof View>>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.home}>
        <Text accessibilityRole="header" style={styles.screenTitle}>
          iOS VoiceOver initial focus repro
        </Text>
        <Text style={styles.description}>
          Reproduce delayed initial VoiceOver focus after a native-stack page
          transition. The Modal is only a control using the same focus API.
        </Text>
        <DemoButton
          label="Open native-stack page"
          onPress={() => navigation.navigate('FocusDemo')}
        />
        <DemoButton
          label="Open core Modal control"
          onPress={() => setIsModalVisible(true)}
        />
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
        onShow={() => requestBodyFocus(modalTargetRef.current, 'core-modal')}
        presentationStyle="fullScreen"
        visible={isModalVisible}>
        <FocusContent
          closeLabel="Close"
          onClose={() => setIsModalVisible(false)}
          targetRef={modalTargetRef}
        />
      </Modal>
    </SafeAreaView>
  );
}

function FocusDemoScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'FocusDemo'>>();
  const targetRef = useRef<React.ComponentRef<typeof View>>(null);

  useEffect(() => {
    return navigation.addListener('transitionEnd', event => {
      if (!event.data.closing) {
        requestBodyFocus(targetRef.current, 'native-stack');
      }
    });
  }, [navigation]);

  return (
    <FocusContent
      closeLabel="Back"
      onClose={() => navigation.goBack()}
      targetRef={targetRef}
    />
  );
}

type FocusContentProps = {
  closeLabel: string;
  onClose: () => void;
  targetRef: React.RefObject<React.ComponentRef<typeof View> | null>;
};

function FocusContent({closeLabel, onClose, targetRef}: FocusContentProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View accessibilityLabel="Page header" style={styles.header}>
        <Pressable
          accessibilityLabel={closeLabel}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.headerButton}>
          <Text style={styles.buttonText}>{closeLabel}</Text>
        </Pressable>

        <Text accessible accessibilityRole="header" style={styles.headerTitle}>
          Focus demo
        </Text>

        <Pressable
          accessibilityLabel="Home"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.headerButton}>
          <Text style={styles.buttonText}>Home</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View
          ref={targetRef}
          accessible
          accessibilityLabel="Requested body target"
          accessibilityRole="summary"
          style={styles.focusTarget}>
          <Text style={styles.targetTitle}>Requested body target</Text>
          <Text style={styles.targetDescription}>
            VoiceOver should move here promptly after the presentation finishes.
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Next body action"
          accessibilityRole="button"
          onPress={() => undefined}
          style={styles.bodyButton}>
          <Text style={styles.buttonText}>Next body action</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type DemoButtonProps = {
  label: string;
  onPress: () => void;
};

function DemoButton({label, onPress}: DemoButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.demoButton}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 20,
    padding: 24,
  },
  bodyButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  description: {
    color: '#334155',
    fontSize: 17,
    lineHeight: 25,
  },
  focusTarget: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
    borderRadius: 12,
    borderWidth: 3,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  headerButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#0f172a',
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  home: {
    gap: 20,
    padding: 24,
  },
  safeArea: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  screenTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
  },
  targetDescription: {
    color: '#166534',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  targetTitle: {
    color: '#14532d',
    fontSize: 22,
    fontWeight: '700',
  },
});

export default App;
