import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Download, ArrowLeft, Trash2, Archive, Copy, Check } from 'lucide-react';
import { getDesignById, deleteDesign, updateDesign } from '../utils/storage';
import { DesignResource } from '../types/design';
import JSZip from 'jszip';
import karechatThumb from 'figma:asset/caf9aba9a4e8e9a703ed2062051f906481e05b7f.png';

type TabType = 'general' | 'karechat';

export default function DesignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [design, setDesign] = useState<DesignResource | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const data = getDesignById(id);
      if (data) {
        setDesign(data);
      } else {
        navigate('/designs');
      }
    }
  }, [id, navigate]);

  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  const handleDownloadResizedLogo = async (logoUrl: string, filename: string, isColor: boolean = true) => {
    if (!design) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      // 원본 이미지의 가로세로 비율 계산
      const aspectRatio = img.width / img.height;
      
      // logoHeight에 맞춰서 너비 계산
      const targetHeight = design.logoHeight;
      const targetWidth = targetHeight * aspectRatio;
      
      // 캔버스 크기 설정
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Blob으로 변환 후 클립보드에 복사
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            
            setCopiedImage(filename);
            setTimeout(() => setCopiedImage(null), 2000);
          } catch (err) {
            console.error('Failed to copy image:', err);
            alert('이미지 복사에 실패했습니다. 다시 시도해주세요.');
          }
        }
      }, 'image/png');
    };
    
    img.src = logoUrl;
  };

  const handleDownloadZip = async () => {
    if (!design) return;

    const zip = new JSZip();

    // Base64 데이터를 blob으로 변환하는 헬퍼 함수
    const dataUrlToBlob = (dataUrl: string): string => {
      return dataUrl.split(',')[1];
    };

    // hspId가 없으면 hospitalName 사용 (기존 데이터 호환성)
    const fileIdentifier = design.hspId || design.hospitalName;

    // 1. card_{hspId}.png
    zip.file(`card_${fileIdentifier}.png`, dataUrlToBlob(design.patientCard), { base64: true });

    // 2. img_{hspId}.png (투명 배경)
    zip.file(`img_${fileIdentifier}.png`, dataUrlToBlob(design.patientCardTransparent), { base64: true });

    // 3. thumb.png (고정 이미지)
    const thumbResponse = await fetch(karechatThumb);
    const thumbBlob = await thumbResponse.blob();
    zip.file(`thumb.png`, thumbBlob);

    // ZIP 파일 생성 및 다운로드
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${design.hospitalName}_Karechat_디지털카드.zip`;
    link.click();
  };

  const handleDelete = () => {
    if (!id || !design) return;
    
    if (confirm(`"${design.hospitalName}" 디자인을 삭제하시겠습니까?`)) {
      deleteDesign(id);
      navigate('/designs');
    }
  };

  const handleCopyColorCode = async () => {
    if (!design) return;
    
    try {
      // Fallback method for clipboard API restrictions
      const textArea = document.createElement('textarea');
      textArea.value = design.colorCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeleteNoticeImage = () => {
    if (!id || !design) return;
    
    if (confirm('공지 이미지를 삭제하시겠습니까?')) {
      updateDesign(id, { noticeImage: undefined });
      setDesign({ ...design, noticeImage: undefined });
    }
  };

  const handleCopyImage = async (dataUrl: string, imageName: string) => {
    try {
      // Data URL을 Blob으로 변환
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Clipboard API를 사용하여 이미지 복사
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setCopiedImage(imageName);
      setTimeout(() => setCopiedImage(null), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
      alert('이미지 복사에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!design) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/designs')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-gray-900">{design.hospitalName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: design.colorCode }}
                />
                <span className="text-gray-500">{design.colorCode}</span>
                <button
                  onClick={handleCopyColorCode}
                  className="ml-2 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>

        {/* 탭 */}
        <div className="flex justify-between items-center mb-6 py-2.5">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-5 py-2.5 rounded-lg transition-colors font-semibold ${
                activeTab === 'general'
                  ? 'bg-[#666f7a] text-white'
                  : 'bg-[#f0f1f5] text-[#6a6e76] hover:bg-[#dadce5]'
              }`}
            >
              일반
            </button>
            <button
              onClick={() => setActiveTab('karechat')}
              className={`px-5 py-2.5 rounded-lg transition-colors font-semibold ${
                activeTab === 'karechat'
                  ? 'bg-[#666f7a] text-white'
                  : 'bg-[#f0f1f5] text-[#6a6e76] hover:bg-[#dadce5]'
              }`}
            >
              톡디지털카드
            </button>
          </div>

          {/* ZIP 다운로드 버튼 - 카카오톡 디지털카드 탭에서만 표시 */}
          {activeTab === 'karechat' && (
            <button
              onClick={handleDownloadZip}
              className="inline-flex items-center justify-center gap-2 px-[24px] py-[14px] bg-[#2b77f5] text-white text-[16px] font-medium leading-none rounded-[8px] hover:bg-[#1763E2] transition-colors"
            >
              <Archive className="w-5 h-5" />
              ZIP 파일로 다운로드
            </button>
          )}
        </div>

        {/* 일반 탭 */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            {/* 썸네일 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
              <div className="flex-shrink-0 p-4 bg-gray-50 flex items-center justify-center sm:w-48">
                <img src={design.thumbnail} alt="썸네일" className="max-w-[120px] h-auto" />
              </div>
              <div className="flex-1 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">썸네일</h3>
                  <p className="text-gray-500 text-sm">144 x 144</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyImage(design.thumbnail, 'thumbnail')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                  >
                    {copiedImage === 'thumbnail' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    복사
                  </button>
                  <button
                    onClick={() => handleDownload(design.thumbnail, `${design.hospitalName}_썸네일.png`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                </div>
              </div>
            </div>

            {/* 웰컴블럭 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
              <div className="flex-shrink-0 p-4 bg-gray-50 flex items-center justify-center sm:w-48">
                <img src={design.welcomeBlock} alt="웰컴블럭" className="max-w-full h-auto max-h-24" />
              </div>
              <div className="flex-1 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">웰컴블럭</h3>
                  <p className="text-gray-500 text-sm">800 x 400</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyImage(design.welcomeBlock, 'welcomeBlock')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                  >
                    {copiedImage === 'welcomeBlock' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    복사
                  </button>
                  <button
                    onClick={() => handleDownload(design.welcomeBlock, `${design.hospitalName}_웰컴블럭.png`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                </div>
              </div>
            </div>

            {/* 컬러 로고 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
              <div className="flex-shrink-0 p-4 bg-gray-50 flex items-center justify-center sm:w-48">
                <img src={design.logoColor} alt="컬러 로고" className="max-w-full h-auto max-h-24" />
              </div>
              <div className="flex-1 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">컬러 로고</h3>
                  <p className="text-gray-500 text-sm">h:{design.logoHeight}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyImage(design.logoColor, 'logoColor')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                  >
                    {copiedImage === 'logoColor' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    복사
                  </button>
                  <button
                    onClick={() => handleDownloadResizedLogo(design.logoColor, `${design.hospitalName}_컬러로고.png`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                </div>
              </div>
            </div>

            {/* 공지 이미지 */}
            {design.noticeImage && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
                <div className="flex-shrink-0 p-4 bg-gray-50 flex items-center justify-center sm:w-48">
                  <img src={design.noticeImage} alt="공지 이미지" className="max-w-full h-auto max-h-32" />
                </div>
                <div className="flex-1 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 mb-1">공지 이미지</h3>
                    <p className="text-gray-500 text-sm">950 x 950</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyImage(design.noticeImage!, 'noticeImage')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                    >
                      {copiedImage === 'noticeImage' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      복사
                    </button>
                    <button
                      onClick={() => handleDownload(design.noticeImage!, `notice_${design.hospitalName}.png`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      다운로드
                    </button>
                    <button
                      onClick={handleDeleteNoticeImage}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Karechat 디지털카드 탭 */}
        {activeTab === 'karechat' && (
          <div>
            <div className="space-y-4">
              {/* 환자카드 */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
                <div className="flex-shrink-0 p-4 bg-gray-50 flex items-center justify-center sm:w-48">
                  <img src={design.patientCard} alt="환자카드" className="max-w-[120px] h-auto" />
                </div>
                <div className="flex-1 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 mb-1">card</h3>
                    <p className="text-gray-500 text-sm">300 x 420 @2x, h:{design.logoHeight}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyImage(design.patientCard, 'patientCard')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                    >
                      {copiedImage === 'patientCard' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      복사
                    </button>
                    <button
                      onClick={() => handleDownload(design.patientCard, `card_${design.hospitalName}.png`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      다운로드
                    </button>
                  </div>
                </div>
              </div>

              {/* 환자카드 이미지 (투명 배경) */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
                <div className="flex-shrink-0 p-4 bg-gray-50 flex items-center justify-center sm:w-48 relative">
                  <div className="absolute inset-4" style={{
                    backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px'
                  }} />
                  <img src={design.patientCardTransparent} alt="환자카드 이미지" className="max-w-[140px] h-auto relative z-10" />
                </div>
                <div className="flex-1 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 mb-1">img</h3>
                    <p className="text-gray-500 text-sm">408 x 255 @3x, 투명, h:{design.logoHeight}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyImage(design.patientCardTransparent, 'patientCardTransparent')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                    >
                      {copiedImage === 'patientCardTransparent' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      복사
                    </button>
                    <button
                      onClick={() => handleDownload(design.patientCardTransparent, `img_${design.hospitalName}.png`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      다운로드
                    </button>
                  </div>
                </div>
              </div>

              {/* 케어챗 썸네일 */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col sm:flex-row">
                <div className="flex-shrink-0 p-4 bg-gray-50 flex items-center justify-center sm:w-48">
                  <img src={karechatThumb} alt="케어챗 썸네일" className="max-w-[120px] h-auto" />
                </div>
                <div className="flex-1 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 mb-1">thumb</h3>
                    <p className="text-gray-500 text-sm">144 x 144</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const response = await fetch(karechatThumb);
                        const blob = await response.blob();
                        await navigator.clipboard.write([
                          new ClipboardItem({
                            'image/png': blob
                          })
                        ]);
                        setCopiedImage('karechatThumb');
                        setTimeout(() => setCopiedImage(null), 2000);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                    >
                      {copiedImage === 'karechatThumb' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      복사
                    </button>
                    <button
                      onClick={async () => {
                        const response = await fetch(karechatThumb);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        handleDownload(url, `thumb_${design.hospitalName}.png`);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] text-[#2C2C2C] rounded-lg hover:bg-[#F5F5F7] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      다운로드
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}