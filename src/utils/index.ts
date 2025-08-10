/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}. ${month}. ${day}.`;
};

/**
 * 이메일 주소가 유효한지 검증합니다.
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * URL이 유효한지 검증합니다.
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 고유 ID를 생성합니다.
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 문자열이 비어있거나 공백만 있는지 확인합니다.
 */
export const isEmpty = (str?: string): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * 문자열을 자릅니다.
 */
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
};

/**
 * URL에서 도메인을 추출합니다.
 */
export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
};
