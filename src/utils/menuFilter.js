// utils/menuFilter.js
export function filterMenusByRole(menus, userRole) {
  return menus
    .filter((item) => {
      return !item.roles || item.roles.includes(userRole)
    })
    .map((item) => {
      const newItem = { ...item }
      if (item.children) {
        newItem.children = filterMenusByRole(item.children, userRole)
      }
      return newItem
    })
    .filter((item) => {
      // 若有 children 結果為空，且沒有 path，就不顯示
      if (item.children && item.children.length === 0 && !item.path) {
        return false
      }
      return true
    })
}
