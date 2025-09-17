"use client"

import { useHistory } from "@/components/sim/history";
import { useStore } from "@/components/sim/useStore";
import { createNewModel } from "@/utils/createNewModel";
import { furnitures as Furniture } from "@prisma/client";
import { useCallback } from "react";
import toast from "react-hot-toast";

export function useHandleItemClick() {
    const {
        cancelPreview,
        startPreviewMode,
        previewMode,
    } = useStore();
    const { addAction } = useHistory();

    const handleItemClick = useCallback(
        (item: Furniture) => {
        // 프리뷰 모드 중이면 기존 프리뷰 취소하고 새 모델로 교체
        if (previewMode) {
            console.log("프리뷰 모드 중 - 모델 교체");
            cancelPreview(); // 기존 프리뷰 취소
        }

        // 즉시 프리뷰용 모델 데이터 생성 (기본 모델 URL 사용)
        const previewModel = createNewModel(item, undefined); // 일단 undefined로 시작
        const modelId = crypto.randomUUID();
        const modelWithId = {
            ...previewModel,
            id: modelId,
            // 원본 아이템 정보 저장 (히스토리용)
            _originalItem: item,
            _addAction: addAction,
        };

        // AbortController 생성
        const abortController = new AbortController();

        // 약간의 딜레이 후 프리뷰 모드 시작 (상태 충돌 방지)
        setTimeout(() => {
            startPreviewMode(modelWithId, abortController);
        }, 10);

        // 백그라운드에서 실제 모델 URL 가져오기
        let loadingToastId: string;
        let shouldShowQuickToast = false;

        // 이미 URL이 있는지 미리 체크
        setTimeout(() => {
            const { currentPreviewFurniture } = useStore.getState();
            if (currentPreviewFurniture?.id === modelId && currentPreviewFurniture.url) {
                shouldShowQuickToast = true;

                toast.success(`${item.name} 모델 로딩 완료`, {
                    position: 'bottom-center'
                });
            } else {
                // URL이 없으면 로딩 토스트 시작
                loadingToastId = toast.loading(`${item.name} 모델 로딩 중...`, {
                    position: 'bottom-center'
                });
            }
        }, 50);

        fetch("/api/model-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ furniture_id: item.furniture_id }),
            signal: abortController.signal, // AbortController 신호 추가
        })
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.model_url) {
                    // 실제 모델 URL을 가져왔으면 업데이트
                    const {
                        setCurrentPreviewFurniture,
                        currentPreviewFurniture,
                        loadedModels,
                        updateModelUrl,
                    } = useStore.getState();

                    // URL이 실제로 변경된 경우에만 업데이트 (null에서 실제 URL로 변경시에만)
                    if (
                        currentPreviewFurniture &&
                        currentPreviewFurniture.id === modelId &&
                        !currentPreviewFurniture.url && // 현재 URL이 null이고
                        result.model_url // 새 URL이 있을 때만
                    ) {
                        const updatedModel = {
                            ...modelWithId,
                            url: result.model_url,
                        };
                        setCurrentPreviewFurniture(updatedModel);

                        // 실제로 URL이 업데이트된 경우 로딩 완료 토스트 표시
                        toast.success(`${item.name} 모델 로딩 완료`, {
                            id: loadingToastId,
                            position: 'bottom-center'
                        });
                    } else {
                        // 이미 배치된 모델이라면 배치된 모델의 URL 업데이트
                        const placedModel = loadedModels.find((m: any) => m.id === modelId);
                        if (placedModel) {
                            updateModelUrl(modelId, result.model_url);
                        }
                        // 이미 URL이 있었던 경우 - 빠른 토스트를 이미 띄웠으면 중복 방지
                        if (!shouldShowQuickToast && loadingToastId) {
                            toast.success(`${item.name} 모델 로딩 완료`, {
                                id: loadingToastId,
                                position: 'bottom-center'
                            });
                        }
                    }
                } else {
                    toast.dismiss(loadingToastId);
                }
            })
            .catch((error) => {
                if (error.name === "AbortError") {
                    console.log("모델 로딩이 취소되었습니다:", error);
                    toast.dismiss(loadingToastId);
                } else {
                    console.log("모델 URL 가져오기 실패, 기본 모델 사용:", error);
                    toast.dismiss(loadingToastId);
                }
            });
        },
        [startPreviewMode, addAction, previewMode, cancelPreview]
    );
    return handleItemClick;
}