import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Home, 
  ShoppingCart, 
  Shapes, 
  LayoutGrid,
  Truck
} from 'lucide-react-native';

// Scaling imports
import { horizontalScale, verticalScale, moderateScale } from './components/scaling'; 
import { useCart } from './CartContext';

const { width } = Dimensions.get('window');

const BottomTabNavigator = ({ state, descriptors, navigation }) => {
  const { cartItems } = useCart();
  const itemCount = cartItems?.length || 0;
  
  // This hook detects the "danger zones" at the bottom of the screen (notches/home bars)
  const insets = useSafeAreaInsets();

  const handleTabPress = (route, isFocused) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const TabIcon = ({ name, color, isActive }) => {
    // Scaling icon sizes based on screen density
    const size = isActive ? moderateScale(20) : moderateScale(18); 
    const strokeWidth = isActive ? 2.5 : 2.2;

    switch (name) {
      case 'Home': return <Home size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Cart': return <ShoppingCart size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Category': return <Shapes size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Products': return <LayoutGrid size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Track': return <Truck size={size} color={color} strokeWidth={strokeWidth} />;
      default: return <Home size={size} color={color} strokeWidth={strokeWidth} />;
    }
  };

  return (
    <View style={[
      styles.tabBar, 
      { 
        // Dynamically add padding at the bottom based on device insets
        paddingBottom: insets.bottom > 0 ? insets.bottom : verticalScale(10),
        height: verticalScale(60) + (insets.bottom > 0 ? insets.bottom : 0)
      }
    ]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const label = route.name;
        const activeColor = '#1E3A8A'; 
        const inactiveColor = '#94A3B8';

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            style={styles.tabItem}
            onPress={() => handleTabPress(route, isFocused)}
          >
            <View style={styles.iconWrapper}>
              <TabIcon 
                name={label} 
                color={isFocused ? activeColor : inactiveColor} 
                isActive={isFocused} 
              />
              
              {label === 'Cart' && itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[
              styles.tabLabel, 
              { color: isFocused ? activeColor : inactiveColor }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    position: 'absolute',
    bottom: 0,
    width: width,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 20, // Higher elevation for cleaner separation
      },
    }),
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrapper: { 
    position: 'relative', 
    height: verticalScale(24), 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  tabLabel: { 
    fontSize: moderateScale(9), // Scaled font size
    marginTop: verticalScale(4), 
    fontWeight: '800', 
    letterSpacing: 0.5,
    textTransform: 'uppercase' 
  },
  badge: {
    position: 'absolute',
    right: horizontalScale(-10),
    top: verticalScale(-6),
    backgroundColor: '#EF4444',
    borderRadius: moderateScale(10),
    minWidth: horizontalScale(16),
    height: verticalScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(2),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(8),
    fontWeight: '900',
  }
});

export default BottomTabNavigator;