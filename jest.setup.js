// Jest setup file

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => ({
  Swipeable: "Swipeable",
  DrawerLayout: "DrawerLayout",
  State: {},
  ScrollView: "ScrollView",
  Slider: "Slider",
  Switch: "Switch",
  TextInput: "TextInput",
  ToolbarAndroid: "ToolbarAndroid",
  ViewPagerAndroid: "ViewPagerAndroid",
  DrawerLayoutAndroid: "DrawerLayoutAndroid",
  WebView: "WebView",
  NativeViewGestureHandler: "NativeViewGestureHandler",
  TapGestureHandler: "TapGestureHandler",
  FlingGestureHandler: "FlingGestureHandler",
  ForceTouchGestureHandler: "ForceTouchGestureHandler",
  LongPressGestureHandler: "LongPressGestureHandler",
  PanGestureHandler: "PanGestureHandler",
  PinchGestureHandler: "PinchGestureHandler",
  RotationGestureHandler: "RotationGestureHandler",
  RawButton: "RawButton",
  BaseButton: "BaseButton",
  RectButton: "RectButton",
  BorderlessButton: "BorderlessButton",
  FlatList: "FlatList",
  gestureHandlerRootHOC: jest.fn(),
  Directions: {},
}));

// Mock Expo modules
jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));
