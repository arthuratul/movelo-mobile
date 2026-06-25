import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { initiateLogin, loginWithGoogle, initiateSignup, getAccessToken, AuthError } from '../../lib/auth';

type LoadingAction = 'login' | 'google' | 'signup' | null;

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <Path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <Path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <Path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </Svg>
  );
}

const shadow = { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 };

export default function LoginScreen() {
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [signupSent, setSignupSent]       = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');

  useEffect(() => {
    getAccessToken().then(token => {
      if (token) router.replace('/(app)/dashboard');
    });
  }, []);

  const busy = loadingAction !== null;

  async function run(action: LoadingAction, fn: () => Promise<'success' | 'cancelled' | 'error'>) {
    setLoadingAction(action);
    setErrorMsg('');
    try {
      const result = await fn();
      if (result === 'success') {
        if (action === 'signup') {
          setSignupSent(true);
        } else {
          router.replace('/(app)/dashboard');
        }
      }
      // 'cancelled' — user closed the browser, do nothing
    } catch (err) {
      const msg = err instanceof AuthError ? err.message : 'Something went wrong. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoadingAction(null);
    }
  }

  if (signupSent) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <View className="bg-surface rounded-2xl p-8 w-full max-w-md items-center" style={shadow}>
          <View className="w-14 h-14 bg-success-light rounded-full items-center justify-center mb-6">
            <Text className="text-2xl">✉️</Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900 mb-2 text-center">Check your inbox</Text>
          <Text className="text-sm text-neutral-500 text-center mb-1">
            We sent a confirmation link to your email.
          </Text>
          <Text className="text-xs text-neutral-400 text-center mt-3 mb-7">
            Click the link to activate your account, then sign in below.
          </Text>
          <TouchableOpacity
            onPress={() => setSignupSent(false)}
            className="h-12 bg-primary rounded-xl items-center justify-center w-full"
          >
            <Text className="text-base font-semibold text-white">Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background items-center justify-center px-4">
      <View className="w-full max-w-md">

        {/* Brand header */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-5">
            <Text className="text-white text-2xl font-bold">M</Text>
          </View>
          <Text className="text-3xl font-bold text-neutral-900">Welcome to Movelo</Text>
          <Text className="text-sm text-neutral-500 mt-1.5">Sign in to continue your deliveries</Text>
        </View>

        {/* Card */}
        <View className="bg-surface rounded-2xl p-6" style={shadow}>

          {/* Error banner */}
          {errorMsg ? (
            <View className="flex-row items-start px-4 py-3.5 rounded-xl bg-error-light mb-5" style={{ gap: 10 }}>
              <AlertCircle size={16} color="#DC2626" style={{ marginTop: 1 }} />
              <Text className="flex-1 text-sm text-error">{errorMsg}</Text>
            </View>
          ) : null}

          {/* Google */}
          <TouchableOpacity
            onPress={() => run('google', loginWithGoogle)}
            disabled={busy}
            className="flex-row items-center justify-center h-12 rounded-xl border border-border mb-4"
            style={{ opacity: busy ? 0.6 : 1, gap: 10 }}
          >
            {loadingAction === 'google'
              ? <ActivityIndicator size="small" color="#6B7280" />
              : <GoogleIcon />
            }
            <Text className="text-sm font-semibold text-neutral-700">
              {loadingAction === 'google' ? 'Opening…' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-px bg-border" />
            <Text className="mx-3 text-xs text-neutral-400 font-medium">or</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* Email sign in */}
          <TouchableOpacity
            onPress={() => run('login', initiateLogin)}
            disabled={busy}
            className="h-12 bg-primary rounded-xl items-center justify-center flex-row mb-5"
            style={{ opacity: busy ? 0.7 : 1, gap: 8 }}
          >
            {loadingAction === 'login' && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text className="text-base font-semibold text-white">
              {loadingAction === 'login' ? 'Opening…' : 'Sign in with Email'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-px bg-border" />
            <Text className="mx-3 text-xs text-neutral-400 font-medium">new here?</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* Create account */}
          <TouchableOpacity
            onPress={() => run('signup', initiateSignup)}
            disabled={busy}
            className="h-12 rounded-xl border border-border items-center justify-center flex-row"
            style={{ opacity: busy ? 0.6 : 1, gap: 8 }}
          >
            {loadingAction === 'signup' && <ActivityIndicator size="small" color="#6B7280" />}
            <Text className="text-sm font-semibold text-neutral-700">
              {loadingAction === 'signup' ? 'Opening…' : 'Create account'}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}