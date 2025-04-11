# 동아리 출석 체크 서비스

QR 코드를 활용한 간편한 동아리 출석 관리 시스템입니다. 사용자 친화적인 인터페이스와 효율적인 기능으로 동아리 활동의 출석을 쉽게 기록하고 관리할 수 있습니다.

## 주요 기능

### 1. QR 코드 출석 체크
- 관리자가 생성한 QR 코드를 회원이 스캔하여 간편하게 출석 체크
- 실시간 출석 현황 확인 가능

### 2. 동아리 관리
- 동아리 생성 및 관리 기능
- 멤버 초대 및 관리
- 동아리별 출석 이벤트 생성

### 3. 출석 통계
- 개인 및 동아리 전체의 출석 기록 확인
- 다양한 통계 데이터 제공
- 출석 내역 다운로드 기능 (관리자용)

## 기술 스택

- **프론트엔드**: React, Next.js, Tailwind CSS
- **UI 컴포넌트**: Radix UI, Shadcn UI
- **상태 관리**: React Hook Form
- **데이터 시각화**: Recharts
- **기타 라이브러리**:
  - QR 코드 생성/스캔: qrcode.react
  - 폼 유효성 검사: Zod
  - 날짜 관리: date-fns

## 시작하기

### 필수 요구사항

- Node.js 18.0 이상
- pnpm

### 설치 방법

1. 저장소 클론
```bash
git clone <저장소 URL>
cd club-attendance
```

2. 의존성 설치
```bash
pnpm install
```

3. 개발 서버 실행
```bash
pnpm dev
```

4. 브라우저에서 `http://localhost:3000`으로 접속

### 빌드 및 배포

```bash
pnpm build
pnpm start
```

## 프로젝트 구조

```
app/                   # Next.js 앱 디렉토리
  attendance/          # 출석 관련 페이지
  clubs/               # 동아리 관련 페이지
  dashboard/           # 대시보드 
  login/               # 로그인 페이지
  signup/              # 회원가입 페이지
  profile/             # 프로필 페이지
  statistics/          # 통계 페이지
components/            # 재사용 가능한 컴포넌트
  ui/                  # UI 컴포넌트
hooks/                 # 커스텀 훅
lib/                   # 유틸리티 함수
public/                # 정적 파일
```

## 라이센스

© 2025 동아리 출석 체크 서비스. All rights reserved.