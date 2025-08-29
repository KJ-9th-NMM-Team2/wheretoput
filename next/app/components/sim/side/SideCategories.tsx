const SideCategories = ({collapsed}: {collapsed:boolean}) => {
    const categories = ["가구", "욕실용품", "조명", "데코"];
    // const [active, setActive] = useState("소파");

    return <>
        {/* Categories */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-300">
            <div className="flex gap-2 flex-wrap">
              {/* 나중에 직접 카테고리를 db에서 불러와서 보여줘도 되고 카테고리가 많으니까 그냥 이렇게 고정해도 괜찮을 듯 */}
              {categories.map((cat) => ( 
                <button
                  key={cat}
                  className="flex-1 py-2 text-sm rounded dark:bg-white text-white-800 dark:text-black hover:bg-orange-200 hover:text-white transition"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
    </>
}
export default SideCategories;