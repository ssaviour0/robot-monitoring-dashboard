# 로봇 에셋 설정 가이드 (Asset Setup Guide)

이 가이드는 새로운 로봇 모델(URDF 및 3D 메쉬)을 프로젝트에 추가하거나 업데이트할 때 따르는 표준 절차를 정의합니다.

---

## 1. 디렉토리 구조 표준

로봇 에셋은 `public/urdf/[robot_model]/` 하위에 논리적으로 구분되어야 합니다.

```text
public/urdf/[robot_model]/
├── [robot_model].urdf        # 로봇 기구학 정의 파일 (XML)
├── config/                   # 관절 한계, 물리 파라미터 등 설정
│   └── [robot_model]/
│       ├── joint_limits.yaml
│       └── ...
└── meshes/                   # 3D 모델 파일
    ├── visual/               # 시각화용 (DAE 또는 OBJ 권장)
    └── collision/            # 충돌 검사용 (STL 등 저폴리곤 권장)
```

---

## 2. 에셋 수집 및 변환 (Checklist)

### 2.1 URDF 파일 확보
- ROS 패키지의 `.xacro` 파일은 브라우저에서 읽을 수 없습니다.
- 반드시 `xacro` 명령어를 통해 순수 `.urdf` (XML) 파일로 변환하여 준비해야 합니다.

### 2.2 메쉬 파일 최적화
- **Visual**: 리얼한 외관을 위해 `.dae` (Collada) 형식을 권장합니다.
- **Collision**: 물리 연산 최적화를 위해 매우 단순한 형태의 `.stl` 파일을 사용합니다.
- **파일 크기**: 전체 로봇 에셋 합계가 10MB를 넘지 않도록 텍스처와 폴리곤을 관리합니다.

---

## 3. 자동화 스크립트 작성 패턴

새로운 로봇을 추가할 때 재사용 가능한 배포 스크립트 (`.sh`) 패턴입니다.

### 스크립트 템플릿 (`scripts/download_[model]_assets.sh`)

```bash
#!/bin/bash
# 1. 경로 설정
BASE_URL="[원본 저장소 URL]"
MODEL_NAME="[로봇 모델명]"
OUTPUT_DIR="public/urdf/$MODEL_NAME"

# 2. 구조 생성
mkdir -p "$OUTPUT_DIR/meshes/visual"
mkdir -p "$OUTPUT_DIR/meshes/collision"
mkdir -p "$OUTPUT_DIR/config/$MODEL_NAME"

# 3. 파일 다운로드 루프
echo "📥 $MODEL_NAME 에셋 다운로드 시작..."

# 예: Visual 메쉬 다운로드
for file in base shoulder; do
  curl -sSL "$BASE_URL/meshes/$MODEL_NAME/visual/${file}.dae" -o "$OUTPUT_DIR/meshes/visual/${file}.dae"
done

# ... 생략 ...

echo "✅ 완료: $OUTPUT_DIR"
```

---

## 4. URDFLoader 경로 매핑 규칙

URDF 파일 내부의 `package://[package_name]/` 경로를 웹 서버 경로로 변환하는 로직이 필요합니다.

```typescript
const loader = new URDFLoader();

// 패키지 루트 매핑
loader.packages = { 
    '[package_name]': '/urdf/[robot_model]' 
};

// 중복 폴더 구조 해결 (필요시)
loader.urlModifierFunc = (url: string) => {
    // 예: 'meshes/ur10/visual' -> 'meshes/visual'
    return url.replace('/meshes/[robot_model]/', '/meshes/');
};
```

---

## 5. 관리 주의사항

1. **대소문자 구분**: Linux/macOS 서버 환경에서는 파일명 대소문자를 엄격히 구분하므로 URDF 내 경로와 실제 파일명을 일치시켜야 합니다.
2. **라이선스 확인**: ROS 산업용 로봇 모델은 대부분 BSD-3 라이선스를 따르지만, 제조사별 특수 모델은 라이선스 확인이 필요합니다.
3. **버전 관리**: 큰 용량의 메쉬 파일은 `git LFS` 사용을 고려하거나 외부 에셋 서버에서 동적 로딩하도록 설계합니다.
