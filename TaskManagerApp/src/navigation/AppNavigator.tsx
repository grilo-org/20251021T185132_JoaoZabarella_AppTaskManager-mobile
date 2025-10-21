import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/home/HomeScreen';
import TaskListScreen from '../screens/tasks/TaskListScreen'; 
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen'; 
import CreateTaskScreen from '../screens/tasks/CreateTaskScreen';
import EditTaskScreen from '../screens/tasks/EditTaskScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen'; 
import ArchivedTasksScreen from '../screens/tasks/ArchivedTasksScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import ProfileScreen from '../screens/home/ProfileScreen'; 

export type AppStackParamList = {
  Home: undefined;
  TaskList: undefined;
  TaskDetail: { taskId: number };
  CreateTask: undefined;
  EditTask: { taskId: number };
  Categories: undefined; 
  Profile: undefined;
  Settings: undefined;
  ArchivedTasks: undefined;
  ChangePassword: undefined;

};

const Stack = createStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="TaskList" component={TaskListScreen} /> 
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
      <Stack.Screen name="EditTask" component={EditTaskScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} /> 
      <Stack.Screen name="ArchivedTasks" component={ArchivedTasksScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
     
    </Stack.Navigator>
  );
}