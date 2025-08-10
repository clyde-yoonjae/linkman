import { Settings, Category, Link } from "../types/data";

/**
 * 캐시 엔트리 인터페이스
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * 캐시 키 타입
 */
export type CacheKey = "settings" | "categories" | "links";

/**
 * 캐시된 데이터 타입
 */
export type CachedData = Settings | Category[] | Link[];

/**
 * 메모리 캐시 클래스
 */
class MemoryCache {
  private cache: Map<CacheKey, CacheEntry<CachedData>> = new Map();
  private readonly defaultTTL: number = 5 * 60 * 1000; // 5분

  /**
   * 캐시에서 데이터를 조회합니다
   */
  get<T extends CachedData>(key: CacheKey): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // TTL 확인
    const now = Date.now();
    const ttl = entry.ttl || this.defaultTTL;

    if (now - entry.timestamp > ttl) {
      // 만료된 데이터 삭제
      this.cache.delete(key);
      console.log(`[Cache] Expired data removed for key: ${key}`);
      return null;
    }

    console.log(`[Cache] Cache hit for key: ${key}`);
    return entry.data as T;
  }

  /**
   * 캐시에 데이터를 저장합니다
   */
  set<T extends CachedData>(key: CacheKey, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry as CacheEntry<CachedData>);
    console.log(`[Cache] Data cached for key: ${key}`);
  }

  /**
   * 특정 키의 캐시를 무효화합니다
   */
  invalidate(key: CacheKey): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`[Cache] Cache invalidated for key: ${key}`);
    }
  }

  /**
   * 모든 캐시를 무효화합니다
   */
  invalidateAll(): void {
    this.cache.clear();
    console.log("[Cache] All cache invalidated");
  }

  /**
   * 만료된 캐시 엔트리들을 정리합니다
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const ttl = entry.ttl || this.defaultTTL;

      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`[Cache] Cleaned up ${removedCount} expired entries`);
    }
  }

  /**
   * 캐시 상태 정보를 반환합니다
   */
  getStats(): {
    totalEntries: number;
    keys: CacheKey[];
    memoryUsage: number;
  } {
    const keys = Array.from(this.cache.keys());
    const memoryUsage = this.estimateMemoryUsage();

    return {
      totalEntries: this.cache.size,
      keys,
      memoryUsage,
    };
  }

  /**
   * 메모리 사용량을 추정합니다 (바이트 단위)
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      // 키 크기 + 데이터 크기 추정
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 16; // timestamp + ttl
    }

    return totalSize;
  }
}

// 싱글톤 캐시 인스턴스
export const memoryCache = new MemoryCache();

/**
 * 캐시를 주기적으로 정리하는 함수
 */
export function startCacheCleanup(
  intervalMs: number = 10 * 60 * 1000
): () => void {
  const intervalId = setInterval(() => {
    memoryCache.cleanup();
  }, intervalMs);

  // 정리 함수 반환
  return () => {
    clearInterval(intervalId);
    console.log("[Cache] Cache cleanup stopped");
  };
}

/**
 * 캐시 키 유틸리티 함수들
 */
export const CacheKeys = {
  SETTINGS: "settings" as const,
  CATEGORIES: "categories" as const,
  LINKS: "links" as const,
} as const;

/**
 * 개발 모드에서만 사용하는 캐시 디버깅 함수
 */
export function debugCache(): void {
  if (__DEV__) {
    const stats = memoryCache.getStats();
    console.log("[Cache Debug]", {
      ...stats,
      memoryUsageKB: Math.round(stats.memoryUsage / 1024),
    });
  }
}
