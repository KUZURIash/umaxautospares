import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';

const BASE_URL = 'https://backend.umaxautospares.com/api/v1';

const AddressScreen = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [addresses, setAddresses] = useState([]); // Array to store saved addresses

  // Form State
  const [newAddress, setNewAddress] = useState({
    addressType: '',
    street: '',
    city: 'Mumbai',
    state: '',
    pinCode: '',
    country: 'India',
    isDefault: false,
  });

  // API Call: Add New Address
  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.pinCode) {
      return Alert.alert('Error', 'Please fill in required fields.');
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_TOKEN_HERE' // Add if your API requires login
        },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        const result = await response.json();
        setAddresses([...addresses, newAddress]); // Update local list
        setShowModal(false);
        Alert.alert('Success', 'Address added successfully!');
        // Reset form
        setNewAddress({
          addressType: '',
          street: '',
          city: 'Mumbai',
          state: '',
          pinCode: '',
          country: 'India',
          isDefault: false,
        });
      } else {
        Alert.alert('Error', 'Failed to save address.');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header matching your UMAX design */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.headerTitle}>My Addresses</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
          </View>
        ) : (
          addresses.map((item, index) => (
            <View key={index} style={styles.addressCard}>
              <Text style={styles.typeLabel}>{item.addressType || 'Home'}</Text>
              <Text style={styles.addressText}>
                {item.street}, {item.city}, {item.pinCode}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Address Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Home, Office"
                onChangeText={val =>
                  setNewAddress({ ...newAddress, addressType: val })
                }
              />

              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main St, Apt 4B"
                onChangeText={val =>
                  setNewAddress({ ...newAddress, street: val })
                }
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.city}
                    editable={false}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Select State"
                    onChangeText={val =>
                      setNewAddress({ ...newAddress, state: val })
                    }
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>PIN Code</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="6-digit PIN"
                    onChangeText={val =>
                      setNewAddress({ ...newAddress, pinCode: val })
                    }
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Country</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.country}
                    editable={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddAddress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Add Address</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 10, fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  addButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: { color: '#333', fontWeight: '500' },
  listContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  emptyState: { alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },
  addressCard: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  typeLabel: { fontWeight: 'bold', marginBottom: 5, color: '#1A237E' },
  addressText: { color: '#666' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { fontSize: 20, color: '#999' },
  label: { fontSize: 13, color: '#666', marginTop: 15, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  saveBtn: {
    backgroundColor: '#1A237E',
    padding: 16,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { marginTop: 15, alignItems: 'center', marginBottom: 20 },
  cancelBtnText: { color: '#666' },
});

export default AddressScreen;
