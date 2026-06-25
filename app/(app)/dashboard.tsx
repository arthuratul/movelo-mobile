import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getAuthUser, logout } from '../../lib/auth';

export default function DashboardScreen() {
  const router  = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    getAuthUser().then(user => {
      if (user) setEmail(user.email);
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <View className="mt-12 mb-8">
        <Text className="text-3xl font-bold text-neutral-900">Dashboard</Text>
        {email ? (
          <Text className="text-sm text-neutral-500 mt-1">Signed in as {email}</Text>
        ) : null}
      </View>

      <View className="bg-surface rounded-2xl p-6 mb-4" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
        <Text className="text-base font-semibold text-neutral-900 mb-1">You're logged in!</Text>
        <Text className="text-sm text-neutral-500">This is where your deliveries will appear.</Text>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        className="h-12 border border-border rounded-xl items-center justify-center mt-4"
      >
        <Text className="text-sm font-semibold text-neutral-700">Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}