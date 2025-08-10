import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button, Logo } from "../components";

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation";

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  const handleGetStarted = () => {
    // 온보딩 완료 후 로그인 화면으로 이동
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Logo size="large" style={styles.logo} />
        <Text style={styles.title}>Linkman에 오신 것을 환영합니다!</Text>
        <Text style={styles.subtitle}>
          웹에서 발견한 유용한 링크들을 체계적으로 관리해보세요.
        </Text>

        <View style={styles.features}>
          <Text style={styles.featureItem}>📱 개인 프라이버시 보호</Text>
          <Text style={styles.featureItem}>📂 카테고리별 링크 관리</Text>
          <Text style={styles.featureItem}>🔍 빠른 검색 기능</Text>
          <Text style={styles.featureItem}>💾 100% 오프라인 동작</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="시작하기"
          onPress={handleGetStarted}
          style={styles.startButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 48,
    lineHeight: 24,
  },
  features: {
    alignItems: "flex-start",
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 12,
    color: "#444",
  },
  footer: {
    paddingBottom: 48,
  },
  startButton: {
    marginTop: 24,
  },
});
