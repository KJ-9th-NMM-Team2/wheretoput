# Sim History System

Archisketch와 같은 히스토리 기능을 구현한 append 모델 기반 시스템입니다.

## 구조

- **types.ts**: 히스토리 관련 타입 정의
- **HistoryManager.tsx**: Context Provider와 히스토리 관리 로직
- **HistoryControls.tsx**: Undo/Redo 버튼 컴포넌트
- **HistoryPanel.tsx**: 히스토리 목록 표시 패널
- **useHistoryKeyboard.ts**: 키보드 단축키 훅 (Ctrl+Z, Ctrl+Y)

## 사용법

### 1. Provider로 앱 감싸기

```tsx
import { HistoryProvider } from '@/components/sim/history';

function App() {
  return (
    <HistoryProvider>
      <YourComponents />
    </HistoryProvider>
  );
}
```

### 2. 히스토리 훅 사용

```tsx
import { useHistory, ActionType } from '@/components/sim/history';

function YourComponent() {
  const { addAction, undo, redo, canUndo, canRedo } = useHistory();

  const handleSomeAction = () => {
    // 실제 작업 수행
    doSomething();
    
    // 히스토리에 추가
    addAction({
      type: ActionType.FURNITURE_ADD,
      data: { furnitureId: '123', position: { x: 0, y: 0, z: 0 } },
      description: '의자를 추가했습니다'
    });
  };
}
```

### 3. UI 컴포넌트 사용

```tsx
import { HistoryControls, HistoryPanel, useHistoryKeyboard } from '@/components/sim/history';

function YourComponent() {
  useHistoryKeyboard(); // 키보드 단축키 활성화
  
  return (
    <div>
      <HistoryControls />
      <HistoryPanel />
    </div>
  );
}
```

## 액션 타입

- `FURNITURE_ADD`: 가구 추가
- `FURNITURE_REMOVE`: 가구 제거  
- `FURNITURE_MOVE`: 가구 이동
- `FURNITURE_ROTATE`: 가구 회전
- `FURNITURE_SCALE`: 가구 크기 변경

## 키보드 단축키

- **Ctrl+Z (Cmd+Z)**: Undo
- **Ctrl+Y (Cmd+Shift+Z)**: Redo

## Append 모델 특징

- 모든 액션이 순차적으로 저장됨
- Undo 시 인덱스만 변경, 데이터 삭제 안함
- Redo 가능
- 새 액션 추가 시 현재 위치 이후 기록 삭제