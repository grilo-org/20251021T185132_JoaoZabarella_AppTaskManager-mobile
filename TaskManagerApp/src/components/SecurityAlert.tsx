import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export const ALERT_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const;


export type AlertType = typeof ALERT_TYPE[keyof typeof ALERT_TYPE];


interface SecurityAlertProps {
  type?: AlertType;
  title?: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type = ALERT_TYPE.INFO,
  title,
  message,
  duration = 3000,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(true);

  const getAlertConfig = () => {
    switch (type) {
      case ALERT_TYPE.SUCCESS:
        return {
          backgroundColor: 'rgba(76, 175, 80, 0.15)',
          borderColor: '#4CAF50',
          iconName: 'checkmark-circle',
          iconColor: '#4CAF50',
        };
      case ALERT_TYPE.ERROR:
        return {
          backgroundColor: 'rgba(244, 67, 54, 0.15)',
          borderColor: '#F44336',
          iconName: 'alert-circle',
          iconColor: '#F44336',
        };
      case ALERT_TYPE.WARNING:
        return {
          backgroundColor: 'rgba(255, 152, 0, 0.15)',
          borderColor: '#FF9800',
          iconName: 'warning',
          iconColor: '#FF9800',
        };
      case ALERT_TYPE.INFO:
      default:
        return {
          backgroundColor: 'rgba(33, 150, 243, 0.15)',
          borderColor: '#2196F3',
          iconName: 'information-circle',
          iconColor: '#2196F3',
        };
    }
  };

  const config = getAlertConfig();

  const translateY = useState(new Animated.Value(-100))[0];
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timeout);
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (onClose) onClose();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          top: insets.top + 10,
        },
      ]}
    >
      <View
        style={[
          styles.content,
          {
            backgroundColor: config.backgroundColor,
            borderLeftColor: config.borderColor,
          },
        ]}
      >
        <Ionicons
          name={config.iconName as any}
          size={24}
          color={config.iconColor}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width - 32,
    alignSelf: 'center',
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  closeButton: {
    padding: 4,
  },
});

export default SecurityAlert;