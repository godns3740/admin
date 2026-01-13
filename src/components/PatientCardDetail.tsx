import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Download, ArrowLeft, Copy, Check, Edit2, X } from 'lucide-react';
import { getDesignByHspId, SheetData } from '../utils/sheety';
import { uploadToCloudinary } from '../utils/cloudinary';
import karechatThumb from 'figma:asset/caf9aba9a4e8e9a703ed2062051f906481e05b7f.png';

export default function PatientCardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [design, setDesign] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<{ type: 'card' | 'img'; url: string } | null>(null);
  const [pastedImage, setPastedImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadDesign = async () => {
      if (id) {
        setIsLoading(true);
        const data = await getDesignByHspId(id);
        if (data) {
          setDesign(data);
        } else {
          alert('해당 병원 데이터를 찾을 수 없습니다.');
          navigate('/patient-cards');
        }
        setIsLoading(false);
      }
    };
    loadDesign();
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

  const handleDownloadThumb = async () => {
    if (!design) return;
    
    const response = await fetch(karechatThumb);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'thumb.png';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleEditFile = (type: 'card' | 'img', url: string) => {
    setEditingFile({ type, url });
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setPastedImage('');
  };

  const handleUploadImage = async () => {
    if (!pastedImage) return;
    setIsUploading(true);
    try {
      const result = await uploadToCloudinary(pastedImage);
      if (result && design) {
        const updatedDesign = {
          ...design,
          [editingFile!.type]: result.secure_url,
        };
        setDesign(updatedDesign);
        setEditingFile(null);
        setPastedImage('');
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
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

  if (!design) {
    return null;
  }

  const files = [
    {
      name: `card_${design.hspId}.png`,
      description: '환자카드 (배경 포함)',
      info: `300 x 420 @2x, h:${design.logoHeight}`,
      preview: design.card,
      onDownload: () => handleDownload(design.card, `card_${design.hspId}.png`),
      onCopyUrl: () => handleCopyUrl(design.card),
      onEdit: () => handleEditFile('card', design.card),
    },
    {
      name: `img_${design.hspId}.png`,
      description: '환자카드 (투명 배경)',
      info: `408 x 255 @3x, h:${design.logoHeight}`,
      preview: design.img,
      onDownload: () => handleDownload(design.img, `img_${design.hspId}.png`),
      onCopyUrl: () => handleCopyUrl(design.img),
      onEdit: () => handleEditFile('img', design.img),
    },
    {
      name: 'thumb.png',
      description: '케어챗 로고 (공통)',
      info: '144 x 144',
      preview: karechatThumb,
      onDownload: handleDownloadThumb,
      onCopyUrl: () => handleCopyUrl(karechatThumb),
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/patient-cards')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-gray-900">{design.hospitalName}</h2>
            <p className="text-[#666666] mt-1">환자카드 개별 파일 (병원ID: {design.hspId})</p>
          </div>
        </div>

        {/* 파일 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* 미리보기 */}
              <div className="aspect-square bg-[#F5F5F7] flex items-center justify-center p-4">
                <img
                  src={file.preview}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h3 className="font-semibold text-[#2C2C2C] mb-1">{file.name}</h3>
                <p className="text-[#999999] mb-4">{file.description}</p>
                <p className="text-[#999999] mb-4">{file.info}</p>

                {/* 버튼 그룹 */}
                <div className="flex gap-2">
                  {/* 다운로드 버튼 */}
                  <button
                    onClick={file.onDownload}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-[#F5F5F7] text-[#666666] rounded-lg hover:bg-[#E8EAED] transition-colors cursor-pointer"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* URL 복사 버튼 */}
                  <button
                    onClick={file.onCopyUrl}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-[#F5F5F7] text-[#666666] rounded-lg hover:bg-[#E8EAED] transition-colors cursor-pointer"
                    title="URL 복사"
                  >
                    {copiedUrl === file.preview ? (
                      <Check className="w-4 h-4 text-[#2b77f5]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* 편집 버튼 - thumb.png 제외 */}
                  {file.onEdit && (
                    <button
                      onClick={file.onEdit}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-[#F5F5F7] text-[#666666] rounded-lg hover:bg-[#E8EAED] transition-colors cursor-pointer"
                      title="편집"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 편집 모달 */}
        {editingFile && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">이미지 편집</h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-[#999999] mb-2">이미지를 붙여넣으세요.</p>
                <textarea
                  value={pastedImage}
                  onChange={(e) => setPastedImage(e.target.value)}
                  className="w-full h-24 p-2 border border-[#E8EAED] rounded-lg focus:outline-none focus:border-[#2b77f5]"
                  placeholder="이미지 URL 또는 Base64 코드 붙여넣기"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleUploadImage}
                  className="px-4 py-2 bg-[#2b77f5] text-white rounded-lg hover:bg-[#2660c2] transition-colors"
                  disabled={isUploading}
                >
                  {isUploading ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}