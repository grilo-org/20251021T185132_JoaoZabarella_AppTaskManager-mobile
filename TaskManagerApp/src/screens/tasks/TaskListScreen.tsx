import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
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

type TaskListScreenNavigationProp = StackNavigationProp<AppStackParamList, 'TaskList'>;

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

interface FilterOptions {
  statusId: number | null;
  prioridadeId: number | null;
  categoriaId: number | null;
}

const TaskListScreen = () => {
  const navigation = useNavigation<TaskListScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statusId: null,
    prioridadeId: null,
    categoriaId: null,
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusOptions, setStatusOptions] = useState([
    { id: 1, texto: 'Novo' },
    { id: 2, texto: 'Em Andamento' },
    { id: 3, texto: 'Concluído' },
    { id: 4, texto: 'Bloqueado' },
    { id: 5, texto: 'Cancelado' },
  ]);
  const [prioridadeOptions, setPrioridadeOptions] = useState([
    { id: 1, texto: 'Baixa' },
    { id: 2, texto: 'Média' },
    { id: 3, texto: 'Alta' },
    { id: 4, texto: 'Urgente' },
  ]);
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);

  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  useEffect(() => {
    loadTasks();
    loadCategorias();
  }, []);

  const loadTasks = async (pageNum = 0, refresh = false) => {
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
      
      if (searchQuery.trim()) {
        const response = await apiService.api.task.searchTasks(searchQuery, pageNum);
        handleTaskResponse(response, refresh);
      }
            else if (
        filterOptions.statusId !== null ||
        filterOptions.prioridadeId !== null ||
        filterOptions.categoriaId !== null
      ) {
        const response = await apiService.api.task.filterTasks(filterOptions, pageNum);
        handleTaskResponse(response, refresh);
      }
      
      else {
        const response = await apiService.api.task.getTasks(pageNum);
        handleTaskResponse(response, refresh);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar as tarefas',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleTaskResponse = (response: any, refresh: boolean) => {
    const newTasks = response.tarefas;
    setTotalPages(response.totalPaginas);
    
    if (refresh || page === 0) {
      setTasks(newTasks);
    } else {
      setTasks(prevTasks => [...prevTasks, ...newTasks]);
    }
  };

  const loadCategorias = async () => {
    try {
      const response = await apiService.api.category.getCategories();
      setCategorias(response.categorias);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const onRefresh = () => {
    loadTasks(0, true);
  };

  const loadMoreTasks = () => {
    if (loadingMore || page + 1 >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadTasks(nextPage);
  };

  const handleSearch = () => {
    setPage(0);
    loadTasks(0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPage(0);
    loadTasks(0);
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    setPage(0);
    loadTasks(0);
  };

  const clearFilters = () => {
    setFilterOptions({
      statusId: null,
      prioridadeId: null,
      categoriaId: null,
    });
    setFilterModalVisible(false);
    setPage(0);
    loadTasks(0);
  };

  const handleMarkCompleted = async (taskId: number) => {
    try {
      setLoading(true);
      await apiService.api.task.completeTask(taskId);
      
      
      loadTasks(page);
      
      Toast.show({
        type: 'success',
        text1: 'Tarefa concluída com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível concluir a tarefa',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReopenTask = async (taskId: number) => {
    try {
      setLoading(true);
      await apiService.api.task.reopenTask(taskId);
      

      loadTasks(page);
      
      Toast.show({
        type: 'success',
        text1: 'Tarefa reaberta com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao reabrir tarefa:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível reabrir a tarefa',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveTask = async (taskId: number) => {
    try {
      setLoading(true);
      await apiService.api.task.archiveTask(taskId);
      
    
      setTasks(tasks.filter(task => task.id !== taskId));
      
      Toast.show({
        type: 'success',
        text1: 'Tarefa arquivada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao arquivar tarefa:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível arquivar a tarefa',
      });
    } finally {
      setLoading(false);
    }
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

  const confirmArchiveSelectedTasks = () => {
    if (selectedTasks.length === 0) {
      showAlert('Atenção', 'Selecione pelo menos uma tarefa para arquivar', 'warning');
      return;
    }

    Alert.alert(
      'Arquivar Tarefas',
      `Tem certeza que deseja arquivar ${selectedTasks.length} tarefa(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Arquivar', onPress: () => arquivarMultiplasTarefas({ tarefasId: selectedTasks })
        }
      ]
    );
  };

const arquivarMultiplasTarefas = async (data: { tarefasId: number[] }) => {
  try {
    setLoading(true);
    await apiService.api.task.arquivarMultiplasTarefas(data);
    setTasks(tasks.filter(task => !data.tarefasId.includes(task.id)));
    showAlert('Sucesso', 'Tarefas arquivadas com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao arquivar tarefas:', error);
    showAlert('Erro', 'Não foi possível arquivar as tarefas', 'error');
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
      'Excluir Tarefas',
      `Tem certeza que deseja excluir ${selectedTasks.length} tarefa(s)? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => excluirMultiplasTarefas({ tarefasId: selectedTasks }) }
      ]
    );
  };

const excluirMultiplasTarefas = async (data: { tarefasId: number[] }) => {
  try {
    setLoading(true);
    await apiService.api.task.excluirMultiplasTarefas(data);
    setTasks(tasks.filter(task => !data.tarefasId.includes(task.id)));
    showAlert('Sucesso', 'Tarefas excluídas com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao excluir tarefas:', error);
    showAlert('Erro', 'Não foi possível excluir as tarefas', 'error');
  } finally {
    setLoading(false);
  }
};

  const getPriorityColor = (prioridadeId: number) => {
    switch (prioridadeId) {
      case 1: return '#4CAF50'; // Baixa
      case 2: return '#FF9800'; // Média
      case 3: return '#F44336'; // Alta
      case 4: return '#9C27B0'; // Urgente
      default: return '#2196F3';
    }
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
        onPress={() =>
          selectMode
            ? toggleSelectTask(item.id)
            : navigation.navigate('TaskDetail', { taskId: item.id })
        }
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
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.prioridadeId) }]} />
            <Text style={[styles.taskTitle, isCompleted && styles.completedText]}>
              {item.titulo}
            </Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.statusId)]}>
            <Text style={styles.statusText}>{item.statusTexto}</Text>
          </View>
        </View>

        {item.descricao ? (
          <Text style={[styles.taskDescription, isCompleted && styles.completedText]} numberOfLines={2}>
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
              {!isCompleted ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}
                  onPress={() => handleMarkCompleted(item.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={22} color="#4CAF50" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}
                  onPress={() => handleReopenTask(item.id)}
                >
                  <Ionicons name="refresh-outline" size={22} color="#FF9800" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}
                onPress={() => handleArchiveTask(item.id)}
              >
                <Ionicons name="archive-outline" size={22} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusStyle = (statusId: number) => {
    switch (statusId) {
      case 1: // Novo
        return { backgroundColor: 'rgba(33, 150, 243, 0.1)' };
      case 2: // Em Andamento
        return { backgroundColor: 'rgba(255, 152, 0, 0.1)' };
      case 3: // Concluído
        return { backgroundColor: 'rgba(76, 175, 80, 0.1)' };
      case 4: // Bloqueado
        return { backgroundColor: 'rgba(244, 67, 54, 0.1)' };
      case 5: // Cancelado
        return { backgroundColor: 'rgba(158, 158, 158, 0.1)' };
      default:
        return { backgroundColor: 'rgba(33, 150, 243, 0.1)' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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
        <Text style={styles.headerTitle}>Minhas Tarefas</Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={toggleSelectMode}
          >
            <Ionicons 
              name={selectMode ? "close" : "checkmark-circle-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={24}
              color={
                filterOptions.statusId !== null ||
                filterOptions.prioridadeId !== null ||
                filterOptions.categoriaId !== null
                  ? '#2196F3'
                  : '#fff'
              }
            />
          </TouchableOpacity>
        </View>
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
              onPress={confirmArchiveSelectedTasks}
              disabled={selectedTasks.length === 0}
            >
              <Ionicons name="archive-outline" size={22} color="#9C27B0" />
              <Text style={[styles.selectionButtonText, { color: '#9C27B0' }]}>Arquivar</Text>
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tarefas..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Task List */}
      {loading && !refreshing && !loadingMore ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando tarefas...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#64748B" />
          <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || filterOptions.statusId || filterOptions.prioridadeId || filterOptions.categoriaId
              ? 'Tente outros filtros ou limpe a busca'
              : 'Crie sua primeira tarefa para começar'}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateTask')}
          >
            <Text style={styles.createButtonText}>Criar Tarefa</Text>
          </TouchableOpacity>
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

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar Tarefas</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.optionsContainer}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status.id}
                    style={[
                      styles.filterOption,
                      filterOptions.statusId === status.id && styles.selectedFilterOption,
                    ]}
                    onPress={() =>
                      setFilterOptions((prev) => ({
                        ...prev,
                        statusId: prev.statusId === status.id ? null : status.id,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterOptions.statusId === status.id && styles.selectedFilterOptionText,
                      ]}
                    >
                      {status.texto}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Prioridade</Text>
              <View style={styles.optionsContainer}>
                {prioridadeOptions.map((prioridade) => (
                  <TouchableOpacity
                    key={prioridade.id}
                    style={[
                      styles.filterOption,
                      filterOptions.prioridadeId === prioridade.id && styles.selectedFilterOption,
                    ]}
                    onPress={() =>
                      setFilterOptions((prev) => ({
                        ...prev,
                        prioridadeId: prev.prioridadeId === prioridade.id ? null : prioridade.id,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterOptions.prioridadeId === prioridade.id &&
                          styles.selectedFilterOptionText,
                      ]}
                    >
                      {prioridade.texto}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categoria</Text>
              <View style={styles.optionsContainer}>
                {categorias.map((categoria) => (
                  <TouchableOpacity
                    key={categoria.id}
                    style={[
                      styles.filterOption,
                      filterOptions.categoriaId === categoria.id && styles.selectedFilterOption,
                    ]}
                    onPress={() =>
                      setFilterOptions((prev) => ({
                        ...prev,
                        categoriaId: prev.categoriaId === categoria.id ? null : categoria.id,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterOptions.categoriaId === categoria.id &&
                          styles.selectedFilterOptionText,
                      ]}
                    >
                      {categoria.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Limpar Filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyFiltersButton} onPress={applyFilters}>
                <Text style={styles.applyFiltersText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTask')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
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
  completedTask: {
    opacity: 0.7,
    backgroundColor: '#1A2234',
  },
  pastDueTask: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  selectedTask: {
    borderWidth: 2,
    borderColor: '#2196F3',
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
    fontSize: 18,
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
  actionButton: {
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  filterOptionText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  selectedFilterOptionText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  clearFiltersButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#64748B',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 16,
  },
  applyFiltersButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
});

export default TaskListScreen;