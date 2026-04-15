import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// --- API ---
import { 
  getWalletAccounts, 
  linkWalletAccount, 
  deleteWalletAccount 
} from './api'; 

import SafeScreenWrapper from './components/SafeScreenWrapper';
import { horizontalScale, verticalScale, moderateScale } from './components/scaling';

// --- Icons ---
import {
  WalletIcon, 
  ShieldCheckIcon,
  BanknotesIcon,
  TrashIcon,
  CheckCircleIcon,
  CreditCardIcon,
  PlusIcon
} from 'react-native-heroicons/solid';

const Wallet = () => {

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState([]);

  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    fetchSavedAccounts();
  }, []);

  const fetchSavedAccounts = async () => {
    try {
      const response = await getWalletAccounts();

      const data = 
        response.data?.data?.accounts || 
        response.data?.data || 
        response.data?.accounts || 
        (Array.isArray(response.data) ? response.data : []);

      setSavedAccounts(data);
    } catch (error) {
      Alert.alert("Error", "Unable to fetch bank accounts.");
    } finally {
      setFetching(false);
    }
  };

  // ✅ VALIDATION (NO UI CHANGE)
  const validateInputs = () => {
    if (!accountHolderName.trim()) {
      return "Please enter account holder name.";
    }

    if (!accountNumber.trim()) {
      return "Please enter account number.";
    }

    if (accountNumber.length < 9) {
      return "Account number must be at least 9 digits.";
    }

    if (!ifscCode.trim()) {
      return "Please enter IFSC code.";
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      return "Invalid IFSC code (Example: SBIN0001234).";
    }

    if (!bankName.trim()) {
      return "Please enter bank name.";
    }

    return null;
  };

  const handleSave = async () => {
    const error = validateInputs();

    if (error) {
      Alert.alert("Invalid Details", error);
      return;
    }

    setLoading(true);

    try {
      const payload = { 
        accountHolderName: accountHolderName.trim(), 
        accountNumber: accountNumber.trim(), 
        ifscCode: ifscCode.trim().toUpperCase(), 
        bankName: bankName.trim(),
        isPrimary: savedAccounts.length === 0 
      };
      
      const res = await linkWalletAccount(payload);
      
      if (res.status === 201 || res.status === 200) {
        Alert.alert("Success", "Bank details linked successfully!");
        setAccountHolderName(''); 
        setAccountNumber(''); 
        setIfscCode(''); 
        setBankName('');
        fetchSavedAccounts();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Could not save details.";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Remove Account", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          try {
            await deleteWalletAccount(id);
            fetchSavedAccounts();
          } catch {
            Alert.alert("Error", "Failed to delete account.");
          }
      }}
    ]);
  };

  return (
    <SafeScreenWrapper backgroundColor="#f1f5f9">
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <WalletIcon size={moderateScale(28)} color="#1a2e63" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.mainHeading}>My Wallet</Text>
              <Text style={styles.subHeading}>Manage your linked bank accounts</Text>
            </View>
          </View>

          {/* SAVED ACCOUNTS */}
          <View style={styles.sectionHeader}>
            <BanknotesIcon size={moderateScale(20)} color="#1a2e63" />
            <Text style={styles.sectionTitle}>Linked Accounts</Text>
          </View>

          {fetching ? (
            <ActivityIndicator size="large" color="#1a2e63" style={{ marginVertical: 20 }} />
          ) : savedAccounts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No accounts linked yet</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {savedAccounts.map((item, index) => (
                <View key={item._id || index} style={styles.bankCard}>
                  <View style={styles.cardTop}>
                    <CreditCardIcon size={moderateScale(24)} color="#fff" />
                    <TouchableOpacity onPress={() => handleDelete(item._id)}>
                      <TrashIcon size={moderateScale(18)} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardNumber}>•••• •••• {item.accountNumber?.slice(-4)}</Text>
                  <Text style={styles.cardHolder}>{item.accountHolderName}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* FORM */}
          <View style={styles.sectionHeader}>
            <PlusIcon size={moderateScale(20)} color="#1a2e63" />
            <Text style={styles.sectionTitle}>Add New Bank Account</Text>
          </View>

          <View style={styles.formCard}>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACCOUNT HOLDER NAME</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94a3b8"
                value={accountHolderName}
                onChangeText={setAccountHolderName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="9–18 digit account number"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: horizontalScale(10) }]}>
                <Text style={styles.inputLabel}>IFSC CODE</Text>
                <TextInput 
                  style={[styles.textInput, { textTransform: 'uppercase' }]}
                  placeholder="SBIN0001234"
                  autoCapitalize="characters"
                  placeholderTextColor="#94a3b8"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>BANK NAME</Text>
                <TextInput 
                  style={styles.textInput}
                  placeholder="e.g. SBI / HDFC / ICICI"
                  placeholderTextColor="#94a3b8"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>
            </View>

            <View style={styles.securityBadge}>
              <ShieldCheckIcon size={moderateScale(16)} color="#059669" />
              <Text style={styles.securityText}>Encrypted & Secure</Text>
            </View>

            <TouchableOpacity 
              style={styles.mainButton} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Link Bank Account</Text>
                  <CheckCircleIcon size={moderateScale(22)} color="#fff" />
                </>
              )}
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreenWrapper>
  );
};

// ✅ YOUR ORIGINAL STYLES (UNCHANGED)
const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: horizontalScale(20), paddingBottom: verticalScale(40) },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(20), marginBottom: verticalScale(25) },
  iconCircle: { width: moderateScale(54), height: moderateScale(54), borderRadius: moderateScale(27), backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerText: { marginLeft: horizontalScale(15) },
  mainHeading: { fontSize: moderateScale(22), fontWeight: '900', color: '#1a2e63' },
  subHeading: { fontSize: moderateScale(12), color: '#64748b', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(15), marginTop: verticalScale(10) },
  sectionTitle: { fontSize: moderateScale(14), fontWeight: '800', color: '#1a2e63' },
  horizontalScroll: { marginHorizontal: horizontalScale(-20), paddingLeft: horizontalScale(20), marginBottom: verticalScale(25) },
  bankCard: { backgroundColor: '#1a2e63', width: horizontalScale(260), height: verticalScale(150), borderRadius: moderateScale(20), padding: moderateScale(20), marginRight: horizontalScale(15), justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { color: '#fff', fontSize: moderateScale(18), fontWeight: '700', marginTop: 4 },
  cardHolder: { color: '#fff', fontSize: moderateScale(13), fontWeight: '600' },
  emptyCard: { backgroundColor: '#e2e8f0', borderRadius: moderateScale(15), padding: moderateScale(30), alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontWeight: '700' },
  formCard: { backgroundColor: '#fff', borderRadius: moderateScale(24), padding: moderateScale(20) },
  inputGroup: { marginBottom: verticalScale(15) },
  inputLabel: { fontSize: moderateScale(10), fontWeight: '800', color: '#94a3b8', marginBottom: verticalScale(6) },
  textInput: { backgroundColor: '#f8fafc', borderRadius: moderateScale(12), paddingHorizontal: horizontalScale(15), paddingVertical: verticalScale(12), borderWidth: 1.5, borderColor: '#e2e8f0' },
  rowInputs: { flexDirection: 'row' },
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: verticalScale(15) },
  securityText: { fontSize: moderateScale(11), color: '#059669', marginLeft: 6 },
  mainButton: { backgroundColor: '#1a2e63', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(16), borderRadius: moderateScale(15) },
  buttonText: { color: '#fff', fontSize: moderateScale(16), fontWeight: 'bold', marginRight: 10 },
});

export default Wallet;