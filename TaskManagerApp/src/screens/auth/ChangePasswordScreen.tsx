import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services';

type ChangePasswordScreenNavigationProp = StackNavigationProp<AppStackParamList, 'ChangePassword'>;

const ChangePasswordScreen = () => {
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Estados para mostrar/ocultar senhas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    setError(null);

    if (!currentPassword.trim()) {
      setError('Por favor, insira sua senha atual');
      return false;
    }

    if (!newPassword.trim()) {
      setError('Por favor, insira uma nova senha');
      return false;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (!confirmPassword.trim()) {
      setError('Por favor, confirme sua nova senha');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação devem ser iguais');
      return false;
    }

    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da senha atual');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await apiService.user.alterarSenha({
        senhaAtual: currentPassword,
        novaSenha: newPassword,
        confirmaSenha: confirmPassword,
      });

      setSuccess(true);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      if (error.message && error.message.includes('senha atual')) {
        setError('Senha atual incorreta');
      } else if (error.message && error.message.includes('confirmação')) {
        setError('Nova senha e confirmação não conferem');
      } else {
        setError('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToProfile = () => {
    navigation.goBack();
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.successContainer}>
          <Animated.View 
            style={[
              styles.successContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            
            <Text style={styles.successTitle}>Senha Alterada!</Text>
            <Text style={styles.successMessage}>
              Sua senha foi alterada com sucesso. Agora você pode usar sua nova senha para fazer login.
            </Text>
            
            <TouchableOpacity 
              style={styles.button}
              onPress={handleBackToProfile}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={22} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Concluído</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          onPress={handleBackToProfile}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Alterar Senha</Text>
        
        <View style={styles.placeholder} />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Ícone */}
            <View style={styles.iconContainer}>
              <Ionicons name="key" size={60} color="#2196F3" />
            </View>

            <Text style={styles.title}>Alterar Senha</Text>
            <Text style={styles.subtitle}>
              Para sua segurança, digite sua senha atual e defina uma nova senha.
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Senha Atual */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Senha Atual</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} 
                    size={22} 
                    color="#94A3B8" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nova Senha */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua nova senha"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                    size={22} 
                    color="#94A3B8" 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>Mínimo de 6 caracteres</Text>
            </View>

            {/* Confirmar Nova Senha */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirme sua nova senha"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={22} 
                    color="#94A3B8" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão de Alterar Senha */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="key-outline" size={22} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Alterar Senha</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Dicas de Segurança */}
            <View style={styles.securityTips}>
              <Text style={styles.securityTitle}>Dicas de Segurança:</Text>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.tipText}>Use pelo menos 6 caracteres</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.tipText}>Combine letras, números e símbolos</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.tipText}>Evite senhas óbvias como "123456"</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    height: 56,
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  eyeIcon: {
    padding: 16,
  },
  passwordHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#1E88E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityTips: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    color: '#94A3B8',
    fontSize: 14,
    marginLeft: 8,
  },
  // Success styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successContent: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
});

export default ChangePasswordScreen;