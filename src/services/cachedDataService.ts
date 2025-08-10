import {
  Settings,
  Category,
  Link,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
} from "../types/data";
import { getStorageItem, setStorageItem, removeStorageItem } from "./storage";
import { generateId } from "../utils";
import { memoryCache, CacheKeys } from "./cacheService";
import {
  DataServiceError,
  SearchOptions,
  SortField,
  SortOrder,
  sortLinks,
} from "./dataService";

// =============================================================================
// 캐시된 설정 관련 함수들
// =============================================================================

/**
 * 캐시를 활용하여 앱 설정을 조회합니다
 */
export async function getCachedSettings(): Promise<Settings> {
  try {
    // 먼저 캐시에서 확인
    const cachedSettings = memoryCache.get<Settings>(CacheKeys.SETTINGS);
    if (cachedSettings) {
      return cachedSettings;
    }

    // 캐시에 없으면 스토리지에서 조회
    const settings = await getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);

    if (!settings) {
      // 설정이 없으면 기본 설정을 생성하고 저장
      await setStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

      // 캐시에도 저장
      memoryCache.set(CacheKeys.SETTINGS, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    // 캐시에 저장
    memoryCache.set(CacheKeys.SETTINGS, settings);
    return settings;
  } catch (error) {
    throw new DataServiceError(
      "Failed to get cached settings",
      "getCachedSettings",
      "settings",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 무효화하면서 앱 설정을 업데이트합니다
 */
export async function updateCachedSettings(
  updates: Partial<Settings>
): Promise<Settings> {
  try {
    const currentSettings = await getCachedSettings();

    const updatedSettings: Settings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // 스토리지와 캐시 동시 업데이트
    await setStorageItem(STORAGE_KEYS.SETTINGS, updatedSettings);
    memoryCache.set(CacheKeys.SETTINGS, updatedSettings);

    return updatedSettings;
  } catch (error) {
    throw new DataServiceError(
      "Failed to update cached settings",
      "updateCachedSettings",
      "settings",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// =============================================================================
// 캐시된 카테고리 관련 함수들
// =============================================================================

/**
 * 캐시를 활용하여 모든 카테고리를 조회합니다
 */
export async function getCachedCategories(): Promise<Category[]> {
  try {
    // 먼저 캐시에서 확인
    const cachedCategories = memoryCache.get<Category[]>(CacheKeys.CATEGORIES);
    if (cachedCategories) {
      return cachedCategories.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // 캐시에 없으면 스토리지에서 조회
    const categories = await getStorageItem<Category[]>(
      STORAGE_KEYS.CATEGORIES
    );

    if (!categories) {
      // 카테고리가 없으면 기본 카테고리를 생성하고 저장
      const defaultCategories = await initializeCachedDefaultCategories();
      return defaultCategories;
    }

    // 정렬 후 캐시에 저장
    const sortedCategories = categories.sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    memoryCache.set(CacheKeys.CATEGORIES, sortedCategories);

    return sortedCategories;
  } catch (error) {
    throw new DataServiceError(
      "Failed to get cached categories",
      "getCachedCategories",
      "category",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 활용하여 특정 ID의 카테고리를 조회합니다
 */
export async function getCachedCategoryById(
  id: string
): Promise<Category | null> {
  try {
    const categories = await getCachedCategories();
    return categories.find((category) => category.id === id) || null;
  } catch (error) {
    throw new DataServiceError(
      "Failed to get cached category by ID",
      "getCachedCategoryById",
      "category",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 무효화하면서 새 카테고리를 추가합니다
 */
export async function addCachedCategory(
  categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<Category> {
  try {
    const categories = await getCachedCategories();
    const now = new Date().toISOString();

    const newCategory: Category = {
      ...categoryData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const updatedCategories = [...categories, newCategory];

    // 스토리지와 캐시 동시 업데이트
    await setStorageItem(STORAGE_KEYS.CATEGORIES, updatedCategories);
    memoryCache.set(CacheKeys.CATEGORIES, updatedCategories);

    return newCategory;
  } catch (error) {
    throw new DataServiceError(
      "Failed to add cached category",
      "addCachedCategory",
      "category",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 무효화하면서 카테고리를 업데이트합니다
 */
export async function updateCachedCategory(
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt">>
): Promise<Category> {
  try {
    const categories = await getCachedCategories();
    const categoryIndex = categories.findIndex((cat) => cat.id === id);

    if (categoryIndex === -1) {
      throw new DataServiceError(
        `Category with ID ${id} not found`,
        "updateCachedCategory",
        "category",
        id
      );
    }

    const updatedCategory: Category = {
      ...categories[categoryIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    categories[categoryIndex] = updatedCategory;

    // 스토리지와 캐시 동시 업데이트
    await setStorageItem(STORAGE_KEYS.CATEGORIES, categories);
    memoryCache.set(CacheKeys.CATEGORIES, categories);

    return updatedCategory;
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to update cached category",
      "updateCachedCategory",
      "category",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 기본 카테고리들을 초기화하고 캐시에 저장합니다
 */
async function initializeCachedDefaultCategories(): Promise<Category[]> {
  const now = new Date().toISOString();

  const categories: Category[] = DEFAULT_CATEGORIES.map((categoryData) => ({
    ...categoryData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));

  // 스토리지와 캐시 동시 저장
  await setStorageItem(STORAGE_KEYS.CATEGORIES, categories);
  memoryCache.set(CacheKeys.CATEGORIES, categories);

  return categories;
}

// =============================================================================
// 캐시된 링크 관련 함수들
// =============================================================================

/**
 * 캐시를 활용하여 모든 링크를 조회합니다
 */
export async function getCachedLinks(): Promise<Link[]> {
  try {
    // 먼저 캐시에서 확인
    const cachedLinks = memoryCache.get<Link[]>(CacheKeys.LINKS);
    if (cachedLinks) {
      return cachedLinks;
    }

    // 캐시에 없으면 스토리지에서 조회
    const links = await getStorageItem<Link[]>(STORAGE_KEYS.LINKS);

    if (!links) {
      // 링크가 없으면 빈 배열을 저장하고 반환
      await setStorageItem(STORAGE_KEYS.LINKS, []);
      memoryCache.set(CacheKeys.LINKS, []);
      return [];
    }

    // 캐시에 저장
    memoryCache.set(CacheKeys.LINKS, links);
    return links;
  } catch (error) {
    throw new DataServiceError(
      "Failed to get cached links",
      "getCachedLinks",
      "link",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 활용하여 특정 ID의 링크를 조회합니다
 */
export async function getCachedLinkById(id: string): Promise<Link | null> {
  try {
    const links = await getCachedLinks();
    return links.find((link) => link.id === id) || null;
  } catch (error) {
    throw new DataServiceError(
      "Failed to get cached link by ID",
      "getCachedLinkById",
      "link",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 활용하여 특정 카테고리의 링크들을 조회합니다
 */
export async function getCachedLinksInCategory(
  categoryId: string
): Promise<Link[]> {
  try {
    const links = await getCachedLinks();
    return links
      .filter((link) => link.categoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    throw new DataServiceError(
      "Failed to get cached links in category",
      "getCachedLinksInCategory",
      "link",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 무효화하면서 새 링크를 추가합니다
 */
export async function addCachedLink(
  linkData: Omit<Link, "id" | "createdAt" | "updatedAt">
): Promise<Link> {
  try {
    const links = await getCachedLinks();
    const now = new Date().toISOString();

    const newLink: Link = {
      ...linkData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const updatedLinks = [...links, newLink];

    // 스토리지와 캐시 동시 업데이트
    await setStorageItem(STORAGE_KEYS.LINKS, updatedLinks);
    memoryCache.set(CacheKeys.LINKS, updatedLinks);

    return newLink;
  } catch (error) {
    throw new DataServiceError(
      "Failed to add cached link",
      "addCachedLink",
      "link",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 무효화하면서 링크를 업데이트합니다
 */
export async function updateCachedLink(
  id: string,
  updates: Partial<Omit<Link, "id" | "createdAt">>
): Promise<Link> {
  try {
    const links = await getCachedLinks();
    const linkIndex = links.findIndex((link) => link.id === id);

    if (linkIndex === -1) {
      throw new DataServiceError(
        `Link with ID ${id} not found`,
        "updateCachedLink",
        "link",
        id
      );
    }

    const updatedLink: Link = {
      ...links[linkIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    links[linkIndex] = updatedLink;

    // 스토리지와 캐시 동시 업데이트
    await setStorageItem(STORAGE_KEYS.LINKS, links);
    memoryCache.set(CacheKeys.LINKS, links);

    return updatedLink;
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to update cached link",
      "updateCachedLink",
      "link",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시를 무효화하면서 링크를 삭제합니다
 */
export async function deleteCachedLink(id: string): Promise<void> {
  try {
    const links = await getCachedLinks();
    const linkIndex = links.findIndex((link) => link.id === id);

    if (linkIndex === -1) {
      throw new DataServiceError(
        `Link with ID ${id} not found`,
        "deleteCachedLink",
        "link",
        id
      );
    }

    const updatedLinks = links.filter((link) => link.id !== id);

    // 스토리지와 캐시 동시 업데이트
    await setStorageItem(STORAGE_KEYS.LINKS, updatedLinks);
    memoryCache.set(CacheKeys.LINKS, updatedLinks);
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to delete cached link",
      "deleteCachedLink",
      "link",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// =============================================================================
// 캐시된 검색 및 정렬 함수들
// =============================================================================

/**
 * 캐시된 데이터에서 링크를 검색합니다
 */
export async function searchCachedLinks(
  options: SearchOptions
): Promise<Link[]> {
  try {
    const links = await getCachedLinks();
    const { query, categoryId, isFavorite, tags } = options;

    return links.filter((link) => {
      // 쿼리 검색 (제목, 설명, URL에서)
      const queryMatch =
        !query ||
        [link.title, link.description || "", link.url, link.notes || ""].some(
          (field) => field.toLowerCase().includes(query.toLowerCase())
        );

      // 카테고리 필터
      const categoryMatch = !categoryId || link.categoryId === categoryId;

      // 즐겨찾기 필터
      const favoriteMatch =
        isFavorite === undefined || link.isFavorite === isFavorite;

      // 태그 필터
      const tagMatch =
        !tags ||
        tags.length === 0 ||
        tags.some((tag) => link.tags.includes(tag));

      return queryMatch && categoryMatch && favoriteMatch && tagMatch;
    });
  } catch (error) {
    throw new DataServiceError(
      "Failed to search cached links",
      "searchCachedLinks",
      "link",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 캐시된 링크 접근 시 접근 횟수와 시간을 업데이트합니다
 */
export async function recordCachedLinkAccess(id: string): Promise<Link> {
  try {
    const link = await getCachedLinkById(id);

    if (!link) {
      throw new DataServiceError(
        `Link with ID ${id} not found`,
        "recordCachedLinkAccess",
        "link",
        id
      );
    }

    return await updateCachedLink(id, {
      accessCount: link.accessCount + 1,
      lastAccessedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to record cached link access",
      "recordCachedLinkAccess",
      "link",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// =============================================================================
// 데이터 초기화 함수들
// =============================================================================

/**
 * 앱 첫 실행 시 모든 데이터를 초기화합니다
 */
export async function initializeAppData(): Promise<{
  settings: Settings;
  categories: Category[];
}> {
  try {
    console.log("[DataInit] Starting app data initialization...");

    // 설정 초기화
    const settings = await getCachedSettings();

    // 첫 실행인지 확인
    if (settings.isFirstLaunch) {
      console.log(
        "[DataInit] First launch detected, initializing default data..."
      );

      // 기본 카테고리 초기화
      const categories = await getCachedCategories();

      // 첫 실행 플래그 업데이트
      const updatedSettings = await updateCachedSettings({
        isFirstLaunch: false,
      });

      console.log("[DataInit] App data initialization completed");

      return {
        settings: updatedSettings,
        categories,
      };
    }

    // 이미 초기화된 경우
    const categories = await getCachedCategories();

    console.log("[DataInit] App data already initialized");

    return {
      settings,
      categories,
    };
  } catch (error) {
    throw new DataServiceError(
      "Failed to initialize app data",
      "initializeAppData",
      "app",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 모든 캐시를 강제로 새로고침합니다
 */
export async function refreshAllCaches(): Promise<void> {
  try {
    console.log("[Cache] Refreshing all caches...");

    // 모든 캐시 무효화
    memoryCache.invalidateAll();

    // 데이터 다시 로드하여 캐시 재구축
    await Promise.all([
      getCachedSettings(),
      getCachedCategories(),
      getCachedLinks(),
    ]);

    console.log("[Cache] All caches refreshed successfully");
  } catch (error) {
    throw new DataServiceError(
      "Failed to refresh all caches",
      "refreshAllCaches",
      "cache",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 특정 캐시를 새로고침합니다
 */
export async function refreshCache(
  cacheKey: "settings" | "categories" | "links"
): Promise<void> {
  try {
    console.log(`[Cache] Refreshing cache for: ${cacheKey}`);

    // 해당 캐시 무효화
    memoryCache.invalidate(cacheKey);

    // 데이터 다시 로드하여 캐시 재구축
    switch (cacheKey) {
      case "settings":
        await getCachedSettings();
        break;
      case "categories":
        await getCachedCategories();
        break;
      case "links":
        await getCachedLinks();
        break;
    }

    console.log(`[Cache] Cache refreshed for: ${cacheKey}`);
  } catch (error) {
    throw new DataServiceError(
      `Failed to refresh cache for ${cacheKey}`,
      "refreshCache",
      "cache",
      cacheKey,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
