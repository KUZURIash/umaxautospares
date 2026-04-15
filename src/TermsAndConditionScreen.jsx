import React from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  TouchableOpacity, Platform, StatusBar
} from 'react-native';
import { 
  ScaleIcon, 
  InformationCircleIcon, 
  UserGroupIcon, 
  CubeIcon, 
  CreditCardIcon, 
  TruckIcon, 
  ArrowPathRoundedSquareIcon, 
  ShieldCheckIcon, 
  IdentificationIcon, 
  ExclamationTriangleIcon,
  GlobeAltIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon
} from "react-native-heroicons/outline";

// Import your scaling tools and wrapper
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import SafeScreenWrapper from './components/SafeScreenWrapper'; 

const sections = [
  { id: 1, title: 'Company Information', icon: InformationCircleIcon, content: 'Umax Auto Spares Private Limited is engaged in the trading and manufacturing of premium two-wheeler spare parts. Our products include but are not limited to horns, ball bearings, brake shoes, clutch plates, mirrors, and various other motorcycle components.' },
  { id: 2, title: 'Eligibility', icon: UserGroupIcon, content: 'You must be at least 18 years of age to use our services or place an order. For business accounts (B2B), you must have valid business credentials including GSTIN for verification purposes.' },
  { id: 3, title: 'Product Information', icon: CubeIcon, content: 'We strive to provide accurate product details including descriptions, specifications, images, and pricing. However, we do not warrant that product descriptions are error-free, complete, or current.' },
  { id: 4, title: 'Orders & Payment', icon: CreditCardIcon, content: 'All orders placed are subject to availability and confirmation. We accept payments through UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) in select locations.' },
  { id: 5, title: 'Shipping & Delivery', icon: TruckIcon, content: 'Orders are processed within 1-2 business days. Delivery timelines range from 2-10 days depending on your location and courier availability across India.' },
  { id: 6, title: 'Returns & Cancellations', icon: ArrowPathRoundedSquareIcon, content: 'You may cancel an order before dispatch. Returns are accepted within 7 days of delivery for unused, undamaged products in original packaging.' },
  { id: 7, title: 'Warranty', icon: ShieldCheckIcon, content: 'Certain products carry a limited manufacturer\'s warranty. Warranty claims require proof of purchase. Please contact our support team for issue resolution.' },
  { id: 8, title: 'Intellectual Property', icon: IdentificationIcon, content: 'All content, logos, product images, and trademarks on this website are the property of Umax Auto Spares Private Limited. Unauthorized use is strictly prohibited.' },
  { id: 9, title: 'Limitation of Liability', icon: ExclamationTriangleIcon, content: 'Umax Auto Spares Private Limited shall not be liable for any indirect, incidental, or special damages arising from the use of our products or platform.' },
  { id: 10, title: 'Governing Law', icon: GlobeAltIcon, content: 'These terms and conditions shall be governed by and construed in accordance with the laws of India. Disputes shall be subject to the jurisdiction of courts in Noida, Uttar Pradesh.' },
];

export default function TermsAndConditionsScreen({ navigation }) {
  return (
    <SafeScreenWrapper backgroundColor="#F8FAFF">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFF" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.legalBadge}>
             <ScaleIcon size={moderateScale(16)} color="#283593" />
             <Text style={styles.legalBadgeText}>Legal</Text>
          </View>
          <Text style={styles.title}>Terms and Conditions</Text>
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Welcome to <Text style={styles.boldText}>Umax Auto Spares Private Limited</Text>. By accessing our app, purchasing products, or engaging with our services, you agree to be bound by the following terms.
            </Text>
          </View>
        </View>

        {/* Quick Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Quick Navigation</Text>
          <View style={styles.navGrid}>
            {sections.map((item) => (
              <TouchableOpacity key={item.id} style={styles.navItem}>
                <Text style={styles.navText}>• {item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Detailed Sections */}
        {sections.map((item) => (
          <View key={item.id} style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <item.icon size={moderateScale(22)} color="#283593" />
              </View>
              <Text style={styles.cardTitle}>{item.id}. {item.title}</Text>
            </View>
            <Text style={styles.cardBody}>{item.content}</Text>
          </View>
        ))}

        {/* Contact Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.footerHeading}>Contact</Text>
          
          <View style={styles.contactRow}>
            <MapPinIcon size={moderateScale(20)} color="#94a3b8" />
            <Text style={styles.footerText}>
              A-116, First Floor, URBTECH TRADE CENTRE, SECTOR-132 NOIDA-201304(UP)
            </Text>
          </View>

          <TouchableOpacity style={styles.contactRow}>
            <EnvelopeIcon size={moderateScale(20)} color="#94a3b8" />
            <Text style={styles.footerLink}>info@umaxautospares.com</Text>
          </TouchableOpacity>

          <View style={styles.contactRow}>
            <PhoneIcon size={moderateScale(20)} color="#94a3b8" />
            <Text style={styles.footerText}>+91 95111 76184</Text>
          </View>

          <View style={styles.contactRow}>
            <PhoneIcon size={moderateScale(20)} color="#94a3b8" />
            <Text style={styles.footerText}>Toll Free: 07971982681</Text>
          </View>
        </View>

      </ScrollView>
    </SafeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollPadding: { paddingBottom: verticalScale(40) },
  header: { 
    paddingHorizontal: horizontalScale(20), 
    paddingBottom: verticalScale(20),
    paddingTop: verticalScale(10), 
    alignItems: 'center' 
  },
  legalBadge: { 
    flexDirection: 'row', 
    backgroundColor: '#E8EAF6', 
    paddingHorizontal: horizontalScale(16), 
    paddingVertical: verticalScale(8), 
    borderRadius: moderateScale(25),
    alignItems: 'center',
    marginBottom: verticalScale(15),
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  legalBadgeText: { 
    color: '#283593', 
    fontSize: moderateScale(13), 
    fontWeight: '800', 
    marginLeft: horizontalScale(8) 
  },
  title: { 
    fontSize: moderateScale(30), 
    fontWeight: '900', 
    color: '#001A3D', 
    textAlign: 'center' 
  },
  introCard: { 
    backgroundColor: '#EEF2FF', 
    padding: moderateScale(20), 
    borderRadius: moderateScale(15), 
    marginTop: verticalScale(25), 
    borderWidth: 1, 
    borderColor: '#C3DAFE',
    elevation: 2
  },
  introText: { 
    color: '#2D3748', 
    lineHeight: verticalScale(22), 
    fontSize: moderateScale(14), 
    textAlign: 'center' 
  },
  boldText: { fontWeight: '800', color: '#283593' },
  
  section: { padding: horizontalScale(20) },
  sectionHeading: { 
    fontSize: moderateScale(18), 
    fontWeight: '800', 
    color: '#1A202C', 
    marginBottom: verticalScale(15) 
  },
  navGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  navItem: { width: '48%', marginBottom: verticalScale(12) },
  navText: { 
    color: '#4A5568', 
    fontSize: moderateScale(13), 
    fontWeight: '500' 
  },

  contentCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: horizontalScale(20), 
    marginBottom: verticalScale(16), 
    padding: moderateScale(20), 
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: '#EDF2F7',
    elevation: 3,
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: verticalScale(14) 
  },
  iconContainer: { 
    backgroundColor: '#F0F4FF', 
    padding: moderateScale(10), 
    borderRadius: moderateScale(12), 
    marginRight: horizontalScale(12) 
  },
  cardTitle: { 
    fontSize: moderateScale(16), 
    fontWeight: '800', 
    color: '#1E293B' 
  },
  cardBody: { 
    color: '#64748B', 
    lineHeight: verticalScale(23), 
    fontSize: moderateScale(14) 
  },

  footer: { 
    backgroundColor: '#001A3D', 
    padding: moderateScale(30), 
    marginTop: verticalScale(10), 
    borderTopLeftRadius: moderateScale(35), 
    borderTopRightRadius: moderateScale(35) 
  },
  footerHeading: { 
    color: '#fff', 
    fontSize: moderateScale(24), 
    fontWeight: '900', 
    marginBottom: verticalScale(25) 
  },
  contactRow: { 
    flexDirection: 'row', 
    marginBottom: verticalScale(20), 
    alignItems: 'flex-start' 
  },
  footerText: { 
    color: '#CBD5E0', 
    marginLeft: horizontalScale(15), 
    fontSize: moderateScale(14), 
    lineHeight: verticalScale(22), 
    flex: 1 
  },
  footerLink: { 
    color: '#63B3ED', 
    marginLeft: horizontalScale(15), 
    fontSize: moderateScale(14), 
    fontWeight: '700' 
  }
});