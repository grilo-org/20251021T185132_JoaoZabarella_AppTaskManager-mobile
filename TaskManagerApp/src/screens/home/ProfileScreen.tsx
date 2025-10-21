import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/AppNavigator';


let apiService: any;
try {
  apiService = require('../../services/apiService').default;
} catch {
  try {
    apiService = require('../../services/api').default;
  } catch {
    console.log('API Service não encontrado, usando mock');
  }
}

type ProfileScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Profile'>;

interface UserData {
  id: number;
  nome: string;
  email: string;
  dataCriacao: string;
  ativo: boolean;
  roles: string[];
}

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    console.log('ProfileScreen montado');
    console.log('User from context:', user);
    
    
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
    
  
    if (user) {
      
      setUserData(user);
      setEditedName(user.nome);
      setEditedEmail(user.email);
    } else {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    console.log('Fetching user data...');
    try {
      setLoading(true);
      
      if (apiService && apiService.user && apiService.user.getProfile) {
        const response = await apiService.user.getProfile();
        console.log('User data fetched:', response);
        setUserData(response);
        setEditedName(response.nome);
        setEditedEmail(response.email);
      } else {
        console.log('API Service não disponível, usando dados do contexto');
        if (user) {
          setUserData(user);
          setEditedName(user.nome);
          setEditedEmail(user.email);
        } else {
          setError('Dados do usuário não disponíveis');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setError('Erro ao carregar dados do perfil');
      
     
      if (user) {
        setUserData(user);
        setEditedName(user.nome);
        setEditedEmail(user.email);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      setError('Nome não pode estar vazio');
      return;
    }

    if (!editedEmail.trim()) {
      setError('Email não pode estar vazio');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail)) {
      setError('Por favor, insira um email válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (apiService && apiService.user && apiService.user.updateProfile) {
        await apiService.user.updateProfile({
          nome: editedName,
          email: editedEmail,
        });

        await fetchUserData(); 
        setEditing(false);
        setSuccess('Perfil atualizado com sucesso!');
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Serviço de atualização não disponível');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      if (error.message && error.message.includes('email')) {
        setError('Este email já está em uso');
      } else if (error.message && error.message.includes('nome')) {
        setError('Este nome já está em uso');
      } else {
        setError('Erro ao atualizar perfil. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedName(userData?.nome || '');
    setEditedEmail(userData?.email || '');
    setEditing(false);
    setError(null);
  };

  const handleChangePassword = () => {
    try {
      navigation.navigate('ChangePassword');
    } catch (error) {
      console.error('Erro ao navegar para ChangePassword:', error);
      Alert.alert('Erro', 'Não foi possível abrir a tela de alteração de senha');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Desativar Conta',
      'Tem certeza que deseja desativar sua conta? Esta ação pode ser irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desativar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (apiService && apiService.user && apiService.user.deactivateAccount) {
                await apiService.user.deactivateAccount();
                Alert.alert('Conta Desativada', 'Sua conta foi desativada com sucesso.');
                logout();
              } else {
                setError('Serviço de desativação não disponível');
              }
            } catch (error) {
              setError('Erro ao desativar conta. Tente novamente.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

 
  if (loading && !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            try {
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao voltar:', error);
              navigation.navigate('Home');
            }
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        
        <TouchableOpacity 
          onPress={editing ? handleCancel : () => setEditing(true)}
          style={styles.editButton}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={editing ? "close" : "create-outline"} 
            size={24} 
            color="#2196F3" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="#2196F3" />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            {success && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Nome */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Nome</Text>
              {editing ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Seu nome"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              ) : (
                <Text style={styles.fieldValue}>{userData?.nome || 'Nome não disponível'}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              {editing ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={editedEmail}
                    onChangeText={setEditedEmail}
                    placeholder="Seu email"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <Text style={styles.fieldValue}>{userData?.email || 'Email não disponível'}</Text>
              )}
            </View>

            {/* Data de Criação */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Membro desde</Text>
              <Text style={styles.fieldValue}>
                {userData?.dataCriacao ? formatDate(userData.dataCriacao) : 'N/A'}
              </Text>
            </View>

            {/* Status */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Status da conta</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: userData?.ativo ? '#4CAF50' : '#FF6B6B' }]} />
                <Text style={styles.fieldValue}>
                  {userData?.ativo ? 'Ativa' : 'Inativa'}
                </Text>
              </View>
            </View>

            {/* Botões de ação */}
            {editing ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Salvar</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#94A3B8" />
                  <Text style={[styles.actionButtonText, { color: '#94A3B8' }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.menuOptions}>
                <TouchableOpacity 
                  style={styles.menuOption}
                  onPress={handleChangePassword}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuOptionContent}>
                    <View style={[styles.menuIcon, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                      <Ionicons name="key-outline" size={24} color="#2196F3" />
                    </View>
                    <View style={styles.menuOptionText}>
                      <Text style={styles.menuOptionTitle}>Alterar Senha</Text>
                      <Text style={styles.menuOptionSubtitle}>Modifique sua senha de acesso</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuOption}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuOptionContent}>
                    <View style={[styles.menuIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                      <Ionicons name="log-out-outline" size={24} color="#FF9800" />
                    </View>
                    <View style={styles.menuOptionText}>
                      <Text style={styles.menuOptionTitle}>Sair da Conta</Text>
                      <Text style={styles.menuOptionSubtitle}>Fazer logout do aplicativo</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuOption}
                  onPress={handleDeactivateAccount}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuOptionContent}>
                    <View style={[styles.menuIcon, { backgroundColor: 'rgba(244, 67, 54, 0.15)' }]}>
                      <Ionicons name="person-remove-outline" size={24} color="#F44336" />
                    </View>
                    <View style={styles.menuOptionText}>
                      <Text style={[styles.menuOptionTitle, { color: '#F44336' }]}>Desativar Conta</Text>
                      <Text style={styles.menuOptionSubtitle}>Desativar permanentemente sua conta</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
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
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileCard: {
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  userInfo: {
    width: '100%',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    height: 48,
    justifyContent: 'center',
  },
  input: {
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    height: '100%',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  menuOptions: {
    marginTop: 24,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuOptionText: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  menuOptionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

export default ProfileScreen;