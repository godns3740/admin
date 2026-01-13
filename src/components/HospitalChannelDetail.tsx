import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Download, Copy, Check, Edit2, X } from 'lucide-react';
import { uploadToCloudinary } from '../utils/cloudinary';
import { getDesignByHspId, SheetData, getNoticesByHspId, NoticeData } from '../utils/sheety';

interface ChannelImage {
  type: 'hspThumb' | 'welcome' | 'logoColor' | 'notice';
  title: string;
  description: string;
  url: string | null;
  publicId: string;
  createdAt?: string;
  uniqueKey?: string; // 고유 키 (notice 이미지용)
}

export default function HospitalChannelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<SheetData | null>(null);
  const [images, setImages] = useState<ChannelImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ChannelImage | null>(null);
  const [pastedImage, setPastedImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHospital = async () => {
      setIsLoading(true);
      try {
        if (!id) {
          navigate('/hospital-channels');
          return;
        }

        // Sheety에서 병원 데이터 가져오기
        const hospitalData = await getDesignByHspId(id);
        
        if (!hospitalData) {
          alert('병원을 찾을 수 없습니다.');
          navigate('/hospital-channels');
          return;
        }
        
        setHospital(hospitalData);
        
        // 이미지 URL 구성 (Cloudinary 또는 실제 저장소 기준)
        const prefix = hospitalData.storagePrefix || hospitalData.hspId;
        const imageList: ChannelImage[] = [
          {
            type: 'hspThumb',
            title: '병원 썸네일',
            description: 'hspThumb - 병원 대표 썸네일 이미지',
            url: hospitalData.hspThumb || `https://res.cloudinary.com/dwc5sqwk5/image/upload/${prefix}_hsp_thumb.png`,
            publicId: `${prefix}_hsp_thumb`,
          },
          {
            type: 'welcome',
            title: '웰컴 블록',
            description: 'welcome - 웰컴 블록 이미지',
            url: hospitalData.welcome || `https://res.cloudinary.com/dwc5sqwk5/image/upload/${prefix}_welcome.png`,
            publicId: `${prefix}_welcome`,
          },
          {
            type: 'logoColor',
            title: '컬러 로고',
            description: 'logoColor - 병원 컬러 로고 (3배수)',
            url: hospitalData.logoColor || `https://res.cloudinary.com/dwc5sqwk5/image/upload/${prefix}_logo_color_3x.png`,
            publicId: `${prefix}_logo_color_3x`,
          },
        ];
        
        // Notice 이미지 조회 및 추가
        const noticeImages = await getNoticesByHspId(id);
        console.log('Notice 이미지:', noticeImages);
        
        // Notice 이미지를 imageList에 추가
        for (const notice of noticeImages) {
          imageList.push({
            type: 'notice',
            title: '공지 이미지',
            description: 'notice - 공지 이미지',
            url: notice.cloudinaryUrl,
            publicId: notice.publicId,
            createdAt: notice.createdAt,
            uniqueKey: notice.uniqueKey, // 고유 키 추가
          });
        }
        
        setImages(imageList);
      } catch (error) {
        console.error('병원 정보 로드 실패:', error);
        alert('병원 정보를 불러오는데 실패했습니다.');
        navigate('/hospital-channels');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospital();
  }, [id, navigate]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      // Modern Clipboard API 시도
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(url);
          setCopiedUrl(url);
          setTimeout(() => setCopiedUrl(null), 2000);
          return;
        } catch (clipboardError) {
          // Clipboard API 실패 시 fallback으로 진행
          console.log('Clipboard API 실패, fallback 사용');
        }
      }
      
      // Fallback: execCommand 사용
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopiedUrl(url);
          setTimeout(() => setCopiedUrl(null), 2000);
        } else {
          throw new Error('execCommand failed');
        }
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('URL 복사 실패:', error);
      // 마지막 수단: prompt로 URL 보여주기
      prompt('URL을 복사해주세요:', url);
    }
  };

  const handleEditClick = (image: ChannelImage) => {
    setEditingImage(image);
    setPastedImage('');
  };

  const handleCloseModal = () => {
    setEditingImage(null);
    setPastedImage('');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPastedImage(event.target?.result as string);
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  const handleUploadImage = async () => {
    if (!pastedImage || !editingImage || !hospital) {
      alert('이미지를 붙여넣기 해주세요.');
      return;
    }

    try {
      setIsUploading(true);
      
      // logoColor인 경우 3배수로 변환
      let imageToUpload = pastedImage;
      
      if (editingImage.type === 'logoColor') {
        imageToUpload = await scaleImageTo3x(pastedImage);
      }
      
      // Cloudinary에 덮어쓰기 (같은 public_id 사용)
      const url = await uploadToCloudinary(
        imageToUpload,
        editingImage.publicId,
        [hospital.hspId, editingImage.type]
      );
      
      // 이미지 목록 업데이트
      setImages(prev => prev.map(img => 
        img.type === editingImage.type 
          ? { ...img, url: url + '?t=' + Date.now() } // 캐시 무효화를 위한 타임스탬프
          : img
      ));
      
      alert('이미지가 성공적으로 업데이트되었습니다.');
      handleCloseModal();
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 이미지를 3배수로 스케일링
  const scaleImageTo3x = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // 3배수로 확대
        canvas.width = img.width * 3;
        canvas.height = img.height * 3;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64Image;
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto text-center py-16 text-[#999999]">
          로딩 중...
        </div>
      </div>
    );
  }

  if (!hospital) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/hospital-channels')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-gray-900">{hospital.hospitalName}</h2>
            <p className="text-[#666666] mt-1">
              {hospital.hspId} · {hospital.storagePrefix}
            </p>
          </div>
        </div>

        {/* 이미지 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image.uniqueKey || image.type}
              className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* 미리보기 */}
              <div className="aspect-video bg-[#F5F5F7] flex items-center justify-center p-3">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.title}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3E이미지 없음%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <p className="text-[#999999] text-sm">이미지 없음</p>
                )}
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h3 className="font-semibold text-[#2C2C2C] mb-1">{image.title}</h3>
                <p className="text-[#999999] mb-3 text-sm">{image.description}</p>

                {/* 버튼 그룹 - 한 줄로 */}
                <div className="flex gap-2">
                  {/* 다운로드 버튼 */}
                  <button
                    onClick={() => image.url && handleDownload(image.url, `${image.type}.png`)}
                    disabled={!image.url}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-[#F5F5F7] text-[#666666] rounded-lg hover:bg-[#E8EAED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* URL 복사 버튼 */}
                  <button
                    onClick={() => image.url && handleCopyUrl(image.url)}
                    disabled={!image.url}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-[#F5F5F7] text-[#666666] rounded-lg hover:bg-[#E8EAED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="URL 복사"
                  >
                    {copiedUrl === image.url ? (
                      <Check className="w-4 h-4 text-[#2b77f5]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* 수정 버튼 */}
                  <button
                    onClick={() => handleEditClick(image)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-[#F5F5F7] text-[#666666] rounded-lg hover:bg-[#E8EAED] transition-colors cursor-pointer"
                    title="수정"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 수정 모달 */}
      {editingImage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-[#E8EAED]">
              <h3 className="text-xl font-semibold text-[#2C2C2C]">
                {editingImage.title} 수정
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6">
              <p className="text-[#666666] mb-4">
                {editingImage.type === 'logoColor' 
                  ? '이미지를 복사하여 아래 영역에 붙여넣기 하세요. (자동으로 3배수로 변환됩니다)'
                  : '이미지를 복사하여 아래 영역에 붙여넣기 하세요.'}
              </p>

              {/* 붙여넣기 영역 */}
              <div
                ref={pasteAreaRef}
                onPaste={handlePaste}
                tabIndex={0}
                className="border-2 border-dashed border-[#E8EAED] rounded-lg p-8 mb-4 min-h-[300px] flex items-center justify-center bg-[#F5F5F7] focus:outline-none focus:border-[#2b77f5] cursor-pointer"
              >
                {pastedImage ? (
                  <img
                    src={pastedImage}
                    alt="붙여넣은 이미지"
                    className="max-w-full max-h-[250px] object-contain"
                  />
                ) : (
                  <p className="text-[#999999] text-center">
                    이미지를 복사한 후 여기를 클릭하고<br />
                    Ctrl+V (Mac: Cmd+V)를 눌러 붙여넣기 하세요
                  </p>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-white text-[#666666] border border-[#E8EAED] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUploadImage}
                  disabled={!pastedImage || isUploading}
                  className="flex-1 px-4 py-2 bg-[#2b77f5] text-white rounded-lg hover:bg-[#1763E2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? '업로드 중...' : '적용하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}