import { File, Menu, PieChart, User, Users } from "lucide-react";

const menuItems = [ // 여기에는 진짜 가구 data가 들어가면 좋겠고
    { key: "1", label: "Option 1", icon: <PieChart size={20} /> },
    { key: "2", label: "Option 2", icon: <Menu size={20} /> },
    {
      key: "sub1",
      label: "User",
      icon: <User size={20} />,
      children: ["Tom", "Bill", "Alex"],
    },
    {
      key: "sub2",
      label: "Team",
      icon: <Users size={20} />,
      children: ["Team 1", "Team 2"],
    },
    { key: "9", label: "Files", icon: <File size={20} /> },
  ];

const SideMenu = ({ collapsed } :{ collapsed:boolean }) => {
    return <>
        {/* Menu */}
        <nav className="flex-1 mt-2">
          {menuItems.map((item) => (
            <div key={item.key} className="px-2">
              <button className="w-full flex items-center gap-2 p-2 rounded hover:bg-orange-200 text-left">
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
              {/* Submenu */}
              {!collapsed && item.children && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child, i) => (
                    <div
                      key={i}
                      className="text-gray-300 hover:text-white cursor-pointer text-sm"
                    >
                      {child}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
    </>
}

export default SideMenu