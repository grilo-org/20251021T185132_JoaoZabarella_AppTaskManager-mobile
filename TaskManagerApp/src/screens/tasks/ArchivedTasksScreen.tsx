import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import apiService from '../../services';
import Toast from 'react-native-toast-message';
import SecurityAlert from '../../components/SecurityAlert';

type ArchivedTasksScreenNavigationProp = StackNavigationProp<AppStackParamList, 'ArchivedTasks'>;

interface Task {
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
  categoriaNome: string | null;
  concluida: string;
}

interface ArchivedTasksResponse {
  tarefas: Task[];
  paginaAtual: number;
  totalItens: number;
  totalPaginas: number;
}

const ArchivedTasksScreen = () => {
  const navigation = useNavigation<ArchivedTasksScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  useEffect(() => {
    loadArchivedTasks();
  }, []);

  const loadArchivedTasks = async (pageNum = 0, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
      setPage(0);
      pageNum = 0;
    } else if (pageNum > 0) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiService.api.task.getArchivedTasks(pageNum);
      handleTasksResponse(response, refresh);
    } catch (error) {
      console.error('Erro ao carregar tarefas arquivadas:', error);
      showAlert('Erro', 'Não foi possível carregar as tarefas arquivadas', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleTasksResponse = (response: ArchivedTasksResponse, refresh: boolean) => {
    const newTasks = response.tarefas;
    setTotalPages(response.totalPaginas);
    
    if (refresh || page === 0) {
      setTasks(newTasks);
    } else {
      setTasks(prevTasks => [...prevTasks, ...newTasks]);
    }
  };

  const onRefresh = () => {
    loadArchivedTasks(0, true);
    setSelectedTasks([]);
    setSelectMode(false);
  };

  const loadMoreTasks = () => {
    if (loadingMore || page + 1 >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadArchivedTasks(nextPage);
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      setSelectedTasks([]);
    }
  };

  const toggleSelectTask = (taskId: number) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const selectAllTasks = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task.id));
    }
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleRestoreTask = async (taskId: number) => {
    try {
      setLoading(true);

      await apiService.api.task.restoreTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      showAlert('Sucesso', 'Tarefa restaurada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao restaurar tarefa:', error);
      showAlert('Erro', 'Não foi possível restaurar a tarefa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmRestoreSelectedTasks = () => {
    if (selectedTasks.length === 0) {
      showAlert('Atenção', 'Selecione pelo menos uma tarefa para restaurar', 'warning');
      return;
    }

    Alert.alert(
      'Restaurar Tarefas',
      `Tem certeza que deseja restaurar ${selectedTasks.length} tarefa(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', onPress: restoreSelectedTasks }
      ]
    );
  };

  const restoreSelectedTasks = async () => {
    try {
      setLoading(true);

      await apiService.api.task.restoreMultipleTasks({ tarefasId: selectedTasks });
      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      setSelectMode(false);
      showAlert('Sucesso', 'Tarefas restauradas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao restaurar tarefas:', error);
      showAlert('Erro', 'Não foi possível restaurar as tarefas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    Alert.alert(
      'Excluir Permanentemente',
      'Esta ação não pode ser desfeita. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteTask(taskId) }
      ]
    );
  };

  const deleteTask = async (taskId: number) => {
    try {
      setLoading(true);
      await apiService.api.task.deletarTarefa(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      showAlert('Sucesso', 'Tarefa excluída permanentemente', 'success');
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      showAlert('Erro', 'Não foi possível excluir a tarefa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteSelectedTasks = () => {
    if (selectedTasks.length === 0) {
      showAlert('Atenção', 'Selecione pelo menos uma tarefa para excluir', 'warning');
      return;
    }

    Alert.alert(
      'Excluir Permanentemente',
      `Tem certeza que deseja excluir permanentemente ${selectedTasks.length} tarefa(s)? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: deleteSelectedTasks }
      ]
    );
  };

  const deleteSelectedTasks = async () => {
    try {
      setLoading(true);
      await apiService.api.task.excluirMultiplasTarefas({ tarefasId: selectedTasks });
      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      setSelectMode(false);
      showAlert('Sucesso', 'Tarefas excluídas permanentemente', 'success');
    } catch (error) {
      console.error('Erro ao excluir tarefas:', error);
      showAlert('Erro', 'Não foi possível excluir as tarefas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (statusId: number) => {
    switch (statusId) {
      case 1: return { backgroundColor: 'rgba(33, 150, 243, 0.1)' }; // Novo
      case 2: return { backgroundColor: 'rgba(255, 152, 0, 0.1)' }; // Em Andamento
      case 3: return { backgroundColor: 'rgba(76, 175, 80, 0.1)' }; // Concluído
      case 4: return { backgroundColor: 'rgba(244, 67, 54, 0.1)' }; // Bloqueado
      case 5: return { backgroundColor: 'rgba(158, 158, 158, 0.1)' }; // Cancelado
      default: return { backgroundColor: 'rgba(33, 150, 243, 0.1)' };
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isPastDue = item.prazo && new Date(item.prazo) < new Date() && !item.dataConclusao;
    const isCompleted = item.dataConclusao !== null;
    const isSelected = selectedTasks.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          isCompleted && styles.completedTask,
          isPastDue && styles.pastDueTask,
          isSelected && styles.selectedTask,
        ]}
        onPress={() => selectMode ? toggleSelectTask(item.id) : null}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          {selectMode && (
            <TouchableOpacity
              style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}
              onPress={() => toggleSelectTask(item.id)}
            >
              {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
            </TouchableOpacity>
          )}
          <View style={styles.taskTitleContainer}>
            <View 
              style={[
                styles.priorityIndicator, 
                { backgroundColor: getPriorityColor(item.prioridadeId) }
              ]} 
            />
            <Text 
              style={[
                styles.taskTitle, 
                isCompleted && styles.completedText
              ]} 
              numberOfLines={1}
            >
              {item.titulo}
            </Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.statusId)]}>
            <Text style={styles.statusText}>{item.statusTexto}</Text>
          </View>
        </View>

        {item.descricao ? (
          <Text 
            style={[
              styles.taskDescription, 
              isCompleted && styles.completedText
            ]} 
            numberOfLines={2}
          >
            {item.descricao}
          </Text>
        ) : null}

        <View style={styles.taskFooter}>
          <View style={styles.taskMetadata}>
            {item.categoriaNome ? (
              <View style={styles.categoryBadge}>
                <Ionicons name="folder-outline" size={14} color="#64748B" />
                <Text style={styles.categoryText}>{item.categoriaNome}</Text>
              </View>
            ) : null}

            {item.prazo ? (
              <View style={styles.dateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={isPastDue ? '#F44336' : '#64748B'}
                />
                <Text
                  style={[
                    styles.dateText,
                    isPastDue && { color: '#F44336' },
                    isCompleted && styles.completedText,
                  ]}
                >
                  {formatDate(item.prazo)}
                </Text>
              </View>
            ) : null}
          </View>

          {!selectMode && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}
                onPress={() => handleRestoreTask(item.id)}
              >
                <Ionicons name="refresh-outline" size={22} color="#4CAF50" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}
                onPress={() => handleDeleteTask(item.id)}
              >
                <Ionicons name="trash-outline" size={22} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
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
        <Text style={styles.headerTitle}>Tarefas Arquivadas</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleSelectMode}
        >
          <Ionicons 
            name={selectMode ? "close" : "checkmark-circle-outline"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Selection mode actions */}
      {selectMode && (
        <View style={styles.selectionActions}>
          <Text style={styles.selectionText}>
            {selectedTasks.length > 0 
              ? `${selectedTasks.length} tarefa(s) selecionada(s)` 
              : 'Selecione tarefas'}
          </Text>
          <View style={styles.selectionButtons}>
            <TouchableOpacity 
              style={styles.selectionButton}
              onPress={selectAllTasks}
            >
              <Ionicons name="checkmark-done-outline" size={22} color="#2196F3" />
              <Text style={styles.selectionButtonText}>
                {selectedTasks.length === tasks.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.selectionButton, { opacity: selectedTasks.length > 0 ? 1 : 0.5 }]}
              onPress={confirmRestoreSelectedTasks}
              disabled={selectedTasks.length === 0}
            >
              <Ionicons name="refresh-outline" size={22} color="#4CAF50" />
              <Text style={[styles.selectionButtonText, { color: '#4CAF50' }]}>Restaurar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.selectionButton, { opacity: selectedTasks.length > 0 ? 1 : 0.5 }]}
              onPress={confirmDeleteSelectedTasks}
              disabled={selectedTasks.length === 0}
            >
              <Ionicons name="trash-outline" size={22} color="#F44336" />
              <Text style={[styles.selectionButtonText, { color: '#F44336' }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Task List */}
      {loading && !refreshing && !loadingMore ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando tarefas arquivadas...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={64} color="#64748B" />
          <Text style={styles.emptyText}>Nenhuma tarefa arquivada</Text>
          <Text style={styles.emptySubtext}>
            Quando você arquivar tarefas, elas aparecerão aqui
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
          }
          onEndReached={loadMoreTasks}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.loadingMoreText}>Carregando mais tarefas...</Text>
              </View>
            ) : null
          }
        />
      )}

      {alertVisible && (
        <SecurityAlert
          type={alertType}
          message={alertMessage}
          duration={3000}
          onClose={() => setAlertVisible(false)}
        />
      )}
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionActions: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  selectionText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  selectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectionButtonText: {
    color: '#2196F3',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#2196F3',
  },
  taskItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTask: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  completedTask: {
    opacity: 0.7,
    backgroundColor: '#1A2234',
  },
  pastDueTask: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  taskDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
    actionButtonr: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ArchivedTasksScreen;