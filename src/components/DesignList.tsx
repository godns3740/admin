import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Search, ChevronDown, Download, Trash2 } from 'lucide-react';
import { getDesigns, getIcons, getBanners, deleteIcon, deleteBanner } from '../utils/storage';
import { DesignResource, IconResource, BannerResource } from '../types/design';

type SortOption = 'latest' | 'alphabetical';
type ViewType = 'all' | 'common' | 'hospitals';
type CommonTab = 'banners' | 'icons';
type AllTab = 'banners' | 'icons' | 'hospitals';

export default function DesignList() {
  const [designs, setDesigns] = useState<DesignResource[]>([]);
  const [icons, setIcons] = useState<IconResource[]>([]);
  const [banners, setBanners] = useState<BannerResource[]>([]);
  const [viewType, setViewType] = useState<ViewType>('all');
  const [commonTab, setCommonTab] = useState<CommonTab>('banners');
  const [allTab, setAllTab] = useState<AllTab>('banners');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  useEffect(() => {
    loadDesigns();
    loadIcons();
    loadBanners();
  }, []);

  const loadDesigns = () => {
    const data = getDesigns();
    setDesigns(data);
  };

  const loadIcons = () => {
    const data = getIcons();
    setIcons(data);
  };

  const loadBanners = () => {
    const data = getBanners();
    setBanners(data);
  };

  const filteredAndSortedDesigns = useMemo(() => {
    let result = [...designs];

    // 검색 필터
    if (searchQuery) {
      result = result.filter(d =>
        d.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    if (sortBy === 'latest') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      result.sort((a, b) => a.hospitalName.localeCompare(b.hospitalName, 'ko'));
    }

    return result;
  }, [designs, searchQuery, sortBy]);

  const filteredAndSortedIcons = useMemo(() => {
    let result = [...icons];

    // 검색 필터
    if (searchQuery) {
      result = result.filter(i =>
        i.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        i.englishName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    if (sortBy === 'latest') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      result.sort((a, b) => a.tags[0]?.localeCompare(b.tags[0] || '', 'ko') || 0);
    }

    return result;
  }, [icons, searchQuery, sortBy]);

  const filteredAndSortedBanners = useMemo(() => {
    let result = [...banners];

    // 검색 필터
    if (searchQuery) {
      result = result.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.englishName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    if (sortBy === 'latest') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    }

    return result;
  }, [banners, searchQuery, sortBy]);

  const handleDownloadIcon = (icon: IconResource) => {
    const link = document.createElement('a');
    link.href = icon.image;
    link.download = `icon_${icon.englishName}.png`;
    link.click();
  };

  const handleDownloadBanner = (banner: BannerResource) => {
    const link = document.createElement('a');
    link.href = banner.bannerImage;
    link.download = `banner_${banner.englishName}.png`;
    link.click();
  };

  const handleDeleteIcon = (icon: IconResource) => {
    deleteIcon(icon.id);
    setIcons(icons.filter(i => i.id !== icon.id));
  };

  const handleDeleteBanner = (banner: BannerResource) => {
    deleteBanner(banner.id);
    setBanners(banners.filter(b => b.id !== banner.id));
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[#2C2C2C] mb-8 text-[24px] font-bold">등록된 디자인</h2>

        {/* 검색 및 정렬 */}
        <div className="flex gap-4 mb-6">
          {/* 보기 타입 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-[#E0E0E0] rounded-lg hover:bg-[#F5F5F7] bg-white shadow-sm"
            >
              <span className="text-[#2C2C2C]">{viewType === 'all' ? '전체' : viewType === 'common' ? '공통' : '병원별'}</span>
              <ChevronDown className="w-4 h-4 text-[#666666]" />
            </button>
            {showViewDropdown && (
              <div className="absolute left-0 mt-2 w-32 bg-white border border-[#E8EAED] rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setViewType('all');
                    setShowViewDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#F5F5F7] rounded-t-lg ${
                    viewType === 'all' ? 'text-[#2b77f5]' : 'text-[#666666]'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => {
                    setViewType('common');
                    setShowViewDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#F5F5F7] ${
                    viewType === 'common' ? 'text-[#2b77f5]' : 'text-[#666666]'
                  }`}
                >
                  공통
                </button>
                <button
                  onClick={() => {
                    setViewType('hospitals');
                    setShowViewDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#F5F5F7] rounded-b-lg ${
                    viewType === 'hospitals' ? 'text-[#2b77f5]' : 'text-[#666666]'
                  }`}
                >
                  병원별
                </button>
              </div>
            )}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={viewType === 'common' ? '검색' : '검색'}
              className="w-full pl-10 pr-4 py-2 border border-[#E0E0E0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2b77f5] shadow-sm"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-[#E0E0E0] rounded-lg hover:bg-[#F5F5F7] bg-white shadow-sm"
            >
              <span className="text-[#2C2C2C]">{sortBy === 'latest' ? '등록순' : '가나다순'}</span>
              <ChevronDown className="w-4 h-4 text-[#666666]" />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-[#E8EAED] rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSortBy('latest');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#F5F5F7] rounded-t-lg ${
                    sortBy === 'latest' ? 'text-[#2b77f5]' : 'text-[#666666]'
                  }`}
                >
                  등록순
                </button>
                <button
                  onClick={() => {
                    setSortBy('alphabetical');
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#F5F5F7] rounded-b-lg ${
                    sortBy === 'alphabetical' ? 'text-[#2b77f5]' : 'text-[#666666]'
                  }`}
                >
                  가나다순
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 전체 섹션 */}
        {viewType === 'all' && (
          <div>
            {/* 탭 메뉴 */}
            <div className="flex gap-2 mb-6 py-2.5">
              <button
                onClick={() => setAllTab('banners')}
                className={`px-5 py-2.5 rounded-lg transition-colors font-semibold ${
                  allTab === 'banners'
                    ? 'bg-[#666f7a] text-white'
                    : 'bg-[#f0f1f5] text-[#6a6e76] hover:bg-[#dadce5]'
                }`}
              >
                배너
              </button>
              <button
                onClick={() => setAllTab('icons')}
                className={`px-5 py-2.5 rounded-lg transition-colors font-semibold ${
                  allTab === 'icons'
                    ? 'bg-[#666f7a] text-white'
                    : 'bg-[#f0f1f5] text-[#6a6e76] hover:bg-[#dadce5]'
                }`}
              >
                아이콘
              </button>
              <button
                onClick={() => setAllTab('hospitals')}
                className={`px-5 py-2.5 rounded-lg transition-colors font-semibold ${
                  allTab === 'hospitals'
                    ? 'bg-[#666f7a] text-white'
                    : 'bg-[#f0f1f5] text-[#6a6e76] hover:bg-[#dadce5]'
                }`}
              >
                병원별
              </button>
            </div>

            {allTab === 'icons' && (
              <>
                {filteredAndSortedIcons.length === 0 ? (
                  <div className="text-center py-16 text-[#999999]">
                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 아이콘이 없습니다.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAndSortedIcons.map((icon) => (
                      <div
                        key={icon.id}
                        className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden flex flex-col sm:flex-row shadow-sm"
                      >
                        <div className="flex-shrink-0 p-4 bg-[#FAFAFA] flex items-center justify-center sm:w-48">
                          <img src={icon.image} alt={icon.tags.join(', ')} className="w-[120px] h-[120px] object-contain" />
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {icon.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full bg-[#E8F0FF] text-[#2b77f5]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-[#999999] font-mono">icon_{icon.englishName}.png</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownloadIcon(icon)}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              다운로드
                            </button>
                            <button
                              onClick={() => handleDeleteIcon(icon)}
                              className="flex items-center px-3 py-2 bg-white border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {allTab === 'banners' && (
              <>
                {filteredAndSortedBanners.length === 0 ? (
                  <div className="text-center py-16 text-[#999999]">
                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 배너가 없습니다.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAndSortedBanners.map((banner) => (
                      <div
                        key={banner.id}
                        className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden flex flex-col sm:flex-row shadow-sm"
                      >
                        <div className="flex-shrink-0 p-4 bg-[#FAFAFA] flex items-center justify-center w-full sm:w-96">
                          <img src={banner.bannerImage} alt={banner.title} className="w-full max-w-md object-contain" />
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-[#2C2C2C] mb-2">{banner.title}</h3>
                            <p className="text-[#999999] font-mono">banner_{banner.englishName}.png</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownloadBanner(banner)}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              다운로드
                            </button>
                            <button
                              onClick={() => handleDeleteBanner(banner)}
                              className="flex items-center px-3 py-2 bg-white border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {allTab === 'hospitals' && (
              <>
                {filteredAndSortedDesigns.length === 0 ? (
                  <div className="text-center py-16 text-[#999999]">
                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 디자인이 없습니다.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedDesigns.map((design) => (
                      <Link
                        key={design.id}
                        to={`/designs/${design.id}`}
                        className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square bg-[#F5F5F7] flex items-center justify-center">
                          <img
                            src={design.thumbnail}
                            alt={design.hospitalName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-[#2C2C2C] mb-2">{design.hospitalName}</h3>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-[#E0E0E0]"
                              style={{ backgroundColor: design.colorCode }}
                            />
                            <span className="text-[#666666]">{design.colorCode}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 공통 섹션 */}
        {viewType === 'common' && (
          <div>
            {/* 탭 메뉴 */}
            <div className="flex gap-2 mb-6 py-2.5">
              <button
                onClick={() => setCommonTab('banners')}
                className={`px-5 py-2.5 rounded-lg transition-colors font-semibold ${
                  commonTab === 'banners'
                    ? 'bg-[#666f7a] text-white'
                    : 'bg-[#f0f1f5] text-[#6a6e76] hover:bg-[#dadce5]'
                }`}
              >
                배너
              </button>
              <button
                onClick={() => setCommonTab('icons')}
                className={`px-5 py-2.5 rounded-lg transition-colors font-semibold ${
                  commonTab === 'icons'
                    ? 'bg-[#666f7a] text-white'
                    : 'bg-[#f0f1f5] text-[#6a6e76] hover:bg-[#dadce5]'
                }`}
              >
                아이콘
              </button>
            </div>

            {commonTab === 'icons' && (
              <>
                {filteredAndSortedIcons.length === 0 ? (
                  <div className="text-center py-16 text-[#999999]">
                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 아이콘이 없습니다.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAndSortedIcons.map((icon) => (
                      <div
                        key={icon.id}
                        className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden flex flex-col sm:flex-row shadow-sm"
                      >
                        <div className="flex-shrink-0 p-4 bg-[#FAFAFA] flex items-center justify-center sm:w-48">
                          <img src={icon.image} alt={icon.tags.join(', ')} className="w-[120px] h-[120px] object-contain" />
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {icon.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full bg-[#E8F0FF] text-[#2b77f5]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-[#999999] font-mono">icon_{icon.englishName}.png</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownloadIcon(icon)}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              다운로드
                            </button>
                            <button
                              onClick={() => handleDeleteIcon(icon)}
                              className="flex items-center px-3 py-2 bg-white border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {commonTab === 'banners' && (
              <>
                {filteredAndSortedBanners.length === 0 ? (
                  <div className="text-center py-16 text-[#999999]">
                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 배너가 없습니다.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAndSortedBanners.map((banner) => (
                      <div
                        key={banner.id}
                        className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden flex flex-col sm:flex-row shadow-sm"
                      >
                        <div className="flex-shrink-0 p-4 bg-[#FAFAFA] flex items-center justify-center w-full sm:w-96">
                          <img src={banner.bannerImage} alt={banner.title} className="w-full max-w-md object-contain" />
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-[#2C2C2C] mb-2">{banner.title}</h3>
                            <p className="text-[#999999] font-mono">banner_{banner.englishName}.png</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownloadBanner(banner)}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              다운로드
                            </button>
                            <button
                              onClick={() => handleDeleteBanner(banner)}
                              className="flex items-center px-3 py-2 bg-white border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 병원별 디자인 리스트 */}
        {viewType === 'hospitals' && (
          <>
            {filteredAndSortedDesigns.length === 0 ? (
              <div className="text-center py-16 text-[#999999]">
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 디자인이 없습니다.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedDesigns.map((design) => (
                  <Link
                    key={design.id}
                    to={`/designs/${design.id}`}
                    className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-[#F5F5F7] flex items-center justify-center">
                      <img
                        src={design.thumbnail}
                        alt={design.hospitalName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#2C2C2C] mb-2">{design.hospitalName}</h3>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-[#E0E0E0]"
                          style={{ backgroundColor: design.colorCode }}
                        />
                        <span className="text-[#666666]">{design.colorCode}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}