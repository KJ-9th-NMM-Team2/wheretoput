import { ChevronLeft, ChevronRight } from "lucide-react"

// React 컴포넌트는 반드시 props 객체 하나만 받아야 하기 때문에 interface로 정의
interface SideTitleProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideTitle = ({ collapsed, setCollapsed} : SideTitleProps) => {
    return <>
        {/* Logo & Toggle */}
        <div className="flex-shrink-0"> {/* 크기 고정 */}
          <div className="flex items-center justify-between p-4 ">
            {!collapsed && <span className="text-lg font-bold">어따놀래</span>}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded hover:bg-gray-700"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>
    </>
}

export default SideTitle;