import * as WebBrowser from 'expo-web-browser';
import { View, ActivityIndicator } from 'react-native';

// Must run at module level — signals expo-web-browser to complete the
// openAuthSessionAsync call with this URL instead of rendering as a route.
WebBrowser.maybeCompleteAuthSession();

export default function CallbackScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator color="#FF6B00" />
    </View>
  );
}