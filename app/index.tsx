import { Redirect } from 'expo-router';
import { getAccessToken } from '../lib/auth';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    getAccessToken().then(token => {
      setHasToken(!!token);
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

  return <Redirect href={hasToken ? '/(app)/dashboard' : '/(auth)/login'} />;
}