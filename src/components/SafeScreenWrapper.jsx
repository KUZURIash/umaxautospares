import React from 'react';
import { StyleSheet, View, StatusBar, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeScreenWrapper = ({ children, backgroundColor = '#FFFFFF' }) => {
  const insets = useSafeAreaInsets();

  // FIX: Force app to ignore system "Large Text" settings which break layouts
  if (Text.defaultProps) {
    Text.defaultProps.allowFontScaling = false;
  } else {
    Text.defaultProps = { allowFontScaling: false };
  }
  
  if (TextInput.defaultProps) {
    TextInput.defaultProps.allowFontScaling = false;
  } else {
    TextInput.defaultProps = { allowFontScaling: false };
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: backgroundColor, // FORCES light mode bg
        paddingTop: insets.top, 
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right 
      }
    ]}>
      {/* FORCES dark icons for light mode visibility regardless of system theme */}
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} translucent />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeScreenWrapper;