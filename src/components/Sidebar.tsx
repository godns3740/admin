import { FileUp, FolderOpen } from 'lucide-react';

interface SidebarProps {
  currentMenu: 'register' | 'list';
  onMenuChange: (menu: 'register' | 'list') => void;
}

export default function Sidebar({ currentMenu, onMenuChange }: SidebarProps) {
  const menuItems = [
    {
      id: 'register' as const,
      label: '리소스 등록',
      icon: FileUp,
    },
    {
      id: 'list' as const,
      label: '등록된 디자인',
      icon: FolderOpen,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-gray-900">병원 리소스 관리</h1>
      </div>
      <nav className="px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
