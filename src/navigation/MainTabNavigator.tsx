import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { HomeScreen } from "../screens/HomeScreen";
import { CategoryDetailScreen } from "../screens/CategoryDetailScreen";
import { AddLinkScreen } from "../screens/AddLinkScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { Text } from "react-native";

export type MainTabParamList = {
  HomeStack: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  CategoryDetail: { categoryId: string; categoryName: string };
  AddLink: { categoryId?: string } | undefined;
  EditLink: { linkId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Linkman" }}
      />
      <HomeStack.Screen
        name="CategoryDetail"
        component={CategoryDetailScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <HomeStack.Screen
        name="AddLink"
        component={AddLinkScreen}
        options={{ title: "링크 추가" }}
      />
      <HomeStack.Screen
        name="EditLink"
        component={AddLinkScreen}
        options={{ title: "링크 편집" }}
      />
    </HomeStack.Navigator>
  );
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "홈",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "설정",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
