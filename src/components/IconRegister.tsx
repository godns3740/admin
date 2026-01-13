import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Save, Image as ImageIcon, Upload, X } from 'lucide-react';
import ImagePasteInput from './ImagePasteInput';
import IconEditModal from './IconEditModal';
import { uploadToCloudinary } from '../utils/cloudinary';
import { saveIconToSheet, getAllIcons, IconData } from '../utils/sheety';

export default function IconRegister() {
  const navigate = useNavigate();
  const [tagsInput, setTagsInput] = useState('');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [registeredIcons, setRegisteredIcons] = useState<IconData[]>([]);
  const [isLoadingIcons, setIsLoadingIcons] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 등록된 아이콘 로드
  useEffect(() => {
    const loadIcons = async () => {
      setIsLoadingIcons(true);
      try {
        const icons = await getAllIcons();
        // 최신순으로 정렬
        const sorted = icons.sort((a, b) => {
          if (!a.id || !b.id) return 0;
          return b.id - a.id;
        });
        setRegisteredIcons(sorted);
      } catch (error) {
        console.error('아이콘 로드 실패:', error);
      } finally {
        setIsLoadingIcons(false);
      }
    };

    loadIcons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tagsInput || !image) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 태그 배열로 변환 (쉼표로 분리하고 공백 제거)
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    if (tags.length === 0) {
      alert('최소 하나 이상의 태그를 입력해주세요.');
      return;
    }

    try {
      setIsUploading(true);

      // 태그를 기반으로 영어 파일명 자동 생성
      // 영어/숫자만 있는 태그를 언더스코어로 연결, 없으면 타임스탬프 사용
      const englishTags = tags
        .map(tag => tag.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
        .filter(tag => tag.length > 0);
      
      const baseName = englishTags.length > 0 
        ? englishTags.join('_') 
        : `icon_${Date.now()}`;

      // 1. 투명 배경 버전 업로드 (원본 그대로)
      const fileNameTransparent = `${baseName}_transparent`;
      const cloudinaryUrlTransparent = await uploadToCloudinary(image, fileNameTransparent, tags);

      // 2. 흰색 배경 버전 생성
      const whiteBackgroundImage = await createWhiteBackgroundImage(image);
      const fileNameWhite = `${baseName}_white`;
      const cloudinaryUrlWhite = await uploadToCloudinary(whiteBackgroundImage, fileNameWhite, tags);

      // Sheety에 저장
      await saveIconToSheet({
        tags: tagsInput, // 쉼표로 구분된 원본 문자열 저장
        englishName: baseName,
        cloudinaryUrlTransparent,
        cloudinaryUrlWhite,
        publicIdTransparent: fileNameTransparent,
        publicIdWhite: fileNameWhite,
        createdAt: new Date().toISOString(),
      });

      alert('아이콘이 성공적으로 등록되었습니다.');
      
      // 폼 초기화
      setTagsInput('');
      setImage('');
      
      // 아이콘 목록 새로고침
      const icons = await getAllIcons();
      const sorted = icons.sort((a, b) => {
        if (!a.id || !b.id) return 0;
        return b.id - a.id;
      });
      setRegisteredIcons(sorted);
      
    } catch (error) {
      console.error('아이콘 등록 실패:', error);
      alert('아이콘 등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 흰색 배경이 있는 이미지 생성
  const createWhiteBackgroundImage = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 흰색 배경 그리기
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 200, 200);
          
          // 이미지 그리기
          ctx.drawImage(img, 0, 0, 200, 200);
          
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
        }
      };
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = base64Image;
    });
  };

  const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  const handleIconClick = (icon: IconData) => {
    setSelectedIcon(icon);
    setIsModalOpen(true);
  };

  const handleIconUpdate = (updatedIcon: IconData) => {
    // 목록에서 해당 아이콘 업데이트
    setRegisteredIcons(prev =>
      prev.map(icon => (icon.id === updatedIcon.id ? updatedIcon : icon))
    );
  };

  const handleIconDelete = (iconId: number) => {
    // 목록에서 해당 아이콘 제거
    setRegisteredIcons(prev => prev.filter(icon => icon.id !== iconId));
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl">
        <h2 className="text-[#2C2C2C] mb-8 text-[24px] font-bold">아이콘 이미지 등록</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-[#E8EAED] rounded-lg p-6 shadow-sm max-w-4xl">
            {/* 아이콘 이미지(좌측) + 태그(우측) */}
            <div className="flex gap-6">
              {/* 아이콘 이미지 - 좌측 */}
              <div className="flex-shrink-0">
                <label className="block text-[#2C2C2C] mb-2">
                  아이콘 이미지 <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer w-[200px] h-[200px] ${
                    image
                      ? 'border-[#E0E0E0] bg-white'
                      : 'border-[#E0E0E0] hover:border-[#2b77f5] hover:bg-[#F9FCFF] bg-white'
                  }`}
                  onClick={() => {
                    const handlePaste = (e: ClipboardEvent) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;

                      for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                          const blob = items[i].getAsFile();
                          if (blob) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = 200;
                                canvas.height = 200;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, 200, 200);
                                  setImage(canvas.toDataURL('image/png'));
                                }
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(blob);
                          }
                          e.preventDefault();
                          document.removeEventListener('paste', handlePaste);
                          break;
                        }
                      }
                    };
                    document.addEventListener('paste', handlePaste);
                    setTimeout(() => document.removeEventListener('paste', handlePaste), 5000);
                  }}
                  tabIndex={0}
                >
                  {image ? (
                    <div className="relative w-full h-full p-4 flex items-center justify-center">
                      <img src={image} alt="아이콘" className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage('');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                      <Upload className="w-8 h-8 text-[#999999] mx-auto mb-2" />
                      <p className="text-[#666666]">
                        붙여넣기
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 태그 - 우측 */}
              <div className="flex-1">
                <label className="block text-[#2C2C2C] mb-2">
                  태그 (쉼표로 구분) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
                  placeholder="예: 병원, 의료, 건강"
                  required
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-[#E8F0FF] text-[#2b77f5]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end max-w-4xl mt-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-[24px] py-[14px] bg-[#2b77f5] text-white text-[16px] font-medium leading-none rounded-[8px] hover:bg-[#1763E2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="animate-spin w-5 h-5 border-2 border-t-2 border-t-white rounded-full"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isUploading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>

        {/* 구분선 */}
        <div className="my-12 border-t border-[#E8EAED]"></div>

        {/* 등록된 아이콘 갤러리 */}
        <div>
          <h3 className="text-[#2C2C2C] mb-6 text-[20px] font-semibold">등록된 아이콘</h3>
          
          {isLoadingIcons ? (
            <div className="text-center py-12 text-[#999999]">
              로딩 중...
            </div>
          ) : registeredIcons.length === 0 ? (
            <div className="bg-[#FFF9E6] border border-[#FFE4A3] rounded-lg p-6 text-center">
              <p className="text-[#666666] mb-2">
                등록된 아이콘이 없습니다.
              </p>
              <p className="text-[#999999] text-sm">
                Google Sheets에 "icons" 시트가 생성되어 있는지 확인해주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {registeredIcons.map((icon) => {
                const firstTag = icon.tags.split(',')[0]?.trim() || '';
                return (
                  <div key={icon.id} className="flex flex-col items-center">
                    <button
                      onClick={() => handleIconClick(icon)}
                      className="w-full aspect-square bg-white rounded-lg flex items-center justify-center mb-2 transition-colors border-2 border-[#E0E0E0] hover:border-[#2b77f5] cursor-pointer overflow-hidden"
                    >
                      <img
                        src={icon.cloudinaryUrlWhite}
                        alt={icon.englishName}
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </button>
                    <p className="text-[#666666] text-xs text-center truncate w-full">
                      {firstTag}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 아이콘 편집 모달 */}
      {isModalOpen && selectedIcon && (
        <IconEditModal
          icon={selectedIcon}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={handleIconUpdate}
          onDelete={handleIconDelete}
        />
      )}
    </div>
  );
}