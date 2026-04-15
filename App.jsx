// import React, { useState, useEffect } from 'react';
// import { View, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// // --- Context & Custom Nav ---
// import { CartProvider } from './src/CartContext'; 
// import MyCustomTabBar from './src/BottomTabNavigator'; 

// // --- Screen Imports ---
// import AuthScreen from './src/AuthScreen';
// import SignupScreen from './src/SignupScreen';
// import EmailVerification from './src/EmailVerification';
// import ForgotPassword from './src/ForgotPassword';
// import CartScreen from './src/CartScreen';
// import HomeScreens from './src/HomeScreens';
// import AllProducts from './src/AllProducts';
// import ProductDetail from './src/ProductDetail';
// import WishlistScreen from './src/WishlistScreen';
// import TrackScreen from './src/TrackScreen';
// import Account from './src/Account';
// import CheckoutScreen from './src/CheckoutScreen';
// import OrderDetailScreen from './src/OrderDetailScreen';

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();
// const queryClient = new QueryClient();

// // --- 1. TabNavigator ---
// function TabNavigator() {
//   return (
//     <Tab.Navigator 
//       tabBar={(props) => <MyCustomTabBar {...props} />} 
//       // Important: Ensure screens can handle initial params from navigation
//       screenOptions={{ headerShown: false, unmountOnBlur: false }}
//     >
//       <Tab.Screen name="Home" component={HomeScreens} />
//       <Tab.Screen name="Products" component={AllProducts} />
//       <Tab.Screen name="Cart" component={CartScreen} /> 
//       <Tab.Screen name="Track" component={TrackScreen} />
//     </Tab.Navigator>
//   );
// }

// // --- 2. Main App ---
// export default function App() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false); 
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const token = await AsyncStorage.getItem('userToken');
//         if (token) {
//           setIsLoggedIn(true);
//         }
//       } catch (error) {
//         console.error("Auth check failed:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     checkAuth();
//   }, []);

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#1E3A8A" />
//       </View>
//     );
//   }

//   return (
//     <QueryClientProvider client={queryClient}>
//       <CartProvider>
//         <NavigationContainer>
//           <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//           <Stack.Navigator 
//             screenOptions={{ 
//               headerShown: false,
//               animation: 'slide_from_right'
//             }}
//           >
//             {!isLoggedIn ? (
//               <>
//                 <Stack.Screen name="Auth">
//                   {(props) => (
//                     <AuthScreen 
//                       {...props} 
//                       onLogin={() => setIsLoggedIn(true)} 
//                     />
//                   )}
//                 </Stack.Screen>
//                 <Stack.Screen name="Signup" component={SignupScreen} />
//                 <Stack.Screen name="EmailVerification" component={EmailVerification} />
//                 <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
//               </>
//             ) : (
//               <>
//                 {/* MainApp handles the Bottom Tabs. 
//                    Navigation to filters/search from Home works by calling:
//                    navigation.navigate('Products', { category: 'Brakes' })
//                 */}
//                 <Stack.Screen name="MainApp" component={TabNavigator} />
                
//                 {/* Full Screen Modals/Details */}
//                 <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
//                 <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
//                 <Stack.Screen name="Wishlist" component={WishlistScreen} />
//                 <Stack.Screen name="Account">
//                   {(props) => (
//                     <Account 
//                       {...props} 
//                       onLogout={async () => {
//                         await AsyncStorage.removeItem('userToken');
//                         setIsLoggedIn(false);
//                       }} 
//                     />
//                   )}
//                 </Stack.Screen>

//                 <Stack.Screen 
//                   name="ProductDetail" 
//                   component={ProductDetail} 
//                   options={{ 
//                     headerShown: true, 
//                     title: 'Product Details',
//                     headerTitleStyle: styles.headerTitle,
//                     headerTintColor: '#1E3A8A',
//                     headerShadowVisible: false,
//                     headerStyle: { backgroundColor: '#fff' }
//                   }} 
//                 />
//               </>
//             )}
//           </Stack.Navigator>
//         </NavigationContainer>
//       </CartProvider>
//     </QueryClientProvider>
//   );
// }

// const styles = StyleSheet.create({
//   loadingContainer: { 
//     flex: 1, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     backgroundColor: '#ffffff' 
//   },
//   headerTitle: {
//     fontWeight: '800',
//     fontSize: 16,
//     color: '#1E293B',
//     ...Platform.select({
//         ios: { fontFamily: 'System' },
//         android: { fontFamily: 'sans-serif-medium' }
//     })
//   }
// });
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// --- ADDED TOAST IMPORT ---
import Toast from 'react-native-toast-message';

// --- Context & Custom Nav ---
import { CartProvider } from './src/CartContext'; 
import MyCustomTabBar from './src/BottomTabNavigator'; 

// --- Screen Imports ---
import AuthScreen from './src/AuthScreen';
import SignupScreen from './src/SignupScreen';
import EmailVerification from './src/EmailVerification';
import ForgotPassword from './src/ForgotPassword';
import CartScreen from './src/CartScreen';
import HomeScreens from './src/HomeScreens';
import AllProducts from './src/AllProducts';
import ProductDetail from './src/ProductDetail';
import WishlistScreen from './src/WishlistScreen';
import TrackScreen from './src/TrackScreen';
import Account from './src/Account';
import CheckoutScreen from './src/CheckoutScreen';
import OrderDetailScreen from './src/OrderDetailScreen';
import CategoryScreen from './src/CategoryScreen'; 
import TermsAndConditionScreen from './src/TermsAndConditionScreen'; 
import Wallet from './src/Wallet'; 
import Support from './src/Support'; 
import MotoPartsAssistant from './src/MotoPartsAssistant'; 

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// --- 1. TabNavigator (The Bottom Bar) ---
function TabNavigator() {
  return (
    <Tab.Navigator 
      tabBar={(props) => <MyCustomTabBar {...props} />} 
      screenOptions={{ headerShown: false, unmountOnBlur: false }}
    >
      <Tab.Screen name="Home" component={HomeScreens} />
      <Tab.Screen name="Products" component={AllProducts} />
      <Tab.Screen name="Category" component={CategoryScreen}/>
      <Tab.Screen name="Cart" component={CartScreen} /> 
      <Tab.Screen name="Track" component={TrackScreen} />
    </Tab.Navigator>
  );
}

// --- 2. Main App Stack ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) setIsLoggedIn(true);
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Centralized Logout Logic
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      queryClient.clear(); // Clears the TanStack Query cache
      setIsLoggedIn(false); // Triggers re-render to Auth screens
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {/* Force Light Theme by passing DefaultTheme */}
        <NavigationContainer theme={DefaultTheme}>
          <View style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            
            <Stack.Navigator 
              screenOptions={{ 
                headerShown: false, 
                animation: 'slide_from_right',
                // Force background to white for every screen
                contentStyle: { backgroundColor: '#ffffff' } 
              }}
            >
              {!isLoggedIn ? (
                <>
                  <Stack.Screen name="Auth">
                    {(props) => <AuthScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
                  </Stack.Screen>
                  <Stack.Screen name="Signup" component={SignupScreen} />
                  <Stack.Screen name="EmailVerification" component={EmailVerification} />
                  <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
                </>
              ) : (
                <>
                  {/* Main App Screens */}
                  <Stack.Screen name="MainApp" component={TabNavigator} />
                  <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
                  <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                  <Stack.Screen name="Wishlist" component={WishlistScreen} />
                  <Stack.Screen name="Wallet" component={Wallet} />
                  <Stack.Screen name="Support" component={Support} />
                  <Stack.Screen name="TermsAndConditions" component={TermsAndConditionScreen} />

                  <Stack.Screen name="Account">
                    {(props) => (
                      <Account 
                        {...props} 
                        onLogout={handleLogout} 
                      />
                    )}
                  </Stack.Screen>
                  
                  <Stack.Screen name="ProductDetail" component={ProductDetail} />
                </>
              )}
            </Stack.Navigator>

            {/* Chatbot persists only when logged in */}
            {isLoggedIn && <MotoPartsAssistant />}

            {/* --- ADDED TOAST COMPONENT AS THE FINAL LAYER --- */}
            <Toast />
          </View>
        </NavigationContainer>
      </CartProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#ffffff' 
  }
});