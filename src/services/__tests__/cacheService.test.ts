import {
  memoryCache,
  CacheKeys,
  startCacheCleanup,
  debugCache,
} from "../cacheService";
import { Settings, Category, Link } from "../../types/data";

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

const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Test Category",
    color: "#FF0000",
    icon: "🔥",
    description: "Test description",
    sortOrder: 0,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
];

const mockLinks: Link[] = [
  {
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
  },
];

describe("MemoryCache", () => {
  beforeEach(() => {
    // 각 테스트 전에 캐시 초기화
    memoryCache.invalidateAll();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic Cache Operations", () => {
    it("should store and retrieve data", () => {
      memoryCache.set(CacheKeys.SETTINGS, mockSettings);

      const result = memoryCache.get<Settings>(CacheKeys.SETTINGS);

      expect(result).toEqual(mockSettings);
      expect(console.log).toHaveBeenCalledWith(
        "[Cache] Data cached for key: settings"
      );
      expect(console.log).toHaveBeenCalledWith(
        "[Cache] Cache hit for key: settings"
      );
    });

    it("should return null for non-existent key", () => {
      const result = memoryCache.get<Settings>(CacheKeys.SETTINGS);

      expect(result).toBeNull();
    });

    it("should store different data types", () => {
      memoryCache.set(CacheKeys.SETTINGS, mockSettings);
      memoryCache.set(CacheKeys.CATEGORIES, mockCategories);
      memoryCache.set(CacheKeys.LINKS, mockLinks);

      expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toEqual(
        mockSettings
      );
      expect(memoryCache.get<Category[]>(CacheKeys.CATEGORIES)).toEqual(
        mockCategories
      );
      expect(memoryCache.get<Link[]>(CacheKeys.LINKS)).toEqual(mockLinks);
    });
  });

  describe("TTL (Time To Live)", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should expire data after TTL", () => {
      const shortTTL = 1000; // 1초
      memoryCache.set(CacheKeys.SETTINGS, mockSettings, shortTTL);

      // 즉시 조회 - 데이터 있음
      expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toEqual(
        mockSettings
      );

      // 1.5초 후 조회 - 데이터 만료
      jest.advanceTimersByTime(1500);
      expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        "[Cache] Expired data removed for key: settings"
      );
    });

    it("should use default TTL when not specified", () => {
      memoryCache.set(CacheKeys.SETTINGS, mockSettings);

      // 4분 후 - 아직 유효 (기본 TTL: 5분)
      jest.advanceTimersByTime(4 * 60 * 1000);
      expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toEqual(
        mockSettings
      );

      // 6분 후 - 만료
      jest.advanceTimersByTime(2 * 60 * 1000);
      expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toBeNull();
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate specific cache key", () => {
      memoryCache.set(CacheKeys.SETTINGS, mockSettings);
      memoryCache.set(CacheKeys.CATEGORIES, mockCategories);

      memoryCache.invalidate(CacheKeys.SETTINGS);

      expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toBeNull();
      expect(memoryCache.get<Category[]>(CacheKeys.CATEGORIES)).toEqual(
        mockCategories
      );
      expect(console.log).toHaveBeenCalledWith(
        "[Cache] Cache invalidated for key: settings"
      );
    });

    it("should invalidate all cache", () => {
      memoryCache.set(CacheKeys.SETTINGS, mockSettings);
      memoryCache.set(CacheKeys.CATEGORIES, mockCategories);
      memoryCache.set(CacheKeys.LINKS, mockLinks);

      memoryCache.invalidateAll();

      expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toBeNull();
      expect(memoryCache.get<Category[]>(CacheKeys.CATEGORIES)).toBeNull();
      expect(memoryCache.get<Link[]>(CacheKeys.LINKS)).toBeNull();
      expect(console.log).toHaveBeenCalledWith("[Cache] All cache invalidated");
    });

    it("should handle invalidating non-existent key gracefully", () => {
      memoryCache.invalidate(CacheKeys.SETTINGS);

      // 에러가 발생하지 않아야 함
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining("Cache invalidated")
      );
    });
  });

  describe("Cache Cleanup", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should cleanup expired entries", () => {
      const shortTTL = 1000;
      const longTTL = 10000;

      memoryCache.set(CacheKeys.SETTINGS, mockSettings, shortTTL);
      memoryCache.set(CacheKeys.CATEGORIES, mockCategories, longTTL);

      // 1.5초 후 cleanup 실행
      jest.advanceTimersByTime(1500);
      memoryCache.cleanup();

      expect(memoryCache.get<Settings>(CacheKeys.SETTINGS)).toBeNull();
      expect(memoryCache.get<Category[]>(CacheKeys.CATEGORIES)).toEqual(
        mockCategories
      );
      expect(console.log).toHaveBeenCalledWith(
        "[Cache] Cleaned up 1 expired entries"
      );
    });

    it("should not log when no cleanup needed", () => {
      memoryCache.set(CacheKeys.SETTINGS, mockSettings, 10000);

      memoryCache.cleanup();

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining("Cleaned up")
      );
    });
  });

  describe("Cache Statistics", () => {
    it("should return correct stats", () => {
      memoryCache.set(CacheKeys.SETTINGS, mockSettings);
      memoryCache.set(CacheKeys.CATEGORIES, mockCategories);

      const stats = memoryCache.getStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.keys).toEqual(["settings", "categories"]);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it("should return empty stats for empty cache", () => {
      const stats = memoryCache.getStats();

      expect(stats.totalEntries).toBe(0);
      expect(stats.keys).toEqual([]);
      expect(stats.memoryUsage).toBe(0);
    });
  });

  describe("Cache Cleanup Scheduler", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should start and stop cache cleanup", () => {
      const cleanupInterval = 1000;
      const stopCleanup = startCacheCleanup(cleanupInterval);

      // cleanup이 주기적으로 실행되는지 확인하기 위해 mock 함수 생성
      const cleanupSpy = jest.spyOn(memoryCache, "cleanup");

      // 1초 후 cleanup 실행 확인
      jest.advanceTimersByTime(1000);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      // 2초 후 다시 cleanup 실행 확인
      jest.advanceTimersByTime(1000);
      expect(cleanupSpy).toHaveBeenCalledTimes(2);

      // cleanup 중지
      stopCleanup();

      // 3초 후 cleanup이 실행되지 않는지 확인
      jest.advanceTimersByTime(1000);
      expect(cleanupSpy).toHaveBeenCalledTimes(2);

      expect(console.log).toHaveBeenCalledWith("[Cache] Cache cleanup stopped");

      cleanupSpy.mockRestore();
    });
  });

  describe("Debug Functions", () => {
    beforeEach(() => {
      (global as any).__DEV__ = true;
    });

    afterEach(() => {
      (global as any).__DEV__ = false;
    });

    it("should log debug info in development mode", () => {
      memoryCache.set(CacheKeys.SETTINGS, mockSettings);
      memoryCache.set(CacheKeys.CATEGORIES, mockCategories);

      debugCache();

      expect(console.log).toHaveBeenCalledWith(
        "[Cache Debug]",
        expect.objectContaining({
          totalEntries: 2,
          keys: ["settings", "categories"],
          memoryUsageKB: expect.any(Number),
        })
      );
    });

    it("should not log in production mode", () => {
      (global as any).__DEV__ = false;

      memoryCache.set(CacheKeys.SETTINGS, mockSettings);
      debugCache();

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining("[Cache Debug]")
      );
    });
  });
});
