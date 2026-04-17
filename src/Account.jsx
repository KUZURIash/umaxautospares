import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, ScrollView, Dimensions, Alert, Image, Modal, Switch,
  ActivityIndicator, Platform
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

// 1. IMPORT SCALING TOOLS AND WRAPPER
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import SafeScreenWrapper from './components/SafeScreenWrapper'; 
import api from './api'; 

import {
  UserIcon, BuildingOfficeIcon, LockClosedIcon,
  TrashIcon, ChevronLeftIcon, PhotoIcon, PencilSquareIcon,
  EyeIcon, EyeSlashIcon, CheckBadgeIcon, GiftIcon,
  WalletIcon, LifebuoyIcon, DocumentTextIcon, ExclamationTriangleIcon
} from 'react-native-heroicons/outline';

const { width } = Dimensions.get('window');

const AccountScreen = ({ navigation, onLogout }) => {
  const [activeSection, setActiveSection] = useState('Profile');
  const [loading, setLoading] = useState(false); 
  const [fetchingUser, setFetchingUser] = useState(true);

  // Visibility / UI States
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Modals
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [showPhoneChangeModal, setShowPhoneChangeModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Form States
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [phoneForm, setPhoneForm] = useState({ widgetToken: '', currentPassword: '' });
  const [addressForm, setAddressForm] = useState({ label: '', street: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [otp, setOtp] = useState('');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: '', lastName: '', email: '', phone: '', aadhaarNumber: '',
    profileImage: null, businessName: '', businessStreet: '', businessCity: '',
    businessState: 'Maharashtra', businessPin: '', panNumber: '', gstin: '',
    tier: 'standard', customerId: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [premiumCoupons, setPremiumCoupons] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeSection === 'Coupons') {
      fetchCoupons();
    }
  }, [activeSection]);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      const u = response.data?.data?.user || response.data?.user;
      
      if (u) {
        const b = u.businessDetails || {};
        const ba = b.businessAddress || {}; 
        
        setProfileData({
          firstName: u.firstName || '', 
          lastName: u.lastName || '', 
          email: u.email || '',
          phone: u.phone || '', 
          aadhaarNumber: u.aadhaarNumber || '', 
          profileImage: u.avatar || null,
          businessName: b.businessName || '', 
          businessStreet: ba.street || '', 
          businessCity: ba.city || '',
          businessState: ba.state || 'Maharashtra', 
          businessPin: ba.postalCode || '',
          panNumber: b.panNumber || '', 
          gstin: b.gstin || '',
          tier: u.tier || 'standard',
          customerId: u.customerId || 'Not assigned'
        });
        if (u.addresses) setAddresses(u.addresses);
      }
    } catch (error) { 
      console.error("Fetch User Error:", error); 
    } finally { 
      setFetchingUser(false); 
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      // Hitting the verified premium endpoint
      const response = await api.get('/coupons/premium');
      const resData = response.data?.data || response.data;
      
      let list = [];
      if (Array.isArray(resData)) {
        list = resData;
      } else if (resData?.coupons && Array.isArray(resData.coupons)) {
        list = resData.coupons;
      }
      setPremiumCoupons(list);
    } catch (e) { 
      console.log("Coupon Fetch Error", e.message); 
      // Fallback logic
      try {
          const fallback = await api.get('/coupons/available');
          const fallbackData = fallback.data?.data?.coupons || fallback.data?.data || [];
          setPremiumCoupons(fallbackData.filter(c => c.premiumOnly === true));
      } catch (err) { setPremiumCoupons([]); }
    } finally {
      setLoading(false);
    }
  };

  const selectImageSource = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "Take Photo", onPress: () => handleImagePicker('camera') },
      { text: "Choose from Gallery", onPress: () => handleImagePicker('library') },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleImagePicker = async (type) => {
    const options = { mediaType: 'photo', quality: 0.6, includeBase64: true };
    const result = type === 'camera' ? await launchCamera(options) : await launchImageLibrary(options);
    if (result.didCancel || !result.assets) return;
    const file = result.assets[0];
    const base64Image = `data:${file.type || 'image/jpeg'};base64,${file.base64}`;

    setLoading(true);
    try {
      await api.patch('/auth/profile', { avatar: base64Image });
      setProfileData({ ...profileData, profileImage: base64Image });
      Alert.alert("Success", "Photo updated!");
    } catch (e) { Alert.alert("Upload Failed"); } finally { setLoading(false); }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await api.patch('/auth/profile', {
        firstName: profileData.firstName, lastName: profileData.lastName,
        phone: profileData.phone, aadhaarNumber: profileData.aadhaarNumber,
        avatar: profileData.profileImage
      });
      Alert.alert("Success", "Profile updated!");
    } catch (e) { Alert.alert("Error", "Update failed."); } 
    finally { setLoading(false); }
  };

  const handleUpdateBusiness = async () => {
    setLoading(true);
    try {
      await api.patch('/auth/profile', { 
        businessDetails: {
          businessName: profileData.businessName,
          businessAddress: {
            street: profileData.businessStreet, city: profileData.businessCity,
            state: profileData.businessState, postalCode: profileData.businessPin, country: 'India'
          },
          panNumber: profileData.panNumber, gstin: profileData.gstin
        }
      });
      Alert.alert("Success", "Business updated!");
      fetchUserData();
    } catch (e) { Alert.alert("Error", "Failed to update business."); } 
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      Alert.alert("Success", "Password changed!");
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { Alert.alert("Error", "Failed to change password."); } 
    finally { setLoading(false); }
  };

  const handleSaveAddress = async () => {
    setLoading(true);
    try {
      if (editingAddressId) await api.put(`/auth/addresses/${editingAddressId}`, addressForm);
      else await api.post('/auth/addresses', addressForm);
      setShowAddressModal(false);
      fetchUserData();
    } catch (e) { Alert.alert("Error", "Failed."); }
    finally { setLoading(false); }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/auth/addresses/${id}`);
      fetchUserData();
    } catch (e) { Alert.alert("Error", "Could not delete."); }
  };

  const handleRequestEmailChange = async () => {
    setLoading(true);
    try {
      await api.post('/auth/change-email-request', emailForm);
      setShowEmailChangeModal(false);
      setShowOtpModal(true);
    } catch (e) { Alert.alert("Error", "Failed."); } 
    finally { setLoading(false); }
  };

  const handleVerifyEmailChange = async () => {
    setLoading(true);
    try {
      await api.post('/auth/change-email-verify', { otp });
      setShowOtpModal(false);
      fetchUserData();
    } catch (e) { Alert.alert("Error", "Invalid OTP."); } 
    finally { setLoading(false); }
  };

  const handleChangePhone = async () => {
    setLoading(true);
    try {
      await api.post('/auth/change-phone', phoneForm);
      setShowPhoneChangeModal(false);
    } catch (e) { Alert.alert("Error", "Failed."); } 
    finally { setLoading(false); }
  };

  // --- RENDER SECTIONS ---
  const renderProfileSection = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.contentHeader}>
        <UserIcon size={moderateScale(20)} color="#2563EB" />
        <Text style={styles.contentTitle}>Profile Information</Text>
      </View>
      <TouchableOpacity style={styles.uploadBox} onPress={selectImageSource} disabled={loading}>
        {loading ? <ActivityIndicator color="#2563EB" /> : profileData.profileImage ? <Image source={{ uri: profileData.profileImage }} style={styles.fullImage} /> : <View style={styles.uploadPlaceholder}><PhotoIcon size={moderateScale(30)} color="#94a3b8" /><Text style={styles.uploadText}>Click to upload</Text></View>}
      </TouchableOpacity>
      <View style={styles.row}>
        <View style={styles.fieldGroup}><Text style={styles.label}>First Name</Text><TextInput style={styles.input} value={profileData.firstName} onChangeText={(t)=>setProfileData({...profileData, firstName:t})} /></View>
        <View style={styles.fieldGroup}><Text style={styles.label}>Last Name</Text><TextInput style={styles.input} value={profileData.lastName} onChangeText={(t)=>setProfileData({...profileData, lastName:t})} /></View>
      </View>
      <Text style={styles.label}>Email</Text>
      <View style={styles.inlineActionInput}><TextInput style={[styles.input, { flex: 1, backgroundColor:'#f1f5f9' }]} value={profileData.email} editable={false} /><TouchableOpacity style={styles.actionBtn} onPress={() => setShowEmailChangeModal(true)}><Text style={styles.actionBtnText}>Change</Text></TouchableOpacity></View>
      <Text style={styles.label}>Phone</Text>
      <View style={styles.inlineActionInput}><TextInput style={[styles.input, { flex: 1, backgroundColor: '#f1f5f9' }]} value={profileData.phone} editable={false} /><TouchableOpacity style={styles.actionBtn} onPress={() => setShowPhoneChangeModal(true)}><Text style={styles.actionBtnText}>Change</Text></TouchableOpacity></View>
      <Text style={styles.label}>Aadhaar Card Number</Text>
      <TextInput style={styles.input} value={profileData.aadhaarNumber} onChangeText={(t)=>setProfileData({...profileData, aadhaarNumber:t})} keyboardType="numeric" maxLength={12} />
      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}><Text style={styles.saveBtnText}>Save Changes</Text></TouchableOpacity>
    </ScrollView>
  );

  const renderAddressSection = () => (
    <View style={styles.contentFlex}>
      <View style={styles.addressHeaderRow}><Text style={styles.cardTitle}>My Addresses</Text><TouchableOpacity style={styles.addBtn} onPress={() => { setEditingAddressId(null); setAddressForm({label: '', street: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false}); setShowAddressModal(true); }}><Text style={styles.addBtnText}>+ Add New</Text></TouchableOpacity></View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {addresses.map((item) => (
          <View key={item._id} style={styles.addressCard}>
            <View style={{ flex: 1 }}><Text style={styles.addressLabelText}>{item.label}</Text><Text style={styles.addressDetailText}>{item.street}, {item.city} - {item.postalCode}</Text></View>
            <TouchableOpacity onPress={() => { setEditingAddressId(item._id); setAddressForm(item); setShowAddressModal(true); }}><PencilSquareIcon size={moderateScale(20)} color="#64748b" /></TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: horizontalScale(15) }} onPress={() => handleDeleteAddress(item._id)}><TrashIcon size={moderateScale(20)} color="#ef4444" /></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderBusinessSection = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.contentHeader}><BuildingOfficeIcon size={moderateScale(20)} color="#2563EB" /><Text style={styles.contentTitle}>Business Details</Text></View>
      <Text style={styles.label}>Business Name</Text>
      <TextInput style={styles.input} value={profileData.businessName} onChangeText={(t)=>setProfileData({...profileData, businessName:t})} />
      <Text style={styles.label}>Street Address</Text>
      <TextInput style={styles.input} value={profileData.businessStreet} onChangeText={(t)=>setProfileData({...profileData, businessStreet:t})} />
      <View style={styles.row}>
        <View style={styles.fieldGroup}><Text style={styles.label}>City</Text><TextInput style={styles.input} value={profileData.businessCity} onChangeText={(t)=>setProfileData({...profileData, businessCity:t})} /></View>
        <View style={styles.fieldGroup}><Text style={styles.label}>State</Text><TextInput style={styles.input} value={profileData.businessState} onChangeText={(t)=>setProfileData({...profileData, businessState:t})} /></View>
      </View>
      <Text style={styles.label}>PIN Code</Text>
      <TextInput style={styles.input} value={profileData.businessPin} onChangeText={(t)=>setProfileData({...profileData, businessPin:t})} keyboardType="numeric" />
      <Text style={styles.label}>PAN Number</Text>
      <TextInput style={styles.input} value={profileData.panNumber} onChangeText={(t)=>setProfileData({...profileData, panNumber:t.toUpperCase()})} />
      <Text style={styles.label}>GSTIN</Text>
      <TextInput style={styles.input} value={profileData.gstin} onChangeText={(t)=>setProfileData({...profileData, gstin:t.toUpperCase()})} />
      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateBusiness}><Text style={styles.saveBtnText}>Save Business Details</Text></TouchableOpacity>
    </ScrollView>
  );

  const renderSecuritySection = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.contentHeader}><LockClosedIcon size={moderateScale(20)} color="#2563EB" /><Text style={styles.contentTitle}>Change Password</Text></View>
      <Text style={styles.label}>Current Password</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput style={styles.passwordInput} secureTextEntry={!showCurrent} value={passwordForm.currentPassword} onChangeText={(t)=>setPasswordForm({...passwordForm, currentPassword: t})} />
        <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>{showCurrent ? <EyeSlashIcon size={moderateScale(20)} color="#64748b" /> : <EyeIcon size={moderateScale(20)} color="#64748b" />}</TouchableOpacity>
      </View>
      <Text style={styles.label}>New Password</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput style={styles.passwordInput} secureTextEntry={!showNew} value={passwordForm.newPassword} onChangeText={(t)=>setPasswordForm({...passwordForm, newPassword: t})} />
        <TouchableOpacity onPress={() => setShowNew(!showNew)}>{showNew ? <EyeSlashIcon size={moderateScale(20)} color="#64748b" /> : <EyeIcon size={moderateScale(20)} color="#64748b" />}</TouchableOpacity>
      </View>
      <Text style={styles.label}>Confirm New Password</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput style={styles.passwordInput} secureTextEntry={!showConfirm} value={passwordForm.confirmPassword} onChangeText={(t)=>setPasswordForm({...passwordForm, confirmPassword: t})} />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeSlashIcon size={moderateScale(20)} color="#64748b" /> : <EyeIcon size={moderateScale(20)} color="#64748b" />}</TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}><Text style={styles.saveBtnText}>Change Password</Text></TouchableOpacity>
    </ScrollView>
  );

  const renderCouponsSection = () => (
    <View style={{flex: 1}}>
      <View style={styles.contentHeader}><GiftIcon size={moderateScale(20)} color="#2563EB" /><Text style={styles.contentTitle}>Premium Coupons</Text></View>
      <Text style={styles.couponSubText}>Exclusive to premium users. Apply at checkout.</Text>
      <View style={loading ? styles.loaderBox : styles.couponPlaceholderBox}>
        {loading ? <ActivityIndicator color="#2563EB" size="large" /> : premiumCoupons.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false} style={{width: '100%'}}>
            {premiumCoupons.map((coupon, i) => (
              <View key={i} style={styles.couponCardStyle}>
                <View style={styles.couponHeaderRow}><Text style={styles.couponCodeText}>{coupon.code}</Text><View style={styles.premiumOnlyTag}><Text style={styles.premiumOnlyText}>Premium Only</Text></View></View>
                <Text style={styles.couponDiscountMain}>{coupon.discountText || 'Discount Applied'}</Text>
                <Text style={styles.couponDescriptionText}>{coupon.description}</Text>
                <View style={styles.couponFooter}>{coupon.conditions && coupon.conditions.map((cond, idx) => (<Text key={idx} style={styles.couponDetailText}>• {cond}</Text>))}</View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={{alignItems: 'center'}}><GiftIcon size={40} color="#cbd5e1" /><Text style={styles.noCouponText}>No premium coupons available.</Text><TouchableOpacity onPress={fetchCoupons} style={{marginTop: 10}}><Text style={{color: '#2563EB', fontWeight: 'bold'}}>Retry Fetch</Text></TouchableOpacity></View>
        )}
      </View>
    </View>
  );

  const isPremium = profileData.tier === 'premium';

  return (
    <SafeScreenWrapper backgroundColor="#f8fafc">
        <View style={styles.topBar}><TouchableOpacity onPress={() => navigation.navigate('MainApp')}><ChevronLeftIcon size={moderateScale(24)} color="#1e293b" /></TouchableOpacity><Text style={styles.topBarTitle}>My Account</Text></View>
        <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.gridContainer}>
            <View style={styles.sidebarCard}>
              <View style={styles.profileBrief}>
                <View style={styles.avatar}>
                   {profileData.profileImage ? <Image source={{ uri: profileData.profileImage }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{profileData.firstName[0]?.toUpperCase()}</Text>}
                </View>
                <View style={styles.profileText}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}><Text style={styles.userName}>{profileData.firstName} {profileData.lastName}</Text>{isPremium && <CheckBadgeIcon size={18} color="#2563EB" style={{marginLeft: 4}} />}</View>
                  <Text style={styles.customerIdText}>Customer ID: {profileData.customerId}</Text>
                  <Text style={styles.userEmail} numberOfLines={1}>{profileData.email}</Text>
                </View>
              </View>
              {isPremium && <View style={styles.premiumBadgeBanner}><CheckBadgeIcon size={16} color="#fff" /><Text style={styles.premiumBadgeText}>Premium Member</Text></View>}
              <View style={styles.menuItems}>
                <TouchableOpacity style={[styles.menuBtn, activeSection === 'Profile' && styles.menuBtnActive]} onPress={() => setActiveSection('Profile')}><UserIcon size={20} color={activeSection === 'Profile' ? "#2563EB" : "#64748b"} /><Text style={[styles.menuLabel, activeSection === 'Profile' && styles.menuLabelActive]}>Profile</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.menuBtn, activeSection === 'Address' && styles.menuBtnActive]} onPress={() => setActiveSection('Address')}><PencilSquareIcon size={20} color={activeSection === 'Address' ? "#2563EB" : "#64748b"} /><Text style={[styles.menuLabel, activeSection === 'Address' && styles.menuLabelActive]}>Address</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.menuBtn, activeSection === 'Business' && styles.menuBtnActive]} onPress={() => setActiveSection('Business')}><BuildingOfficeIcon size={20} color={activeSection === 'Business' ? "#2563EB" : "#64748b"} /><Text style={[styles.menuLabel, activeSection === 'Business' && styles.menuLabelActive]}>Business</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Wallet')}><WalletIcon size={20} color="#64748b" /><Text style={styles.menuLabel}>Wallet</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Support')}><LifebuoyIcon size={20} color="#64748b" /><Text style={styles.menuLabel}>Support</Text></TouchableOpacity>
                {isPremium && <TouchableOpacity style={[styles.menuBtn, activeSection === 'Coupons' && styles.menuBtnActive]} onPress={() => setActiveSection('Coupons')}><GiftIcon size={20} color={activeSection === 'Coupons' ? "#2563EB" : "#64748b"} /><Text style={[styles.menuLabel, activeSection === 'Coupons' && styles.menuLabelActive]}>Coupons</Text></TouchableOpacity>}
                <TouchableOpacity style={[styles.menuBtn, activeSection === 'Security' && styles.menuBtnActive]} onPress={() => setActiveSection('Security')}><LockClosedIcon size={20} color={activeSection === 'Security' ? "#2563EB" : "#64748b"} /><Text style={[styles.menuLabel, activeSection === 'Security' && styles.menuLabelActive]}>Security</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('TermsAndConditions')}><DocumentTextIcon size={20} color="#64748b" /><Text style={styles.menuLabel}>Terms & Conditions</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.menuBtn, {marginTop: 20, backgroundColor: '#fff1f2'}]} onPress={() => setShowLogoutModal(true)}><TrashIcon size={20} color="#ef4444" /><Text style={[styles.menuLabel, {color: '#ef4444'}]}>Logout</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.mainContentCard}>
               {activeSection === 'Profile' && renderProfileSection()}
               {activeSection === 'Address' && renderAddressSection()}
               {activeSection === 'Business' && renderBusinessSection()}
               {activeSection === 'Security' && renderSecuritySection()}
               {isPremium && activeSection === 'Coupons' && renderCouponsSection()}
            </View>
          </View>
        </ScrollView>

        {/* LOGOUT MODAL UI */}
        <Modal visible={showLogoutModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.logoutModalCard}>
                <View style={styles.logoutIconCircle}><ExclamationTriangleIcon size={30} color="#ef4444" /></View>
                <Text style={styles.modalTitle}>Confirm Logout</Text>
                <Text style={styles.modalSubText}>Are you sure you want to sign out of your account?</Text>
                <View style={styles.logoutButtonRow}>
                    <TouchableOpacity style={styles.cancelLogoutBtn} onPress={() => setShowLogoutModal(false)}><Text style={styles.cancelLogoutText}>Stay</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.confirmLogoutBtn} onPress={() => { setShowLogoutModal(false); onLogout(); }}><Text style={styles.confirmLogoutText}>Logout</Text></TouchableOpacity>
                </View>
            </View>
          </View>
        </Modal>

        {/* OTHER MODALS */}
        <Modal visible={showEmailChangeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}><View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Email</Text>
            <TextInput style={styles.input} placeholder="New Email" onChangeText={(t)=>setEmailForm({...emailForm, newEmail: t})} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={(t)=>setEmailForm({...emailForm, currentPassword: t})} />
            <View style={styles.buttonRow}><TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowEmailChangeModal(false)}><Text>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmBtn} onPress={handleRequestEmailChange}><Text style={{color:'#fff'}}>Send OTP</Text></TouchableOpacity></View>
          </View></View>
        </Modal>
        <Modal visible={showOtpModal} transparent animationType="fade">
          <View style={styles.modalOverlay}><View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <TextInput style={styles.input} placeholder="000000" keyboardType="numeric" maxLength={6} onChangeText={setOtp} />
            <View style={styles.buttonRow}><TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowOtpModal(false)}><Text>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmBtn} onPress={handleVerifyEmailChange}><Text style={{color:'#fff'}}>Verify</Text></TouchableOpacity></View>
          </View></View>
        </Modal>
        <Modal visible={showPhoneChangeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}><View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Phone</Text>
            <TextInput style={styles.input} placeholder="Widget Token" onChangeText={(t)=>setPhoneForm({...phoneForm, widgetToken: t})} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={(t)=>setPhoneForm({...phoneForm, currentPassword: t})} />
            <View style={styles.buttonRow}><TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowPhoneChangeModal(false)}><Text>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmBtn} onPress={handleChangePhone}><Text style={{color:'#fff'}}>Update</Text></TouchableOpacity></View>
          </View></View>
        </Modal>
        <Modal visible={showAddressModal} transparent animationType="fade">
          <View style={styles.modalOverlay}><View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</Text>
            <TextInput style={styles.input} placeholder="Label" onChangeText={(t)=>setAddressForm({...addressForm, label: t})} value={addressForm.label} />
            <TextInput style={styles.input} placeholder="Street" onChangeText={(t)=>setAddressForm({...addressForm, street: t})} value={addressForm.street} />
            <View style={styles.row}><TextInput style={[styles.input, {flex:1}]} placeholder="City" onChangeText={(t)=>setAddressForm({...addressForm, city: t})} value={addressForm.city} /><TextInput style={[styles.input, {flex:1}]} placeholder="State" onChangeText={(t)=>setAddressForm({...addressForm, state: t})} value={addressForm.state} /></View>
            <View style={styles.row}><TextInput style={[styles.input, {flex:1}]} placeholder="PIN" keyboardType="numeric" onChangeText={(t)=>setAddressForm({...addressForm, postalCode: t})} value={addressForm.postalCode} /><TextInput style={[styles.input, {flex:1}]} placeholder="Country" value="India" readOnly /></View>
            <View style={[styles.row, {alignItems:'center', marginTop: 10}]}><Text style={{color:'#1e293b'}}>Default Address</Text><Switch value={addressForm.isDefault} onValueChange={(v)=>setAddressForm({...addressForm, isDefault: v})} /></View>
            <View style={styles.buttonRow}><TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowAddressModal(false)}><Text>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.confirmBtn} onPress={handleSaveAddress}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity></View>
          </View></View>
        </Modal>
    </SafeScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginLeft: 12 },
  mainScroll: { padding: 16 },
  gridContainer: { flexDirection: width > 600 ? 'row' : 'column', gap: 16 },
  sidebarCard: { width: width > 600 ? '35%' : '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 16 },
  profileBrief: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e3a8a', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  profileText: { marginLeft: 12, flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  customerIdText: { fontSize: 11, color: '#64748b', marginVertical: 2 },
  userEmail: { fontSize: 11, color: '#94a3b8' },
  premiumBadgeBanner: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 15, gap: 8 },
  premiumBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  menuBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 12, marginBottom: 4 },
  menuBtnActive: { backgroundColor: '#eff6ff' },
  menuLabel: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  menuLabelActive: { color: '#2563EB', fontWeight: '700' },
  mainContentCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', minHeight: 480 },
  contentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  contentTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  couponSubText: { fontSize: 13, color: '#64748b', marginBottom: 15 },
  couponPlaceholderBox: { minHeight: 150 },
  noCouponText: { color: '#94a3b8', fontSize: 14, marginTop: 10 },
  couponCardStyle: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#dbeafe' },
  couponHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  couponCodeText: { fontSize: 16, fontWeight: '800', color: '#1d4ed8' },
  premiumOnlyTag: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  premiumOnlyText: { fontSize: 10, color: '#1d4ed8', fontWeight: '700' },
  couponDiscountMain: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  couponDescriptionText: { fontSize: 14, color: '#475569', marginVertical: 6 },
  couponFooter: { borderTopWidth: 1, borderTopColor: '#dbeafe', paddingTop: 8, marginTop: 4 },
  couponDetailText: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  loaderBox: { justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  uploadBox: { height: 100, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { fontSize: 14, color: '#64748b' },
  row: { flexDirection: 'row', gap: 15 },
  fieldGroup: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, color: '#1e293b', marginTop: 5, fontSize: 14 },
  passwordInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingRight: 12, marginTop: 5 },
  passwordInput: { flex: 1, padding: 12, color: '#1e293b', fontSize: 14 },
  inlineActionInput: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: { padding: 10 },
  actionBtnText: { color: '#2563EB', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2b3d8f', padding: 15, borderRadius: 10, marginTop: 30, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  addressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  addBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  addressCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  addressLabelText: { fontWeight: 'bold', color: '#1e293b' },
  addressDetailText: { color: '#64748b', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#fff', padding: 24, borderRadius: 16 },
  logoutModalCard: { width: '80%', backgroundColor: '#fff', padding: 24, borderRadius: 20, alignItems: 'center' },
  logoutIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalSubText: { textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 24 },
  logoutButtonRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelLogoutBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelLogoutText: { color: '#475569', fontWeight: '600' },
  confirmLogoutBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center' },
  confirmLogoutText: { color: '#fff', fontWeight: '600' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1e293b' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 25 },
  cancelBtn: { padding: 12, borderRadius: 8, backgroundColor: '#f1f5f9' },
  confirmBtn: { padding: 12, borderRadius: 8, backgroundColor: '#2b3d8f' }
});

export default AccountScreen;