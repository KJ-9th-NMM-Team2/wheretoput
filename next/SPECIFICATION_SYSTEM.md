# 3D 규격 정보 표시 시스템

이 문서는 React Three Fiber를 사용한 3D 인테리어 시뮬레이터에 추가된 규격 정보 표시 시스템에 대해 설명합니다.

## 개요

이 시스템은 다음과 같은 문제들을 해결합니다:
- 3D 공간에서 벽과 가구의 규격 정보 표시
- 2D 도면에서 3D 공간으로의 치수 정보 변환
- 화면 혼잡을 방지하기 위한 토글 기능
- 정확한 치수 환산 및 표시

## 주요 컴포넌트

### 1. WallSpecification 컴포넌트
벽의 규격 정보를 3D 공간에 표시합니다.

**표시 정보:**
- 벽 길이 (미터/센티미터/밀리미터 자동 단위 선택)
- 벽 높이
- 벽 두께

**사용 예시:**
```jsx
<WallSpecification
  position={[0, 2.5, 0]}
  rotation={[0, 0, 0]}
  dimensions={{ width: 3.5, height: 2.5, depth: 0.1 }}
  wallId="wall-1"
  isVisible={true}
/>
```

### 2. FurnitureSpecification 컴포넌트
가구의 규격 정보를 3D 공간에 표시합니다.

**표시 정보:**
- 가구 이름
- 크기 (폭×높이×깊이)
- 부피 (선택된 가구만)
- 위치 좌표 (선택된 가구만)

**사용 예시:**
```jsx
<FurnitureSpecification
  position={[1, 0.5, 1]}
  rotation={[0, 0, 0]}
  scale={[1, 1, 1]}
  length={[800, 750, 600]} // mm 단위
  modelId="furniture-1"
  name="책상"
  isVisible={true}
/>
```

### 3. FurnitureDimensionLines 컴포넌트
선택된 가구에 대해 상세한 치수선을 표시합니다.

**기능:**
- X축 (폭) 치수선 - 주황색
- Y축 (높이) 치수선 - 파란색  
- Z축 (깊이) 치수선 - 초록색
- 각 축의 실제 치수 표시

### 4. SpecificationToggle 컴포넌트
규격 정보 표시를 켜고 끌 수 있는 UI 컨트롤입니다.

**기능:**
- 버튼 클릭으로 규격 정보 표시/숨김 전환
- 현재 상태를 시각적으로 표시
- 툴팁으로 기능 설명 제공

## 유틸리티 함수 (dimensionUtils.ts)

### 2D-3D 변환 함수
```typescript
// 2D 벽 데이터를 3D로 변환
convertWall2Dto3D(wall2D: Wall2D, pixelToMmRatio: number): Wall3D

// 3D 벽 데이터를 2D로 변환  
convertWall3Dto2D(wall3D: Wall3D, pixelToMmRatio: number): Wall2D
```

### 치수 계산 함수
```typescript
// 벽의 실제 치수 계산
calculateWallDimensions(wallData: Wall3D): WallDimensions

// 가구의 실제 치수 계산
calculateFurnitureDimensions(scale: number[], length: number[]): FurnitureDimensions
```

### 형식화 함수
```typescript
// 치수를 적절한 단위로 포맷팅 (mm/cm/m 자동 선택)
formatDimension(meters: number, precision?: number): string
```

### 스냅핑 함수
```typescript
// 벽 근처 스냅 포인트 확인
checkWallSnap(point: Point3D, wall: Wall3D, tolerance?: number): SnapInfo | null
```

## 사용 방법

### 1. 규격 정보 표시 활성화
UI 상단의 규격 정보 버튼을 클릭하거나, 스토어에서 직접 설정:

```javascript
const { setShowSpecifications } = useStore();
setShowSpecifications(true);
```

### 2. 벽에 규격 정보 추가
기존 Wall 컴포넌트에 자동으로 포함되어 있습니다.

### 3. 가구에 규격 정보 추가
기존 DraggableModel 컴포넌트에 자동으로 포함되어 있습니다.

### 4. 2D 도면 데이터 변환
```typescript
import { convertWall2Dto3D } from '@/utils/dimensionUtils';

const wall2D = {
  start: { x: 100, y: 100 },
  end: { x: 500, y: 100 }
};

const wall3D = convertWall2Dto3D(wall2D, 1000); // 1000mm/m 비율
```

## 상태 관리

규격 정보 표시 상태는 Zustand 스토어의 `uiSlice`에서 관리됩니다:

```javascript
// 상태
showSpecifications: false

// 액션
setShowSpecifications: (value) => set({ showSpecifications: value })
```

## 특징

### 1. 적응형 단위 표시
- 10mm 미만: mm 단위
- 1m 미만: cm 단위  
- 1m 이상: m 단위

### 2. 성능 최적화
- 규격 정보가 비활성화되면 렌더링하지 않음
- 카메라 시점에 따라 텍스트 회전 자동 조정

### 3. 사용자 경험
- 선택된 가구에 대해서만 상세 정보 표시
- 배경 평면으로 가독성 향상
- 색상 코딩으로 정보 구분

### 4. 화면 혼잡 방지
- 토글 기능으로 필요할 때만 표시
- 계층적 정보 표시 (기본 정보 → 상세 정보)
- 선택 상태에 따른 조건부 표시

## 기술적 세부사항

### 타입 정의
```typescript
interface Wall3D {
  position: Point3D;
  rotation: Point3D;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  endpoints?: {
    start: Point3D;
    end: Point3D;
  };
}

interface FurnitureDimensions {
  width: number;
  height: number;
  depth: number;
  volume: number;
}
```

### 렌더링 최적화
- Suspense 경계로 비동기 로딩 처리
- useEffect로 카메라 추적 최적화
- 조건부 렌더링으로 불필요한 계산 방지

## 향후 개선 계획

1. **다국어 지원**: 단위 표시 및 라벨 다국어화
2. **커스터마이징**: 색상, 크기, 위치 사용자 정의
3. **측정 도구**: 임의 두 점 간 거리 측정 기능
4. **내보내기**: 규격 정보가 포함된 도면 내보내기
5. **정밀도 설정**: 사용자가 표시 정밀도 조정 가능

## 문제 해결

### 규격 정보가 표시되지 않을 때
1. `showSpecifications` 상태 확인
2. 컴포넌트의 `isVisible` prop 확인
3. 브라우저 콘솔에서 오류 메시지 확인

### 텍스트가 회전하지 않을 때
1. `@react-three/drei`의 Text 컴포넌트 버전 확인
2. useEffect의 camera 의존성 확인

### 치수가 부정확할 때
1. 스케일 값 확인
2. 2D-3D 변환 시 pixelToMmRatio 확인
3. 원본 가구 치수 데이터 확인