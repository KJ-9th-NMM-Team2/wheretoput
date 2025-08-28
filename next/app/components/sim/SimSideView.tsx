'use client';// 클라이언트 컴포넌트라는 것을 명시 // 이거 안하면 렌더링 안됨

import React, { useState } from "react";
import SideTitle from './side/SideTitle';
import SideSearch from './side/SideSearch';
import SideCategories from './side/SideCategories';
import SideMenu from "./side/SideMenu";

const SimSideView: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`${
          // 접힙: 펼침
          collapsed ? "w-[5%]" : "w-[22%]" 
        } bg-white text-black transition-all duration-300 flex flex-col`}
      >

        <SideTitle collapsed={collapsed} setCollapsed={setCollapsed}></SideTitle>
        <SideSearch collapsed={collapsed}></SideSearch>
        <SideCategories collapsed={collapsed}></SideCategories>
        <SideMenu collapsed={collapsed}></SideMenu>
      </div>

      {/* 나중에 수연님 화면으로 대체될 놈 */}
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-gray-100 flex items-center px-4 shadow">
          <h1 className="text-lg font-semibold">Header</h1>
        </header>
        <main className="flex-1 p-6 bg-gray-50">
          <div className="bg-white p-6 rounded-lg shadow">
            Bill is a cat.
          </div>
        </main>
        <footer className="h-12 flex items-center justify-center bg-gray-100 text-sm text-gray-500">
          Tailwind Layout ©{new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};

export default SimSideView;