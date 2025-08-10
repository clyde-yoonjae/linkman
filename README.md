# 🔗 Linkman

> **개인용 링크 관리 앱** - 소중한 링크들을 안전하고 체계적으로 관리하세요

<div align="center">

[![React Native](https://img.shields.io/badge/React%20Native-0.76.2-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~52.0.11-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0.2-orange.svg)](https://zustand-demo.pmnd.rs/)

</div>

## 📱 프로젝트 소개

**Linkman**은 개인용 링크 관리 모바일 애플리케이션입니다. 일상에서 발견한 유용한 웹사이트나 기사들을 카테고리별로 분류하여 안전하게 저장하고, 나중에 쉽게 찾아볼 수 있도록 도와줍니다.

### ✨ 주요 특징

- 🔒 **보안**: 4자리 비밀번호로 앱 잠금
- 📂 **카테고리**: 사용자 정의 카테고리로 체계적 관리
- 🔍 **검색**: 제목, 설명, URL 등 전방위 검색
- 📱 **오프라인**: 모든 데이터는 기기에 로컬 저장
- 🎨 **직관적 UI**: 깔끔하고 사용하기 쉬운 인터페이스
- 🌙 **다크모드**: 라이트/다크 테마 지원

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **프레임워크** | React Native 0.76.2 |
| **플랫폼** | Expo ~52.0.11 |
| **언어** | TypeScript 5.3.3 |
| **네비게이션** | React Navigation 6.x |
| **상태관리** | Zustand 5.0.2 |
| **데이터 저장** | AsyncStorage |
| **테스팅** | Jest, React Testing Library |
| **스타일링** | StyleSheet (Native) |

## 📋 개발 로드맵 (Task-Master)

프로젝트는 Task-Master를 통해 체계적으로 관리되고 있으며, 다음과 같은 단계로 진행됩니다:

### ✅ Phase 1: 기초 설정 및 구조
- [x] **Task 1**: 프로젝트 초기 설정 및 네비게이션 구조 구축 `완료`
  - [x] React Navigation 패키지 설치
  - [x] 기본 폴더 구조 설정
  - [x] 네비게이션 구조 구현
  - [x] 기본 화면 컴포넌트 생성
  - [x] 디자인 시스템 및 테마 설정 (Zustand)
  - [x] 유틸리티 함수 구현
  - [x] App.tsx 통합
  - [x] 테스트 실행 및 확인

### 🚧 Phase 2: 핵심 기능 구현
- [ ] **Task 2**: 로컬 데이터 저장소 구현 `진행 예정`
- [ ] **Task 3**: 비밀번호 보안 시스템 구현
- [ ] **Task 4**: 온보딩 및 로그인 화면 구현

### 📦 Phase 3: 링크 관리 기능
- [ ] **Task 5**: 카테고리 관리 기능 구현
- [ ] **Task 6**: 링크 저장 및 메타데이터 추출 기능 구현
- [ ] **Task 7**: 링크 CRUD 기능 구현

### 🔍 Phase 4: 고급 기능
- [ ] **Task 8**: 검색 및 필터링 기능 구현
- [ ] **Task 9**: 드래그 앤 드롭 정렬 기능 구현
- [ ] **Task 10**: 메인 화면 및 UI 컴포넌트 구현

### ⚙️ Phase 5: 마무리
- [ ] **Task 11**: 설정 화면 및 사용자 기본 설정 구현
- [ ] **Task 12**: 성능 최적화 및 앱 배포 준비

**진행률**: 1/12 (8.3%) 완료 | 8/8 서브태스크 완료

## 🚀 시작하기

### 사전 요구사항
- Node.js 18.x 이상
- Expo CLI
- iOS Simulator (macOS) 또는 Android Emulator

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start

# iOS에서 실행
npm run ios

# Android에서 실행
npm run android
```

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch
```

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Button.tsx
│   └── Logo.tsx
├── navigation/          # 네비게이션 설정
│   ├── AppNavigator.tsx
│   └── MainTabNavigator.tsx
├── screens/            # 화면 컴포넌트
│   ├── OnboardingScreen.tsx
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   └── ...
├── stores/             # Zustand 상태 관리
│   └── themeStore.ts
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
└── assets/             # 이미지, 폰트 등 정적 자원
```

## 🎯 주요 기능 (예정)

### 🔐 보안
- 4자리 비밀번호 설정 및 인증
- 앱 백그라운드 전환 시 자동 잠금
- 로컬 데이터 암호화

### 📋 링크 관리
- URL 클립보드 자동 감지
- 웹페이지 메타데이터 자동 추출 (제목, 설명, 썸네일)
- 사용자 정의 카테고리 분류
- 즐겨찾기 기능

### 🔍 검색 및 정렬
- 전방위 통합 검색
- 카테고리별 필터링
- 날짜, 이름순 정렬
- 드래그 앤 드롭 순서 변경

### ⚙️ 설정
- 라이트/다크 테마
- 데이터 백업/복원
- 앱 잠금 설정

## 🤝 기여하기

이 프로젝트는 개인 프로젝트이지만, 피드백과 제안을 환영합니다!

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

---

<div align="center">
  <p>Made with ❤️ for better link management</p>
</div>
