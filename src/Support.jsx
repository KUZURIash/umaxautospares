import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  StatusBar, Modal, ActivityIndicator, Alert, Platform, KeyboardAvoidingView
} from 'react-native';

// --- Scaling & Wrapper ---
import api from './api';
import SafeScreenWrapper from './components/SafeScreenWrapper';
import { horizontalScale, verticalScale, moderateScale } from './components/scaling';

// --- Icons ---
import {
  LifebuoyIcon, ChevronRightIcon, CheckCircleIcon,
  PaperAirplaneIcon, ClockIcon, FunnelIcon, XMarkIcon,
  TicketIcon, ChatBubbleLeftRightIcon, ChevronDownIcon
} from 'react-native-heroicons/outline';
import { CheckIcon, PlusCircleIcon as PlusSolid } from 'react-native-heroicons/solid';

const COLORS = {
  primary: '#1a2e63',
  secondary: '#2563eb',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textMain: '#1E293B',
  textMuted: '#64748B',
  inputBg: '#F1F5F9',
  danger: '#dc2626',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  warning: '#92400e',
  warningLight: '#fef3c7'
};

// --- Sub-components ---

const RaiseTicketContent = ({
  subject, setSubject, description, setDescription, category, priority, openDropdown, handleCreateTicket, loading
}) => (
  <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
    <View style={styles.formCard}>
      <View style={styles.cardHeaderInline}>
        <PlusSolid size={moderateScale(20)} color={COLORS.primary} />
        <Text style={styles.cardHeaderTitle}>Raise New Ticket</Text>
      </View>

      <Text style={styles.fieldLabel}>Subject</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Brief summary of the issue" 
        placeholderTextColor="#94A3B8" 
        value={subject} 
        onChangeText={setSubject} 
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: horizontalScale(12) }}>
          <Text style={styles.fieldLabel}>Category</Text>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={() => openDropdown('category')}>
            <Text style={styles.dropdownValue}>{category}</Text>
            <ChevronDownIcon size={moderateScale(16)} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Priority</Text>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={() => openDropdown('priority')}>
            <Text style={styles.dropdownValue}>{priority}</Text>
            <ChevronDownIcon size={moderateScale(16)} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Provide as much detail as possible..." 
        multiline 
        value={description} 
        onChangeText={setDescription} 
        placeholderTextColor="#94A3B8" 
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTicket} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit Ticket</Text>}
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const MyTicketsContent = ({ tickets, loading, fetchTickets, onSelectTicket }) => (
  <View style={styles.tabContent}>
    <View style={styles.listHeader}>
      <Text style={styles.countText}>{tickets.length} Active Tickets</Text>
      <TouchableOpacity onPress={fetchTickets}>
        <Text style={styles.refreshLink}>Refresh</Text>
      </TouchableOpacity>
    </View>
    
    {loading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: verticalScale(20) }} />}
    
    <ScrollView showsVerticalScrollIndicator={false}>
      {tickets.length === 0 && !loading ? (
        <View style={styles.emptyState}>
           <TicketIcon size={moderateScale(48)} color={COLORS.border} />
           <Text style={styles.emptyStateText}>No tickets found.</Text>
        </View>
      ) : (
        tickets.map((item, index) => (
          <TouchableOpacity
            key={item._id || index}
            style={styles.ticketCard}
            onPress={() => onSelectTicket(item)}
          >
            <View style={styles.ticketCardHeader}>
              <Text style={styles.ticketIdText}>{item.ticketNumber || `TKT-${index + 1}`}</Text>
              <View style={[styles.statusTag, { backgroundColor: item.status === 'closed' ? COLORS.inputBg : '#DBEAFE' }]}>
                <Text style={[styles.statusTagText, { color: item.status === 'closed' ? COLORS.textMuted : COLORS.secondary }]}>
                  {item.status?.toUpperCase() || 'OPEN'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.ticketSubjectText} numberOfLines={1}>{item.subject}</Text>
            
            <View style={styles.ticketCardFooter}>
              <View style={styles.metaRow}>
                <ClockIcon size={moderateScale(12)} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</Text>
              </View>
              <ChevronRightIcon size={moderateScale(16)} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  </View>
);

const ChatContent = ({ ticket, reply, setReply, onSendReply, onCloseTicket, loading }) => {
  if (!ticket) return (
    <View style={styles.emptyState}>
      <ChatBubbleLeftRightIcon size={moderateScale(48)} color={COLORS.border} />
      <Text style={styles.emptyStateText}>Select a ticket to start chatting.</Text>
    </View>
  );

  const isClosed = ticket.status?.toLowerCase() === 'closed';

  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeaderInfo}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, marginRight: horizontalScale(10) }}>
            <Text style={styles.ticketIdText}>{ticket.ticketNumber || 'Ticket Detail'}</Text>
            <Text style={styles.chatTitle} numberOfLines={1}>{ticket.subject}</Text>
          </View>
          
          {!isClosed && (
            <TouchableOpacity style={styles.textCloseBtn} onPress={onCloseTicket}>
              <Text style={styles.textCloseBtnText}>Close Ticket</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.metaRow, { marginTop: verticalScale(10) }]}>
          <View style={styles.infoPill}><Text style={styles.infoPillText}>{ticket.category}</Text></View>
          <View style={[styles.infoPill, { backgroundColor: COLORS.warningLight }]}><Text style={[styles.infoPillText, {color: COLORS.warning}]}>{ticket.priority}</Text></View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: verticalScale(20) }}>
        {ticket.messages?.map((msg, idx) => {
          const isMe = msg.senderType === 'user';
          return (
            <View key={idx} style={[styles.msgWrapper, isMe ? styles.msgMe : styles.msgAdmin]}>
               <View style={styles.msgHeader}>
                  <Text style={[styles.msgUser, !isMe && {color: COLORS.textMuted}]}>{isMe ? 'You' : 'Support'}</Text>
                  <Text style={[styles.msgDate, !isMe && {color: COLORS.textMuted}]}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
               </View>
               <Text style={[styles.msgBody, !isMe && {color: COLORS.textMain}]}>{msg.message}</Text>
            </View>
          );
        })}
      </ScrollView>

      {!isClosed ? (
        <View style={styles.inputArea}>
          <TextInput
            style={styles.chatInput}
            placeholder="Write a reply..."
            multiline
            value={reply}
            onChangeText={setReply}
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity 
            style={[styles.sendIconBtn, { backgroundColor: !reply.trim() ? COLORS.border : COLORS.primary }]} 
            onPress={onSendReply} 
            disabled={loading || !reply.trim()}
          >
            {loading ? <ActivityIndicator size="small" color="white" /> : <PaperAirplaneIcon size={moderateScale(20)} color="white" />}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.closedNotice}>
          <Text style={styles.closedNoticeText}>This ticket has been resolved and closed.</Text>
        </View>
      )}
    </View>
  );
};

// --- Main Support Component ---

const Support = () => {
  const [activeTab, setActiveTab] = useState('Raise');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [priority, setPriority] = useState('Medium');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tickets/me?page=1&limit=50');
      const data = response.data?.data?.tickets || response.data?.tickets || response.data?.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Fetch Error:", error.message);
    } finally { setLoading(false); }
  };

  const handleSelectTicket = async (ticket) => {
    setLoading(true);
    try {
      const res = await api.get(`/tickets/me/${ticket._id}`);
      const ticketData = res.data?.data?.ticket || res.data?.ticket || res.data;
      setSelectedTicket(ticketData);
      setActiveTab('Chats');
    } catch (e) {
      setSelectedTicket(ticket); 
      setActiveTab('Chats');
    } finally { setLoading(false); }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    setLoading(true);
    try {
      await api.post(`/tickets/me/${selectedTicket._id}/reply`, { message: replyMessage });
      setReplyMessage('');
      handleSelectTicket(selectedTicket); 
    } catch (e) {
      Alert.alert("Error", "Failed to send reply");
    } finally { setLoading(false); }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    Alert.alert("Resolve Ticket", "Mark this issue as resolved and close the ticket?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes, Resolve", onPress: async () => {
          setLoading(true);
          try {
            await api.patch(`/tickets/me/${selectedTicket._id}/close`);
            fetchTickets();
            setActiveTab('Tickets');
          } catch (e) {
            Alert.alert("Error", "Failed to close ticket");
          } finally { setLoading(false); }
      }}
    ]);
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert("Required", "Please provide a subject and description.");
      return;
    }
    setLoading(true);
    try {
      const ticketData = { 
        subject: subject.trim(), 
        description: description.trim(), 
        category: category.toLowerCase(), 
        priority: priority.toLowerCase() 
      };
      await api.post('/tickets', ticketData);
      Alert.alert("Success", "Ticket created successfully.");
      setSubject(''); setDescription('');
      fetchTickets();
      setActiveTab('Tickets');
    } catch (error) {
      Alert.alert("Error", "Failed to create ticket.");
    } finally { setLoading(false); }
  };

  return (
    <SafeScreenWrapper backgroundColor={COLORS.background}>
      <StatusBar barStyle="dark-content" />
      
      <Modal transparent visible={modalVisible} animationType="slide">
        <TouchableOpacity style={styles.modalBlur} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Select {modalType}</Text></View>
            {(modalType === 'category' ? ['Order', 'Payment', 'Product', 'Shipping', 'Account', 'Technical', 'Other'] : ['Low', 'Medium', 'High', 'Urgent']).map((opt) => (
              <TouchableOpacity 
                key={opt} 
                style={styles.modalOption} 
                onPress={() => { modalType === 'category' ? setCategory(opt) : setPriority(opt); setModalVisible(false); }}
              >
                <Text style={[(modalType === 'category' ? category : priority) === opt ? styles.optionTextActive : styles.optionText]}>{opt}</Text>
                {(modalType === 'category' ? category : priority) === opt && <CheckIcon size={moderateScale(20)} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <LifebuoyIcon size={moderateScale(26)} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Support Center</Text>
        </View>
        <View style={styles.tabBar}>
          {['Raise', 'Tickets', 'Chats'].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'Raise' ? 'New' : tab === 'Tickets' ? 'My Tickets' : 'Chat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
            {activeTab === 'Raise' && (
              <RaiseTicketContent subject={subject} setSubject={setSubject} description={description} setDescription={setDescription} category={category} priority={priority} openDropdown={(t) => { setModalType(t); setModalVisible(true); }} handleCreateTicket={handleCreateTicket} loading={loading} />
            )}
            {activeTab === 'Tickets' && (
              <MyTicketsContent tickets={tickets} loading={loading} fetchTickets={fetchTickets} onSelectTicket={handleSelectTicket} />
            )}
            {activeTab === 'Chats' && (
              <ChatContent ticket={selectedTicket} reply={replyMessage} setReply={setReplyMessage} onSendReply={handleSendReply} onCloseTicket={handleCloseTicket} loading={loading} />
            )}
        </View>
      </KeyboardAvoidingView>
    </SafeScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.card, paddingHorizontal: horizontalScale(20), borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: verticalScale(10) },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(15) },
  headerTitle: { fontSize: moderateScale(22), fontWeight: '900', color: COLORS.primary, marginLeft: horizontalScale(10), letterSpacing: -0.5 },
  tabBar: { flexDirection: 'row', gap: horizontalScale(25) },
  tabItem: { paddingBottom: verticalScale(12), borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: moderateScale(14), fontWeight: '700', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  body: { flex: 1 },
  tabContent: { flex: 1, padding: moderateScale(20) },
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Form
  formCard: { backgroundColor: COLORS.card, borderRadius: moderateScale(16), padding: moderateScale(20), borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: moderateScale(10), elevation: 2 },
  cardHeaderInline: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(15), gap: horizontalScale(8) },
  cardHeaderTitle: { fontSize: moderateScale(18), fontWeight: '800', color: COLORS.textMain },
  fieldLabel: { fontSize: moderateScale(13), fontWeight: '800', color: COLORS.textMain, marginBottom: verticalScale(8), marginTop: verticalScale(16), textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.inputBg, borderRadius: moderateScale(10), padding: moderateScale(14), color: COLORS.textMain, fontSize: moderateScale(15), borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: verticalScale(120), textAlignVertical: 'top' },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.inputBg, padding: moderateScale(14), borderRadius: moderateScale(10), borderWidth: 1, borderColor: COLORS.border },
  dropdownValue: { fontSize: moderateScale(15), color: COLORS.textMain, fontWeight: '500' },
  submitBtn: { backgroundColor: COLORS.primary, padding: moderateScale(18), borderRadius: moderateScale(14), marginTop: verticalScale(30), alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: moderateScale(16) },

  // List
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(15), alignItems: 'center' },
  countText: { color: COLORS.textMuted, fontSize: moderateScale(13), fontWeight: '600' },
  refreshLink: { color: COLORS.secondary, fontSize: moderateScale(13), fontWeight: '800' },
  ticketCard: { backgroundColor: COLORS.card, borderRadius: moderateScale(14), padding: moderateScale(16), marginBottom: verticalScale(12), borderWidth: 1, borderColor: COLORS.border },
  ticketCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(8) },
  ticketIdText: { fontWeight: '900', color: COLORS.textMain, fontSize: moderateScale(14), opacity: 0.8 },
  statusTag: { paddingHorizontal: horizontalScale(10), paddingVertical: verticalScale(4), borderRadius: moderateScale(8) },
  statusTagText: { fontSize: moderateScale(11), fontWeight: '900' },
  ticketSubjectText: { fontSize: moderateScale(16), fontWeight: '700', color: COLORS.textMain, marginBottom: verticalScale(12) },
  ticketCardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.inputBg, paddingTop: verticalScale(12) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: horizontalScale(6) },
  metaText: { fontSize: moderateScale(12), color: COLORS.textMuted, fontWeight: '500' },

  // Chat
  chatContainer: { flex: 1, padding: moderateScale(16) },
  chatHeaderInfo: { marginBottom: verticalScale(15), backgroundColor: COLORS.card, padding: moderateScale(15), borderRadius: moderateScale(16), borderWidth: 1, borderColor: COLORS.border },
  chatTitle: { fontSize: moderateScale(18), fontWeight: '800', color: COLORS.textMain },
  textCloseBtn: { paddingHorizontal: horizontalScale(12), paddingVertical: verticalScale(6), backgroundColor: COLORS.dangerLight, borderRadius: moderateScale(8), borderWidth: 1, borderColor: '#FCA5A5' },
  textCloseBtnText: { color: COLORS.danger, fontWeight: '800', fontSize: moderateScale(12) },
  infoPill: { backgroundColor: '#DBEAFE', paddingHorizontal: horizontalScale(10), paddingVertical: verticalScale(4), borderRadius: moderateScale(20), marginRight: horizontalScale(8) },
  infoPillText: { fontSize: moderateScale(11), fontWeight: '800', color: '#1E40AF' },
  msgWrapper: { maxWidth: '85%', padding: moderateScale(14), borderRadius: moderateScale(18), marginBottom: verticalScale(16) },
  msgMe: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: moderateScale(4) },
  msgAdmin: { alignSelf: 'flex-start', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: moderateScale(4) },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(6) },
  msgUser: { fontSize: moderateScale(11), fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  msgDate: { fontSize: moderateScale(10), color: 'rgba(255,255,255,0.5)' },
  msgBody: { fontSize: moderateScale(14), color: 'white', lineHeight: verticalScale(20), fontWeight: '500' },
  inputArea: { backgroundColor: COLORS.card, padding: moderateScale(10), borderRadius: moderateScale(20), borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: horizontalScale(10) },
  chatInput: { flex: 1, maxHeight: verticalScale(100), fontSize: moderateScale(15), color: COLORS.textMain, paddingHorizontal: horizontalScale(10) },
  sendIconBtn: { width: horizontalScale(44), height: horizontalScale(44), borderRadius: horizontalScale(22), justifyContent: 'center', alignItems: 'center' },
  closedNotice: { backgroundColor: COLORS.inputBg, padding: moderateScale(20), borderRadius: moderateScale(16), alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border },
  closedNoticeText: { color: COLORS.textMuted, fontWeight: '700', fontSize: moderateScale(14) },

  // Modal
  modalBlur: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: moderateScale(30), borderTopRightRadius: moderateScale(30), padding: moderateScale(25), paddingBottom: verticalScale(50) },
  modalHeader: { alignItems: 'center', marginBottom: verticalScale(20) },
  modalTitle: { fontSize: moderateScale(17), fontWeight: '900', color: COLORS.textMain, textTransform: 'uppercase' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: verticalScale(18), borderBottomWidth: 1, borderBottomColor: COLORS.inputBg },
  optionText: { fontSize: moderateScale(16), color: COLORS.textMuted, fontWeight: '500' },
  optionTextActive: { fontSize: moderateScale(16), fontWeight: '800', color: COLORS.primary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.4 },
  emptyStateText: { marginTop: verticalScale(12), color: COLORS.textMuted, fontWeight: '700' }
});

export default Support;