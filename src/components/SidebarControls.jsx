export default function SidebarControls({ collapsed, onToggleCollapse }) {
  return (
    <div className="collapse-rail">
      <button className="rail-btn" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggleCollapse}>
        {collapsed ? '»' : '«'}
      </button>
    </div>
  )
}
