import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getAccessToken } from '../../lib/auth';

export default function AppLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getAccessToken().then(token => {
      if (!token) router.replace('/(auth)/login');
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#FF6B00" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}