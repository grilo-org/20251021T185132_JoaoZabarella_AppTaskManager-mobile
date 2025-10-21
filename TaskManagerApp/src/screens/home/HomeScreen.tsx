import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import apiService from '../../services';

type HomeScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2196F3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#673AB7;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Fundo circular -->
  <circle cx="200" cy="200" r="180" fill="#0F172A" filter="url(#shadow)"/>
  
  <!-- Círculo gradiente interno -->
  <circle cx="200" cy="200" r="160" fill="url(#grad1)" opacity="0.9"/>
  
  <!-- Ícone de lista de tarefas -->
  <g fill="white" transform="translate(100, 100) scale(0.8)">
    <!-- Papel/Documento -->
    <path d="M50,30 h150 a20,20 0 0 1 20,20 v200 a20,20 0 0 1 -20,20 h-150 a20,20 0 0 1 -20,-20 v-200 a20,20 0 0 1 20,-20 z" fill="white" opacity="0.95"/>
    
    <!-- Linhas do documento -->
    <line x1="70" y1="90" x2="180" y2="90" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
    <line x1="70" y1="130" x2="180" y2="130" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
    <line x1="70" y1="170" x2="180" y2="170" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
    <line x1="70" y1="210" x2="120" y2="210" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
    
    <!-- Marcação de check -->
    <circle cx="50" y="90" r="12" fill="#2196F3"/>
    <circle cx="50" y="130" r="12" fill="#2196F3"/>
    <circle cx="50" y="170" r="12" fill="#2196F3"/>
    <circle cx="50" y="210" r="12" fill="#2196F3"/>
    
    <!-- Checkmarks -->
    <path d="M44,90 l5,5 l8,-8" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M44,130 l5,5 l8,-8" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

interface Tarefa {
  id: number;
  titulo: string;
  statusId: number;
  statusTexto: string;
  prazo?: string | null;
}

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    concluidas: 0,
    emAndamento: 0,
    comPrazo: 0
  });
  const [tarefasRecentes, setTarefasRecentes] = useState<Tarefa[]>([]);

 const navigation = useNavigation<HomeScreenNavigationProp>();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const cardAnimArray = [
    useState(new Animated.Value(0))[0],
    useState(new Animated.Value(0))[0],
    useState(new Animated.Value(0))[0],
    useState(new Animated.Value(0))[0]
  ];

  const fetchData = async () => {
    setLoading(true);
    try {

      const estatisticas = await apiService.api.task.getTaskStats();
      setStats({
        total: estatisticas.total || 0,
        concluidas: estatisticas.concluidas || 0,
        emAndamento: estatisticas.emAndamento || 0,
        comPrazo: estatisticas.comPrazo || 0
      });

      const response = await apiService.api.task.getTasks(0, 3);
      setTarefasRecentes(response.tarefas || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  fetchData();
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
    ...cardAnimArray.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 300 + index * 100,
        useNativeDriver: true,
      })
    ),
  ]).start();
}, []);

useFocusEffect(
  React.useCallback(() => {
    fetchData();
  }, [])
);

const onRefresh = () => {
  setRefreshing(true);
  fetchData().finally(() => {
    setRefreshing(false);
  });
};

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getStatusStyle = (statusId: number) => {
    switch (statusId) {
      case 1:
        return { backgroundColor: '#4CAF50' };
      case 2:
        return { backgroundColor: '#FF9800' };
      case 3:
        return { backgroundColor: '#F44336' };
      default:
        return { backgroundColor: '#94A3B8' };
    }
  };

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
        <View style={styles.userGreeting}>
          <Text style={styles.greeting}>Olá, {user?.nome || 'Usuário'}!</Text>
          <Text style={styles.subtitle}>Bem-vindo ao TaskManager</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')} 
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#2196F3" 
            colors={["#2196F3"]}
          />
        }
      >
        {/* Logo e título */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <SvgXml xml={logoSvg} width={100} height={100} />
          <Text style={styles.logoTitle}>TaskManager</Text>
        </Animated.View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {cardAnimArray.map((anim, index) => {
            let iconName: "list-outline" | "checkmark-circle-outline" | "time-outline" | "calendar-outline" | undefined;
            let cardTitle, cardValue, cardColor;
            
            switch(index) {
              case 0:
                iconName = "list-outline";
                cardTitle = "Total";
                cardValue = stats.total;
                cardColor = "#2196F3";
                break;
              case 1:
                iconName = "checkmark-circle-outline";
                cardTitle = "Concluídas";
                cardValue = stats.concluidas;
                cardColor = "#4CAF50";
                break;
              case 2:
                iconName = "time-outline";
                cardTitle = "Em Andamento";
                cardValue = stats.emAndamento;
                cardColor = "#FF9800";
                break;
              case 3:
                iconName = "calendar-outline";
                cardTitle = "Com Prazo";
                cardValue = stats.comPrazo;
                cardColor = "#9C27B0";
                break;
            }
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.statCard,
                  {
                    opacity: anim,
                    transform: [
                      { scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      }) }
                    ]
                  }
                ]}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: cardColor }]}>
                  <Ionicons name={iconName} size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{loading ? '-' : cardValue}</Text>
                <Text style={styles.statLabel}>{cardTitle}</Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <TouchableOpacity 
            style={styles.actionCard} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CreateTask')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
              <Ionicons name="add-circle" size={30} color="#2196F3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Nova Tarefa</Text>
              <Text style={styles.actionSubtext}>Crie uma tarefa rapidamente</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TaskList')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
              <Ionicons name="list" size={30} color="#4CAF50" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Ver Todas as Tarefas</Text>
              <Text style={styles.actionSubtext}>Visualize e gerencie suas tarefas</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Categories')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
              <Ionicons name="folder-open" size={30} color="#FF9800" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Categorias</Text>
              <Text style={styles.actionSubtext}>Organize suas tarefas por categoria</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
          </TouchableOpacity>

          {/* Botão para tarefas arquivadas */}
          <TouchableOpacity 
            style={styles.actionCard} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ArchivedTasks')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(156, 39, 176, 0.15)' }]}>
              <Ionicons name="archive" size={30} color="#9C27B0" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Tarefas Arquivadas</Text>
              <Text style={styles.actionSubtext}>Visualize e restaure tarefas arquivadas</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Tarefas Recentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarefas Recentes</Text>
          {tarefasRecentes.length > 0 ? (
            tarefasRecentes.map(tarefa => (
              <TouchableOpacity 
                key={tarefa.id}
                style={styles.recentTaskCard}
                onPress={() => navigation.navigate('TaskDetail', { taskId: tarefa.id })}
              >
                <View style={styles.recentTaskHeader}>
                  <Text style={styles.recentTaskTitle}>{tarefa.titulo}</Text>
                  <View style={[styles.statusBadge, getStatusStyle(tarefa.statusId)]}>
                    <Text style={styles.statusText}>{tarefa.statusTexto}</Text>
                  </View>
                </View>
                {tarefa.prazo && (
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                    <Text style={styles.dateText}>
                      {new Date(tarefa.prazo).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#64748B" />
              <Text style={styles.emptyText}>Nenhuma tarefa recente</Text>
              <Text style={styles.emptySubtext}>Crie sua primeira tarefa para começar</Text>
              <TouchableOpacity 
                style={styles.emptyButton} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CreateTask')}
              >
                <Text style={styles.emptyButtonText}>Criar Tarefa</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botão flutuante para adicionar tarefa */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  userGreeting: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    fontSize: 18,
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  recentTaskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTaskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  changePasswordButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  changePasswordText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default HomeScreen;