import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Button } from "../components/Button";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../navigation/MainTabNavigator";

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, "Home">;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleAddLink = () => {
    navigation.navigate("AddLink");
  };

  const handleSearchPress = () => {
    console.log("검색");
    // TODO: 검색 기능 구현
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate("CategoryDetail", { categoryId, categoryName });
  };

  // 임시 데이터
  const categories = [
    { id: "1", name: "일반", count: 5 },
    { id: "2", name: "업무", count: 3 },
    { id: "3", name: "취미", count: 7 },
  ];

  const recentLinks = [
    {
      id: "1",
      title: "React Native 공식 문서",
      url: "https://reactnative.dev",
    },
    { id: "2", title: "TypeScript 핸드북", url: "https://typescriptlang.org" },
    { id: "3", title: "Expo 가이드", url: "https://expo.dev" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 검색바 */}
        <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
          <Text style={styles.searchPlaceholder}>링크 검색...</Text>
        </TouchableOpacity>

        {/* 카테고리 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id, category.name)}
              >
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.count}개</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 최근 링크 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 저장한 링크</Text>
          {recentLinks.map((link) => (
            <TouchableOpacity key={link.id} style={styles.linkCard}>
              <Text style={styles.linkTitle}>{link.title}</Text>
              <Text style={styles.linkUrl}>{link.url}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 플로팅 액션 버튼 */}
      <TouchableOpacity style={styles.fab} onPress={handleAddLink}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchPlaceholder: {
    color: "#999",
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: "#666",
  },
  linkCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 14,
    color: "#666",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
});
