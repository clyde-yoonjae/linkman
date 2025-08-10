import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCachedSettings,
  updateCachedSettings,
  getCachedCategories,
  getCachedCategoryById,
  addCachedCategory,
  updateCachedCategory,
  getCachedLinks,
  getCachedLinkById,
  getCachedLinksInCategory,
  addCachedLink,
  updateCachedLink,
  deleteCachedLink,
  searchCachedLinks,
  recordCachedLinkAccess,
  initializeAppData,
  refreshAllCaches,
  refreshCache,
} from "../cachedDataService";
import { memoryCache, CacheKeys } from "../cacheService";
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
}));

// utils 모킹
jest.mock("../../utils", () => ({
  generateId: jest.fn(),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedUtils = utils as jest.Mocked<typeof utils>;

// 테스트 데이터
const mockSettings: Settings = {
  isFirstLaunch: false,
  isDarkMode: true,
  appVersion: "1.0.0",
  autoLockTimeMinutes: 5,
  autoDetectClipboard: true,
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const mockCategory: Category = {
  id: "cat-1",
  name: "Test Category",
  color: "#FF0000",
  icon: "🔥",
  description: "Test description",
  sortOrder: 0,
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const mockLink: Link = {
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

describe("CachedDataService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memoryCache.invalidateAll();
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();

    // generateId 기본 모킹
    mockedUtils.generateId.mockReturnValue("test-id");

    // AsyncStorage 기본 모킹 초기화
    mockedAsyncStorage.getItem.mockImplementation(() => Promise.resolve(null));
    mockedAsyncStorage.setItem.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // 캐시된 설정 테스트
  // ==========================================================================

  describe("Cached Settings", () => {
    describe("getCachedSettings", () => {
      it("should return cached settings if available", async () => {
        // 캐시에 데이터 미리 저장
        memoryCache.set(CacheKeys.SETTINGS, mockSettings);

        const result = await getCachedSettings();

        expect(result).toEqual(mockSettings);
        // AsyncStorage는 호출되지 않아야 함
        expect(mockedAsyncStorage.getItem).not.toHaveBeenCalled();
      });

      it("should fetch from storage and cache when not in cache", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockSettings)
        );

        const result = await getCachedSettings();

        expect(result).toEqual(mockSettings);
        expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
          STORAGE_KEYS.SETTINGS
        );
        // 캐시에 저장되었는지 확인
        expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toEqual(
          mockSettings
        );
      });

      it("should create default settings when none exist", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

        const result = await getCachedSettings();

        expect(result).toEqual(DEFAULT_SETTINGS);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(DEFAULT_SETTINGS)
        );
        // 캐시에 저장되었는지 확인
        expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toEqual(
          DEFAULT_SETTINGS
        );
      });
    });

    describe("updateCachedSettings", () => {
      it("should update settings in storage and cache", async () => {
        // 기존 설정을 캐시에 저장
        memoryCache.set(CacheKeys.SETTINGS, mockSettings);

        const updates = { isDarkMode: false };
        const result = await updateCachedSettings(updates);

        expect(result.isDarkMode).toBe(false);
        expect(result.updatedAt).toBeDefined();
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(result)
        );
        // 캐시도 업데이트되었는지 확인
        expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toEqual(result);
      });
    });
  });

  // ==========================================================================
  // 캐시된 카테고리 테스트
  // ==========================================================================

  describe("Cached Categories", () => {
    describe("getCachedCategories", () => {
      it("should return cached categories if available", async () => {
        const mockCategories = [mockCategory];
        memoryCache.set(CacheKeys.CATEGORIES, mockCategories);

        const result = await getCachedCategories();

        expect(result).toEqual(mockCategories);
        expect(mockedAsyncStorage.getItem).not.toHaveBeenCalled();
      });

      it("should fetch from storage and cache when not in cache", async () => {
        const mockCategories = [mockCategory];
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockCategories)
        );

        const result = await getCachedCategories();

        expect(result).toEqual(mockCategories);
        expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
          STORAGE_KEYS.CATEGORIES
        );
        expect(memoryCache.get<Category[]>(CacheKeys.CATEGORIES)).toEqual(
          mockCategories
        );
      });

      it("should create default categories when none exist", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
        mockedUtils.generateId
          .mockReturnValueOnce("id-1")
          .mockReturnValueOnce("id-2")
          .mockReturnValueOnce("id-3")
          .mockReturnValueOnce("id-4")
          .mockReturnValueOnce("id-5");

        const result = await getCachedCategories();

        expect(result).toHaveLength(5);
        expect(result[0].name).toBe("즐겨찾기");
        expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
        expect(memoryCache.get<Category[]>(CacheKeys.CATEGORIES)).toEqual(
          result
        );
      });
    });

    describe("getCachedCategoryById", () => {
      it("should return category by ID from cache", async () => {
        const mockCategories = [mockCategory];
        memoryCache.set(CacheKeys.CATEGORIES, mockCategories);

        const result = await getCachedCategoryById("cat-1");

        expect(result).toEqual(mockCategory);
      });

      it("should return null for non-existent category", async () => {
        memoryCache.set(CacheKeys.CATEGORIES, []);

        const result = await getCachedCategoryById("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("addCachedCategory", () => {
      it("should add category to storage and cache", async () => {
        const existingCategories = [mockCategory];
        memoryCache.set(CacheKeys.CATEGORIES, existingCategories);

        const newCategoryData = {
          name: "New Category",
          color: "#00FF00",
          icon: "🆕",
          description: "New category",
          sortOrder: 1,
        };

        const result = await addCachedCategory(newCategoryData);

        expect(result.id).toBe("test-id");
        expect(result.name).toBe(newCategoryData.name);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalled();

        // 캐시에 새 카테고리가 추가되었는지 확인
        const cachedCategories = memoryCache.get<Category[]>(
          CacheKeys.CATEGORIES
        );
        expect(cachedCategories).toHaveLength(2);
        expect(cachedCategories?.[1]).toEqual(result);
      });
    });

    describe("updateCachedCategory", () => {
      it("should update category in storage and cache", async () => {
        const existingCategories = [mockCategory];
        memoryCache.set(CacheKeys.CATEGORIES, existingCategories);

        const updates = { name: "Updated Name" };
        const result = await updateCachedCategory("cat-1", updates);

        expect(result.name).toBe("Updated Name");
        expect(result.updatedAt).toBeDefined();
        expect(mockedAsyncStorage.setItem).toHaveBeenCalled();

        // 캐시에서 업데이트되었는지 확인
        const cachedCategories = memoryCache.get<Category[]>(
          CacheKeys.CATEGORIES
        );
        expect(cachedCategories?.[0]).toEqual(result);
      });
    });
  });

  // ==========================================================================
  // 캐시된 링크 테스트
  // ==========================================================================

  describe("Cached Links", () => {
    describe("getCachedLinks", () => {
      it("should return cached links if available", async () => {
        const mockLinks = [mockLink];
        memoryCache.set(CacheKeys.LINKS, mockLinks);

        const result = await getCachedLinks();

        expect(result).toEqual(mockLinks);
        expect(mockedAsyncStorage.getItem).not.toHaveBeenCalled();
      });

      it("should fetch from storage and cache when not in cache", async () => {
        const mockLinks = [mockLink];
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockLinks)
        );

        const result = await getCachedLinks();

        expect(result).toEqual(mockLinks);
        expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
          STORAGE_KEYS.LINKS
        );
        expect(memoryCache.get<Link[]>(CacheKeys.LINKS)).toEqual(mockLinks);
      });

      it("should return empty array when no links exist", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

        const result = await getCachedLinks();

        expect(result).toEqual([]);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.LINKS,
          JSON.stringify([])
        );
        expect(memoryCache.get<Link[]>(CacheKeys.LINKS)).toEqual([]);
      });
    });

    describe("getCachedLinkById", () => {
      it("should return link by ID from cache", async () => {
        const mockLinks = [mockLink];
        memoryCache.set(CacheKeys.LINKS, mockLinks);

        const result = await getCachedLinkById("link-1");

        expect(result).toEqual(mockLink);
      });
    });

    describe("getCachedLinksInCategory", () => {
      it("should return links in specific category", async () => {
        const mockLinks = [
          { ...mockLink, categoryId: "cat-1", sortOrder: 1 },
          { ...mockLink, id: "link-2", categoryId: "cat-2", sortOrder: 0 },
          { ...mockLink, id: "link-3", categoryId: "cat-1", sortOrder: 0 },
        ];
        memoryCache.set(CacheKeys.LINKS, mockLinks);

        const result = await getCachedLinksInCategory("cat-1");

        expect(result).toHaveLength(2);
        expect(result[0].sortOrder).toBe(0); // 정렬 확인
        expect(result[1].sortOrder).toBe(1);
      });
    });

    describe("addCachedLink", () => {
      it("should add link to storage and cache", async () => {
        const existingLinks = [mockLink];
        memoryCache.set(CacheKeys.LINKS, existingLinks);

        const newLinkData = {
          url: "https://new.com",
          title: "New Link",
          categoryId: "cat-1",
          isFavorite: false,
          tags: [],
          sortOrder: 1,
          accessCount: 0,
        };

        const result = await addCachedLink(newLinkData);

        expect(result.id).toBe("test-id");
        expect(result.url).toBe(newLinkData.url);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalled();

        // 캐시에 새 링크가 추가되었는지 확인
        const cachedLinks = memoryCache.get<Link[]>(CacheKeys.LINKS);
        expect(cachedLinks).toHaveLength(2);
        expect(cachedLinks?.[1]).toEqual(result);
      });
    });

    describe("updateCachedLink", () => {
      it("should update link in storage and cache", async () => {
        const existingLinks = [mockLink];
        memoryCache.set(CacheKeys.LINKS, existingLinks);

        const updates = { title: "Updated Title" };
        const result = await updateCachedLink("link-1", updates);

        expect(result.title).toBe("Updated Title");
        expect(result.updatedAt).toBeDefined();
        expect(mockedAsyncStorage.setItem).toHaveBeenCalled();

        // 캐시에서 업데이트되었는지 확인
        const cachedLinks = memoryCache.get<Link[]>(CacheKeys.LINKS);
        expect(cachedLinks?.[0]).toEqual(result);
      });
    });

    describe("deleteCachedLink", () => {
      it("should delete link from storage and cache", async () => {
        const existingLinks = [mockLink];
        memoryCache.set(CacheKeys.LINKS, existingLinks);

        await deleteCachedLink("link-1");

        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.LINKS,
          JSON.stringify([])
        );

        // 캐시에서도 삭제되었는지 확인
        const cachedLinks = memoryCache.get<Link[]>(CacheKeys.LINKS);
        expect(cachedLinks).toEqual([]);
      });
    });
  });

  // ==========================================================================
  // 검색 및 접근 추적 테스트
  // ==========================================================================

  describe("Search and Access", () => {
    describe("searchCachedLinks", () => {
      it("should search cached links by query", async () => {
        const searchLinks = [
          {
            ...mockLink,
            id: "1",
            title: "JavaScript Tutorial",
            description: "Learn JS",
          },
          {
            ...mockLink,
            id: "2",
            title: "React Guide",
            description: "React basics",
          },
        ];
        memoryCache.set(CacheKeys.LINKS, searchLinks);

        const result = await searchCachedLinks({ query: "JavaScript" });

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("JavaScript Tutorial");
      });
    });

    describe("recordCachedLinkAccess", () => {
      it("should increment access count", async () => {
        const existingLinks = [mockLink];
        memoryCache.set(CacheKeys.LINKS, existingLinks);

        const result = await recordCachedLinkAccess("link-1");

        expect(result.accessCount).toBe(1);
        expect(result.lastAccessedAt).toBeDefined();
        expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // 데이터 초기화 테스트
  // ==========================================================================

  describe("Data Initialization", () => {
    describe("initializeAppData", () => {
      it("should initialize data for first launch", async () => {
        const firstLaunchSettings = {
          ...DEFAULT_SETTINGS,
          isFirstLaunch: true,
        };
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(firstLaunchSettings)) // getCachedSettings
          .mockResolvedValueOnce(null); // getCachedCategories

        mockedUtils.generateId
          .mockReturnValueOnce("cat-1")
          .mockReturnValueOnce("cat-2")
          .mockReturnValueOnce("cat-3")
          .mockReturnValueOnce("cat-4")
          .mockReturnValueOnce("cat-5");

        const result = await initializeAppData();

        expect(result.settings.isFirstLaunch).toBe(false);
        expect(result.categories).toHaveLength(5);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(2); // categories, settings update
      });

      it("should return existing data for non-first launch", async () => {
        const existingSettings = { ...mockSettings, isFirstLaunch: false };
        const existingCategories = [mockCategory];

        memoryCache.set(CacheKeys.SETTINGS, existingSettings);
        memoryCache.set(CacheKeys.CATEGORIES, existingCategories);

        const result = await initializeAppData();

        expect(result.settings.isFirstLaunch).toBe(false);
        expect(result.categories).toEqual(existingCategories);
        // 새로운 데이터 생성이 없었으므로 AsyncStorage 호출 없음
        expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // 캐시 새로고침 테스트
  // ==========================================================================

  describe("Cache Refresh", () => {
    describe("refreshAllCaches", () => {
      it("should invalidate and reload all caches", async () => {
        // 기존 캐시 데이터
        memoryCache.set(CacheKeys.SETTINGS, mockSettings);
        memoryCache.set(CacheKeys.CATEGORIES, [mockCategory]);
        memoryCache.set(CacheKeys.LINKS, [mockLink]);

        // 새로운 데이터 모킹
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(mockSettings))
          .mockResolvedValueOnce(JSON.stringify([mockCategory]))
          .mockResolvedValueOnce(JSON.stringify([mockLink]));

        await refreshAllCaches();

        expect(console.log).toHaveBeenCalledWith(
          "[Cache] Refreshing all caches..."
        );
        expect(console.log).toHaveBeenCalledWith(
          "[Cache] All caches refreshed successfully"
        );
        expect(mockedAsyncStorage.getItem).toHaveBeenCalledTimes(3);
      });
    });

    describe("refreshCache", () => {
      it("should refresh specific cache", async () => {
        memoryCache.set(CacheKeys.SETTINGS, mockSettings);

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockSettings)
        );

        await refreshCache("settings");

        expect(console.log).toHaveBeenCalledWith(
          "[Cache] Refreshing cache for: settings"
        );
        expect(console.log).toHaveBeenCalledWith(
          "[Cache] Cache refreshed for: settings"
        );
        expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
          STORAGE_KEYS.SETTINGS
        );
      });
    });
  });
});
