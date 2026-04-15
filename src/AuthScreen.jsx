import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
  Image, Platform, KeyboardAvoidingView, Animated, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import the Eye icons
import { Eye, EyeOff } from 'lucide-react-native'; 

import api from './api'; 
import AppLogo from './assets/logo.jpg'; 
import { useCart } from './CartContext'; 

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation, onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 1. New state for password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { fetchCart } = useCart();

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnim = (val, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, useNativeDriver: true }),
        ])
      );
    };

    Animated.parallel([
      createAnim(anim1, 8000),
      createAnim(anim2, 11000),
    ]).start();
  }, []);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      const token = response.data?.data?.accessToken;
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        await fetchCart();
        if (onLogin) onLogin(); 
      }
    } catch (error) {
      Alert.alert("Login Failed", error.response?.data?.error?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.blob, styles.blob1, {
          transform: [
            { translateY: anim1.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) },
            { scale: anim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }
          ]
        }]} />
        <Animated.View style={[styles.blob, styles.blob2, {
          transform: [
            { translateX: anim2.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) },
            { translateY: anim1.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) }
          ]
        }]} />
        <Animated.View style={[styles.blob, styles.blob3, {
          transform: [
            { scale: anim1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) },
            { translateX: anim2.interpolate({ inputRange: [0, 1], outputRange: [0, -80] }) }
          ]
        }]} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoContainer}>
            <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.subText}>Sign in to your account</Text>

          <View style={styles.card}>
            <View>
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={styles.input} 
                placeholder="name@company.com" 
                placeholderTextColor="#999"
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={setEmail} 
              />
              
              <Text style={styles.label}>Password</Text>
              
              {/* 2. Password Container to hold Input and Eye */}
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput} 
                  placeholder="••••••••" 
                  placeholderTextColor="#999"
                  secureTextEntry={!isPasswordVisible} // Toggle logic
                  value={password} 
                  onChangeText={setPassword} 
                />
                <TouchableOpacity 
                  style={styles.eyeBtn}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleEmailLogin} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.footerTouch}>
            <Text style={styles.footerLink}>
              Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  scrollContent: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  
  blob: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    opacity: 0.35,
  },
  blob1: { backgroundColor: '#4facfe', top: -50, right: -50 },
  blob2: { backgroundColor: '#0004feff', bottom: height * 0.2, left: -100 },
  blob3: { backgroundColor: '#2e4a9e', bottom: -50, right: -20 },

  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff' },
  welcomeText: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#1a1a1a', marginBottom: 4 },
  subText: { textAlign: 'center', color: '#666', marginBottom: 30, fontSize: 15 },
  
  card: { 
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    borderRadius: 24, 
    padding: 24, 
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },

  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#444' },
  input: { 
    height: 55,
    borderWidth: 1.5, 
    borderColor: '#e1e8ef', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    marginBottom: 20, 
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333'
  },

  // 3. Password specific styles
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderWidth: 1.5,
    borderColor: '#e1e8ef',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  eyeBtn: {
    padding: 8,
  },

  primaryBtn: { 
    backgroundColor: '#2e4a9e', 
    height: 55, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#2e4a9e',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  forgotText: { textAlign: 'right', color: '#2e4a9e', marginBottom: 25, fontSize: 14, fontWeight: '600' },
  footerTouch: { marginTop: 30 },
  footerLink: { textAlign: 'center', color: '#444', fontSize: 15 },
  linkBold: { color: '#2e4a9e', fontWeight: 'bold' }
});