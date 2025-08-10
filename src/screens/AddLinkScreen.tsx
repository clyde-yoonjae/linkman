import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Button } from "../components/Button";
import { useNavigation } from "@react-navigation/native";

export const AddLinkScreen: React.FC = () => {
  const navigation = useNavigation();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 임시 카테고리 데이터
  const categories = [
    { id: "1", name: "일반" },
    { id: "2", name: "업무" },
    { id: "3", name: "취미" },
  ];

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert("오류", "URL을 입력해주세요.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("오류", "제목을 입력해주세요.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("오류", "카테고리를 선택해주세요.");
      return;
    }

    setIsLoading(true);

    // TODO: AsyncStorage에 링크 저장
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("성공", "링크가 저장되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    }, 1000);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL *</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="링크 제목을 입력하세요"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="링크에 대한 설명을 입력하세요 (선택사항)"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>카테고리 *</Text>
          <View style={styles.categoryList}>
            {categories.map((category) => (
              <Button
                key={category.id}
                title={category.name}
                onPress={() => handleCategorySelect(category.id)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id &&
                    styles.selectedCategoryButton,
                ]}
                variant={
                  selectedCategory === category.id ? "primary" : "secondary"
                }
              />
            ))}
          </View>
        </View>

        <Button
          title={isLoading ? "저장 중..." : "링크 저장"}
          onPress={handleSave}
          disabled={isLoading}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  descriptionInput: {
    height: 80,
    paddingTop: 12,
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: "#007AFF",
  },
  saveButton: {
    marginTop: 24,
  },
});
