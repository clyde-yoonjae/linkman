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
  StorageError,
} from "./storage";
import { generateId } from "../utils";

/**
 * 데이터 서비스 에러 클래스
 */
export class DataServiceError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly entityType: string,
    public readonly entityId?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "DataServiceError";
  }
}

// =============================================================================
// SETTINGS 관련 함수들
// =============================================================================

/**
 * 앱 설정을 조회합니다
 */
export async function getSettings(): Promise<Settings> {
  try {
    const settings = await getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);

    if (!settings) {
      // 설정이 없으면 기본 설정을 생성하고 저장
      await setStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    // 데이터 유효성 검증
    if (!isValidSettings(settings)) {
      throw new DataServiceError(
        "Invalid settings data format",
        "getSettings",
        "settings"
      );
    }

    return settings;
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to get settings",
      "getSettings",
      "settings",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 앱 설정을 업데이트합니다
 */
export async function updateSettings(
  updates: Partial<Settings>
): Promise<Settings> {
  try {
    const currentSettings = await getSettings();

    const updatedSettings: Settings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await setStorageItem(STORAGE_KEYS.SETTINGS, updatedSettings);

    return updatedSettings;
  } catch (error) {
    throw new DataServiceError(
      "Failed to update settings",
      "updateSettings",
      "settings",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 설정을 기본값으로 초기화합니다
 */
export async function resetSettings(): Promise<Settings> {
  try {
    const resetSettings: Settings = {
      ...DEFAULT_SETTINGS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setStorageItem(STORAGE_KEYS.SETTINGS, resetSettings);

    return resetSettings;
  } catch (error) {
    throw new DataServiceError(
      "Failed to reset settings",
      "resetSettings",
      "settings",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// =============================================================================
// CATEGORIES 관련 함수들
// =============================================================================

/**
 * 모든 카테고리를 조회합니다
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await getStorageItem<Category[]>(
      STORAGE_KEYS.CATEGORIES
    );

    if (!categories) {
      // 카테고리가 없으면 기본 카테고리를 생성하고 저장
      const defaultCategories = await initializeDefaultCategories();
      return defaultCategories;
    }

    // 데이터 유효성 검증
    if (!isValidCategoryArray(categories)) {
      throw new DataServiceError(
        "Invalid categories data format",
        "getCategories",
        "category"
      );
    }

    // 정렬 순서대로 반환
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to get categories",
      "getCategories",
      "category",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 특정 ID의 카테고리를 조회합니다
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const categories = await getCategories();
    return categories.find((category) => category.id === id) || null;
  } catch (error) {
    throw new DataServiceError(
      "Failed to get category by ID",
      "getCategoryById",
      "category",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 새 카테고리를 추가합니다
 */
export async function addCategory(
  categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<Category> {
  try {
    const categories = await getCategories();
    const now = new Date().toISOString();

    const newCategory: Category = {
      ...categoryData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const updatedCategories = [...categories, newCategory];
    await setStorageItem(STORAGE_KEYS.CATEGORIES, updatedCategories);

    return newCategory;
  } catch (error) {
    throw new DataServiceError(
      "Failed to add category",
      "addCategory",
      "category",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 카테고리를 업데이트합니다
 */
export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt">>
): Promise<Category> {
  try {
    const categories = await getCategories();
    const categoryIndex = categories.findIndex((cat) => cat.id === id);

    if (categoryIndex === -1) {
      throw new DataServiceError(
        `Category with ID ${id} not found`,
        "updateCategory",
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
    await setStorageItem(STORAGE_KEYS.CATEGORIES, categories);

    return updatedCategory;
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to update category",
      "updateCategory",
      "category",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 카테고리를 삭제합니다 (관련 링크는 '기타' 카테고리로 이동)
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    const categories = await getCategories();
    const categoryToDelete = categories.find((cat) => cat.id === id);

    if (!categoryToDelete) {
      throw new DataServiceError(
        `Category with ID ${id} not found`,
        "deleteCategory",
        "category",
        id
      );
    }

    // '기타' 카테고리 찾기 (없으면 생성)
    let miscCategory = categories.find((cat) => cat.name === "기타");
    if (!miscCategory) {
      miscCategory = await addCategory({
        name: "기타",
        color: "#9E9E9E",
        icon: "📎",
        description: "분류되지 않은 링크들",
        sortOrder: Math.max(...categories.map((cat) => cat.sortOrder)) + 1,
      });
    }

    // 해당 카테고리의 모든 링크를 '기타' 카테고리로 이동
    const links = await getLinks();
    const linksToUpdate = links.filter((link) => link.categoryId === id);

    for (const link of linksToUpdate) {
      await updateLink(link.id, { categoryId: miscCategory.id });
    }

    // 카테고리 삭제
    const updatedCategories = categories.filter((cat) => cat.id !== id);
    await setStorageItem(STORAGE_KEYS.CATEGORIES, updatedCategories);
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to delete category",
      "deleteCategory",
      "category",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 기본 카테고리들을 초기화합니다
 */
async function initializeDefaultCategories(): Promise<Category[]> {
  const now = new Date().toISOString();

  const categories: Category[] = DEFAULT_CATEGORIES.map((categoryData) => ({
    ...categoryData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));

  await setStorageItem(STORAGE_KEYS.CATEGORIES, categories);
  return categories;
}

// =============================================================================
// LINKS 관련 함수들
// =============================================================================

/**
 * 모든 링크를 조회합니다
 */
export async function getLinks(): Promise<Link[]> {
  try {
    const links = await getStorageItem<Link[]>(STORAGE_KEYS.LINKS);

    if (!links) {
      // 링크가 없으면 빈 배열을 저장하고 반환
      await setStorageItem(STORAGE_KEYS.LINKS, []);
      return [];
    }

    // 데이터 유효성 검증
    if (!isValidLinkArray(links)) {
      throw new DataServiceError(
        "Invalid links data format",
        "getLinks",
        "link"
      );
    }

    return links;
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to get links",
      "getLinks",
      "link",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 특정 ID의 링크를 조회합니다
 */
export async function getLinkById(id: string): Promise<Link | null> {
  try {
    const links = await getLinks();
    return links.find((link) => link.id === id) || null;
  } catch (error) {
    throw new DataServiceError(
      "Failed to get link by ID",
      "getLinkById",
      "link",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 특정 카테고리의 링크들을 조회합니다
 */
export async function getLinksInCategory(categoryId: string): Promise<Link[]> {
  try {
    const links = await getLinks();
    return links
      .filter((link) => link.categoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    throw new DataServiceError(
      "Failed to get links in category",
      "getLinksInCategory",
      "link",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 새 링크를 추가합니다
 */
export async function addLink(
  linkData: Omit<Link, "id" | "createdAt" | "updatedAt">
): Promise<Link> {
  try {
    const links = await getLinks();
    const now = new Date().toISOString();

    const newLink: Link = {
      ...linkData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const updatedLinks = [...links, newLink];
    await setStorageItem(STORAGE_KEYS.LINKS, updatedLinks);

    return newLink;
  } catch (error) {
    throw new DataServiceError(
      "Failed to add link",
      "addLink",
      "link",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 링크를 업데이트합니다
 */
export async function updateLink(
  id: string,
  updates: Partial<Omit<Link, "id" | "createdAt">>
): Promise<Link> {
  try {
    const links = await getLinks();
    const linkIndex = links.findIndex((link) => link.id === id);

    if (linkIndex === -1) {
      throw new DataServiceError(
        `Link with ID ${id} not found`,
        "updateLink",
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
    await setStorageItem(STORAGE_KEYS.LINKS, links);

    return updatedLink;
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to update link",
      "updateLink",
      "link",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 링크를 삭제합니다
 */
export async function deleteLink(id: string): Promise<void> {
  try {
    const links = await getLinks();
    const linkIndex = links.findIndex((link) => link.id === id);

    if (linkIndex === -1) {
      throw new DataServiceError(
        `Link with ID ${id} not found`,
        "deleteLink",
        "link",
        id
      );
    }

    const updatedLinks = links.filter((link) => link.id !== id);
    await setStorageItem(STORAGE_KEYS.LINKS, updatedLinks);
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to delete link",
      "deleteLink",
      "link",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// =============================================================================
// 검색 및 정렬 함수들
// =============================================================================

/**
 * 링크 검색 옵션
 */
export interface SearchOptions {
  query: string;
  categoryId?: string;
  isFavorite?: boolean;
  tags?: string[];
}

/**
 * 링크를 검색합니다
 */
export async function searchLinks(options: SearchOptions): Promise<Link[]> {
  try {
    const links = await getLinks();
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
      "Failed to search links",
      "searchLinks",
      "link",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * 링크 정렬 옵션
 */
export type SortField =
  | "createdAt"
  | "updatedAt"
  | "title"
  | "accessCount"
  | "lastAccessedAt";
export type SortOrder = "asc" | "desc";

/**
 * 링크를 정렬합니다
 */
export function sortLinks(
  links: Link[],
  field: SortField,
  order: SortOrder = "desc"
): Link[] {
  const sortedLinks = [...links].sort((a, b) => {
    let aValue: string | number | undefined;
    let bValue: string | number | undefined;

    switch (field) {
      case "createdAt":
      case "updatedAt":
      case "lastAccessedAt":
        aValue = a[field] || "";
        bValue = b[field] || "";
        break;
      case "title":
        aValue = a[field].toLowerCase();
        bValue = b[field].toLowerCase();
        break;
      case "accessCount":
        aValue = a[field];
        bValue = b[field];
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });

  return sortedLinks;
}

/**
 * 링크 접근 시 접근 횟수와 시간을 업데이트합니다
 */
export async function recordLinkAccess(id: string): Promise<Link> {
  try {
    const link = await getLinkById(id);

    if (!link) {
      throw new DataServiceError(
        `Link with ID ${id} not found`,
        "recordLinkAccess",
        "link",
        id
      );
    }

    return await updateLink(id, {
      accessCount: link.accessCount + 1,
      lastAccessedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }

    throw new DataServiceError(
      "Failed to record link access",
      "recordLinkAccess",
      "link",
      id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
