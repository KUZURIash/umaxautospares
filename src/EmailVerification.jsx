import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function EmailVerification({ navigation, route }) {
  // Grab the email passed from the SignupScreen
  const { email } = route.params || { email: '' };

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success',
    message: '',
  });

  const showFeedback = (type, message) => {
    setFeedback({ visible: true, type, message });
    setTimeout(() => setFeedback({ ...feedback, visible: false }), 4000);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      showFeedback('error', 'Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        'https://backend.umaxautospares.com/auth/verify-email-otp-public',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            // FIX: Removing the Origin/Referer headers that were causing CSRF errors
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ email, otp }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        showFeedback('success', 'Email verified successfully!');
        // Navigate to the next screen in your flow
        setTimeout(() => navigation.navigate('PhoneVerification'), 2000);
      } else {
        showFeedback('error', result.message || 'Invalid OTP code.');
      }
    } catch (error) {
      showFeedback('error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Status Banner */}
      {feedback.visible && (
        <View
          style={[
            styles.banner,
            feedback.type === 'success'
              ? styles.successBanner
              : styles.errorBanner,
          ]}
        >
          <Text style={styles.bannerText}>{feedback.message}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Email Verification</Text>
          <Text style={styles.subText}>
            We sent a verification code to:{' '}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Enter 6-Digit Code</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Verify Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001a4d',
    marginBottom: 10,
  },
  subText: { color: '#666', marginBottom: 25 },
  emailText: { fontWeight: 'bold', color: '#001a4d' },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10, color: '#333' },
  otpInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 20,
    backgroundColor: '#fdfdfd',
  },
  primaryBtn: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // Banner Styles (Consistent with your other screens)
  banner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 100,
    elevation: 5,
  },
  successBanner: { backgroundColor: '#2e7d32' },
  errorBanner: { backgroundColor: '#d32f2f' },
  bannerText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
