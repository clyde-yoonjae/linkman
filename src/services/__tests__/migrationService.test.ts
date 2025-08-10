import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  migrateDataIfNeeded,
  createBackup,
  restoreFromBackup,
  resetToDefaults,
  validateDataIntegrity,
  autoRecoverCorruptedData,
  debugStorageState,
  forceMigration,
  nukeStorage,
  MigrationError,
  DataRecoveryError,
} from "../migrationService";
import {
  Settings,
  Category,
  Link,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
} from "../../types/data";
import * as utils from "../../utils";

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

// utils 모킹
jest.mock("../../utils", () => ({
  generateId: jest.fn(),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedUtils = utils as jest.Mocked<typeof utils>;

// 테스트 데이터
const mockOldSettings = {
  isFirstLaunch: false,
  isDarkMode: true,
  appVersion: "0.9.0",
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const mockCurrentSettings: Settings = {
  isFirstLaunch: false,
  isDarkMode: true,
  appVersion: "1.0.0",
  autoLockTimeMinutes: 5,
  autoDetectClipboard: true,
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const mockOldCategory = {
  id: "cat-1",
  name: "Test Category",
  color: "#FF0000",
  icon: "🔥",
  description: "Test description",
  // sortOrder 필드가 없는 구버전
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const mockCurrentCategory: Category = {
  id: "cat-1",
  name: "Test Category",
  color: "#FF0000",
  icon: "🔥",
  description: "Test description",
  sortOrder: 0,
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const mockOldLink = {
  id: "link-1",
  url: "https://example.com",
  title: "Example Link",
  description: "Example description",
  categoryId: "cat-1",
  isFavorite: false,
  tags: ["test"],
  sortOrder: 0,
  // accessCount, lastAccessedAt, thumbnailUrl, notes 필드가 없는 구버전
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const mockCurrentLink: Link = {
  id: "link-1",
  url: "https://example.com",
  title: "Example Link",
  description: "Example description",
  thumbnailUrl: undefined,
  categoryId: "cat-1",
  isFavorite: false,
  tags: ["test"],
  notes: undefined,
  sortOrder: 0,
  lastAccessedAt: undefined,
  accessCount: 0,
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

describe("MigrationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();

    // generateId 기본 모킹
    mockedUtils.generateId.mockReturnValue("test-id");

    // __DEV__ 설정
    (global as any).__DEV__ = true;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // 마이그레이션 테스트
  // ==========================================================================

  describe("Migration", () => {
    describe("migrateDataIfNeeded", () => {
      it("should return null if no settings exist", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

        const result = await migrateDataIfNeeded();

        expect(result).toBeNull();
        expect(console.log).toHaveBeenCalledWith(
          "[Migration] No existing settings found, migration not needed"
        );
      });

      it("should return null if already on latest version", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockCurrentSettings)
        );

        const result = await migrateDataIfNeeded();

        expect(result).toBeNull();
        expect(console.log).toHaveBeenCalledWith(
          "[Migration] Already on latest version 1.0.0"
        );
      });

      it("should perform migration from 0.9.0 to 1.0.0", async () => {
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockOldSettings)) // 초기 settings 조회
          .mockResolvedValueOnce(JSON.stringify(mockOldSettings)) // createBackup - settings
          .mockResolvedValueOnce(JSON.stringify([mockOldCategory])) // createBackup - categories
          .mockResolvedValueOnce(JSON.stringify([mockOldLink])) // createBackup - links
          .mockResolvedValueOnce(JSON.stringify([mockOldCategory])) // migration step 1 - categories
          .mockResolvedValueOnce(JSON.stringify([mockOldLink])) // migration step 2 - links
          .mockResolvedValueOnce(JSON.stringify(mockOldSettings)) // migration step 3 - settings
          .mockResolvedValueOnce(JSON.stringify(mockOldSettings)); // updateAppVersion - settings

        mockedAsyncStorage.setItem.mockResolvedValue();

        const result = await migrateDataIfNeeded();

        expect(result).toBeDefined();
        expect(result!.success).toBe(true);
        expect(result!.fromVersion).toBe("0.9.0");
        expect(result!.toVersion).toBe("1.0.0");
        expect(result!.backupCreated).toBe(true);
        expect(result!.migratedData).toContain(
          "Add missing category sortOrder field"
        );
        expect(result!.migratedData).toContain(
          "Add missing link fields for 1.0.0"
        );
        expect(result!.migratedData).toContain(
          "Update settings format for 1.0.0"
        );
        expect(result!.migratedData).toContain("Updated app version");
      });

      it("should handle migration errors gracefully", async () => {
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockOldSettings))
          .mockRejectedValue(new Error("Storage error"));

        await expect(migrateDataIfNeeded()).rejects.toThrow(MigrationError);
      });
    });

    describe("forceMigration", () => {
      it("should perform forced migration in dev mode", async () => {
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockOldSettings)) // createBackup - settings
          .mockResolvedValueOnce(JSON.stringify([mockOldCategory])) // createBackup - categories
          .mockResolvedValueOnce(JSON.stringify([mockOldLink])) // createBackup - links
          .mockResolvedValueOnce(JSON.stringify([mockOldCategory])) // migration step 1 - categories
          .mockResolvedValueOnce(JSON.stringify([mockOldLink])) // migration step 2 - links
          .mockResolvedValueOnce(JSON.stringify(mockOldSettings)) // migration step 3 - settings
          .mockResolvedValueOnce(JSON.stringify(mockOldSettings)); // updateAppVersion - settings

        mockedAsyncStorage.setItem.mockResolvedValue();

        const result = await forceMigration("0.9.0", "1.0.0");

        expect(result.success).toBe(true);
        expect(result.fromVersion).toBe("0.9.0");
        expect(result.toVersion).toBe("1.0.0");
      });

      it("should throw error in production mode", async () => {
        (global as any).__DEV__ = false;

        await expect(forceMigration("0.9.0", "1.0.0")).rejects.toThrow(
          "Force migration is only available in development mode"
        );
      });
    });
  });

  // ==========================================================================
  // 백업 및 복구 테스트
  // ==========================================================================

  describe("Backup and Recovery", () => {
    describe("createBackup", () => {
      it("should create backup successfully", async () => {
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockCurrentSettings))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory]))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentLink]));

        mockedAsyncStorage.setItem.mockResolvedValue();

        const result = await createBackup("1.0.0");

        expect(result).toBe(true);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.BACKUP_DATA,
          expect.stringContaining('"version":"1.0.0"')
        );
      });

      it("should handle backup errors gracefully", async () => {
        mockedAsyncStorage.getItem.mockRejectedValue(
          new Error("Storage error")
        );

        const result = await createBackup("1.0.0");

        expect(result).toBe(false);
      });
    });

    describe("restoreFromBackup", () => {
      it("should restore from backup successfully", async () => {
        const backupData = {
          metadata: {
            version: "1.0.0",
            timestamp: "2023-01-01T00:00:00.000Z",
            dataTypes: ["settings", "categories", "links"],
            size: 1000,
          },
          data: {
            settings: mockCurrentSettings,
            categories: [mockCurrentCategory],
            links: [mockCurrentLink],
          },
        };

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(backupData)
        );
        mockedAsyncStorage.setItem.mockResolvedValue();

        const result = await restoreFromBackup();

        expect(result.success).toBe(true);
        expect(result.strategy).toBe("backup");
        expect(result.recoveredItems).toBe(3);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(3);
      });

      it("should throw error when no backup exists", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

        await expect(restoreFromBackup()).rejects.toThrow(DataRecoveryError);
      });
    });

    describe("resetToDefaults", () => {
      it("should reset all data to defaults", async () => {
        mockedAsyncStorage.setItem.mockResolvedValue();
        mockedUtils.generateId
          .mockReturnValueOnce("cat-1")
          .mockReturnValueOnce("cat-2")
          .mockReturnValueOnce("cat-3")
          .mockReturnValueOnce("cat-4")
          .mockReturnValueOnce("cat-5");

        const result = await resetToDefaults();

        expect(result.success).toBe(true);
        expect(result.strategy).toBe("default");
        expect(result.recoveredItems).toBe(3);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(3);
      });
    });
  });

  // ==========================================================================
  // 데이터 검증 및 복구 테스트
  // ==========================================================================

  describe("Data Validation and Recovery", () => {
    describe("validateDataIntegrity", () => {
      it("should validate healthy data", async () => {
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockCurrentSettings))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory]))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentLink]));

        const result = await validateDataIntegrity();

        expect(result.isValid).toBe(true);
        expect(result.corruptedData).toHaveLength(0);
        expect(result.recommendations).toHaveLength(0);
      });

      it("should detect corrupted data", async () => {
        const corruptedSettings = { invalid: "data" };

        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(corruptedSettings))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory]))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentLink]));

        const result = await validateDataIntegrity();

        expect(result.isValid).toBe(false);
        expect(result.corruptedData).toContain("settings");
        expect(result.recommendations).toContain(
          "Settings data is corrupted - restore from backup or reset to defaults"
        );
      });

      it("should detect orphaned links", async () => {
        const orphanedLink = { ...mockCurrentLink, categoryId: "non-existent" };

        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockCurrentSettings))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory]))
          .mockResolvedValueOnce(JSON.stringify([orphanedLink]));

        const result = await validateDataIntegrity();

        expect(result.isValid).toBe(false);
        expect(result.corruptedData).toContain("link-category-relationships");
      });

      it("should detect missing data", async () => {
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(null) // missing settings
          .mockResolvedValueOnce(null) // missing categories
          .mockResolvedValueOnce(JSON.stringify([mockCurrentLink]));

        const result = await validateDataIntegrity();

        expect(result.isValid).toBe(true); // 실제로는 누락된 데이터가 있어도 전체적으로는 유효할 수 있음
        expect(result.corruptedData).toContain("settings");
        expect(result.corruptedData).toContain("categories");
      });
    });

    describe("autoRecoverCorruptedData", () => {
      it("should return success if no corruption found", async () => {
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockCurrentSettings))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory]))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentLink]));

        const result = await autoRecoverCorruptedData();

        expect(result.success).toBe(true);
        expect(result.recoveredItems).toBe(0);
      });

      it("should recover corrupted settings", async () => {
        const corruptedSettings = { invalid: "data" };

        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(corruptedSettings)) // validateDataIntegrity
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory])) // validateDataIntegrity
          .mockResolvedValueOnce(JSON.stringify([mockCurrentLink])) // validateDataIntegrity
          .mockResolvedValueOnce(null); // restoreFromBackup 시도 - 백업 없음

        mockedAsyncStorage.setItem.mockResolvedValue();

        const result = await autoRecoverCorruptedData();

        expect(result.success).toBe(true);
        expect(result.strategy).toBe("rebuild");
        expect(result.recoveredItems).toBe(1);
      });

      it("should fix orphaned links", async () => {
        const orphanedLink = { ...mockCurrentLink, categoryId: "non-existent" };

        // validateDataIntegrity 호출
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockCurrentSettings))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory]))
          .mockResolvedValueOnce(JSON.stringify([orphanedLink]))
          .mockResolvedValueOnce(null) // restoreFromBackup 시도 - 백업 없음
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory])) // fixOrphanedLinks - categories
          .mockResolvedValueOnce(JSON.stringify([orphanedLink])); // fixOrphanedLinks - links

        mockedAsyncStorage.setItem.mockResolvedValue();

        const result = await autoRecoverCorruptedData();

        expect(result.success).toBe(true);
        expect(result.recoveredItems).toBe(1);
      });
    });
  });

  // ==========================================================================
  // 디버깅 및 유지보수 테스트
  // ==========================================================================

  describe("Debugging and Maintenance", () => {
    describe("debugStorageState", () => {
      it("should log storage state in dev mode", async () => {
        mockedAsyncStorage.getAllKeys.mockResolvedValueOnce([
          STORAGE_KEYS.SETTINGS,
          STORAGE_KEYS.CATEGORIES,
          STORAGE_KEYS.LINKS,
        ]);

        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockCurrentSettings))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory]))
          .mockResolvedValueOnce(JSON.stringify([mockCurrentLink]))
          .mockResolvedValueOnce(JSON.stringify(mockCurrentSettings)) // validateDataIntegrity
          .mockResolvedValueOnce(JSON.stringify([mockCurrentCategory])) // validateDataIntegrity
          .mockResolvedValueOnce(JSON.stringify([mockCurrentLink])); // validateDataIntegrity

        await debugStorageState();

        expect(console.log).toHaveBeenCalledWith("=== STORAGE DEBUG STATE ===");
        expect(console.log).toHaveBeenCalledWith("Total keys: 3");
        expect(console.log).toHaveBeenCalledWith("Data integrity:", "✅ Valid");
        expect(console.log).toHaveBeenCalledWith("=== END STORAGE DEBUG ===");
      });

      it("should not log in production mode", async () => {
        (global as any).__DEV__ = false;

        await debugStorageState();

        expect(console.log).not.toHaveBeenCalledWith(
          "=== STORAGE DEBUG STATE ==="
        );
      });
    });

    describe("nukeStorage", () => {
      it("should clear all storage in dev mode", async () => {
        mockedAsyncStorage.clear.mockResolvedValue();

        await nukeStorage();

        expect(mockedAsyncStorage.clear).toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith(
          "[Dev] NUKING ALL STORAGE DATA!"
        );
        expect(console.log).toHaveBeenCalledWith(
          "[Dev] All storage data cleared"
        );
      });

      it("should throw error in production mode", async () => {
        (global as any).__DEV__ = false;

        await expect(nukeStorage()).rejects.toThrow(
          "Storage nuke is only available in development mode"
        );
      });
    });
  });

  // ==========================================================================
  // 에러 클래스 테스트
  // ==========================================================================

  describe("Error Classes", () => {
    it("should create MigrationError with correct properties", () => {
      const originalError = new Error("Original error");
      const migrationError = new MigrationError(
        "Migration failed",
        "1.0.0",
        "migrate",
        originalError
      );

      expect(migrationError.name).toBe("MigrationError");
      expect(migrationError.message).toBe("Migration failed");
      expect(migrationError.version).toBe("1.0.0");
      expect(migrationError.operation).toBe("migrate");
      expect(migrationError.originalError).toBe(originalError);
    });

    it("should create DataRecoveryError with correct properties", () => {
      const originalError = new Error("Original error");
      const recoveryError = new DataRecoveryError(
        "Recovery failed",
        "settings",
        "backup",
        originalError
      );

      expect(recoveryError.name).toBe("DataRecoveryError");
      expect(recoveryError.message).toBe("Recovery failed");
      expect(recoveryError.dataType).toBe("settings");
      expect(recoveryError.recoveryStrategy).toBe("backup");
      expect(recoveryError.originalError).toBe(originalError);
    });
  });
});
