import { Outlet, Link, useLocation } from 'react-router';
import { FileEdit, FolderOpen, ImagePlus, Image, CreditCard, Bell, Folder, Images, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isSheetyAvailable } from '../utils/sheety';

export default function Layout() {
  const location = useLocation();
  const [showSheetyWarning, setShowSheetyWarning] = useState(false);
  
  useEffect(() => {
    // Sheety API 상태 확인
    const apiAvailable = isSheetyAvailable();
    setShowSheetyWarning(!apiAvailable);
  }, [location.pathname]);
  
  const isActive = (path: string) => {
    if (path === '/register') {
      return location.pathname === '/' || location.pathname === '/register';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* LNB */}
      <aside className="w-64 bg-[#F5F5F7] border-r border-[#E8EAED]">
        <div className="p-6">
          <h1 className="text-[#2C2C2C] font-bold text-[20px]">디자인 리소스 관리</h1>
        </div>
        
        {/* Sheety API 경고 배너 */}
        {showSheetyWarning && (
          <div className="mx-3 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="text-amber-900 font-semibold mb-1">로컬 백업 모드</p>
                <p className="text-amber-700 leading-relaxed">
                  Sheety API 할당량 초과로 로컬 저장소를 사용 중입니다. 
                  기존 데이터는 조회 가능하지만 새 데이터 저장은 제한됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="px-3">
          {/* 오픈준비/환자카드 그룹 */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[rgb(151,156,159)] text-[13px] font-bold">오픈 준비</p>
          </div>
          <Link
            to="/register"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive('/register')
                ? 'text-[#2b77f5]'
                : 'text-[#666666] hover:bg-gray-200'
            }`}
          >
            <FileEdit className="w-5 h-5" />
            <span className="font-bold">병원별 리소스 등록</span>
          </Link>
          <Link
            to="/notice-register"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive('/notice-register')
                ? 'text-[#2b77f5]'
                : 'text-[#666666] hover:bg-gray-200'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-bold">공지 이미지 등록</span>
          </Link>

          {/* 배너 만들기 그룹 */}
          <div className="px-4 pt-8 pb-2">
            <p className="text-[rgb(151,156,159)] text-[13px] font-bold">배너 만들기</p>
          </div>
          <Link
            to="/icon-register"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive('/icon-register')
                ? 'text-[#2b77f5]'
                : 'text-[#666666] hover:bg-gray-200'
            }`}
          >
            <ImagePlus className="w-5 h-5" />
            <span className="font-bold">아이콘 등록</span>
          </Link>
          <Link
            to="/banner-register"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive('/banner-register')
                ? 'text-[#2b77f5]'
                : 'text-[#666666] hover:bg-gray-200'
            }`}
          >
            <Image className="w-5 h-5" />
            <span className="font-bold">배너 등록</span>
          </Link>

          {/* 완료 그룹 */}
          <div className="px-4 pt-8 pb-2">
            <p className="text-[rgb(151,156,159)] text-[13px] font-bold">등록 완료</p>
          </div>
          <Link
            to="/patient-cards"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive('/patient-cards')
                ? 'text-[#2b77f5]'
                : 'text-[#666666] hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-bold">환자카드</span>
          </Link>
          <Link
            to="/hospital-channels"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive('/hospital-channels')
                ? 'text-[#2b77f5]'
                : 'text-[#666666] hover:bg-gray-200'
            }`}
          >
            <Folder className="w-5 h-5" />
            <span className="font-bold">병원별 이미지</span>
          </Link>
          <Link
            to="/resource-gallery"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive('/resource-gallery')
                ? 'text-[#2b77f5]'
                : 'text-[#666666] hover:bg-gray-200'
            }`}
          >
            <Images className="w-5 h-5" />
            <span className="font-bold">배너 / 아이콘</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}