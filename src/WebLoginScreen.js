import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WebLoginScreen({ navigation, onLogin }) {
  const [loading, setLoading] = useState(true);

  const handleMessage = async event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      console.log('Received from Web:', data);

      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);

        // 🔥 Navigate to app
        if (onLogin) {
          onLogin();
        } else {
          navigation.replace('MainApp');
        }
      }
    } catch (err) {
      console.log('Message parse error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://backend.umaxautospares.com/api/v1/login' }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && <ActivityIndicator size="large" style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },
});
