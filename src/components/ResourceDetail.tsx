import { ArrowLeft, Download, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Resource } from '../App';
import carechatThumbnail from 'figma:asset/caf9aba9a4e8e9a703ed2062051f906481e05b7f.png';

interface ResourceDetailProps {
  resource: Resource;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export default function ResourceDetail({ resource, onBack, onDelete }: ResourceDetailProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCode, setDeleteCode] = useState(['', '', '', '']);
  const [activeTab, setActiveTab] = useState<'general' | 'digitalCard'>('general');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resource.thumbnail;
    link.download = `thumb_${resource.hospitalName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadWelcomeBlock = () => {
    const link = document.createElement('a');
    link.href = resource.welcomeBlock;
    link.download = `welcome_${resource.hospitalName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadLogo = () => {
    const link = document.createElement('a');
    link.href = resource.logoImage;
    link.download = `logo_${resource.hospitalName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPatientCard = () => {
    const link = document.createElement('a');
    link.href = resource.patientCard;
    link.download = `card_환자카드_${resource.hospitalName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPatientCardImage = () => {
    const link = document.createElement('a');
    link.href = resource.patientCardImage;
    link.download = `img_환자카드_${resource.hospitalName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCarechatThumbnail = () => {
    const link = document.createElement('a');
    link.href = carechatThumbnail;
    link.download = `carechat_thumbnail.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeleteCode(['', '', '', '']);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newCode = [...deleteCode];
    newCode[index] = value;
    setDeleteCode(newCode);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !deleteCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleDeleteConfirm = () => {
    const code = deleteCode.join('');
    if (code === '0000') {
      onDelete(resource.id);
      setShowDeleteModal(false);
    } else {
      alert('코드가 올바르지 않습니다.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteCode(['', '', '', '']);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (showDeleteModal && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [showDeleteModal]);

  return (
    <>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>목록으로</span>
          </button>
          
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>삭제하기</span>
          </button>
        </div>

        <div className="max-w-6xl">
          <h2 className="text-[#2C2C2C] mb-8 text-[24px] font-bold">{resource.hospitalName}</h2>

          {/* 기본 정보 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">병원명</label>
                <p className="text-gray-900">{resource.hospitalName}</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">컬러코드</label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-900">#{resource.colorCode}</span>
                  <div
                    className="w-12 h-12 rounded border border-gray-300"
                    style={{ backgroundColor: `#${resource.colorCode}` }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">등록날짜</label>
                <p className="text-gray-600">{formatDate(resource.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-3 transition-colors ${
                  activeTab === 'general'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                일반
              </button>
              <button
                onClick={() => setActiveTab('digitalCard')}
                className={`px-6 py-3 transition-colors ${
                  activeTab === 'digitalCard'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                톡디지털카드
              </button>
            </div>
          </div>

          {/* 이미지 리소스 그리드 - 일반 탭 */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 병원 썸네일 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-gray-700 mb-4">병원 썸네일 (144x144)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
                    <img
                      src={resource.thumbnail}
                      alt={resource.hospitalName}
                      className="border border-gray-300 rounded-lg"
                      style={{ width: '144px', height: '144px', objectFit: 'contain' }}
                    />
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>다운로드</span>
                  </button>
                  <p className="text-gray-500 text-sm text-center">
                    thumb_{resource.hospitalName}.png
                  </p>
                </div>
              </div>

              {/* 웰컴블럭 이미지 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-gray-700 mb-4">웰컴블럭 이미지 (800x400)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
                    <img
                      src={resource.welcomeBlock}
                      alt={`${resource.hospitalName} 환영 메시지`}
                      className="border border-gray-300 rounded-lg max-w-full"
                      style={{ width: '100%', maxWidth: '400px', height: 'auto', objectFit: 'contain' }}
                    />
                  </div>
                  <button
                    onClick={handleDownloadWelcomeBlock}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>다운로드</span>
                  </button>
                  <p className="text-gray-500 text-sm text-center">
                    welcome_{resource.hospitalName}.png
                  </p>
                </div>
              </div>

              {/* 컬러 로고 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-gray-700 mb-4">컬러 로고 (H: {resource.logoHeight}px)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4" style={{ minHeight: '150px' }}>
                    <img
                      src={resource.logoImage}
                      alt={`${resource.hospitalName} 로고`}
                      className="border border-gray-300 rounded-lg"
                      style={{ maxHeight: '120px', width: 'auto', objectFit: 'contain' }}
                    />
                  </div>
                  <button
                    onClick={handleDownloadLogo}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>다운로드</span>
                  </button>
                  <p className="text-gray-500 text-sm text-center">
                    logo_{resource.hospitalName}.png
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 이미지 리소스 그리드 - 톡디지털카드 탭 */}
          {activeTab === 'digitalCard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 환자 카드 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-gray-700 mb-4">환자 카드 (600x840)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
                    <img
                      src={resource.patientCard}
                      alt={`${resource.hospitalName} 환자 카드`}
                      className="border border-gray-300 rounded-lg"
                      style={{ width: 'auto', maxHeight: '300px', objectFit: 'contain' }}
                    />
                  </div>
                  <button
                    onClick={handleDownloadPatientCard}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>다운로드</span>
                  </button>
                  <p className="text-gray-500 text-sm text-center">
                    card_환자카드_{resource.hospitalName}.png
                  </p>
                </div>
              </div>

              {/* 환자 카드 이미지 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-gray-700 mb-4">환자 카드 이미지 (408x255)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
                    <img
                      src={resource.patientCardImage}
                      alt={`${resource.hospitalName} 환자 카드 이미지`}
                      className="border border-gray-300 rounded-lg"
                      style={{ width: 'auto', maxHeight: '300px', objectFit: 'contain' }}
                    />
                  </div>
                  <button
                    onClick={handleDownloadPatientCardImage}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>다운로드</span>
                  </button>
                  <p className="text-gray-500 text-sm text-center">
                    img_환자카드_{resource.hospitalName}.png
                  </p>
                </div>
              </div>

              {/* Carechat 썸네일 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-gray-700 mb-4">Carechat 썸네일 (144x144)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
                    <img
                      src={carechatThumbnail}
                      alt="Carechat 썸네일"
                      className="border border-gray-300 rounded-lg"
                      style={{ width: '144px', height: '144px', objectFit: 'contain' }}
                    />
                  </div>
                  <button
                    onClick={handleDownloadCarechatThumbnail}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>다운로드</span>
                  </button>
                  <p className="text-gray-500 text-sm text-center">
                    carechat_thumbnail.png
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          }}
        >
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-gray-900 mb-2 text-center">{resource.hospitalName}을(를) 삭제하려면</h3>
            <p className="text-gray-600 mb-6 text-center">코드를 입력해주세요</p>
            
            <div className="flex gap-3 justify-center mb-8">
              {deleteCode.map((digit, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-14 h-14 text-center border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none text-2xl opacity-0 absolute inset-0"
                    ref={(el) => (inputRefs.current[index] = el)}
                  />
                  <div className="w-14 h-14 flex items-center justify-center border-b-2 border-gray-300 text-2xl pointer-events-none">
                    {digit ? '●' : ''}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}