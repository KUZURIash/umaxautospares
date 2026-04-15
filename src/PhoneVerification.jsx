import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function PhoneVerification({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Create your account</Text>
      
      <View style={styles.card}>
        <Text style={styles.stepTitle}>Step 2: Phone Verification</Text>
        <Text style={styles.stepSub}>Verify your mobile number to continue.</Text>

        <View style={styles.otpBox}>
           {/* Icon placeholder for the blue phone icon in your screenshot */}
          <View style={styles.iconCircle}>
             <Text style={{fontSize: 30}}>📞</Text> 
          </View>
          
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.navigate('BusinessDetails')}
          >
            <Text style={styles.btnText}>Verify with OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20, justifyContent: 'center' },
  mainTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#001a4d', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  stepSub: { fontSize: 14, color: '#666', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  primaryBtn: { backgroundColor: '#2e4a9e', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footerLink: { textAlign: 'center', marginTop: 20, color: '#666' },
  linkBold: { color: '#2e4a9e', fontWeight: 'bold' },
  otpBox: { alignItems: 'center', padding: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }
});