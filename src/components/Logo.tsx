import React from "react";
import { View, Text, StyleSheet, ViewStyle, Image } from "react-native";
import { useTheme } from "../stores";
import LogoImage from "../assets/images/common/logo.png";

interface LogoProps {
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = "medium",
  style,
  showText = true,
}) => {
  const theme = useTheme();

  const sizeConfig = {
    small: {
      iconSize: 32,
      fontSize: 18,
      spacing: 4,
    },
    medium: {
      iconSize: 48,
      fontSize: 24,
      spacing: 8,
    },
    large: {
      iconSize: 64,
      fontSize: 32,
      spacing: 12,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.container, style]}>
      {/* 로고 이미지 */}
      <Image
        source={LogoImage}
        style={[
          styles.logoIcon,
          {
            width: config.iconSize,
            height: config.iconSize,
          },
        ]}
        resizeMode="contain"
      />

      {showText && (
        <Text
          style={[
            styles.logoText,
            {
              fontSize: config.fontSize,
              color: theme.colors.primary,
              marginTop: config.spacing,
            },
          ]}
        >
          Linkman
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
