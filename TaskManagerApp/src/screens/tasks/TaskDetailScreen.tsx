import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AppStackParamList } from '../../navigation/AppNavigator';
import apiService from '../../services';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type TaskDetailScreenRouteProp = RouteProp<AppStackParamList, 'TaskDetail'>;
type TaskDetailScreenNavigationProp = StackNavigationProp<AppStackParamList, 'TaskDetail'>;

interface TaskDetail {
  id: number;
  titulo: string;
  descricao: string;
  statusId: number;
  statusTexto: string;
  prioridadeId: number;
  prioridadeTexto: string;
  dataCriacao: string;
  prazo: string | null;
  dataConclusao: string | null;
  usuarioNome: string;
  categoriaId: number | null;
  categoriaNome: string | null;
  concluida: string;
}

const TaskDetailScreen = () => {
  const route = useRoute<TaskDetailScreenRouteProp>();
  const navigation = useNavigation<TaskDetailScreenNavigationProp>();
  const { taskId } = route.params;
  
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  useEffect(() => {
    fetchTaskDetails();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [taskId]);
  
  const fetchTaskDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.api.task.getTaskById(taskId);
      setTask(response);
      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao buscar detalhes da tarefa:', err);
      setError('Não foi possível carregar os detalhes da tarefa. Tente novamente.');
      setLoading(false);
    }
  };
  
  const handleEditTask = () => {
    if (task) {
      navigation.navigate('EditTask', { taskId: task.id });
    }
  };
  
  const handleCompleteTask = async () => {
    if (!task) return;
    
    try {
      setLoading(true);
      const updatedTask = await apiService.api.task.completeTask(task.id);
      
      Toast.show({
        type: 'success',
        text1: 'Tarefa concluída com sucesso!',
      });
      
      setTask(updatedTask);
      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao concluir tarefa:', err);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível concluir a tarefa',
      });
      setLoading(false);
    }
  };
  
  const handleReopenTask = async () => {
    if (!task) return;
    
    try {
      setLoading(true);
      const updatedTask = await apiService.api.task.reopenTask(task.id);
      
      Toast.show({
        type: 'success',
        text1: 'Tarefa reaberta com sucesso!',
      });
      
      setTask(updatedTask);
      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao reabrir tarefa:', err);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível reabrir a tarefa',
      });
      setLoading(false);
    }
  };
  
  const confirmArchiveTask = () => {
    Alert.alert(
      'Arquivar Tarefa',
      'Tem certeza que deseja arquivar esta tarefa? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: handleArchiveTask,
        },
      ],
      { cancelable: true }
    );
  };
  
  const handleArchiveTask = async () => {
    if (!task) return;
    
    try {
      setLoading(true);
      await apiService.api.task.archiveTask(task.id);
      
      Toast.show({
        type: 'success',
        text1: 'Tarefa arquivada com sucesso!',
      });
      
      navigation.goBack();
    } catch (err: any) {
      console.error('Erro ao arquivar tarefa:', err);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível arquivar a tarefa',
      });
      setLoading(false);
    }
  };
  
const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Não definido';
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: pt });
  } catch (e) {
    return 'Data inválida';
  }
};
  
  const isPastDue = (dateString?: string | null) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date() && (!task?.dataConclusao);
    } catch (e) {
      return false;
    }
  };
  
  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1: return '#2196F3'; // Novo
      case 2: return '#FF9800'; // Em Andamento
      case 3: return '#4CAF50'; // Concluído
      case 4: return '#F44336'; // Bloqueado
      case 5: return '#9E9E9E'; // Cancelado
      default: return '#94A3B8';
    }
  };
  
  const getPriorityColor = (prioridadeId: number) => {
    switch (prioridadeId) {
      case 1: return '#4CAF50'; // Baixa
      case 2: return '#FF9800'; // Média 
      case 3: return '#F44336'; // Alta
      case 4: return '#9C27B0'; // Urgente
      default: return '#94A3B8';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Tarefa</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setConfirmationVisible(!confirmationVisible)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Menu popup */}
      {confirmationVisible && (
        <View style={styles.menuPopup}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setConfirmationVisible(false);
              handleEditTask();
            }}
          >
            <Ionicons name="create-outline" size={22} color="#fff" />
            <Text style={styles.menuItemText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setConfirmationVisible(false);
              confirmArchiveTask();
            }}
          >
            <Ionicons name="archive-outline" size={22} color="#F44336" />
            <Text style={[styles.menuItemText, {color: '#F44336'}]}>Arquivar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !task ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchTaskDetails}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : task ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
        >
          <Animated.View
            style={[
              styles.taskHeaderSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.taskTitleContainer}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.prioridadeId) }]} />
              <Text style={styles.taskTitle}>{task.titulo}</Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.statusId) }]}>
              <Text style={styles.statusText}>{task.statusTexto}</Text>
            </View>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.infoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="flag-outline" size={20} color="#94A3B8" />
                <Text style={styles.infoLabel}>Prioridade</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.prioridadeId) }]}>
                <Text style={styles.priorityText}>{task.prioridadeTexto}</Text>
              </View>
            </View>
            
            {task.categoriaId && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons name="folder-outline" size={20} color="#94A3B8" />
                  <Text style={styles.infoLabel}>Categoria</Text>
                </View>
                <Text style={styles.infoValue}>{task.categoriaNome || 'Sem categoria'}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="time-outline" size={20} color="#94A3B8" />
                <Text style={styles.infoLabel}>Criada em</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(task.dataCriacao)}</Text>
            </View>
            
            {task.prazo && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={isPastDue(task.prazo) ? '#F44336' : '#94A3B8'} 
                  />
                  <Text 
                    style={[
                      styles.infoLabel,
                      isPastDue(task.prazo) && {color: '#F44336'}
                    ]}
                  >
                    Prazo
                  </Text>
                </View>
                <Text 
                  style={[
                    styles.infoValue,
                    isPastDue(task.prazo) && {color: '#F44336', fontWeight: '600'}
                  ]}
                >
                  {formatDate(task.prazo)}
                  {isPastDue(task.prazo) && ' (Atrasada)'}
                </Text>
              </View>
            )}
            
            {task.dataConclusao && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                  <Text style={[styles.infoLabel, {color: '#4CAF50'}]}>Concluída em</Text>
                </View>
                <Text style={[styles.infoValue, {color: '#4CAF50'}]}>{formatDate(task.dataConclusao)}</Text>
              </View>
            )}
          </Animated.View>
          
          <Animated.View
            style={[
              styles.descriptionSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.descriptionTitle}>Descrição</Text>
            <Text style={styles.descriptionText}>
              {task.descricao || 'Sem descrição'}
            </Text>
          </Animated.View>
          
          {/* Ações da tarefa */}
          <View style={styles.actionsContainer}>
            {task.dataConclusao ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.reopenButton]}
                onPress={handleReopenTask}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={22} color="#fff" style={styles.actionIcon} />
                    <Text style={styles.actionText}>Reabrir Tarefa</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={handleCompleteTask}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#fff" style={styles.actionIcon} />
                    <Text style={styles.actionText}>Concluir Tarefa</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : null}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuPopup: {
    position: 'absolute',
    right: 16,
    top: 75,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94A3B8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  taskHeaderSection: {
    marginBottom: 24,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityIndicator: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    flexWrap: 'wrap',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 16,
    marginLeft: 8,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  descriptionSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  reopenButton: {
    backgroundColor: '#FF9800',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskDetailScreen;