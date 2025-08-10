import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { HomeStackParamList } from "../navigation/MainTabNavigator";

type CategoryDetailScreenProps = {
  route: RouteProp<HomeStackParamList, "CategoryDetail">;
};

export const CategoryDetailScreen: React.FC<CategoryDetailScreenProps> = ({
  route,
}) => {
  const { categoryId, categoryName } = route.params;

  // 임시 데이터
  const links = [
    {
      id: "1",
      title: "React Native 공식 문서",
      url: "https://reactnative.dev",
      description: "RN 개발에 필요한 모든 정보",
    },
    {
      id: "2",
      title: "TypeScript 핸드북",
      url: "https://typescriptlang.org",
      description: "TS 기초부터 고급까지",
    },
    {
      id: "3",
      title: "Expo 가이드",
      url: "https://expo.dev",
      description: "Expo 플랫폼 사용법",
    },
  ];

  const handleLinkPress = (linkId: string) => {
    console.log(`링크 선택: ${linkId}`);
    // TODO: 링크 상세 또는 웹뷰로 이동
  };

  const handleEditLink = (linkId: string) => {
    console.log(`링크 편집: ${linkId}`);
    // TODO: 편집 화면으로 이동
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.categoryInfo}>
          {categoryName} 카테고리 • {links.length}개의 링크
        </Text>

        {links.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={styles.linkCard}
            onPress={() => handleLinkPress(link.id)}
            onLongPress={() => handleEditLink(link.id)}
          >
            <Text style={styles.linkTitle}>{link.title}</Text>
            <Text style={styles.linkDescription}>{link.description}</Text>
            <Text style={styles.linkUrl}>{link.url}</Text>
          </TouchableOpacity>
        ))}

        {links.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>아직 저장된 링크가 없습니다.</Text>
            <Text style={styles.emptySubtext}>
              + 버튼을 눌러 첫 번째 링크를 추가해보세요!
            </Text>
          </View>
        )}
      </ScrollView>
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
  categoryInfo: {
    fontSize: 16,
    color: "#666",
    marginVertical: 16,
    textAlign: "center",
  },
  linkCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  linkDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  linkUrl: {
    fontSize: 12,
    color: "#007AFF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
