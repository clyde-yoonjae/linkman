import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  getAllStorageKeys,
  getMultipleStorageItems,
  setMultipleStorageItems,
  getStorageInfo,
  StorageError,
} from "../storage";

// AsyncStorage 모킹
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));

// 모킹된 AsyncStorage 타입 정의
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("Storage Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // __DEV__ 플래그를 true로 설정하여 로깅 테스트
    (global as any).__DEV__ = true;
    // console 메서드들을 스파이로 설정
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getStorageItem", () => {
    it("should retrieve and parse stored item successfully", async () => {
      const testData = { name: "test", value: 123 };
      const testKey = "test-key";

      mockedAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify(testData)
      );

      const result = await getStorageItem<typeof testData>(testKey);

      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(testData);
      expect(console.log).toHaveBeenCalledWith(
        "[Storage] Getting item with key: test-key",
        ""
      );
    });

    it("should return null when item does not exist", async () => {
      const testKey = "non-existent-key";

      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await getStorageItem(testKey);

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        "[Storage] No item found for key: non-existent-key",
        ""
      );
    });

    it("should throw StorageError when AsyncStorage fails", async () => {
      const testKey = "error-key";
      const testError = new Error("AsyncStorage error");

      mockedAsyncStorage.getItem.mockRejectedValueOnce(testError);

      await expect(getStorageItem(testKey)).rejects.toThrow(StorageError);
      expect(console.error).toHaveBeenCalledWith(
        "[Storage Error] Failed to get item with key: error-key",
        testError
      );
    });

    it("should throw StorageError when JSON parsing fails", async () => {
      const testKey = "invalid-json-key";

      mockedAsyncStorage.getItem.mockResolvedValueOnce("invalid json");

      await expect(getStorageItem(testKey)).rejects.toThrow(StorageError);
    });
  });

  describe("setStorageItem", () => {
    it("should serialize and store item successfully", async () => {
      const testData = { name: "test", value: 123 };
      const testKey = "test-key";

      mockedAsyncStorage.setItem.mockResolvedValueOnce();

      await setStorageItem(testKey, testData);

      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testData)
      );
      expect(console.log).toHaveBeenCalledWith(
        "[Storage] Setting item with key: test-key",
        testData
      );
    });

    it("should throw StorageError when AsyncStorage fails", async () => {
      const testKey = "error-key";
      const testData = { test: "data" };
      const testError = new Error("AsyncStorage error");

      mockedAsyncStorage.setItem.mockRejectedValueOnce(testError);

      await expect(setStorageItem(testKey, testData)).rejects.toThrow(
        StorageError
      );
      expect(console.error).toHaveBeenCalledWith(
        "[Storage Error] Failed to set item with key: error-key",
        testError
      );
    });
  });

  describe("removeStorageItem", () => {
    it("should remove item successfully", async () => {
      const testKey = "test-key";

      mockedAsyncStorage.removeItem.mockResolvedValueOnce();

      await removeStorageItem(testKey);

      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith(testKey);
      expect(console.log).toHaveBeenCalledWith(
        "[Storage] Removing item with key: test-key",
        ""
      );
    });

    it("should throw StorageError when AsyncStorage fails", async () => {
      const testKey = "error-key";
      const testError = new Error("AsyncStorage error");

      mockedAsyncStorage.removeItem.mockRejectedValueOnce(testError);

      await expect(removeStorageItem(testKey)).rejects.toThrow(StorageError);
    });
  });

  describe("clearStorage", () => {
    it("should clear all storage successfully", async () => {
      mockedAsyncStorage.clear.mockResolvedValueOnce();

      await clearStorage();

      expect(mockedAsyncStorage.clear).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        "[Storage Warning] Clearing all storage data",
        ""
      );
    });

    it("should throw StorageError when AsyncStorage fails", async () => {
      const testError = new Error("AsyncStorage error");

      mockedAsyncStorage.clear.mockRejectedValueOnce(testError);

      await expect(clearStorage()).rejects.toThrow(StorageError);
    });
  });

  describe("getAllStorageKeys", () => {
    it("should retrieve all keys successfully", async () => {
      const testKeys = ["key1", "key2", "key3"];

      mockedAsyncStorage.getAllKeys.mockResolvedValueOnce(testKeys);

      const result = await getAllStorageKeys();

      expect(mockedAsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(result).toEqual(testKeys);
      expect(console.log).toHaveBeenCalledWith(
        "[Storage] Found 3 keys in storage",
        testKeys
      );
    });

    it("should throw StorageError when AsyncStorage fails", async () => {
      const testError = new Error("AsyncStorage error");

      mockedAsyncStorage.getAllKeys.mockRejectedValueOnce(testError);

      await expect(getAllStorageKeys()).rejects.toThrow(StorageError);
    });
  });

  describe("getMultipleStorageItems", () => {
    it("should retrieve multiple items successfully", async () => {
      const testKeys = ["key1", "key2"];
      const testData1 = { data: "test1" };
      const testData2 = { data: "test2" };
      const mockResponse: [string, string | null][] = [
        ["key1", JSON.stringify(testData1)],
        ["key2", JSON.stringify(testData2)],
      ];

      mockedAsyncStorage.multiGet.mockResolvedValueOnce(mockResponse);

      const result = await getMultipleStorageItems(testKeys);

      expect(mockedAsyncStorage.multiGet).toHaveBeenCalledWith(testKeys);
      expect(result).toEqual({
        key1: testData1,
        key2: testData2,
      });
    });

    it("should handle null values correctly", async () => {
      const testKeys = ["key1", "key2"];
      const mockResponse: [string, string | null][] = [
        ["key1", null],
        ["key2", JSON.stringify({ data: "test" })],
      ];

      mockedAsyncStorage.multiGet.mockResolvedValueOnce(mockResponse);

      const result = await getMultipleStorageItems(testKeys);

      expect(result).toEqual({
        key1: null,
        key2: { data: "test" },
      });
    });

    it("should handle JSON parsing errors gracefully", async () => {
      const testKeys = ["key1"];
      const mockResponse: [string, string | null][] = [
        ["key1", "invalid json"],
      ];

      mockedAsyncStorage.multiGet.mockResolvedValueOnce(mockResponse);

      const result = await getMultipleStorageItems(testKeys);

      expect(result).toEqual({
        key1: null,
      });
      expect(console.error).toHaveBeenCalledWith(
        "[Storage Error] Failed to parse value for key: key1",
        expect.any(Error)
      );
    });
  });

  describe("setMultipleStorageItems", () => {
    it("should store multiple items successfully", async () => {
      const testPairs: Array<[string, any]> = [
        ["key1", { data: "test1" }],
        ["key2", { data: "test2" }],
      ];

      mockedAsyncStorage.multiSet.mockResolvedValueOnce();

      await setMultipleStorageItems(testPairs);

      expect(mockedAsyncStorage.multiSet).toHaveBeenCalledWith([
        ["key1", JSON.stringify({ data: "test1" })],
        ["key2", JSON.stringify({ data: "test2" })],
      ]);
    });

    it("should throw StorageError when AsyncStorage fails", async () => {
      const testPairs: Array<[string, any]> = [["key1", { data: "test" }]];
      const testError = new Error("AsyncStorage error");

      mockedAsyncStorage.multiSet.mockRejectedValueOnce(testError);

      await expect(setMultipleStorageItems(testPairs)).rejects.toThrow(
        StorageError
      );
    });
  });

  describe("getStorageInfo", () => {
    it("should calculate storage info correctly", async () => {
      const testKeys = ["key1", "key2"];
      const testData1 = JSON.stringify({ data: "test1" });
      const testData2 = JSON.stringify({ data: "test2" });

      mockedAsyncStorage.getAllKeys.mockResolvedValueOnce(testKeys);
      mockedAsyncStorage.multiGet.mockResolvedValueOnce([
        ["key1", testData1],
        ["key2", testData2],
      ]);

      const result = await getStorageInfo();

      const expectedSize =
        "key1".length + testData1.length + "key2".length + testData2.length;

      expect(result).toEqual({
        totalKeys: 2,
        keys: testKeys,
        estimatedSize: expectedSize,
      });
    });

    it("should handle null values in size calculation", async () => {
      const testKeys = ["key1"];

      mockedAsyncStorage.getAllKeys.mockResolvedValueOnce(testKeys);
      mockedAsyncStorage.multiGet.mockResolvedValueOnce([["key1", null]]);

      const result = await getStorageInfo();

      expect(result).toEqual({
        totalKeys: 1,
        keys: testKeys,
        estimatedSize: "key1".length,
      });
    });
  });

  describe("StorageError", () => {
    it("should create error with correct properties", () => {
      const originalError = new Error("Original error");
      const storageError = new StorageError(
        "Test error",
        "testOperation",
        "testKey",
        originalError
      );

      expect(storageError.name).toBe("StorageError");
      expect(storageError.message).toBe("Test error");
      expect(storageError.operation).toBe("testOperation");
      expect(storageError.key).toBe("testKey");
      expect(storageError.originalError).toBe(originalError);
    });
  });
});
