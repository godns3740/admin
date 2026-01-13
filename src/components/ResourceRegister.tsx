import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Save, Plus, Minus, Search, ChevronDown } from 'lucide-react';
import ImagePasteInput from './ImagePasteInput';
import PatientCardPreview from './PatientCardPreview';
import PatientCardTransparent from './PatientCardTransparent';
import { uploadMultipleImages } from '../utils/cloudinary';
import { saveToSheet, updateSheet, getDesignByHspId } from '../utils/sheety';
import karechatThumb from 'figma:asset/caf9aba9a4e8e9a703ed2062051f906481e05b7f.png';

// 병원 타입 정의
interface Hospital {
  hspId: string;
  hspNm: string;
  hspTp?: string;
  storagePrefix?: string;
}

export default function ResourceRegister() {
  const navigate = useNavigate();
  const [hospitalName, setHospitalName] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalList, setHospitalList] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, imageName: '' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [colorCode, setColorCode] = useState('#');
  const [thumbnail, setThumbnail] = useState('');
  const [welcomeBlock, setWelcomeBlock] = useState('');
  const [logoColor, setLogoColor] = useState('');
  const [logoWhite, setLogoWhite] = useState('');
  const [logoHeight, setLogoHeight] = useState(30);
  const [logoLeft, setLogoLeft] = useState(24);
  const [logoTop, setLogoTop] = useState(26);
  const [patientCard, setPatientCard] = useState('');
  const [patientCardTransparent, setPatientCardTransparent] = useState('');

  // 병원 리스트 불러오기
  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoadingHospitals(true);
      try {
        const response = await fetch('https://karechat-hsp-dev.kakaohealthcare.com/manage/api/v1/hospitals?includeHspTp=true');
        
        if (!response.ok) {
          throw new Error('병원 리스트를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        console.log('병원 리스트 로드 완료:', data);
        
        // API 응답 구조에 따라 조정 필요
        // 예시: data.hospitals 또는 data.data 등
        const hospitals = Array.isArray(data) ? data : data.hospitals || data.data || [];
        setHospitalList(hospitals);
        setFilteredHospitals(hospitals);
      } catch (error) {
        console.error('병원 리스트 로드 실패:', error);
        // 에러 시 빈 배열로 설정
        setHospitalList([]);
        setFilteredHospitals([]);
      } finally {
        setIsLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색어 변경 시 필터링
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHospitals(hospitalList);
    } else {
      const filtered = hospitalList.filter(hospital =>
        hospital.hspNm.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHospitals(filtered);
    }
  }, [searchQuery, hospitalList]);

  // 병원 선택 핸들러
  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setHospitalName(hospital.hspNm);
    setSearchQuery(hospital.hspNm);
    setShowDropdown(false);
  };

  // 검색어 입력 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    
    // 검색어가 변경되면 선택 해제
    if (selectedHospital && value !== selectedHospital.hspNm) {
      setSelectedHospital(null);
      setHospitalName('');
    }
  };

  // 이미지에서 배경색 추출 함수
  const extractBackgroundColor = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      console.log('extractBackgroundColor 호출됨');
      const img = new Image();
      img.onload = () => {
        console.log('이미지 로드 완료');
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.log('ctx 없음');
          resolve('#000000');
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // 이미지의 가장자리 픽셀들을 샘플링하여 배경색 추출
        const samples: { r: number; g: number; b: number }[] = [];
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        console.log('샘플링 시작, 이미지 크기:', canvas.width, 'x', canvas.height);
        
        // 상단 가장자리 샘플링
        for (let x = 0; x < canvas.width; x += 5) {
          const idx = (0 * canvas.width + x) * 4;
          samples.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2]
          });
        }
        
        // 하단 가장자리 샘플링
        for (let x = 0; x < canvas.width; x += 5) {
          const idx = ((canvas.height - 1) * canvas.width + x) * 4;
          samples.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2]
          });
        }
        
        // 좌측 가장자리 샘플링
        for (let y = 0; y < canvas.height; y += 5) {
          const idx = (y * canvas.width + 0) * 4;
          samples.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2]
          });
        }
        
        // 우측 가장자리 샘플링
        for (let y = 0; y < canvas.height; y += 5) {
          const idx = (y * canvas.width + (canvas.width - 1)) * 4;
          samples.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2]
          });
        }
        
        console.log('총 샘플 수:', samples.length);
        
        // 평균 색상 계산
        const avgColor = samples.reduce(
          (acc, sample) => ({
            r: acc.r + sample.r,
            g: acc.g + sample.g,
            b: acc.b + sample.b
          }),
          { r: 0, g: 0, b: 0 }
        );
        
        avgColor.r = Math.round(avgColor.r / samples.length);
        avgColor.g = Math.round(avgColor.g / samples.length);
        avgColor.b = Math.round(avgColor.b / samples.length);
        
        // RGB를 HEX로 변환
        const hex = `#${avgColor.r.toString(16).padStart(2, '0')}${avgColor.g.toString(16).padStart(2, '0')}${avgColor.b.toString(16).padStart(2, '0')}`;
        console.log('추출된 색상:', hex);
        resolve(hex);
      };
      img.onerror = () => {
        console.log('이미지 로드 오류');
        resolve('#000000');
      };
      img.src = imageData;
    });
  };

  // 썸네일 이미지가 변경되면 자동으로 배경색 추출
  useEffect(() => {
    console.log('thumbnail 변경됨:', !!thumbnail);
    if (thumbnail && thumbnail.startsWith('data:image')) {
      console.log('배경색 추출 시작...');
      extractBackgroundColor(thumbnail).then((hex) => {
        console.log('컬러코드 설정:', hex);
        setColorCode(hex);
      });
    }
  }, [thumbnail]);

  const handleColorCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    if (value.length <= 7) {
      setColorCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHospital) {
      alert('병원을 선택해주세요.');
      return;
    }

    // 개별 검사 추가
    const missingFields = [];
    if (!hospitalName) missingFields.push('병원명');
    if (!colorCode || colorCode === '#') missingFields.push('컬러코드');
    if (!thumbnail) missingFields.push('썸네일');
    if (!welcomeBlock) missingFields.push('웰컴블록');
    if (!logoColor) missingFields.push('컬러 로고');
    if (!logoWhite) missingFields.push('화이트 로고');
    if (!patientCard) missingFields.push('환자카드');
    if (!patientCardTransparent) missingFields.push('환자카드 투명');

    if (missingFields.length > 0) {
      alert(`다음 항목을 입력해주세요:\n${missingFields.join(', ')}`);
      return;
    }

    if (colorCode.length !== 7) {
      alert('컬러코드는 #을 포함한 7자리여야 합니다.');
      return;
    }

    try {
      setIsUploading(true);

      // 기존 데이터 확인
      const hspId = selectedHospital.hspId;
      console.log('기존 데이터 확인 중...');
      const existingData = await getDesignByHspId(hspId);
      
      let actionMessage = '';
      if (existingData && existingData.id) {
        // 기존 데이터가 있으면 덮어쓸지 확인
        const confirmed = window.confirm(
          `${hospitalName}은(는) 이미 등록된 병원입니다.\n기존 데이터를 덮어쓰시겠습니까?`
        );
        if (!confirmed) {
          setIsUploading(false);
          return;
        }
        actionMessage = '업데이트';
      } else {
        actionMessage = '등록';
      }

      // Cloudinary에 이미지 업로드
      console.log('이미지 업로드 시작...');
      const timestamp = Date.now().toString();
      
      const imagesToUpload = [
        { base64: thumbnail, name: `${hspId}_hsp_thumb_${timestamp}`, tags: [hspId, 'hsp_thumb'] },
        { base64: welcomeBlock, name: `${hspId}_welcome_${timestamp}`, tags: [hspId, 'welcome'] },
        { base64: logoColor, name: `${hspId}_logo_color_${timestamp}`, tags: [hspId, 'logo_color'] },
        { base64: logoWhite, name: `${hspId}_logo_white_${timestamp}`, tags: [hspId, 'logo_white'] },
        { base64: patientCard, name: `${hspId}_card_${timestamp}`, tags: [hspId, 'card'] },
        { base64: patientCardTransparent, name: `${hspId}_img_${timestamp}`, tags: [hspId, 'img'] },
      ];

      const imageUrls = await uploadMultipleImages(
        imagesToUpload,
        (current, total, imageName) => {
          setUploadProgress({ current, total, imageName });
          console.log(`업로드 진행: ${current}/${total} - ${imageName}`);
        }
      );

      console.log('업로드 완료:', imageUrls);

      const sheetData = {
        hspId: String(selectedHospital.hspId), // 문자열로 변환
        hospitalName,
        storagePrefix: selectedHospital.storagePrefix || '', // storagePrefix 추가
        colorCode,
        hspThumb: imageUrls[`${hspId}_hsp_thumb_${timestamp}`],
        welcome: imageUrls[`${hspId}_welcome_${timestamp}`],
        logoColor: imageUrls[`${hspId}_logo_color_${timestamp}`],
        logoWhite: imageUrls[`${hspId}_logo_white_${timestamp}`],
        logoHeight,
        logoLeft,
        logoTop,
        card: imageUrls[`${hspId}_card_${timestamp}`],
        img: imageUrls[`${hspId}_img_${timestamp}`],
        createdAt: existingData ? existingData.createdAt : new Date().toISOString(), // 기존 데이터가 있으면 createdAt 유지
      };

      // Sheety API에 저장 또는 업데이트
      if (existingData && existingData.id) {
        console.log('Sheety 업데이트 중...');
        await updateSheet(existingData.id, sheetData);
      } else {
        console.log('Sheety에 저장 중...');
        await saveToSheet(sheetData);
      }

      setIsUploading(false);
      alert(`리소스가 성공적으로 ${actionMessage}되었습니다.`);
      
      // 폼 초기화
      setSelectedHospital(null);
      setSearchQuery('');
      setHospitalName('');
      setColorCode('#');
      setThumbnail('');
      setWelcomeBlock('');
      setLogoColor('');
      setLogoWhite('');
      setLogoHeight(30);
      setLogoLeft(24);
      setLogoTop(26);
      setPatientCard('');
      setPatientCardTransparent('');
      
      navigate('/designs');
    } catch (error) {
      setIsUploading(false);
      console.error('저장 실패:', error);
      if (error instanceof Error) {
        alert(`저장 실패: ${error.message}`);
      } else {
        alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[#2C2C2C] mb-8 text-[24px] font-bold">병원별 리소스 등록</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* 왼쪽: 입력 폼 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 기본 정보 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-gray-900 mb-4">기본 정보</h3>
                
                <div className="space-y-4">
                  {/* 병원명 */}
                  <div className="relative">
                    <label className="block text-gray-700 mb-2">
                      병원명 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full px-3 sm:px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
                        placeholder="병원명을 검색하세요"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-auto"
                        onClick={() => setShowDropdown(!showDropdown)}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    {showDropdown && (
                      <div
                        className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        ref={dropdownRef}
                      >
                        {isLoadingHospitals ? (
                          <div className="p-3 text-gray-500 text-center text-sm">로딩 중...</div>
                        ) : filteredHospitals.length > 0 ? (
                          filteredHospitals.map(hospital => (
                            <div
                              key={hospital.hspId}
                              className="px-4 py-2 cursor-pointer hover:bg-[#2b77f5] hover:text-white transition-colors text-sm"
                              onClick={() => handleSelectHospital(hospital)}
                            >
                              {hospital.hspNm}
                              {hospital.hspTp && (
                                <span className="ml-2 text-xs opacity-70">({hospital.hspTp})</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500 text-center text-sm">검색 결과가 없습니다</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 컬러코드 */}
                  <div>
                    <label className="block text-gray-700 mb-2">
                      컬러코드 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={colorCode}
                        onChange={handleColorCodeChange}
                        className="flex-1 min-w-0 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5] font-mono text-sm sm:text-base"
                        placeholder="#000000"
                        required
                      />
                      <div
                        className="w-10 h-10 rounded border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: colorCode.length === 7 ? colorCode : '#ffffff' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 이미지 리소스 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-gray-900 mb-4">이미지 리소스</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* 병원썸네일 */}
                  <ImagePasteInput
                    label="병원썸네일"
                    value={thumbnail}
                    onChange={setThumbnail}
                    width={144}
                    height={144}
                    required
                  />

                  {/* 웰컴블럭 이미지 */}
                  <ImagePasteInput
                    label="웰컴 이미지"
                    value={welcomeBlock}
                    onChange={setWelcomeBlock}
                    width={800}
                    height={400}
                    required
                  />
                </div>
              </div>

              {/* 로고 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-gray-900 mb-4">병원 가로형 로고</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* 병원 가로형 로고 (컬러) */}
                  <ImagePasteInput
                    label="컬러 버전"
                    value={logoColor}
                    onChange={setLogoColor}
                    required
                  />

                  {/* 병원 가로형 로고 (화이트) */}
                  <ImagePasteInput
                    label="화이트 버전"
                    value={logoWhite}
                    onChange={setLogoWhite}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 오른쪽: 미리보기 */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-gray-900 mb-4">환자카드 미리보기</h3>
                
                {/* 로고 높이 조절 */}
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    로고 높이 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLogoHeight(Math.max(1, logoHeight - 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex-shrink-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={logoHeight}
                      onChange={(e) => setLogoHeight(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
                      min="1"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoHeight(logoHeight + 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-gray-500 text-sm flex-shrink-0">px</span>
                  </div>
                </div>

                {/* 로고 위치 조절 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      좌측 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLogoLeft(Math.max(0, logoLeft - 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex-shrink-0"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={logoLeft}
                        onChange={(e) => setLogoLeft(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoLeft(logoLeft + 1)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-gray-500 text-sm flex-shrink-0">px</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      상단 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLogoTop(Math.max(0, logoTop - 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex-shrink-0"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={logoTop}
                        onChange={(e) => setLogoTop(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoTop(logoTop + 1)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-gray-500 text-sm flex-shrink-0">px</span>
                    </div>
                  </div>
                </div>

                {/* 미리보기 */}
                {logoWhite && colorCode.length === 7 ? (
                  <>
                    <PatientCardPreview
                      logoWhite={logoWhite}
                      logoHeight={logoHeight}
                      logoLeft={logoLeft}
                      logoTop={logoTop}
                      colorCode={colorCode}
                      onCardGenerated={setPatientCard}
                    />
                    <PatientCardTransparent
                      logoWhite={logoWhite}
                      logoHeight={logoHeight}
                      onCardGenerated={setPatientCardTransparent}
                    />
                  </>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-400">
                      화이트 로고와 컬러코드를 입력하면<br />
                      미리보기가 표시됩니다
                    </p>
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end">
                {isUploading && (
                  <div className="mr-4 text-[#2b77f5]">
                    <p className="text-sm">업로드 중... {uploadProgress.current}/{uploadProgress.total}</p>
                    <p className="text-xs text-gray-500">{uploadProgress.imageName}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center justify-center gap-2 px-[24px] py-[14px] bg-[#2b77f5] text-white text-[16px] font-medium leading-none rounded-[8px] hover:bg-[#1763E2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {isUploading ? '업로드 중...' : '등록하기'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}