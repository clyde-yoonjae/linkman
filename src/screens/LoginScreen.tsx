import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import { Button, Logo } from "../components";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (password.length !== 4) {
      Alert.alert("오류", "4자리 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    // TODO: AsyncStorage에서 저장된 비밀번호와 비교
    setTimeout(() => {
      setIsLoading(false);
      // 임시 검증 (실제로는 1234로 설정)
      if (password === "1234") {
        console.log("로그인 성공");
        navigation.replace("Main");
      } else {
        Alert.alert("오류", "비밀번호가 올바르지 않습니다.");
        setPassword("");
      }
    }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Logo size="large" style={styles.logo} />
        <Text style={styles.subtitle}>4자리 비밀번호를 입력해주세요</Text>

        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          keyboardType="numeric"
          maxLength={4}
          autoFocus
        />

        <Button
          title={isLoading ? "확인 중..." : "로그인"}
          onPress={handleLogin}
          disabled={isLoading || password.length !== 4}
          style={styles.loginButton}
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
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 48,
    textAlign: "center",
  },
  passwordInput: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  loginButton: {
    width: "100%",
  },
});
