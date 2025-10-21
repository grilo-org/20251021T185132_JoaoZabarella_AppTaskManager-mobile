import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import apiService from '../../services';

const { width } = Dimensions.get('window');

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (senha.length < 6) {
      newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (!confirmaSenha) {
      newErrors.confirmaSenha = 'Confirme a senha';
    } else if (senha !== confirmaSenha) {
      newErrors.confirmaSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await apiService.user.registerUser({ nome, email, senha, confirmaSenha });

      Toast.show({
        type: 'success',
        text1: 'Cadastro realizado com sucesso!',
        text2: 'Você já pode fazer login',
        position: 'top',
      });

      navigation.goBack();
    } catch (error: any) {
      let errorMessage = 'Erro ao cadastrar. Tente novamente.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        if (error.message.includes('email')) {
          setErrors((prev) => ({ ...prev, email: 'Este email já está cadastrado' }));
          errorMessage = 'Este email já está em uso.';
        } else if (error.message.includes('senha')) {
          setErrors((prev) => ({ ...prev, senha: 'Senha inválida' }));
          errorMessage = 'Problema com a senha informada.';
        }
      }

      Toast.show({
        type: 'error',
        text1: 'Erro ao cadastrar',
        text2: errorMessage,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Criar Conta</Text>
              <Text style={styles.headerSubtitle}>Junte-se ao TaskManager</Text>
            </View>
          </Animated.View>

          {/* Formulário */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Campo Nome */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nome completo</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.nome ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#9CA3AF"
                  value={nome}
                  onChangeText={(text) => {
                    setNome(text);
                    if (errors.nome) {
                      setErrors((prev) => ({ ...prev, nome: '' }));
                    }
                  }}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
              {errors.nome ? (
                <Text style={styles.errorText}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color="#FF6B6B"
                  />{' '}
                  {errors.nome}
                </Text>
              ) : null}
            </View>

            {/* Campo Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.email ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color="#FF6B6B"
                  />{' '}
                  {errors.email}
                </Text>
              ) : null}
            </View>

            {/* Campo Senha */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.senha ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#9CA3AF"
                  value={senha}
                  onChangeText={(text) => {
                    setSenha(text);
                    if (errors.senha) {
                      setErrors((prev) => ({ ...prev, senha: '' }));
                    }
                  }}
                  secureTextEntry={secureTextEntry}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {errors.senha ? (
                <Text style={styles.errorText}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color="#FF6B6B"
                  />{' '}
                  {errors.senha}
                </Text>
              ) : null}
            </View>

            {/* Campo Confirmar Senha */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirmar senha</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmaSenha ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor="#9CA3AF"
                  value={confirmaSenha}
                  onChangeText={(text) => {
                    setConfirmaSenha(text);
                    if (errors.confirmaSenha) {
                      setErrors((prev) => ({ ...prev, confirmaSenha: '' }));
                    }
                  }}
                  secureTextEntry={secureConfirmTextEntry}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() =>
                    setSecureConfirmTextEntry(!secureConfirmTextEntry)
                  }
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      secureConfirmTextEntry
                        ? 'eye-outline'
                        : 'eye-off-outline'
                    }
                    size={22}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmaSenha ? (
                <Text style={styles.errorText}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color="#FF6B6B"
                  />{' '}
                  {errors.confirmaSenha}
                </Text>
              ) : null}
            </View>
          </Animated.View>

          {/* Botões */}
          <Animated.View
            style={[
              styles.buttonsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.registerButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={22}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.registerButtonText}>Criar conta</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já tem uma conta?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
              >
                <Text style={styles.loginLink}>Fazer login</Text>
              </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  formContainer: {
    marginBottom: 32,
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
    backgroundColor: '#1E293B',
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
    paddingHorizontal: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  buttonsContainer: {
    marginTop: 24,
  },
  registerButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#94A3B8',
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;