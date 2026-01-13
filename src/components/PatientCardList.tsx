import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Download, Copy, Check, RefreshCw } from 'lucide-react';
import { getAllDesigns, SheetData } from '../utils/sheety';
import JSZip from 'jszip';
import karechatThumb from 'figma:asset/caf9aba9a4e8e9a703ed2062051f906481e05b7f.png';

export default function PatientCardList() {
  const [designs, setDesigns] = useState<SheetData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadDesigns = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    const data = await getAllDesigns();
    setDesigns(data);
    
    if (showRefreshIndicator) {
      setIsRefreshing(false);
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const filteredDesigns = designs.filter(design =>
    design.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    design.hspId.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // 병원ID를 숫자로 변환하여 내림차순 정렬 (큰 숫자가 위로)
    const idA = parseInt(a.hspId.replace(/\D/g, ''), 10) || 0;
    const idB = parseInt(b.hspId.replace(/\D/g, ''), 10) || 0;
    return idB - idA;
  });

  const handleCopyColor = (e: React.MouseEvent, colorCode: string, hspId: string) => {
    e.stopPropagation();
    
    // Fallback method for copying text
    const textArea = document.createElement('textarea');
    textArea.value = colorCode;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      setCopiedId(hspId);
      setTimeout(() => setCopiedId(null), 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    
    document.body.removeChild(textArea);
  };

  const handleDownloadZip = async (e: React.MouseEvent, design: SheetData) => {
    e.stopPropagation(); // 행 클릭 이벤트 전파 방지
    const zip = new JSZip();

    try {
      // URL에서 이미지를 Blob으로 다운로드하는 함수
      const urlToBlob = async (url: string): Promise<Blob> => {
        const response = await fetch(url);
        return await response.blob();
      };

      // 1. card_{hspId}.png - Cloudinary URL에서 다운로드
      const cardBlob = await urlToBlob(design.card);
      zip.file(`card_${design.hspId}.png`, cardBlob);

      // 2. img_{hspId}.png (투명 배경) - Cloudinary URL에서 다운로드
      const imgBlob = await urlToBlob(design.img);
      zip.file(`img_${design.hspId}.png`, imgBlob);

      // 3. thumb.png (고정 케어챗 로고 이미지)
      const thumbResponse = await fetch(karechatThumb);
      const thumbBlob = await thumbResponse.blob();
      zip.file('thumb.png', thumbBlob);

      // ZIP 파일 생성 및 다운로드
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `디지털환자카드_${design.hspId}.zip`;
      link.click();
    } catch (error) {
      console.error('ZIP 다운로드 실패:', error);
      alert('ZIP 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[#2C2C2C] mb-8 text-[24px] font-bold">환자카드</h2>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="병원명 또는 병원ID로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E8EAED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
            />
          </div>
        </div>

        {/* 병원 리스트 */}
        {isLoading ? (
          <div className="text-center py-16 text-[#999999]">
            로딩 중...
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="text-center py-16 text-[#999999]">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 병원이 없습니다.'}
          </div>
        ) : (
          <div className="bg-white border border-[#E8EAED] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F5F7]">
                <tr>
                  <th className="px-6 py-3 text-left text-[#666666]">병원 ID</th>
                  <th className="px-6 py-3 text-left text-[#666666]">병원명</th>
                  <th className="px-6 py-3 text-left text-[#666666]">컬러코드</th>
                  <th className="px-6 py-3 text-right text-[#666666]">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredDesigns.map((design) => (
                  <tr 
                    key={design.hspId} 
                    className={`border-t border-[#E8EAED] cursor-pointer ${hoveredButtonId !== design.hspId ? 'hover:bg-gray-50' : ''}`}
                    onClick={() => navigate(`/patient-cards/${design.hspId}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-[#666666] font-mono">
                        {design.hspId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[rgb(39,40,45)] font-semibold">
                        {design.hospitalName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: design.colorCode }}
                        />
                        <span className="text-[#666666]">{design.colorCode}</span>
                        <button
                          onClick={(e) => handleCopyColor(e, design.colorCode, design.hspId)}
                          onMouseEnter={() => setHoveredButtonId(design.hspId)}
                          onMouseLeave={() => setHoveredButtonId(null)}
                          className="flex items-center justify-center w-[44px] h-[28px] bg-[#F5F5F7] text-[#666666] rounded hover:bg-[#E8EAED] transition-colors text-sm cursor-pointer"
                        >
                          {copiedId === design.hspId ? <Check className="w-4 h-4 text-[#2b77f5]" /> : '복사'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => handleDownloadZip(e, design)}
                        onMouseEnter={() => setHoveredButtonId(design.hspId)}
                        onMouseLeave={() => setHoveredButtonId(null)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black border border-[#E8EAED] rounded-lg shadow-sm hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        ZIP 다운로드
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}