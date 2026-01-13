import { useState, useEffect, useRef } from 'react';
import { Search, Download, Link2, Edit, X, ChevronDown } from 'lucide-react';
import { getAllIcons, getAllBanners, IconData, BannerData } from '../utils/sheety';
import IconEditModal from './IconEditModal';

type TabType = 'icons' | 'banners';

export default function ResourceGallery() {
  const [activeTab, setActiveTab] = useState<TabType>('banners');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceFunction, setSelectedServiceFunction] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [icons, setIcons] = useState<IconData[]>([]);
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 배너 탭이 기본이므로 배너 데이터만 먼저 로드
    if (activeTab === 'banners' && !bannersLoaded) {
      loadBanners();
    } else if (activeTab === 'icons' && !iconsLoaded) {
      loadIcons();
    }
  }, [activeTab]);

  const loadBanners = async () => {
    if (loadingBanners || bannersLoaded) return;
    try {
      setLoadingBanners(true);
      const bannersData = await getAllBanners();
      console.log('로드된 배너 데이터:', bannersData);
      setBanners(bannersData);
      setBannersLoaded(true);
    } catch (error) {
      console.error('배너 데이터 로드 실패:', error);
    } finally {
      setLoadingBanners(false);
    }
  };

  const loadIcons = async () => {
    if (loadingIcons || iconsLoaded) return;
    try {
      setLoadingIcons(true);
      const iconsData = await getAllIcons();
      setIcons(iconsData);
      setIconsLoaded(true);
    } catch (error) {
      console.error('아이콘 데이터 로드 실패:', error);
    } finally {
      setLoadingIcons(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 배너의 고유한 serviceFunction 값들 추출
  const getUniqueServiceFunctions = (): string[] => {
    const serviceFunctions = banners
      .map(banner => banner.serviceFunction)
      .filter(sf => sf && sf.trim() !== '');
    return Array.from(new Set(serviceFunctions));
  };

  const uniqueServiceFunctions = getUniqueServiceFunctions();

  // 검색 및 필터링
  const getFilteredItems = () => {
    const items = activeTab === 'icons' ? icons : banners;
    
    let filtered = items.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const tags = item.tags?.toLowerCase() || '';
      
      if (activeTab === 'banners') {
        const banner = item as BannerData;
        const title = banner.title?.toLowerCase() || '';
        const description = banner.description?.toLowerCase() || '';
        return tags.includes(searchLower) || title.includes(searchLower) || description.includes(searchLower);
      } else {
        const icon = item as IconData;
        const englishName = icon.englishName?.toLowerCase() || '';
        return tags.includes(searchLower) || englishName.includes(searchLower);
      }
    });

    // serviceFunction으로 필터링 (배너 탭에서만)
    if (activeTab === 'banners' && selectedServiceFunction !== 'all') {
      filtered = filtered.filter((item) => {
        const banner = item as BannerData;
        return banner.serviceFunction === selectedServiceFunction;
      });
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();

  // 이미지 다운로드
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  // 링크 복사
  const handleCopyLink = (url: string) => {
    // 클립보드 API 대신 전통적인 방법 사용
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      alert('링크가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('링크 복사 실패:', error);
      // 복사 실패 시 URL을 표시
      prompt('링크를 복사하려면 Ctrl+C를 누르세요:', url);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  // 수정 (아이콘만)
  const handleEdit = (item: IconData | BannerData) => {
    if (activeTab === 'icons') {
      setSelectedIcon(item as IconData);
      setIsEditModalOpen(true);
    } else {
      // 배너 수정은 추후 구현
      alert('배너 수정 기능은 준비 중입니다.');
    }
  };

  const handleIconUpdate = (updatedIcon: IconData) => {
    setIcons(icons.map(icon => icon.id === updatedIcon.id ? updatedIcon : icon));
  };

  const handleIconDelete = (iconId: number) => {
    setIcons(icons.filter(icon => icon.id !== iconId));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="p-8 pb-0">
        <h2 className="text-[#2C2C2C] text-[24px] font-bold mb-6">배너 / 아이콘</h2>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-8 pt-0">
          {/* 탭 */}
          <div className="flex gap-2 mb-6 border-b border-[#E8EAED]">
            <button
              onClick={() => setActiveTab('banners')}
              className={`px-6 py-3 text-[15px] font-bold border-b-2 transition-colors ${
                activeTab === 'banners'
                  ? 'border-[#2b77f5] text-[#2b77f5]'
                  : 'border-transparent text-[#666666] hover:text-[#2C2C2C]'
              }`}
            >
              배너
            </button>
            <button
              onClick={() => setActiveTab('icons')}
              className={`px-6 py-3 text-[15px] font-bold border-b-2 transition-colors ${
                activeTab === 'icons'
                  ? 'border-[#2b77f5] text-[#2b77f5]'
                  : 'border-transparent text-[#666666] hover:text-[#2C2C2C]'
              }`}
            >
              아이콘
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex gap-4 mb-6">
            {/* 필터 드롭다운 - 배너 탭에서만 표시 */}
            {activeTab === 'banners' && (
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="px-4 pr-10 py-3 border border-[#E8EAED] rounded-lg focus:outline-none focus:border-[#2b77f5] bg-white text-[#2C2C2C] min-w-[150px] flex items-center justify-between text-left"
                >
                  <span>{selectedServiceFunction === 'all' ? '전체' : selectedServiceFunction}</span>
                </button>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                {showFilterDropdown && (
                  <div
                    className="absolute left-0 top-full mt-1 z-10 min-w-[150px] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden max-h-[300px] overflow-y-auto"
                  >
                    <button
                      onClick={() => {
                        setSelectedServiceFunction('all');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#2b77f5] hover:text-white transition-colors ${
                        selectedServiceFunction === 'all' ? 'bg-[#F0F7FF] text-[#2b77f5]' : 'text-[#2C2C2C]'
                      }`}
                    >
                      전체
                    </button>
                    {uniqueServiceFunctions.map((sf) => (
                      <button
                        key={sf}
                        onClick={() => {
                          setSelectedServiceFunction(sf);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#2b77f5] hover:text-white transition-colors ${
                          selectedServiceFunction === sf ? 'bg-[#F0F7FF] text-[#2b77f5]' : 'text-[#2C2C2C]'
                        }`}
                      >
                        {sf}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 검색바 */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" />
              <input
                type="text"
                placeholder="태그나 설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[#E8EAED] rounded-lg focus:outline-none focus:border-[#2b77f5] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#666666]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* 결과 카운트 */}
          <div className="mb-4">
            <p className="text-[#666666] text-[14px]">
              총 <span className="text-[#2b77f5] font-bold">{filteredItems.length}</span>개의 {activeTab === 'icons' ? '아이콘' : '배너'}
            </p>
          </div>

          {/* 그리드 */}
          {(loadingIcons && activeTab === 'icons') || (loadingBanners && activeTab === 'banners') ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-[#2b77f5] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-[#666666]">데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#999999] text-[16px]">검색 결과가 없습니다.</p>
            </div>
          ) : activeTab === 'icons' ? (
            <div className="grid grid-cols-2 gap-6">
              {(filteredItems as IconData[]).map((icon) => (
                <div
                  key={icon.id}
                  className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden hover:shadow-lg transition-shadow p-4 flex gap-4"
                >
                  {/* 이미지 영역 */}
                  <div className="w-24 h-24 bg-white flex items-center justify-center flex-shrink-0 border border-[#E8EAED] rounded-lg">
                    <img
                      src={icon.cloudinaryUrlWhite}
                      alt={icon.englishName}
                      className="max-w-full max-h-full object-contain p-2"
                      onError={(e) => {
                        console.error('Icon image load error:', icon.cloudinaryUrlWhite);
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E?%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* 정보 영역 */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {icon.tags && icon.tags.split(',').map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#F0F7FF] text-[#2b77f5] text-[12px] rounded"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleDownload(icon.cloudinaryUrlTransparent, `${icon.englishName}.png`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#E8EAED] rounded-lg hover:bg-[#1763E2] hover:text-white hover:border-[#1763E2] transition-colors text-[13px]"
                        title="투명 배경 다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyLink(icon.cloudinaryUrlTransparent)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#E8EAED] rounded-lg hover:bg-[#1763E2] hover:text-white hover:border-[#1763E2] transition-colors text-[13px]"
                        title="링크 복사"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(icon)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#E8EAED] rounded-lg hover:bg-[#1763E2] hover:text-white hover:border-[#1763E2] transition-colors text-[13px]"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {(filteredItems as BannerData[]).map((banner) => (
                <div
                  key={banner.id}
                  className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* 이미지 영역 */}
                  <div className="aspect-[2/1] bg-[#F5F5F7] flex items-center justify-center border-b border-[#E8EAED]">
                    <img
                      src={banner.cloudinaryUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Banner image load error:', banner.cloudinaryUrl);
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f0f0f0" width="400" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E이미지 로드 실패%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* 정보 영역 */}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {banner.tags && banner.tags.split(',').map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#F0F7FF] text-[#2b77f5] text-[12px] rounded"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(banner.cloudinaryUrl, `${banner.title}.png`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#E8EAED] rounded-lg hover:bg-[#1763E2] hover:text-white hover:border-[#1763E2] transition-colors text-[13px]"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyLink(banner.cloudinaryUrl)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#E8EAED] rounded-lg hover:bg-[#1763E2] hover:text-white hover:border-[#1763E2] transition-colors text-[13px]"
                        title="링크 복사"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(banner)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#E8EAED] rounded-lg hover:bg-[#1763E2] hover:text-white hover:border-[#1763E2] transition-colors text-[13px]"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 아이콘 편집 모달 */}
      {selectedIcon && (
        <IconEditModal
          icon={selectedIcon}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedIcon(null);
          }}
          onUpdate={handleIconUpdate}
          onDelete={handleIconDelete}
        />
      )}
    </div>
  );
}