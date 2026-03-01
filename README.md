# Client-side real-time robot monitoring dashboard with 3D digital twin visualization

React, @react-three/fiber, Zustand. Simulated data for scalable, zero-server-cost monitoring (ROS2 integration ready).

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://robot-monitoring-dashboard.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/ssaviour0/robot-monitoring-dashboard.git)

산업용 디지털 트윈 모니터링 시스템의 **클라이언트 중심 고성능 웹 프론트엔드** 구현 프로젝트입니다.  
실무에서 서버 중심 스트리밍 방식의 구조적 한계(고비용 GPU 서버, 확장성 제약, 자원 낭비)를 인지하고, **클라이언트 측 3D 렌더링 + 모의 실시간 데이터** 접근으로 서버 부하를 최소화하고 무제한 확장성을 목표로 개인 R&D했습니다.

(실제 ROS2/WebSocket 연결 시 동일 UI 구조와 대부분의 로직 재사용 가능하도록 설계)

### 데모
🔗 **라이브 데모**: [https://robot-monitoring-dashboard.vercel.app](https://robot-monitoring-dashboard.vercel.app/)  

![메인 대시보드 뷰](docs/screenshots/joint-telemetry-panel.png)
*(메인 3D 캔버스 + 실시간 조인트/텔레메트리 패널)*

### 프로젝트 배경 & 동기
실무 디지털 트윈 프로젝트 경험 중 발견한 핵심 문제점:

1. **인프라 비용 폭증** (High OPEX): 사용자 증가 → 고사양 GPU 서버 운영 비용 급등  
2. **확장성 한계**: 네트워크 대역폭 + 동시 세션 물리적 제한  
3. **자원 낭비**: 단순 read-only 모니터링 사용자에게도 과도한 서버 컴퓨팅 할당  

→ **클라이언트 측 고성능 3D 렌더링** + **추론 기반의 자연스러운 모의 실시간 시뮬레이션**으로 해결  
→ 서버 의존성 최소화 → 비용 절감 + 무한 사용자 확장 가능

### 주요 특징
- **URDF 기반 정밀 3D 렌더링**: `urdf-loader`를 사용하여 UR10 로봇의 URDF를 파싱, 실제 기구학적 구조와 관절 축을 완벽히 재현
- @react-three/fiber + drei 기반 **클라이언트 측 100% 3D 렌더링**
- Zustand로 joint angles, telemetry 등 **실시간 데이터 바인딩**
- **정밀 관절 제어**: URDF 표준에 따른 6축 로봇의 개별 관절(Shoulder, Elbow, Wrist) 실시간 조작 및 시각화
- **고도화된 UI 오버레이**: Three.js Canvas 위에 띄워진 Glassmorphism 기반의 실시간 관절 상태 패널(JointPanel)
- **Vercel 정적 배포** (zero 서버 비용, 글로벌 CDN)
- 실제 ROS2 토픽 스키마 기반 시뮬레이션 → 실 ROS2 연결 시 UI/훅 재사용 용이
- Feature-Sliced Design (FSD) 기반 **확장성 높은 구조**

### 아키텍처 비교 (산업 표준 vs 본 프로젝트)

| 영역             | 산업 표준 (서버 중심)                          | 본 프로젝트 (클라이언트 중심)                          | 비고                              |
|------------------|------------------------------------------------|-------------------------------------------------------|-----------------------------------|
| 씬 정보 제공     | URDF/USD → 실시간 glTF 스트리밍                | **URDF + DAE/STL Meshes** (public/urdf)              | 서버 스트리밍 대신 정적 URDF 구조 |
| 설비 데이터 제공 | ROS2 + WebSocket 실시간 스트리밍               | React + requestAnimationFrame + Math 기반 시뮬레이션   | 실제 토픽 스키마 기반 모델링      |
| 웹 렌더링        | 서버 측 렌더링 + WebRTC/스트리밍               | React 18 + @react-three/fiber + urdf-loader + Zustand | 핵심 구현 영역 (95% 이상)         |

**데이터 흐름**  
`URDF/Mesh 로드` → `Zustand 실시간 데이터 업데이트 (60fps)` → `urdf-loader 관절 업데이트` → `Three.js 렌더링`

### 기술 스택 (2026 기준 최신)
- **Core**: React 18 + TypeScript, Vite 5, @react-three/fiber, urdf-loader, three.js  
- **상태 관리**: Zustand – boilerplate 적고 feature-sliced 구조에 최적  
- **UI**: Material-UI (MUI v5) – 산업용 느낌의 컴포넌트 빠른 구현  
- **시뮬레이션**: requestAnimationFrame + lerp/easing – 부드러운 움직임  
- **배포**: Vercel – 정적 호스팅, Preview, zero-config CI/CD  

### 프로젝트 구조 (Feature-Sliced Design 기반)
```
src/
├── app/                  # 진입점, 글로벌 테마, 레이아웃
├── features/
│   └── robot/            # 메인 기능: 로봇 모니터링
│       ├── components/   # RobotCanvas, JointPanel, ControlToolbar 등
│       ├── hooks/        # useRosBridge, useRobotJoints 등
│       ├── store/        # robotStore.ts (Zustand)
│       ├── services/     # mockRosService.ts (시뮬레이션 엔진)
│       ├── types/        # robot.ts, ros.ts
│       └── utils/        # joint.utils.ts
├── shared/               # 공통 UI 컴포넌트 및 스타일
└── public/
    └── urdf/             # 로봇 모델 정의 및 3D 메쉬 (UR10)
```

### 설치 & 실행 (From Scratch)

```bash
# 1. 클론
git clone https://github.com/ssaviour0/robot-monitoring-dashboard.git
cd robot-monitoring-dashboard

# 2. 의존성 설치
pnpm install

# 3. 로봇 3D 에셋 다운로드 (필수)
# URDF 로딩에 필요한 DAE/STL 메쉬 파일을 공식 리포지토리에서 가져옵니다.
chmod +x scripts/download_ur10_assets.sh
./scripts/download_ur10_assets.sh

# 4. 개발 서버 시작
pnpm dev
```

### 향후 계획 / 확장 포인트

- **실제 ROS2 Bridge 활성화**: `features/robot/services/rosBridge.ts`를 실제 WebSocket 클라이언트로 교체하여 실 설비 데이터 연동
- **멀티 로봇 지원**: UR10 외에 UR3, UR5 등 다양한 로봇 모델 동적 로딩 기능
- **WebXR (AR/VR) 모드**: 모바일/HMD 기기를 통한 몰입형 현장 관제 경험
- **디지털 트윈 데이터 로깅**: 관절 이동 경로 및 텔레메트리 데이터의 타임라인 기록 및 리플레이 기능

### 관련 문서
- [리팩토링 및 고도화 설계서](docs/fix/refactoring-plan.md)
- [로봇 에셋 설정 가이드](docs/guide/robot-asset-setup-guide.md)

### 라이선스
MIT License – 자유롭게 사용/수정/포크 가능 (출처 표기 부탁드려요 🙏)

피드백이나 Pull Request 언제든 환영합니다! 🚀



면접 가이드 내용을 기반으로 답변을 작성해줘.

Q11. 과 Q13. 의 질문 답변이 비슷한거같아. 하나의 질문으로 유도하는게 좋을까?

Q12. 폐쇄망 환경에서 이루어지는 작업이라는 점을 인지하고 다시 답변 작성해줘. 

Q16.  도메인은 회사에서 보내는 사업장에 따라 달라지는거지 내 의지가 아니잖아..

전체적으로 면접 가이드 내용을 검토해보자.


