import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

export const SettingsScreen: React.FC = () => {
  const handleChangePassword = () => {
    Alert.alert(
      "비밀번호 변경",
      "비밀번호 변경 기능은 아직 구현되지 않았습니다."
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "데이터 내보내기",
      "데이터 내보내기 기능은 아직 구현되지 않았습니다."
    );
  };

  const handleImportData = () => {
    Alert.alert(
      "데이터 가져오기",
      "데이터 가져오기 기능은 아직 구현되지 않았습니다."
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "Linkman 정보",
      "Linkman v1.0.0\n\n개인 링크 관리 앱\n개발자: Your Name"
    );
  };

  const settingsItems = [
    {
      title: "보안",
      items: [{ label: "비밀번호 변경", onPress: handleChangePassword }],
    },
    {
      title: "데이터",
      items: [
        { label: "데이터 내보내기", onPress: handleExportData },
        { label: "데이터 가져오기", onPress: handleImportData },
      ],
    },
    {
      title: "정보",
      items: [{ label: "앱 정보", onPress: handleAbout }],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      {settingsItems.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={itemIndex}
              style={styles.settingItem}
              onPress={item.onPress}
            >
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.chevron}>{">"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          모든 데이터는 기기에 안전하게 저장됩니다.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    marginTop: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#f8f8f8",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
  },
  chevron: {
    fontSize: 16,
    color: "#999",
  },
  footer: {
    padding: 16,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
