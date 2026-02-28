#!/bin/bash
# download_ur10_assets.sh
# UR10 로봇 URDF 렌더링을 위한 3D 메쉬 및 설정 파일을 다운로드합니다.
# 사용법: chmod +x scripts/download_ur10_assets.sh && ./scripts/download_ur10_assets.sh

# 1. 설정
BASE_URL="https://raw.githubusercontent.com/ros-industrial/universal_robot/noetic-devel/ur_description"
PROJECT_ROOT=$(pwd)
OUTPUT_DIR="$PROJECT_ROOT/public/urdf/ur10"

echo "=========================================================="
echo "🤖 UR10 Robot Asset Downloader"
echo "=========================================================="
echo "📍 Target Directory: $OUTPUT_DIR"

# 2. 디렉토리 생성
echo "📁 디렉토리 생성 중..."
mkdir -p "$OUTPUT_DIR/meshes/visual"
mkdir -p "$OUTPUT_DIR/meshes/collision"
mkdir -p "$OUTPUT_DIR/config/ur10"

# 3. Visual 메쉬 (DAE) 다운로드
echo "🔍 Visual 메쉬 (DAE) 다운로드 중 (7개)..."
for mesh in base shoulder upperarm forearm wrist1 wrist2 wrist3; do
  echo "  📥 다운로드: ${mesh}.dae"
  curl -sSL "$BASE_URL/meshes/ur10/visual/${mesh}.dae" \
    -o "$OUTPUT_DIR/meshes/visual/${mesh}.dae"
done

# 4. Collision 메쉬 (STL) 다운로드
echo "🔍 Collision 메쉬 (STL) 다운로드 중 (7개)..."
for mesh in base shoulder upperarm forearm wrist1 wrist2 wrist3; do
  echo "  📥 다운로드: ${mesh}.stl"
  curl -sSL "$BASE_URL/meshes/ur10/collision/${mesh}.stl" \
    -o "$OUTPUT_DIR/meshes/collision/${mesh}.stl"
done

# 5. 설정 파일 (YAML) 다운로드
echo "🔍 설정 파일 (YAML) 다운로드 중 (4개)..."
for cfg in joint_limits.yaml default_kinematics.yaml physical_parameters.yaml visual_parameters.yaml; do
  echo "  📥 다운로드: ${cfg}"
  curl -sSL "$BASE_URL/config/ur10/${cfg}" \
    -o "$OUTPUT_DIR/config/ur10/${cfg}"
done

echo "=========================================================="
echo "✅ 모든 파일 다운로드 및 배치가 완료되었습니다!"
echo "📍 위치: $OUTPUT_DIR"
echo "=========================================================="
