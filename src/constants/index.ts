// 앱 상수들
export const COLORS = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  gray: "#8E8E93",
  lightGray: "#F2F2F7",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const API_ENDPOINTS = {
  BASE_URL: "https://api.linkman.com",
  USERS: "/users",
  LINKS: "/links",
} as const;
