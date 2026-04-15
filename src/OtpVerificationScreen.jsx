import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function OtpVerificationScreen({ route, navigation, onLogin }) {
  const { phone } = route.params;
  const [loading, setLoading] = useState(false);

  // This is the HTML/JS that will run inside the WebView
  // Replace 'YOUR_WIDGET_ID' with your actual MSG91 Widget configuration
  const INJECTED_JAVASCRIPT = `
    // MSG91 Widget Logic
    const config = {
      widgetId: "YOUR_WIDGET_ID",
      token: "YOUR_API_TOKEN",
      // After validation, send the widgetToken back to React Native
      success: (data) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'OTP_SUCCESS', 
          widgetToken: data.token 
        }));
      }
    };
    // Initialize Widget...
  `;

  const handleVerifyWithBackend = async widgetToken => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://backend.umaxautospares.com/api/v1/auth/verify-otp-public',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetToken }), // Matches your API requirement
        },
      );

      const result = await response.json();
      if (response.ok) {
        if (onLogin) onLogin();
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid Token');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Please check your connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2e4a9e" />
        </View>
      ) : (
        <WebView
          source={{
            uri: 'https://control.msg91.com/assets/otp-widget/index.html',
          }} // Replace with your hosted widget URL
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onMessage={event => {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'OTP_SUCCESS') {
              handleVerifyWithBackend(data.widgetToken);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
