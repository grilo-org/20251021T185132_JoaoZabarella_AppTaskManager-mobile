import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AppStackParamList } from '../../navigation/AppNavigator';
import apiService from '../../services';

type EditTaskScreenRouteProp = RouteProp<AppStackParamList, 'EditTask'>;
type EditTaskScreenNavigationProp = StackNavigationProp<AppStackParamList, 'EditTask'>;

interface Category {
  id: number;
  nome: string;
}

interface Status {
  id: number;
  texto: string;
}

interface Priority {
  id: number;
  texto: string;
}

interface TaskDetails {
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
  categoriaId: number | null;
  categoriaNome: string | null;
  concluida: string;
}

const EditTaskScreen = () => {
  const route = useRoute<EditTaskScreenRouteProp>();
  const navigation = useNavigation<EditTaskScreenNavigationProp>();
  const { taskId } = route.params;

 
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState<number | null>(null);
  const [priorityId, setPriorityId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalTask, setOriginalTask] = useState<TaskDetails | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  

  const [statuses, setStatuses] = useState<Status[]>([
    { id: 1, texto: 'Novo' },
    { id: 2, texto: 'Em Andamento' },
    { id: 3, texto: 'Concluído' },
    { id: 4, texto: 'Bloqueado' },
    { id: 5, texto: 'Cancelado' },
  ]);
  const [priorities, setPriorities] = useState<Priority[]>([
    { id: 1, texto: 'Baixa' },
    { id: 2, texto: 'Média' },
    { id: 3, texto: 'Alta' },
    { id: 4, texto: 'Urgente' },
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadTaskDetails(),
          loadCategories()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Não foi possível carregar os dados da tarefa',
        });
      } finally {
        
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
      }
    };

    loadData();
  }, [taskId]);

  const loadTaskDetails = async () => {
    setLoading(true);
    try {
      const response = await apiService.api.task.getTaskById(taskId);
      setOriginalTask(response);
      
    
      setTitle(response.titulo);
      setDescription(response.descricao || '');
      setStatusId(response.statusId);
      setPriorityId(response.prioridadeId);
      setCategoryId(response.categoriaId);
      
      if (response.prazo) {
        setDueDate(new Date(response.prazo));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading task details:', error);
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os detalhes da tarefa',
      });
      navigation.goBack();
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await apiService.api.category.getCategories();
      setCategories(response.categorias || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar as categorias',
      });
    } finally {
      setLoadingCategories(false);
    }
  };

 
  const getStatusText = () => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.texto : 'Selecione um status';
  };
  
  const getPriorityText = () => {
    const priority = priorities.find(p => p.id === priorityId);
    return priority ? priority.texto : 'Selecione uma prioridade';
  };
  
  const getCategoryText = () => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.nome : 'Selecione uma categoria (opcional)';
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

  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (!selectedDate) return;
      
      if (datePickerMode === 'date') {
        
        setDatePickerMode('time');
        setShowDatePicker(true);
      
        const tempDate = selectedDate;
        if (dueDate) {
          tempDate.setHours(dueDate.getHours());
          tempDate.setMinutes(dueDate.getMinutes());
        }
        setDueDate(tempDate);
      } else {
       
        setDatePickerMode('date');
        
        if (dueDate) {
       
          const finalDate = new Date(dueDate);
          finalDate.setHours(selectedDate.getHours());
          finalDate.setMinutes(selectedDate.getMinutes());
          setDueDate(finalDate);
        } else {
          setDueDate(selectedDate);
        }
      }
    } else {
      
      if (selectedDate) {
        setDueDate(selectedDate);
      }
    }
  };
  
  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setDatePickerMode('date');
      setShowDatePicker(true);
    } else {
      setDatePickerMode('date');
      setShowDatePickerModal(true);
    }
  };

  const clearDueDate = () => {
    setDueDate(null);
  };

  
  const validateForm = () => {
    let isValid = true;
    
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'O título da tarefa é obrigatório',
      });
      isValid = false;
    }
    
    if (!statusId) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'O status da tarefa é obrigatório',
      });
      isValid = false;
    }
    
    if (!priorityId) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'A prioridade da tarefa é obrigatória',
      });
      isValid = false;
    }
    
    return isValid;
  };

  const isTaskModified = () => {
    if (!originalTask) return false;
    
    const prazoOriginal = originalTask.prazo ? new Date(originalTask.prazo).toISOString() : null;
    const prazoAtual = dueDate ? dueDate.toISOString() : null;
    
    return title !== originalTask.titulo ||
           description !== (originalTask.descricao || '') ||
           statusId !== originalTask.statusId ||
           priorityId !== originalTask.prioridadeId ||
           categoryId !== originalTask.categoriaId ||
           prazoAtual !== prazoOriginal;
  };


  const handleUpdateTask = async () => {
    if (!validateForm()) return;
    
    if (!isTaskModified()) {
      Toast.show({
        type: 'info',
        text1: 'Informação',
        text2: 'Nenhuma alteração foi feita na tarefa',
      });
      navigation.goBack();
      return;
    }
    
    setSaving(true);
    try {
      const taskData = {
        id: taskId,
        titulo: title,
        descricao: description,
        statusId,
        prioridadeId: priorityId,
        prazo: dueDate ? dueDate.toISOString() : null,
        categoriaId: categoryId,
      };
      
      await apiService.api.task.updateTask(taskData);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Tarefa atualizada com sucesso!',
      });
      
      navigation.goBack();
      
    } catch (error) {
      console.error('Error updating task:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível atualizar a tarefa',
      });
    } finally {
      setSaving(false);
    }
  };

  
  const handleCancel = () => {
    if (isTaskModified()) {
      Alert.alert(
        'Cancelar edição',
        'Tem certeza que deseja cancelar? Todas as alterações serão perdidas.',
        [
          {
            text: 'Não',
            style: 'cancel',
          },
          {
            text: 'Sim',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: true }
      );
    } else {
      navigation.goBack();
    }
  };

  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Tarefa</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando tarefa...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.formSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Campo Título */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Título *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite o título da tarefa"
                    placeholderTextColor="#94A3B8"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                  />
                </View>
              </View>
              
              {/* Campo Descrição */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descrição</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Digite uma descrição (opcional)"
                    placeholderTextColor="#94A3B8"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                    maxLength={500}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              
              {/* Campo Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Status *</Text>
                <TouchableOpacity
                  style={styles.selectContainer}
                  onPress={() => setShowStatusModal(true)}
                >
                  <Text style={styles.selectText}>{getStatusText()}</Text>
                  <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              
              {/* Campo Prioridade */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Prioridade *</Text>
                <TouchableOpacity
                  style={styles.selectContainer}
                  onPress={() => setShowPriorityModal(true)}
                >
                  {priorityId ? (
                    <View style={styles.priorityContainer}>
                      <View 
                        style={[
                          styles.priorityIndicator, 
                          { backgroundColor: getPriorityColor(priorityId) }
                        ]} 
                      />
                      <Text style={styles.selectText}>{getPriorityText()}</Text>
                    </View>
                  ) : (
                    <Text style={styles.selectText}>Selecione uma prioridade</Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              
              {/* Campo Categoria */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoria</Text>
                <TouchableOpacity
                  style={styles.selectContainer}
                  onPress={() => setShowCategoryModal(true)}
                  disabled={loadingCategories}
                >
                  {loadingCategories ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#2196F3" />
                      <Text style={styles.loadingText}>Carregando categorias...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.selectText}>{getCategoryText()}</Text>
                      <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Campo Prazo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Prazo</Text>
                <View style={styles.dateContainer}>
                  <TouchableOpacity
                    style={styles.selectContainer}
                    onPress={openDatePicker}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                    <Text style={styles.selectText}>
                      {dueDate ? format(dueDate, 'dd MMM yyyy, HH:mm', { locale: pt }) : 'Definir prazo (opcional)'}
                    </Text>
                  </TouchableOpacity>
                  
                  {dueDate && (
                    <TouchableOpacity
                      style={styles.clearDateButton}
                      onPress={clearDueDate}
                    >
                      <Ionicons name="close-circle" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              {/* Botões */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleUpdateTask}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={20} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      
      {/* DateTimePicker for Android */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode={datePickerMode}
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={[
                    styles.modalItem,
                    statusId === status.id && styles.selectedModalItem,
                  ]}
                  onPress={() => {
                    setStatusId(status.id);
                    setShowStatusModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      statusId === status.id && styles.selectedModalItemText,
                    ]}
                  >
                    {status.texto}
                  </Text>
                  {statusId === status.id && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Priority Modal */}
      <Modal
        visible={showPriorityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPriorityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Prioridade</Text>
              <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.modalItem,
                    priorityId === priority.id && styles.selectedModalItem,
                  ]}
                  onPress={() => {
                    setPriorityId(priority.id);
                    setShowPriorityModal(false);
                  }}
                >
                  <View style={styles.priorityContainer}>
                    <View 
                      style={[
                        styles.priorityIndicator, 
                        { backgroundColor: getPriorityColor(priority.id) }
                      ]} 
                    />
                    <Text
                      style={[
                        styles.modalItemText,
                        priorityId === priority.id && styles.selectedModalItemText,
                      ]}
                    >
                      {priority.texto}
                    </Text>
                  </View>
                  
                  {priorityId === priority.id && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  categoryId === null && styles.selectedModalItem,
                ]}
                onPress={() => {
                  setCategoryId(null);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    categoryId === null && styles.selectedModalItemText,
                  ]}
                >
                  Sem categoria
                </Text>
                {categoryId === null && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.modalItem,
                    categoryId === category.id && styles.selectedModalItem,
                  ]}
                  onPress={() => {
                    setCategoryId(category.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      categoryId === category.id && styles.selectedModalItemText,
                    ]}
                  >
                    {category.nome}
                  </Text>
                  {categoryId === category.id && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Modal de seleção de data para iOS */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {datePickerMode === 'date' ? 'Selecione a data' : 'Selecione a hora'}
              </Text>
              <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <DateTimePicker
              value={dueDate || new Date()}
              mode={datePickerMode}
              display="spinner"
              onChange={handleDateChange}
              minimumDate={new Date()}
              textColor="#fff"
            />
            
            <View style={styles.datePickerButtonContainer}>
              {datePickerMode === 'date' ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => setDatePickerMode('time')}
                >
                  <Text style={styles.nextButtonText}>Próximo</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => {
                    setDatePickerMode('date');
                    setShowDatePickerModal(false);
                  }}
                >
                  <Text style={styles.doneButtonText}>Confirmar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94A3B8',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textAreaContainer: {
    minHeight: 120,
  },
  textArea: {
    height: 120,
  },
  selectContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  selectText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearDateButton: {
    padding: 8,
    marginLeft: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    padding: 10,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  selectedModalItem: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  modalItemText: {
    fontSize: 16,
    color: '#CBD5E1',
  },
  selectedModalItemText: {
    color: '#2196F3',
    fontWeight: '500',
  },

  datePickerModalContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  datePickerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default EditTaskScreen;