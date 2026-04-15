import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function BusinessDetails({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.stepTitle}>Step 3: Business Details</Text>
        <Text style={styles.stepSub}>Required for B2B transactions and invoicing.</Text>

        <Text style={styles.label}>Business / Company Name *</Text>
        <TextInput style={styles.input} placeholder="My Auto Spares" />

        <Text style={styles.label}>Aadhaar Number *</Text>
        <TextInput style={styles.input} placeholder="1234 5678 9012" keyboardType="number-pad" />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>PAN Number *</Text>
            <TextInput style={styles.input} placeholder="ABCDE1234F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>GSTIN (Optional)</Text>
            <TextInput style={styles.input} placeholder="22ABCDE1234F1Z5" />
          </View>
        </View>

        <Text style={styles.label}>Business Address *</Text>
        <TextInput style={styles.input} placeholder="Shop No, Street, Area" />
        
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('AllProducts')}>
          <Text style={styles.btnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  header: { alignItems: 'center', marginVertical: 20 },
  logo: { width: 120, height: 40 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#001a4d' },
  subText: { textAlign: 'center', color: '#666', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 4 },
  tabHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderColor: '#2e4a9e' },
  tabText: { color: '#666', fontWeight: '500' },
  activeTabText: { color: '#2e4a9e' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: '#fff' },
  primaryBtn: { backgroundColor: '#2e4a9e', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row' },
  forgotText: { textAlign: 'right', color: '#2e4a9e', marginBottom: 15 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#eee' },
  orText: { marginHorizontal: 10, color: '#999' },
  googleBtn: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, alignItems: 'center' },
  footerLink: { textAlign: 'center', marginTop: 25, color: '#666' },
  linkBold: { color: '#2e4a9e', fontWeight: 'bold' }
});