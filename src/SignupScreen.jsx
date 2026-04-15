import React, { useState } from 'react';
import {
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator, 
  Keyboard
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

// Scaling and Wrapper Imports
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import SafeScreenWrapper from './components/SafeScreenWrapper'; 
import api from './api'; 

// Icons
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  PhoneIcon, 
  EyeIcon, 
  EyeSlashIcon,
  BuildingOfficeIcon, 
  IdentificationIcon, 
  MapPinIcon 
} from "react-native-heroicons/outline";

// Indian States Data for Dropdown
const stateData = [
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh' },
  { label: 'Assam', value: 'Assam' },
  { label: 'Bihar', value: 'Bihar' },
  { label: 'Chhattisgarh', value: 'Chhattisgarh' },
  { label: 'Goa', value: 'Goa' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Haryana', value: 'Haryana' },
  { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
  { label: 'Jharkhand', value: 'Jharkhand' },
  { label: 'Karnataka', value: 'Karnataka' },
  { label: 'Kerala', value: 'Kerala' },
  { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Manipur', value: 'Manipur' },
  { label: 'Meghalaya', value: 'Meghalaya' },
  { label: 'Mizoram', value: 'Mizoram' },
  { label: 'Nagaland', value: 'Nagaland' },
  { label: 'Odisha', value: 'Odisha' },
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Rajasthan', value: 'Rajasthan' },
  { label: 'Sikkim', value: 'Sikkim' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu' },
  { label: 'Telangana', value: 'Telangana' },
  { label: 'Tripura', value: 'Tripura' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'Uttarakhand', value: 'Uttarakhand' },
  { label: 'West Bengal', value: 'West Bengal' },
  // Union Territories
  { label: 'Andaman and Nicobar Islands', value: 'Andaman and Nicobar Islands' },
  { label: 'Chandigarh', value: 'Chandigarh' },
  { label: 'Dadra and Nagar Haveli and Daman and Diu', value: 'Dadra and Nagar Haveli and Daman and Diu' },
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Jammu and Kashmir', value: 'Jammu and Kashmir' },
  { label: 'Ladakh', value: 'Ladakh' },
  { label: 'Lakshadweep', value: 'Lakshadweep' },
  { label: 'Puducherry', value: 'Puducherry' },
];

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [secureText, setSecureText] = useState(true); 
  const [isFocus, setIsFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, type: 'success', message: '' });

  // Form State Initialization
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    aadhaarNumber: '',
    panNumber: '',
    gstin: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const showFeedback = (type, message) => {
    setFeedback({ visible: true, type, message });
    setTimeout(() => setFeedback(prev => ({ ...prev, visible: false })), 5000);
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateStepOne = () => {
    const { firstName, lastName, email, password, phone } = formData;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim() || !phone?.trim()) {
      showFeedback('error', "All fields marked with * are mandatory.");
      return false;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      showFeedback('error', "Please enter a valid email address.");
      return false;
    }
    if (phone.length < 10) {
      showFeedback('error', "Please enter a valid phone number.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    const { businessName, aadhaarNumber, panNumber, street, city, state, postalCode } = formData;
    
    if (!businessName?.trim() || !aadhaarNumber?.trim() || !panNumber?.trim() || 
        !street?.trim() || !city?.trim() || !state || !postalCode?.trim()) {
      showFeedback('error', "Please fill all mandatory business details.");
      return;
    }

    setLoading(true);

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      phone: formData.phone.trim(),
      aadhaarNumber: formData.aadhaarNumber.trim(),
      businessDetails: {
        businessName: formData.businessName.trim(),
        panNumber: formData.panNumber.toUpperCase().trim(),
        gstin: formData.gstin.trim() || undefined,
        businessAddress: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state,
          postalCode: formData.postalCode.trim(),
          country: "India"
        }
      }
    };

    try {
      const response = await api.post('/auth/register', payload);
      if (response.status === 201 || response.status === 200) {
        showFeedback('success', "Registration Successful! Redirecting...");
        setTimeout(() => navigation.navigate('Auth'), 2000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed.";
      showFeedback('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreenWrapper backgroundColor="#F4F7FF">
      {feedback.visible && (
        <View style={[styles.banner, feedback.type === 'success' ? styles.successBanner : styles.errorBanner]}>
          <Text style={styles.bannerText}>{feedback.message}</Text>
        </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.headerTitle}>Create account</Text>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, step >= 1 ? styles.progressActive : styles.progressInactive]} />
            <View style={[styles.progressBar, step === 2 ? styles.progressActive : styles.progressInactive]} />
          </View>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Text style={styles.stepTitle}>Step 1: Account Info</Text>
                <Text style={styles.stepSubtitle}>Let's start with the basics.</Text>

                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, { flex: 1, marginRight: horizontalScale(8) }]}>
                    <UserIcon size={moderateScale(18)} color="#94a3b8" />
                    <TextInput 
                        style={styles.input} 
                        placeholder="First" 
                        placeholderTextColor="#94a3b8"
                        value={formData.firstName} 
                        onChangeText={(v) => handleInputChange('firstName', v)} 
                    />
                  </View>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Last" 
                        placeholderTextColor="#94a3b8"
                        value={formData.lastName} 
                        onChangeText={(v) => handleInputChange('lastName', v)} 
                    />
                  </View>
                </View>

                <Text style={styles.label}>Email *</Text>
                <View style={styles.inputWrapper}>
                  <EnvelopeIcon size={moderateScale(18)} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="you@example.com" 
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address" 
                    autoCapitalize="none"
                    value={formData.email} 
                    onChangeText={(v) => handleInputChange('email', v)} 
                  />
                </View>

                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputWrapper}>
                  <LockClosedIcon size={moderateScale(18)} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={secureText} 
                    value={formData.password} 
                    onChangeText={(v) => handleInputChange('password', v)} 
                  />
                  <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                    {secureText ? <EyeIcon size={moderateScale(20)} color="#94a3b8" /> : <EyeSlashIcon size={moderateScale(20)} color="#283593" />}
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.inputWrapper}>
                  <PhoneIcon size={moderateScale(18)} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="9876543210" 
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={formData.phone} 
                    onChangeText={(v) => handleInputChange('phone', v)} 
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={() => validateStepOne() && setStep(2)}>
                  <Text style={styles.btnText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Step 2: Business Details</Text>
                <Text style={styles.stepSubtitle}>Required for B2B transactions.</Text>

                <Text style={styles.label}>Company / Shop Name *</Text>
                <View style={styles.inputWrapper}>
                  <BuildingOfficeIcon size={moderateScale(18)} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Business Name" 
                    placeholderTextColor="#94a3b8"
                    value={formData.businessName} 
                    onChangeText={(v) => handleInputChange('businessName', v)} 
                  />
                </View>

                <Text style={styles.label}>Aadhaar Number *</Text>
                <View style={styles.inputWrapper}>
                  <IdentificationIcon size={moderateScale(18)} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="12-digit number" 
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric" 
                    maxLength={12} 
                    value={formData.aadhaarNumber} 
                    onChangeText={(v) => handleInputChange('aadhaarNumber', v)} 
                  />
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: horizontalScale(8) }}>
                    <Text style={styles.label}>PAN *</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput 
                        style={styles.inputStyleFlat} 
                        placeholder="ABCDE1234F" 
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters" 
                        maxLength={10} 
                        value={formData.panNumber} 
                        onChangeText={(v) => handleInputChange('panNumber', v)} 
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>GSTIN</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput 
                        style={styles.inputStyleFlat} 
                        placeholder="Optional" 
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters" 
                        value={formData.gstin} 
                        onChangeText={(v) => handleInputChange('gstin', v)} 
                      />
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Full Address *</Text>
                <View style={styles.inputWrapper}>
                  <MapPinIcon size={moderateScale(18)} color="#94a3b8" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Building, Street, Area" 
                    placeholderTextColor="#94a3b8"
                    value={formData.street} 
                    onChangeText={(v) => handleInputChange('street', v)} 
                  />
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: horizontalScale(8) }}>
                      <Text style={styles.label}>City *</Text>
                      <View style={styles.inputWrapper}>
                         <TextInput 
                          style={styles.inputStyleFlat} 
                          placeholder="City" 
                          placeholderTextColor="#94a3b8"
                          value={formData.city} 
                          onChangeText={(v) => handleInputChange('city', v)} 
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>State *</Text>
                      <Dropdown
                        style={[styles.dropdown, isFocus && { borderColor: '#283593' }]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        data={stateData}
                        maxHeight={250}
                        labelField="label"
                        valueField="value"
                        placeholder="Select"
                        value={formData.state}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={item => {
                          handleInputChange('state', item.value);
                          setIsFocus(false);
                        }}
                      />
                    </View>
                </View>
                
                <View style={{ width: '50%' }}>
                  <Text style={styles.label}>PIN Code *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput 
                      style={styles.inputStyleFlat} 
                      placeholder="6 Digits" 
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric" 
                      maxLength={6} 
                      value={formData.postalCode} 
                      onChangeText={(v) => handleInputChange('postalCode', v)} 
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.primaryBtn, loading && { opacity: 0.7 }]} 
                  onPress={handleRegister} 
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Complete Registration</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Back to Step 1</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={styles.footerLink}>
              <Text style={styles.footerText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { 
    paddingHorizontal: horizontalScale(20), 
    paddingBottom: verticalScale(40), 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: moderateScale(26), 
    fontWeight: '800', 
    color: '#001A3D', 
    marginBottom: verticalScale(12), 
    marginTop: verticalScale(100) 
  },
  progressContainer: { 
    flexDirection: 'row', 
    width: horizontalScale(90), 
    justifyContent: 'space-between', 
    marginBottom: verticalScale(20) 
  },
  progressBar: { 
    height: verticalScale(6), 
    width: horizontalScale(42), 
    borderRadius: moderateScale(10) 
  },
  progressActive: { backgroundColor: '#283593' },
  progressInactive: { backgroundColor: '#E2E8F0' },
  card: { 
    backgroundColor: '#fff', 
    width: '100%', 
    padding: horizontalScale(20), 
    borderRadius: moderateScale(20), 
    borderWidth: 1, 
    borderColor: '#EDF2F7',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  stepTitle: { 
    fontSize: moderateScale(18), 
    fontWeight: '700', 
    color: '#1A202C', 
    textAlign: 'center' 
  },
  stepSubtitle: { 
    fontSize: moderateScale(13), 
    color: '#718096', 
    textAlign: 'center', 
    marginBottom: verticalScale(16), 
    marginTop: verticalScale(4) 
  },
  label: { 
    fontSize: moderateScale(13), 
    fontWeight: '600', 
    color: '#4A5568', 
    marginBottom: verticalScale(6), 
    marginTop: verticalScale(10) 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: moderateScale(12), 
    paddingHorizontal: horizontalScale(12), 
    height: verticalScale(48), 
    backgroundColor: '#fff' 
  },
  input: { 
    flex: 1, 
    marginLeft: horizontalScale(10), 
    fontSize: moderateScale(14), 
    color: '#2D3748' 
  },
  inputStyleFlat: { 
    flex: 1, 
    fontSize: moderateScale(14), 
    color: '#2D3748' 
  },
  row: { 
    flexDirection: 'row', 
    marginTop: verticalScale(2) 
  },
  dropdown: { 
    height: verticalScale(48), 
    borderColor: '#E2E8F0', 
    borderWidth: 1, 
    borderRadius: moderateScale(12), 
    paddingHorizontal: horizontalScale(12), 
    backgroundColor: '#fff' 
  },
  placeholderStyle: { 
    fontSize: moderateScale(14), 
    color: '#94a3b8' 
  },
  selectedTextStyle: { 
    fontSize: moderateScale(14), 
    color: '#2D3748' 
  },
  primaryBtn: { 
    backgroundColor: '#283593', 
    height: verticalScale(52), 
    borderRadius: moderateScale(14), 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: verticalScale(25) 
  },
  btnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: moderateScale(16) 
  },
  backBtn: { 
    marginTop: verticalScale(15), 
    alignSelf: 'center' 
  },
  backBtnText: { 
    color: '#283593', 
    fontWeight: '700', 
    fontSize: moderateScale(14) 
  },
  footerLink: { 
    marginTop: verticalScale(20), 
    alignItems: 'center' 
  },
  footerText: { 
    color: '#718096', 
    fontSize: moderateScale(13) 
  },
  linkBold: { 
    color: '#283593', 
    fontWeight: '700' 
  },
  banner: { 
    position: 'absolute', 
    top: verticalScale(50), 
    left: horizontalScale(20), 
    right: horizontalScale(20), 
    padding: horizontalScale(12), 
    borderRadius: moderateScale(10), 
    zIndex: 2000,
    elevation: 10
  },
  successBanner: { backgroundColor: '#38A169' },
  errorBanner: { backgroundColor: '#E53E3E' },
  bannerText: { 
    color: '#fff', 
    fontWeight: '600', 
    textAlign: 'center', 
    fontSize: moderateScale(12) 
  }
});