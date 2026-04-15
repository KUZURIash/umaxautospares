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

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // New State for Professional Feedback
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success',
    message: '',
  });

  // Helper to trigger the custom banner
  const showFeedback = (type, message) => {
    setFeedback({ visible: true, type, message });
    // Hide it after 4 seconds
    setTimeout(() => setFeedback({ ...feedback, visible: false }), 4000);
  };

  const handleResetPassword = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showFeedback('error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'https://backend.umaxautospares.com/api/v1/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        showFeedback('success', 'Reset link sent! Please check your email.');
        // Navigate back after a short delay so the user sees the success message
        setTimeout(() => navigation.goBack(), 2000);
      } else {
        showFeedback('error', data.message || 'Could not send reset link.');
      }
    } catch (error) {
      showFeedback('error', 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Status Banner */}
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
        style={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 30 }}>✉️</Text>
          </View>

          <Text style={styles.mainTitle}>Forgot Password?</Text>
          <Text style={styles.subText}>
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.footerLink}>
              Back to <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  // Banner Styles
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
  bannerText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  // Original Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#001a4d',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
  },
  primaryBtn: {
    backgroundColor: '#2e4a9e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footerLink: { textAlign: 'center', marginTop: 20, color: '#666' },
  linkBold: { color: '#2e4a9e', fontWeight: 'bold' },
});
