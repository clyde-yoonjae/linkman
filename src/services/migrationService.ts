import {
  Settings,
  Category,
  Link,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  isValidSettings,
  isValidCategoryArray,
  isValidLinkArray,
} from "../types/data";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  getAllStorageKeys,
} from "./storage";
import { generateId } from "../utils";

/**
 * 마이그레이션 에러 클래스
 */
export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly version: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "MigrationError";
  }
}

/**
 * 데이터 복구 에러 클래스
 */
export class DataRecoveryError extends Error {
  constructor(
    message: string,
    public readonly dataType: string,
    public readonly recoveryStrategy: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "DataRecoveryError";
  }
}

/**
 * 마이그레이션 결과 인터페이스
 */
export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migratedData: string[];
  errors: string[];
  backupCreated: boolean;
}

/**
 * 데이터 복구 결과 인터페이스
 */
export interface RecoveryResult {
  success: boolean;
  dataType: string;
  strategy: "backup" | "default" | "rebuild";
  recoveredItems: number;
  errors: string[];
}

/**
 * 백업 메타데이터
 */
interface BackupMetadata {
  version: string;
  timestamp: string;
  dataTypes: string[];
  size: number;
}

// 현재 앱 버전 (실제 앱에서는 package.json에서 가져와야 함)
const CURRENT_APP_VERSION = "1.0.0";

// 지원하는 마이그레이션 버전들
const MIGRATION_VERSIONS = ["0.9.0", "1.0.0"];

// =============================================================================
// 마이그레이션 함수들
// =============================================================================

/**
 * 앱 시작 시 데이터 마이그레이션이 필요한지 확인하고 실행합니다
 */
export async function migrateDataIfNeeded(): Promise<MigrationResult | null> {
  try {
    console.log("[Migration] Checking if data migration is needed...");

    const settings = await getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);

    if (!settings) {
      console.log(
        "[Migration] No existing settings found, migration not needed"
      );
      return null;
    }

    const currentVersion = settings.appVersion || "0.9.0";

    if (currentVersion === CURRENT_APP_VERSION) {
      console.log(
        `[Migration] Already on latest version ${CURRENT_APP_VERSION}`
      );
      return null;
    }

    console.log(
      `[Migration] Migration needed: ${currentVersion} → ${CURRENT_APP_VERSION}`
    );

    return await performMigration(currentVersion, CURRENT_APP_VERSION);
  } catch (error) {
    throw new MigrationError(
      "Failed to check migration requirements",
      CURRENT_APP_VERSION,
      "check",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 실제 마이그레이션을 수행합니다
 */
async function performMigration(
  fromVersion: string,
  toVersion: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    fromVersion,
    toVersion,
    migratedData: [],
    errors: [],
    backupCreated: false,
  };

  try {
    console.log(
      `[Migration] Starting migration from ${fromVersion} to ${toVersion}`
    );

    // 1. 백업 생성
    result.backupCreated = await createBackup(fromVersion);

    // 2. 버전별 마이그레이션 실행
    const migrationSteps = getMigrationSteps(fromVersion, toVersion);

    for (const step of migrationSteps) {
      try {
        await step.execute();
        result.migratedData.push(step.description);
        console.log(`[Migration] Completed: ${step.description}`);
      } catch (error) {
        const errorMsg = `Failed migration step: ${step.description}`;
        result.errors.push(errorMsg);
        console.error(`[Migration] ${errorMsg}`, error);
      }
    }

    // 3. 설정에서 버전 업데이트
    await updateAppVersion(toVersion);
    result.migratedData.push("Updated app version");

    result.success = result.errors.length === 0;

    console.log(
      `[Migration] Migration ${
        result.success ? "completed successfully" : "completed with errors"
      }`
    );

    return result;
  } catch (error) {
    result.errors.push(
      `Migration failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw new MigrationError(
      "Migration process failed",
      toVersion,
      "migrate",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 마이그레이션 단계를 반환합니다
 */
function getMigrationSteps(fromVersion: string, toVersion: string) {
  const steps: Array<{ description: string; execute: () => Promise<void> }> =
    [];

  // 0.9.x → 1.0.0 마이그레이션
  if (fromVersion.startsWith("0.9") && toVersion === "1.0.0") {
    steps.push({
      description: "Add missing category sortOrder field",
      execute: async () => {
        const categories = await getStorageItem<Category[]>(
          STORAGE_KEYS.CATEGORIES
        );
        if (categories && Array.isArray(categories)) {
          const updatedCategories = categories.map((category, index) => ({
            ...category,
            sortOrder: category.sortOrder ?? index,
          }));
          await setStorageItem(STORAGE_KEYS.CATEGORIES, updatedCategories);
        }
      },
    });

    steps.push({
      description: "Add missing link fields for 1.0.0",
      execute: async () => {
        const links = await getStorageItem<Link[]>(STORAGE_KEYS.LINKS);
        if (links && Array.isArray(links)) {
          const updatedLinks = links.map((link) => ({
            ...link,
            thumbnailUrl: link.thumbnailUrl || undefined,
            notes: link.notes || undefined,
            lastAccessedAt: link.lastAccessedAt || undefined,
            accessCount: link.accessCount || 0,
          }));
          await setStorageItem(STORAGE_KEYS.LINKS, updatedLinks);
        }
      },
    });

    steps.push({
      description: "Update settings format for 1.0.0",
      execute: async () => {
        const settings = await getStorageItem<any>(STORAGE_KEYS.SETTINGS);
        if (settings) {
          const updatedSettings: Settings = {
            isFirstLaunch: settings.isFirstLaunch ?? false,
            isDarkMode: settings.isDarkMode ?? false,
            appVersion: toVersion,
            autoLockTimeMinutes: settings.autoLockTimeMinutes ?? 5,
            autoDetectClipboard: settings.autoDetectClipboard ?? true,
            createdAt: settings.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setStorageItem(STORAGE_KEYS.SETTINGS, updatedSettings);
        }
      },
    });
  }

  return steps;
}

/**
 * 앱 버전을 업데이트합니다
 */
async function updateAppVersion(version: string): Promise<void> {
  const settings = await getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);
  if (settings) {
    const updatedSettings: Settings = {
      ...settings,
      appVersion: version,
      updatedAt: new Date().toISOString(),
    };
    await setStorageItem(STORAGE_KEYS.SETTINGS, updatedSettings);
  }
}

// =============================================================================
// 백업 및 복구 함수들
// =============================================================================

/**
 * 현재 데이터의 백업을 생성합니다
 */
export async function createBackup(version: string): Promise<boolean> {
  try {
    console.log(`[Backup] Creating backup for version ${version}...`);

    const backupData: any = {};
    const dataTypes: string[] = [];
    let totalSize = 0;

    // Settings 백업
    const settings = await getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);
    if (settings) {
      backupData.settings = settings;
      dataTypes.push("settings");
      totalSize += JSON.stringify(settings).length;
    }

    // Categories 백업
    const categories = await getStorageItem<Category[]>(
      STORAGE_KEYS.CATEGORIES
    );
    if (categories) {
      backupData.categories = categories;
      dataTypes.push("categories");
      totalSize += JSON.stringify(categories).length;
    }

    // Links 백업
    const links = await getStorageItem<Link[]>(STORAGE_KEYS.LINKS);
    if (links) {
      backupData.links = links;
      dataTypes.push("links");
      totalSize += JSON.stringify(links).length;
    }

    // 백업 메타데이터
    const metadata: BackupMetadata = {
      version,
      timestamp: new Date().toISOString(),
      dataTypes,
      size: totalSize,
    };

    // 백업 저장
    await setStorageItem(STORAGE_KEYS.BACKUP_DATA, {
      metadata,
      data: backupData,
    });

    console.log(
      `[Backup] Backup created successfully (${
        dataTypes.length
      } data types, ${Math.round(totalSize / 1024)}KB)`
    );
    return true;
  } catch (error) {
    console.error("[Backup] Failed to create backup:", error);
    return false;
  }
}

/**
 * 백업에서 데이터를 복구합니다
 */
export async function restoreFromBackup(): Promise<RecoveryResult> {
  const result: RecoveryResult = {
    success: false,
    dataType: "all",
    strategy: "backup",
    recoveredItems: 0,
    errors: [],
  };

  try {
    console.log("[Recovery] Attempting to restore from backup...");

    const backupData = await getStorageItem<{
      metadata: BackupMetadata;
      data: any;
    }>(STORAGE_KEYS.BACKUP_DATA);

    if (!backupData) {
      throw new DataRecoveryError("No backup data found", "all", "backup");
    }

    const { metadata, data } = backupData;
    console.log(
      `[Recovery] Found backup from ${metadata.timestamp} (version ${metadata.version})`
    );

    // Settings 복구
    if (data.settings && isValidSettings(data.settings)) {
      await setStorageItem(STORAGE_KEYS.SETTINGS, data.settings);
      result.recoveredItems++;
    }

    // Categories 복구
    if (data.categories && isValidCategoryArray(data.categories)) {
      await setStorageItem(STORAGE_KEYS.CATEGORIES, data.categories);
      result.recoveredItems++;
    }

    // Links 복구
    if (data.links && isValidLinkArray(data.links)) {
      await setStorageItem(STORAGE_KEYS.LINKS, data.links);
      result.recoveredItems++;
    }

    result.success = result.recoveredItems > 0;
    console.log(
      `[Recovery] Backup restoration ${
        result.success ? "completed" : "failed"
      } (${result.recoveredItems} items recovered)`
    );

    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    throw new DataRecoveryError(
      "Failed to restore from backup",
      "all",
      "backup",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 기본값으로 데이터를 초기화합니다
 */
export async function resetToDefaults(): Promise<RecoveryResult> {
  const result: RecoveryResult = {
    success: false,
    dataType: "all",
    strategy: "default",
    recoveredItems: 0,
    errors: [],
  };

  try {
    console.log("[Recovery] Resetting all data to defaults...");

    // Settings 초기화
    await setStorageItem(STORAGE_KEYS.SETTINGS, {
      ...DEFAULT_SETTINGS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    result.recoveredItems++;

    // Categories 초기화
    const defaultCategories: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    await setStorageItem(STORAGE_KEYS.CATEGORIES, defaultCategories);
    result.recoveredItems++;

    // Links 초기화 (빈 배열)
    await setStorageItem(STORAGE_KEYS.LINKS, []);
    result.recoveredItems++;

    result.success = true;
    console.log("[Recovery] Reset to defaults completed successfully");

    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    throw new DataRecoveryError(
      "Failed to reset to defaults",
      "all",
      "default",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// =============================================================================
// 데이터 검증 및 복구 함수들
// =============================================================================

/**
 * 모든 데이터의 무결성을 검사합니다
 */
export async function validateDataIntegrity(): Promise<{
  isValid: boolean;
  corruptedData: string[];
  recommendations: string[];
}> {
  const result = {
    isValid: true,
    corruptedData: [] as string[],
    recommendations: [] as string[],
  };

  try {
    console.log("[Validation] Checking data integrity...");

    // Settings 검증
    const settings = await getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);
    if (settings && !isValidSettings(settings)) {
      result.isValid = false;
      result.corruptedData.push("settings");
      result.recommendations.push(
        "Settings data is corrupted - restore from backup or reset to defaults"
      );
    } else if (!settings) {
      result.corruptedData.push("settings");
      result.recommendations.push(
        "Settings data is missing - initialize with defaults"
      );
    }

    // Categories 검증
    const categories = await getStorageItem<Category[]>(
      STORAGE_KEYS.CATEGORIES
    );
    if (categories && !isValidCategoryArray(categories)) {
      result.isValid = false;
      result.corruptedData.push("categories");
      result.recommendations.push(
        "Categories data is corrupted - restore from backup or reset to defaults"
      );
    } else if (!categories) {
      result.corruptedData.push("categories");
      result.recommendations.push(
        "Categories data is missing - initialize with defaults"
      );
    }

    // Links 검증
    const links = await getStorageItem<Link[]>(STORAGE_KEYS.LINKS);
    if (links && !isValidLinkArray(links)) {
      result.isValid = false;
      result.corruptedData.push("links");
      result.recommendations.push(
        "Links data is corrupted - restore from backup or clear links"
      );
    }

    // 카테고리-링크 관계 검증
    if (
      categories &&
      links &&
      isValidCategoryArray(categories) &&
      isValidLinkArray(links)
    ) {
      const categoryIds = new Set(categories.map((cat) => cat.id));
      const orphanedLinks = links.filter(
        (link) => !categoryIds.has(link.categoryId)
      );

      if (orphanedLinks.length > 0) {
        result.isValid = false;
        result.corruptedData.push("link-category-relationships");
        result.recommendations.push(
          `Found ${orphanedLinks.length} orphaned links - assign them to existing categories`
        );
      }
    }

    console.log(
      `[Validation] Data integrity check ${
        result.isValid ? "passed" : "failed"
      }`
    );
    if (result.corruptedData.length > 0) {
      console.warn(
        `[Validation] Corrupted data found: ${result.corruptedData.join(", ")}`
      );
    }

    return result;
  } catch (error) {
    console.error("[Validation] Failed to validate data integrity:", error);
    throw new DataRecoveryError(
      "Failed to validate data integrity",
      "all",
      "validation",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 손상된 데이터를 자동으로 복구합니다
 */
export async function autoRecoverCorruptedData(): Promise<RecoveryResult> {
  const result: RecoveryResult = {
    success: false,
    dataType: "all",
    strategy: "rebuild",
    recoveredItems: 0,
    errors: [],
  };

  try {
    console.log("[Recovery] Starting automatic data recovery...");

    const validation = await validateDataIntegrity();

    if (validation.isValid) {
      console.log("[Recovery] No corrupted data found");
      result.success = true;
      return result;
    }

    // 백업에서 복구 시도
    try {
      const backupResult = await restoreFromBackup();
      if (backupResult.success) {
        return backupResult;
      }
    } catch (error) {
      result.errors.push("Backup recovery failed");
      console.warn(
        "[Recovery] Backup recovery failed, trying individual data recovery"
      );
    }

    // 개별 데이터 복구 시도
    for (const corruptedType of validation.corruptedData) {
      try {
        switch (corruptedType) {
          case "settings":
            await setStorageItem(STORAGE_KEYS.SETTINGS, {
              ...DEFAULT_SETTINGS,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            result.recoveredItems++;
            break;

          case "categories":
            const defaultCategories: Category[] = DEFAULT_CATEGORIES.map(
              (cat) => ({
                ...cat,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            );
            await setStorageItem(STORAGE_KEYS.CATEGORIES, defaultCategories);
            result.recoveredItems++;
            break;

          case "links":
            await setStorageItem(STORAGE_KEYS.LINKS, []);
            result.recoveredItems++;
            break;

          case "link-category-relationships":
            await fixOrphanedLinks();
            result.recoveredItems++;
            break;
        }
      } catch (error) {
        result.errors.push(
          `Failed to recover ${corruptedType}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    result.success = result.recoveredItems > 0;
    console.log(
      `[Recovery] Auto recovery ${result.success ? "completed" : "failed"} (${
        result.recoveredItems
      } items recovered)`
    );

    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    throw new DataRecoveryError(
      "Auto recovery failed",
      "all",
      "rebuild",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 고아 링크들을 수정합니다
 */
async function fixOrphanedLinks(): Promise<void> {
  const categories = await getStorageItem<Category[]>(STORAGE_KEYS.CATEGORIES);
  const links = await getStorageItem<Link[]>(STORAGE_KEYS.LINKS);

  if (
    !categories ||
    !links ||
    !isValidCategoryArray(categories) ||
    !isValidLinkArray(links)
  ) {
    return;
  }

  const categoryIds = new Set(categories.map((cat) => cat.id));

  // '기타' 카테고리 찾기 또는 생성
  let miscCategory = categories.find((cat) => cat.name === "기타");
  if (!miscCategory) {
    miscCategory = {
      id: generateId(),
      name: "기타",
      color: "#9E9E9E",
      icon: "📎",
      description: "분류되지 않은 링크들",
      sortOrder: Math.max(...categories.map((cat) => cat.sortOrder)) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCategories = [...categories, miscCategory];
    await setStorageItem(STORAGE_KEYS.CATEGORIES, updatedCategories);
  }

  // 고아 링크들을 '기타' 카테고리로 이동
  const updatedLinks = links.map((link) => {
    if (!categoryIds.has(link.categoryId)) {
      return {
        ...link,
        categoryId: miscCategory!.id,
        updatedAt: new Date().toISOString(),
      };
    }
    return link;
  });

  await setStorageItem(STORAGE_KEYS.LINKS, updatedLinks);
  console.log(
    "[Recovery] Fixed orphaned links by moving them to '기타' category"
  );
}

// =============================================================================
// 디버깅 및 유지보수 함수들
// =============================================================================

/**
 * 개발 모드에서 스토리지 상태를 출력합니다
 */
export async function debugStorageState(): Promise<void> {
  if (!__DEV__) {
    return;
  }

  try {
    console.log("=== STORAGE DEBUG STATE ===");

    const allKeys = await getAllStorageKeys();
    console.log(`Total keys: ${allKeys.length}`);
    console.log(`Keys: ${allKeys.join(", ")}`);

    for (const key of [
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.LINKS,
    ]) {
      const data = await getStorageItem(key);
      console.log(
        `${key}:`,
        data ? `${JSON.stringify(data).length} chars` : "null"
      );
    }

    const validation = await validateDataIntegrity();
    console.log(
      "Data integrity:",
      validation.isValid ? "✅ Valid" : "❌ Invalid"
    );
    if (!validation.isValid) {
      console.log("Corrupted data:", validation.corruptedData);
      console.log("Recommendations:", validation.recommendations);
    }

    console.log("=== END STORAGE DEBUG ===");
  } catch (error) {
    console.error("Failed to debug storage state:", error);
  }
}

/**
 * 수동으로 마이그레이션을 트리거합니다 (개발/테스트용)
 */
export async function forceMigration(
  fromVersion: string,
  toVersion: string
): Promise<MigrationResult> {
  if (!__DEV__) {
    throw new Error("Force migration is only available in development mode");
  }

  console.log(`[Dev] Force migration: ${fromVersion} → ${toVersion}`);
  return await performMigration(fromVersion, toVersion);
}

/**
 * 전체 스토리지를 초기화합니다 (개발/테스트용)
 */
export async function nukeStorage(): Promise<void> {
  if (!__DEV__) {
    throw new Error("Storage nuke is only available in development mode");
  }

  console.warn("[Dev] NUKING ALL STORAGE DATA!");
  await clearStorage();
  console.log("[Dev] All storage data cleared");
}
