/**
 * 앱 설정 인터페이스
 */
export interface Settings {
  /** 4자리 비밀번호 (해시됨) */
  passwordHash?: string;
  /** 앱이 처음 실행되었는지 여부 */
  isFirstLaunch: boolean;
  /** 다크 모드 설정 */
  isDarkMode: boolean;
  /** 앱 버전 (마이그레이션용) */
  appVersion: string;
  /** 자동 잠금 시간 (분) */
  autoLockTimeMinutes: number;
  /** 클립보드 자동 감지 여부 */
  autoDetectClipboard: boolean;
  /** 설정 생성일 */
  createdAt: string;
  /** 설정 수정일 */
  updatedAt: string;
}

/**
 * 카테고리 인터페이스
 */
export interface Category {
  /** 고유 식별자 */
  id: string;
  /** 카테고리 이름 */
  name: string;
  /** 카테고리 색상 (hex 코드) */
  color: string;
  /** 아이콘 이름 또는 이모지 */
  icon: string;
  /** 카테고리 설명 */
  description?: string;
  /** 정렬 순서 */
  sortOrder: number;
  /** 생성일 */
  createdAt: string;
  /** 수정일 */
  updatedAt: string;
}

/**
 * 링크 인터페이스
 */
export interface Link {
  /** 고유 식별자 */
  id: string;
  /** URL 주소 */
  url: string;
  /** 링크 제목 */
  title: string;
  /** 링크 설명 */
  description?: string;
  /** 썸네일 이미지 URL */
  thumbnailUrl?: string;
  /** 소속 카테고리 ID */
  categoryId: string;
  /** 즐겨찾기 여부 */
  isFavorite: boolean;
  /** 사용자 태그 */
  tags: string[];
  /** 메모 */
  notes?: string;
  /** 정렬 순서 (카테고리 내) */
  sortOrder: number;
  /** 마지막 접근일 */
  lastAccessedAt?: string;
  /** 접근 횟수 */
  accessCount: number;
  /** 생성일 */
  createdAt: string;
  /** 수정일 */
  updatedAt: string;
}

/**
 * AsyncStorage에서 사용하는 키 상수
 */
export const STORAGE_KEYS = {
  SETTINGS: "@linkman:settings",
  CATEGORIES: "@linkman:categories",
  LINKS: "@linkman:links",
  APP_VERSION: "@linkman:app_version",
  BACKUP_DATA: "@linkman:backup",
} as const;

/**
 * 기본 카테고리 정의
 */
export const DEFAULT_CATEGORIES: Omit<
  Category,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "즐겨찾기",
    color: "#FFD700",
    icon: "⭐",
    description: "자주 방문하는 사이트들",
    sortOrder: 0,
  },
  {
    name: "읽을거리",
    color: "#4CAF50",
    icon: "📚",
    description: "나중에 읽을 기사와 문서들",
    sortOrder: 1,
  },
  {
    name: "쇼핑",
    color: "#FF9800",
    icon: "🛍️",
    description: "쇼핑 사이트와 상품 링크",
    sortOrder: 2,
  },
  {
    name: "업무",
    color: "#2196F3",
    icon: "💼",
    description: "업무 관련 링크와 자료",
    sortOrder: 3,
  },
  {
    name: "기타",
    color: "#9E9E9E",
    icon: "📎",
    description: "분류되지 않은 링크들",
    sortOrder: 4,
  },
];

/**
 * 기본 설정 정의
 */
export const DEFAULT_SETTINGS: Settings = {
  isFirstLaunch: true,
  isDarkMode: false,
  appVersion: "1.0.0",
  autoLockTimeMinutes: 5,
  autoDetectClipboard: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * 데이터 검증용 타입 가드 함수들
 */

export function isValidSettings(data: any): data is Settings {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.isFirstLaunch === "boolean" &&
    typeof data.isDarkMode === "boolean" &&
    typeof data.appVersion === "string" &&
    typeof data.autoLockTimeMinutes === "number" &&
    typeof data.autoDetectClipboard === "boolean" &&
    typeof data.createdAt === "string" &&
    typeof data.updatedAt === "string"
  );
}

export function isValidCategory(data: any): data is Category {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.id === "string" &&
    typeof data.name === "string" &&
    typeof data.color === "string" &&
    typeof data.icon === "string" &&
    typeof data.sortOrder === "number" &&
    typeof data.createdAt === "string" &&
    typeof data.updatedAt === "string"
  );
}

export function isValidLink(data: any): data is Link {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.id === "string" &&
    typeof data.url === "string" &&
    typeof data.title === "string" &&
    (data.description === undefined || typeof data.description === "string") &&
    (data.thumbnailUrl === undefined ||
      typeof data.thumbnailUrl === "string") &&
    typeof data.categoryId === "string" &&
    typeof data.isFavorite === "boolean" &&
    Array.isArray(data.tags) &&
    (data.notes === undefined || typeof data.notes === "string") &&
    typeof data.sortOrder === "number" &&
    (data.lastAccessedAt === undefined ||
      typeof data.lastAccessedAt === "string") &&
    typeof data.accessCount === "number" &&
    typeof data.createdAt === "string" &&
    typeof data.updatedAt === "string"
  );
}

export function isValidCategoryArray(data: any): data is Category[] {
  return Array.isArray(data) && data.every(isValidCategory);
}

export function isValidLinkArray(data: any): data is Link[] {
  return Array.isArray(data) && data.every(isValidLink);
}
