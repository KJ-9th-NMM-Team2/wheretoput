import React, { useState } from "react";

import { FaCameraRetro, FaPalette, FaShareAlt } from "react-icons/fa";
import { MdSunny, MdHelp } from "react-icons/md";
import { TbScreenshot } from "react-icons/tb";

export function HelpPopup() {
  const [index, setIndex] = useState(0);

  const helpContents = [
    // 시뮬레이터 기본 조작 설명
    <div>
      <p className="text-xl font-semibold mb-3">시뮬레이터 기본 조작</p>
      <p className="text-lg font-semibold mb-1">키보드</p>
      <p>wasd - 카메라 전후좌우 이동</p>
      <p className="mb-3">q e - 카메라 상승/하강 이동</p>
      <p className="text-lg font-semibold mb-1">마우스 (가구 미 선택시)</p>
      <p>좌클릭 후 드래그 - 시점 시준 회전</p>
      <p>우클릭 후 드래그 - 시점 기준 평행이동</p>
      <p className="mb-3">마우스휠 - 확대/축소</p>
      <p className="text-lg font-semibold mb-1">마우스 (가구 선택시)</p>
      <p>클릭 후 드래그 - 가구 이동</p>
      <p>shift + 클릭 후 드래그 - 가구 확대/축소</p>
      <p>가구 이외의 곳을 클릭해서 가구 선택 해제</p>
    </div>,

    // 시뮬레이터 모드 설명
    <div>
      <p className="text-xl font-semibold mb-3">시뮬레이터 모드</p>
      <p className="text-lg font-semibold mb-1 text-[#22C55E]">보기</p>
      <p>방의 편집이 불가능합니다.</p>
      <p className="mb-3">카메라 이동으로 방을 둘러보세요.</p>
      <p className="text-lg font-semibold mb-1 text-[#3B82F6]">편집</p>
      <p>가구 배치 등 모든 편집 기능이 있습니다.</p>
      <p className="mb-3">우상단 저장 버튼으로 저장할 수 있습니다.</p>
      <p className="text-lg font-semibold mb-1 text-[#F59E0B]">협업</p>
      <p>다른 사용자와 함께 방을 편집할 수 있습니다.</p>
      <p>방의 소유자가 협업모드를 활성화했다면 다른 사용자가 협업모드에 참여할 수 있습니다.</p>
    </div>,

    // 기능 아이콘 설명
    <div>
      <p className="text-xl font-semibold mb-3">기능 아이콘</p>
      <div className="flex items-center text-lg font-semibold"><FaShareAlt className="mr-1" /> 공유하기</div>
      <p className="mb-2">링크를 다른 사용자와 공유</p>
      <div className="flex items-center text-lg font-semibold"><TbScreenshot className="mr-1" /> 화면 캡처</div>
      <p className="mb-2">현재 시뮬레이션 화면 캡처 다운로드</p>
      <div className="flex items-center text-lg font-semibold"><FaPalette className="mr-1" /> 색상 세팅</div>
      <p className="mb-2">벽 / 바닥 / 배경 색상 변경</p>
      <div className="flex items-center text-lg font-semibold"><FaCameraRetro className="mr-1" /> 카메라 세팅</div>
      <p className="mb-2">벽 투명화, 자석 on/off 설정 | 시야각 조정 | 카메라 위치 리셋</p>
      <div className="flex items-center text-lg font-semibold"><MdSunny className="mr-1" /> 빛 세팅</div>
      <p className="mb-2">조명 프리셋 변경 | 햇빛 위치 및 세기 조정</p>
    </div>,
  ];

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(helpContents.length - 1, i + 1));

  return (
    <div
      className="relative bg-black rounded-lg shadow-xl text-white"
      onClick={(e) => e.stopPropagation()}
    >
      {/* header */}
      <div className="flex items-center justify-between px-1 py-2 border-b">
        <div className="flex items-center text-xl font-semibold"><MdHelp className="mr-1" /> 도움말</div>
        <div className="flex items-center gap-2 text-sm">
          {index + 1} / {helpContents.length}
        </div>
      </div>

      {/* content */}
      <div className="px-4 py-3 overflow-auto break-keep" style={{ height: 400 }} >
        {helpContents[index]}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-1 py-2 border-t">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className={`px-3 py-1 rounded text-sm cursor-pointer ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-400'}`}
          >
            이전
          </button>

          <button
            onClick={goNext}
            disabled={index === helpContents.length - 1}
            className={`px-3 py-1 rounded text-sm cursor-pointer ${index === helpContents.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-400'}`}
          >
            다음
          </button>
        </div>

        <div className="flex items-center gap-1">
          {helpContents.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`페이지 ${i + 1}`}
              className={`w-2 h-2 rounded-full ${i === index ? 'bg-gray-200' : 'bg-gray-500'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
