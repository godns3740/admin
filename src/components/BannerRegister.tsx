import { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Search, AlertTriangle, Trash2 } from 'lucide-react';
import { getAllIcons, IconData, saveBannerToSheet, getAllBanners, BannerData, deleteBannerFromSheet } from '../utils/sheety';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary';
import BannerPreview from './BannerPreview';

export default function BannerRegister() {
  const [serviceFunction, setServiceFunction] = useState('');
  const [serviceFunctionSuggestions, setServiceFunctionSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedIconId, setSelectedIconId] = useState('');
  const [icons, setIcons] = useState<IconData[]>([]);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [bannerDataUrl, setBannerDataUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [existingBanner, setExistingBanner] = useState<BannerData | null>(null);
  const [allBanners, setAllBanners] = useState<BannerData[]>([]);

  useEffect(() => {
    loadIcons();
    loadServiceFunctions();
  }, []);

  const loadIcons = async () => {
    const loadedIcons = await getAllIcons();
    setIcons(loadedIcons);
  };

  const loadServiceFunctions = async () => {
    const banners = await getAllBanners();
    // 중복 제거하고 serviceFunction만 추출
    const uniqueFunctions = [...new Set(banners.map(b => b.serviceFunction))].filter(f => f);
    setServiceFunctionSuggestions(uniqueFunctions);
    setAllBanners(banners);
  };

  // 중복 배너 체크
  useEffect(() => {
    if (serviceFunction && title) {
      const existing = allBanners.find(
        banner => banner.serviceFunction === serviceFunction && banner.title === title
      );
      setExistingBanner(existing || null);
    } else {
      setExistingBanner(null);
    }
  }, [serviceFunction, title, allBanners]);

  const handleServiceFunctionChange = (value: string) => {
    setServiceFunction(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setServiceFunction(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceFunction || !title || !selectedIconId) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (!bannerDataUrl) {
      alert('배너 이미지 생성 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      setIsUploading(true);

      const selectedIcon = icons.find(icon => icon.id?.toString() === selectedIconId);
      if (!selectedIcon) {
        alert('아이콘을 찾을 수 없습니다.');
        return;
      }

      // 기존 배너가 있다면 삭제 (덮어쓰기)
      if (existingBanner && existingBanner.id) {
        await deleteBannerFromSheet(existingBanner.id);
        if (existingBanner.publicId) {
          await deleteFromCloudinary(existingBanner.publicId);
        }
      }

      // 배너 이미지를 Cloudinary에 업로드
      const timestamp = Date.now();
      const bannerPublicId = `banner_${serviceFunction.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      const bannerCloudinaryUrl = await uploadToCloudinary(
        bannerDataUrl,
        bannerPublicId,
        [serviceFunction, 'banner']
      );

      // Google Sheets에 저장
      const bannerData: BannerData = {
        serviceFunction,
        title,
        tags: serviceFunction,
        iconPublicId: selectedIcon.publicIdTransparent,
        iconCloudinaryUrl: selectedIcon.cloudinaryUrlTransparent,
        cloudinaryUrl: bannerCloudinaryUrl,
        publicId: bannerPublicId,
        createdAt: new Date().toISOString(),
      };

      await saveBannerToSheet(bannerData);

      alert('배너가 성공적으로 등록되었습니다!');
      
      // 폼 초기화하지 않고 목록만 새로고침 (선택 상태 유지)
      await loadServiceFunctions();
    } catch (error) {
      console.error('배너 등록 실패:', error);
      alert('배너 등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredIcons = icons.filter(icon => {
    if (!iconSearchQuery.trim()) return true;
    const query = iconSearchQuery.toLowerCase();
    const tags = icon.tags?.toLowerCase() || '';
    const name = icon.englishName?.toLowerCase() || '';
    return tags.includes(query) || name.includes(query);
  });

  // 선택된 기능에 등록된 배너 필터링
  const registeredBanners = serviceFunction
    ? allBanners.filter(banner => banner.serviceFunction === serviceFunction)
    : [];

  // 배너 삭제 핸들러
  const handleDeleteBanner = async (banner: BannerData) => {
    if (!confirm(`"${banner.title}" 배너를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // Cloudinary에서 삭제
      if (banner.publicId) {
        await deleteFromCloudinary(banner.publicId);
      }

      // Google Sheets에서 삭제
      if (banner.id) {
        await deleteBannerFromSheet(banner.id);
      }

      alert('배너가 성공적으로 삭제되었습니다.');
      
      // 목록 새로고침
      await loadServiceFunctions();
    } catch (error) {
      console.error('배너 삭제 실패:', error);
      alert('배너 삭제 중 오류가 발생했습니다.');
    }
  };

  const selectedIcon = icons.find(icon => icon.id?.toString() === selectedIconId);

  const filteredSuggestions = serviceFunctionSuggestions.filter(s =>
    s.toLowerCase().includes(serviceFunction.toLowerCase())
  );

  return (
    <div className="p-8">
      <h2 className="text-[#2C2C2C] mb-8 text-[24px] font-bold tracking-[0.0703px]">
        배너 생성 및 등록
      </h2>

      <form onSubmit={handleSubmit}>
        {/* 상단 영역: 입력 + 미리보기 */}
        <div className="flex gap-8 mb-6">
          {/* 왼쪽: 입력 필드 */}
          <div className="flex-1 bg-white border border-[#E8EAED] rounded-lg p-6 shadow-sm">
            {/* 서비스/기능 */}
            <div className="mb-6">
              <label className="block text-[#2C2C2C] mb-2 text-[16px] tracking-[-0.3125px]">
                서비스/기능<span className="text-[#FB2C36] ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceFunction}
                  onChange={(e) => handleServiceFunctionChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="진료 예약"
                  className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-[16px] tracking-[-0.3125px] text-[#2C2C2C] placeholder:text-[rgba(44,44,44,0.5)] focus:outline-none focus:border-[#2B77F5]"
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#E0E0E0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full px-4 py-2 text-left text-[#2C2C2C] hover:bg-[#F5F5F7] text-[14px]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[#999999] mt-2 text-[14px] tracking-[-0.1504px]">
                새로운 서비스/기능명을 입력하거나 기존 항목을 선택하세요
              </p>
            </div>

            {/* 배너 타이틀 */}
            <div>
              <label className="block text-[#2C2C2C] mb-2 text-[16px] tracking-[-0.3125px]">
                배너 타이틀<span className="text-[#FB2C36] ml-1">*</span>
              </label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="배너에 들어갈 텍스트를 입력하세요"
                className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-[16px] tracking-[-0.3125px] text-[#2C2C2C] placeholder:text-[rgba(44,44,44,0.5)] focus:outline-none focus:border-[#2B77F5] resize-none h-[120px]"
              />
              <p className="text-[#999999] mt-2 text-[14px] tracking-[-0.1504px]">
                520x240 영역에 표시됩니다. 자동으로 줄바꿈됩니다.
              </p>
            </div>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="w-[450px] bg-white border border-[#E8EAED] rounded-lg p-6 shadow-sm relative">
            <h3 className="text-[#2C2C2C] mb-4 text-[16px] tracking-[-0.3125px]">
              미리보기 (800x400)
            </h3>
            <div className="bg-[#FAFAFA] rounded-lg h-[200px] flex items-center justify-center mb-4">
              {selectedIcon && title ? (
                <BannerPreview
                  title={title}
                  iconImage={selectedIcon.cloudinaryUrlTransparent}
                  onBannerGenerated={(dataUrl) => setBannerDataUrl(dataUrl)}
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-[#999999] opacity-50 mx-auto mb-2" />
                  <p className="text-[#999999] text-[16px] tracking-[-0.3125px]">
                    타이틀과 아이콘을 입력하면
                  </p>
                  <p className="text-[#999999] text-[16px] tracking-[-0.3125px]">
                    미리보기가 표시됩니다
                  </p>
                </div>
              )}
            </div>

            {/* 등록 버튼 */}
            <button
              type="submit"
              disabled={isUploading || !bannerDataUrl}
              className="absolute bottom-6 right-6 bg-[#2B77F5] text-white px-6 py-3 rounded-lg hover:bg-[#1763E2] transition-colors disabled:bg-[#CCCCCC] disabled:cursor-not-allowed flex items-center gap-2 text-[16px] tracking-[-0.3125px] font-medium"
            >
              <Save className="w-5 h-5" />
              {isUploading ? '등록 중...' : '배너 등록하기'}
            </button>

            {/* 중복 배너 경고 */}
            {existingBanner && (
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-[#FFF3CD] border border-[#FFE69C] px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-[#856404]" />
                <span className="text-[#856404] text-sm">동일한 배너가 이미 존재합니다 (덮어쓰기)</span>
              </div>
            )}
          </div>
        </div>

        {/* 아이콘 선택 */}
        <div className="bg-white border border-[#E8EAED] rounded-lg p-6 shadow-sm mb-12">
          <h3 className="text-[#2C2C2C] mb-4 text-[16px] tracking-[-0.3125px]">아이콘 선택</h3>
          
          {/* 검색 */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              type="text"
              value={iconSearchQuery}
              onChange={(e) => setIconSearchQuery(e.target.value)}
              placeholder="태그로 검색"
              className="w-full pl-10 pr-4 py-2.5 border border-[#E0E0E0] rounded-lg text-[16px] tracking-[-0.3125px] text-[#2C2C2C] placeholder:text-[rgba(44,44,44,0.5)] focus:outline-none focus:border-[#2B77F5]"
            />
          </div>

          {/* 아이콘 그리드 */}
          {filteredIcons.length === 0 ? (
            <div className="text-center py-12 text-[#999999]">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>등록된 아이콘이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {filteredIcons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setSelectedIconId(icon.id?.toString() || '')}
                  className={`bg-white border-2 rounded-lg p-3 transition-all hover:shadow-md ${
                    selectedIconId === icon.id?.toString()
                      ? 'border-[#2B77F5] shadow-md'
                      : 'border-[#E8EAED]'
                  }`}
                >
                  <div className="aspect-square bg-white rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                    <img
                      src={icon.cloudinaryUrlWhite}
                      alt={icon.englishName}
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <p className="text-[#666666] text-[11px] text-center truncate">
                    {icon.tags?.split(',')[0] || icon.englishName}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* 등록된 배너 목록 */}
      {serviceFunction && registeredBanners.length > 0 && (
        <div className="mt-12">
          <h3 className="text-[#2C2C2C] mb-6 text-[20px] font-bold">
            {serviceFunction} 등록된 배너
          </h3>
          <div className="grid grid-cols-3 gap-4 max-w-4xl">
            {registeredBanners.map((banner) => {
              console.log('배너 데이터:', {
                id: banner.id,
                title: banner.title,
                cloudinaryUrl: banner.cloudinaryUrl,
                publicId: banner.publicId,
              });
              
              return (
                <div
                  key={banner.id}
                  className="bg-white border border-[#E8EAED] rounded-lg p-3 shadow-sm relative group"
                >
                  <div className="aspect-[2/1] bg-[#F5F5F7] rounded-lg overflow-hidden mb-2">
                    {banner.cloudinaryUrl ? (
                      <img
                        src={banner.cloudinaryUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onLoad={() => console.log('이미지 로드 성공:', banner.cloudinaryUrl)}
                        onError={(e) => {
                          console.error('이미지 로드 실패:', {
                            url: banner.cloudinaryUrl,
                            publicId: banner.publicId,
                            banner: banner
                          });
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex items-center justify-center bg-[#E8EAED]';
                            fallback.innerHTML = '<div class="text-xs text-[#999999]">이미지 로드 실패</div>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#E8EAED]">
                        <ImageIcon className="w-8 h-8 text-[#999999] opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 mb-2">
                    <p className="text-[#2C2C2C] text-xs font-medium line-clamp-2">
                      {banner.title}
                    </p>
                    <p className="text-[#999999] text-[10px]">
                      {new Date(banner.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(banner)}
                    className="absolute bottom-2 right-2 p-1.5 bg-[#FF4D4F] text-white rounded hover:bg-[#FF1919] transition-colors opacity-0 group-hover:opacity-100"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}