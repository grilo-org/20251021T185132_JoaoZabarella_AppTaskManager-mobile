import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AppStackParamList } from '../../navigation/AppNavigator';
import apiService from '../../services';
import Toast from 'react-native-toast-message';

type CategoriesScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Categories'>;

interface Category {
  id: number;
  nome: string;
}

const CategoriesScreen = () => {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');

  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

 
  useEffect(() => {
    loadCategories();
    
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
  }, []);

  const loadCategories = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else if (!loading) {
      setLoading(true);
    }
    
    try {
      const response = await apiService.api.category.getCategories();
      setCategories(response.categorias || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar as categorias',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

 
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'O nome da categoria não pode estar vazio',
      });
      return;
    }
    
    setLoading(true);
    try {
      await apiService.api.category.createCategory({ nome: newCategoryName });
      setNewCategoryName('');
      setCreateModalVisible(false);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Categoria criada com sucesso!',
      });
      
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      let errorMessage = 'Não foi possível criar a categoria';
      
      if (error.response?.status === 409) {
        errorMessage = 'Já existe uma categoria com esse nome';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage,
      });
      setLoading(false);
    }
  };

  
  const handleEditCategory = async () => {
    if (!editingCategory) return;
    
    if (!editedCategoryName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'O nome da categoria não pode estar vazio',
      });
      return;
    }
    
    if (editedCategoryName === editingCategory.nome) {
      setEditModalVisible(false);
      return;
    }
    
    setLoading(true);
    try {
      await apiService.api.category.updateCategory(editingCategory.id, { nome: editedCategoryName });
      setEditingCategory(null);
      setEditedCategoryName('');
      setEditModalVisible(false);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Categoria atualizada com sucesso!',
      });
      
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      let errorMessage = 'Não foi possível atualizar a categoria';
      
      if (error.response?.status === 409) {
        errorMessage = 'Já existe uma categoria com esse nome';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage,
      });
      setLoading(false);
    }
  };


  const checkCategoryHasTasks = async (categoryId: number): Promise<number> => {
    try {
      const response = await apiService.api.task.filterTasks(
        {
          statusId: null,
          prioridadeId: null,
          categoriaId: categoryId,
        },
        0,
        1 
      );
      return response.totalItens || 0;
    } catch (error) {
      console.error('Erro ao verificar tarefas na categoria:', error);
      return 0;
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.nome);
    setEditModalVisible(true);
  };

  
  const confirmDeleteCategory = async (category: Category) => {
    const taskCount = await checkCategoryHasTasks(category.id);

    if (taskCount > 0) {
      Alert.alert(
        'Atenção',
        `A categoria "${category.nome}" tem ${taskCount} tarefa(s) associada(s). O que deseja fazer?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Manter tarefas',
            onPress: () => {
              
              handleDeleteCategory(category.id, false);
            },
          },
          {
            text: 'Excluir tudo',
            style: 'destructive',
            onPress: () => {
              
              handleDeleteCategory(category.id, true);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert(
        'Excluir Categoria',
        `Tem certeza que deseja excluir a categoria "${category.nome}"?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => handleDeleteCategory(category.id, false),
          },
        ],
        { cancelable: true }
      );
    }
  };

  
  const handleDeleteCategory = async (categoryId: number, deleteTasks: boolean = false) => {
    setLoading(true);
    try {
      if (deleteTasks) {
      
        const response = await apiService.api.task.filterTasks(
          {
            statusId: null,
            prioridadeId: null,
            categoriaId: categoryId,
          },
          0,
          999
        );
        const taskIds = response.tarefas.map((task: any) => task.id);
        if (taskIds.length > 0) {
          await apiService.api.task.deleteBulkTasks(taskIds);
        }
      }
      await apiService.api.category.deleteCategory(categoryId);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: deleteTasks
          ? 'Categoria e tarefas associadas excluídas com sucesso!'
          : 'Categoria excluída com sucesso!',
      });
      
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      let errorMessage = 'Não foi possível excluir a categoria';
      
      if (error.response?.status === 400) {
        errorMessage = 'Erro ao excluir a categoria. Tente novamente.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: errorMessage,
      });
      setLoading(false);
    }
  };


  const renderCategoryItem = ({ item }: { item: Category }) => (
    <Animated.View
      style={[
        styles.categoryItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.categoryInfo}>
        <Ionicons name="folder-outline" size={24} color="#2196F3" />
        <Text style={styles.categoryName}>{item.nome}</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={22} color="#2196F3" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}
          onPress={() => confirmDeleteCategory(item)}
        >
          <Ionicons name="trash-outline" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

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
        <Text style={styles.headerTitle}>Categorias</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Conteúdo principal */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando categorias...</Text>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#64748B" />
          <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
          <Text style={styles.emptySubtext}>Crie uma categoria para organizar suas tarefas</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Criar Categoria</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadCategories(true)}
        />
      )}
      
      {/* Botão Criar Categoria */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
      
      {/* Modal Criar Categoria */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Categoria</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Nome da categoria</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome da categoria"
                  placeholderTextColor="#94A3B8"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                  maxLength={100}
                />
              </View>
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setNewCategoryName('');
                    setCreateModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                >
                  <Text style={styles.createButtonText}>Criar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal Editar Categoria */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Categoria</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Nome da categoria</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome da categoria"
                  placeholderTextColor="#94A3B8"
                  value={editedCategoryName}
                  onChangeText={setEditedCategoryName}
                  autoFocus
                  maxLength={100}
                />
              </View>
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingCategory(null);
                    setEditedCategoryName('');
                    setEditModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleEditCategory}
                  disabled={!editedCategoryName.trim()}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94A3B8',
  },
  listContent: {
    padding: 16,
  },
  categoryItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
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
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#0F172A',
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
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoriesScreen;