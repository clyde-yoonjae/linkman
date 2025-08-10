import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage 에러 타입
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly key?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/**
 * 로깅 유틸리티
 */
const log = {
  info: (message: string, data?: any) => {
    if (__DEV__) {
      console.log(`[Storage] ${message}`, data || "");
    }
  },
  error: (message: string, error?: any) => {
    if (__DEV__) {
      console.error(`[Storage Error] ${message}`, error || "");
    }
  },
  warn: (message: string, data?: any) => {
    if (__DEV__) {
      console.warn(`[Storage Warning] ${message}`, data || "");
    }
  },
};

/**
 * AsyncStorage에서 데이터를 조회하고 파싱하는 함수
 * @param key 저장소 키
 * @returns 파싱된 데이터 또는 null
 */
export async function getStorageItem<T>(key: string): Promise<T | null> {
  try {
    log.info(`Getting item with key: ${key}`);

    const item = await AsyncStorage.getItem(key);

    if (item === null) {
      log.info(`No item found for key: ${key}`);
      return null;
    }

    const parsedItem = JSON.parse(item) as T;
    log.info(`Successfully retrieved item for key: ${key}`, parsedItem);

    return parsedItem;
  } catch (error) {
    const errorMessage = `Failed to get item with key: ${key}`;
    log.error(errorMessage, error);

    throw new StorageError(
      errorMessage,
      "getItem",
      key,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * AsyncStorage에 데이터를 저장하는 함수
 * @param key 저장소 키
 * @param value 저장할 데이터
 */
export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  try {
    log.info(`Setting item with key: ${key}`, value);

    const serializedValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, serializedValue);

    log.info(`Successfully stored item for key: ${key}`);
  } catch (error) {
    const errorMessage = `Failed to set item with key: ${key}`;
    log.error(errorMessage, error);

    throw new StorageError(
      errorMessage,
      "setItem",
      key,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * AsyncStorage에서 특정 키의 데이터를 삭제하는 함수
 * @param key 삭제할 저장소 키
 */
export async function removeStorageItem(key: string): Promise<void> {
  try {
    log.info(`Removing item with key: ${key}`);

    await AsyncStorage.removeItem(key);

    log.info(`Successfully removed item for key: ${key}`);
  } catch (error) {
    const errorMessage = `Failed to remove item with key: ${key}`;
    log.error(errorMessage, error);

    throw new StorageError(
      errorMessage,
      "removeItem",
      key,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * AsyncStorage의 모든 데이터를 삭제하는 함수
 * ⚠️ 주의: 이 함수는 모든 앱 데이터를 삭제합니다
 */
export async function clearStorage(): Promise<void> {
  try {
    log.warn("Clearing all storage data");

    await AsyncStorage.clear();

    log.info("Successfully cleared all storage data");
  } catch (error) {
    const errorMessage = "Failed to clear storage";
    log.error(errorMessage, error);

    throw new StorageError(
      errorMessage,
      "clear",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * AsyncStorage의 모든 키를 조회하는 함수
 * @returns 저장된 모든 키의 배열
 */
export async function getAllStorageKeys(): Promise<string[]> {
  try {
    log.info("Getting all storage keys");

    const keys = await AsyncStorage.getAllKeys();

    log.info(`Found ${keys.length} keys in storage`, keys);

    return keys;
  } catch (error) {
    const errorMessage = "Failed to get all storage keys";
    log.error(errorMessage, error);

    throw new StorageError(
      errorMessage,
      "getAllKeys",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 여러 키의 데이터를 한 번에 조회하는 함수
 * @param keys 조회할 키들의 배열
 * @returns 키-값 쌍의 객체
 */
export async function getMultipleStorageItems<T>(
  keys: string[]
): Promise<Record<string, T | null>> {
  try {
    log.info(`Getting multiple items for keys:`, keys);

    const keyValuePairs = await AsyncStorage.multiGet(keys);
    const result: Record<string, T | null> = {};

    keyValuePairs.forEach(([key, value]) => {
      if (value !== null) {
        try {
          result[key] = JSON.parse(value) as T;
        } catch (parseError) {
          log.error(`Failed to parse value for key: ${key}`, parseError);
          result[key] = null;
        }
      } else {
        result[key] = null;
      }
    });

    log.info("Successfully retrieved multiple items", result);

    return result;
  } catch (error) {
    const errorMessage = "Failed to get multiple storage items";
    log.error(errorMessage, error);

    throw new StorageError(
      errorMessage,
      "multiGet",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 여러 키-값 쌍을 한 번에 저장하는 함수
 * @param keyValuePairs 저장할 키-값 쌍들
 */
export async function setMultipleStorageItems<T>(
  keyValuePairs: Array<[string, T]>
): Promise<void> {
  try {
    log.info("Setting multiple items", keyValuePairs);

    const serializedPairs: Array<[string, string]> = keyValuePairs.map(
      ([key, value]) => [key, JSON.stringify(value)]
    );

    await AsyncStorage.multiSet(serializedPairs);

    log.info("Successfully stored multiple items");
  } catch (error) {
    const errorMessage = "Failed to set multiple storage items";
    log.error(errorMessage, error);

    throw new StorageError(
      errorMessage,
      "multiSet",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 저장소의 사용량 정보를 조회하는 함수 (개발 모드 전용)
 * @returns 저장소 사용량 정보
 */
export async function getStorageInfo(): Promise<{
  totalKeys: number;
  keys: string[];
  estimatedSize: number; // bytes
}> {
  try {
    const keys = await getAllStorageKeys();
    const keyValuePairs = await AsyncStorage.multiGet(keys);

    let estimatedSize = 0;
    keyValuePairs.forEach(([key, value]) => {
      estimatedSize += key.length;
      if (value) {
        estimatedSize += value.length;
      }
    });

    const info = {
      totalKeys: keys.length,
      keys,
      estimatedSize,
    };

    log.info("Storage info", info);

    return info;
  } catch (error) {
    const errorMessage = "Failed to get storage info";
    log.error(errorMessage, error);

    throw new StorageError(
      errorMessage,
      "getStorageInfo",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
