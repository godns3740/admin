import { useEffect, useRef, useState } from 'react';
import { Upload, ChevronDown } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CLOUDINARY_CONFIG } from '../utils/cloudinary';
import { uploadToCloudinary } from '../utils/cloudinary';
import { getAllDesigns, SheetData, saveNoticeToSheet, getAllNotices, updateNoticeInSheet, deleteNoticeFromSheet } from '../utils/sheety';
import { DraggableHospitalItem } from './DraggableHospitalItem';
import { DroppableLineArea } from './DroppableLineArea';

// 피그마 이미지 import
import chIconImg from 'figma:asset/f64f75d43f47629c71ca46de26b3629188b30fcb.png';
import plusIconImg from 'figma:asset/e6c2c55cebc93a8bf8ed501b47faa4e878fe33ea.png';
import newOpenImg from 'figma:asset/6f1d9968ca43ccf2cd982ff2a3270e5d373e278a.png';
import xIconImg from 'figma:asset/99e4a2cd7796044dcf858dbdb3e5a2bfbd588923.png';
import kakaoHealthcareImg from 'figma:asset/334ae38063b03083f6b73c13ce88e2f4f028cafe.png';
import svgPaths from '../imports/svg-6zjy039297';
import multipleTopOneLineImg from 'figma:asset/636222859d3a34220555d4df281f32bb553d5915.png';
import multipleTopTwoLinesImg from 'figma:asset/0fc462cd4a6ea2183a359df5aa7d6c8e794963be.png';
import multipleBgImg from 'figma:asset/91da1b4ca95b70a6e0c9f4f7ce305abef8a2e860.png';

interface Hospital {
  hspId: string;
  hspNm: string;
  hspTp?: string;
  logoWhite?: string; // Cloudinary URL
  colorCode?: string;
}

interface SelectedHospital {
  hspId: string;
  hspNm: string;
  channelName: string;
  colorCode: string;
  gradientColor: string; // 그라데이션 어두운 색상
  logoWhite: string;
  line?: 1 | 2; // 복수 등록 시 줄 정보
}

export default function NoticeImageRegister() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'single' | 'multiple'>('single');
  
  const [hospitalList, setHospitalList] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  
  const [selectedHospitals, setSelectedHospitals] = useState<SelectedHospital[]>([]);
  const [sheetyData, setSheetyData] = useState<Map<string, { colorCode: string }>>(new Map());
  
  // 이미지 생성 설정
  const [logoSymbolX, setLogoSymbolX] = useState(480);
  const [logoSymbolY, setLogoSymbolY] = useState(60);
  const [logoSymbolScale, setLogoSymbolScale] = useState(0.8);
  
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  
  // 병원 리스트 불러오기 (Sheety 기반)
  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoadingHospitals(true);
      try {
        // Sheety에서 병원별 디자인 데이터 조회
        const sheetyDesigns = await getAllDesigns();
        console.log('Sheety 디자인 데이터:', sheetyDesigns);
        
        // 첫 번째 데이터 상세 확인
        if (sheetyDesigns.length > 0) {
          console.log('첫 번째 데이터 샘플:', sheetyDesigns[0]);
          console.log('모든 키:', Object.keys(sheetyDesigns[0]));
        }
        
        // Sheety 데이터를 Hospital 형식으로 변환
        const hospitals = sheetyDesigns.map((design) => ({
          hspId: design.hspId,
          hspNm: design.hospitalName,
          logoWhite: design.logoWhite, // Cloudinary URL
          colorCode: design.colorCode,
        }));
        
        console.log('변환된 병원 리스트:', hospitals);
        
        setHospitalList(hospitals);
        setFilteredHospitals(hospitals);
      } catch (error) {
        console.error('병원 리스트 로드 실패:', error);
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

  // 검색어 입력 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
  };

  // 병원 선택 핸들러
  const handleSelectHospital = (hospital: Hospital) => {
    const hospitalColorCode = hospital.colorCode || '#2b77f5';
    const hospitalGradientColor = darkenColor(hospitalColorCode, 60);
    
    console.log('선택된 병원:', hospital);
    console.log('logoWhite URL:', hospital.logoWhite || '없음');
    
    // 단일 탭에서는 한 개만 선택 가능
    if (activeTab === 'single') {
      setSelectedHospitals([
        {
          hspId: hospital.hspId,
          hspNm: hospital.hspNm,
          channelName: hospital.hspNm, // 기본값: 병원명
          colorCode: hospitalColorCode,
          gradientColor: hospitalGradientColor, // 그라데이션 어두운 색상
          logoWhite: hospital.logoWhite || '', // Cloudinary URL 직접 사용
        },
      ]);
    } else {
      // 복수 탭에서는 이미 선택된 병원인지 확인
      if (selectedHospitals.some(h => h.hspId === hospital.hspId)) {
        alert('이미 선택된 병원입니다.');
        return;
      }

      // 선택된 병원 목록에 추가 (기본적으로 첫 번째 줄에 추가)
      setSelectedHospitals([
        ...selectedHospitals,
        {
          hspId: hospital.hspId,
          hspNm: hospital.hspNm,
          channelName: hospital.hspNm, // 기본값: 병원명
          colorCode: hospitalColorCode,
          gradientColor: hospitalGradientColor, // 그라데이션 어두운 색상
          logoWhite: hospital.logoWhite || '', // Cloudinary URL 직접 사용
          line: 1, // 기본적으로 첫 번째 줄에 추가
        },
      ]);
    }
    
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeHospital = (hspId: string) => {
    setSelectedHospitals(selectedHospitals.filter(h => h.hspId !== hspId));
  };

  const updateChannelName = (hspId: string, channelName: string) => {
    setSelectedHospitals(
      selectedHospitals.map(h =>
        h.hspId === hspId ? { ...h, channelName } : h
      )
    );
  };

  const updateColorCode = (hspId: string, colorCode: string) => {
    setSelectedHospitals(
      selectedHospitals.map(h =>
        h.hspId === hspId ? { ...h, colorCode, gradientColor: darkenColor(colorCode, 60) } : h
      )
    );
  };

  const moveHospital = (dragIndex: number, hoverIndex: number) => {
    const dragHospital = selectedHospitals[dragIndex];
    const newHospitals = [...selectedHospitals];
    newHospitals.splice(dragIndex, 1);
    newHospitals.splice(hoverIndex, 0, dragHospital);
    setSelectedHospitals(newHospitals);
  };

  // 복수 등록 - 줄별로 병원 이동
  const moveHospitalWithLine = (dragIndex: number, hoverIndex: number, fromLine: 1 | 2, toLine: 1 | 2) => {
    const lineOneHospitals = selectedHospitals.filter(h => h.line === 1);
    const lineTwoHospitals = selectedHospitals.filter(h => h.line === 2);
    
    // 같은 줄 내에서 이동
    if (fromLine === toLine) {
      const lineHospitals = fromLine === 1 ? lineOneHospitals : lineTwoHospitals;
      const dragHospital = lineHospitals[dragIndex];
      lineHospitals.splice(dragIndex, 1);
      lineHospitals.splice(hoverIndex, 0, dragHospital);
      
      // 업데이트된 배열 합치기
      if (fromLine === 1) {
        setSelectedHospitals([...lineHospitals, ...lineTwoHospitals]);
      } else {
        setSelectedHospitals([...lineOneHospitals, ...lineHospitals]);
      }
    } else {
      // 다른 줄로 이동
      const sourceArray = fromLine === 1 ? lineOneHospitals : lineTwoHospitals;
      const targetArray = toLine === 1 ? lineOneHospitals : lineTwoHospitals;
      
      const dragHospital = sourceArray[dragIndex];
      dragHospital.line = toLine; // 줄 정보 업데이트
      
      sourceArray.splice(dragIndex, 1);
      targetArray.splice(hoverIndex, 0, dragHospital);
      
      setSelectedHospitals([...lineOneHospitals, ...lineTwoHospitals]);
    }
  };

  // HEX 색상을 더 어둡게 만드는 함수
  const darkenColor = (hex: string, percent: number = 50): string => {
    // HEX를 RGB로 변환
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // 각 채널을 어둡게
    const darkenChannel = (channel: number) => Math.max(0, Math.floor(channel * (1 - percent / 100)));
    
    const newR = darkenChannel(r);
    const newG = darkenChannel(g);
    const newB = darkenChannel(b);
    
    // RGB를 다시 HEX로 변환
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  // 미리보기 이미지 생성
  useEffect(() => {
    if (selectedHospitals.length > 0) {
      generatePreviewImage();
    } else {
      setPreviewImage('');
    }
  }, [selectedHospitals, logoSymbolX, logoSymbolY, logoSymbolScale, activeTab]);

  const generatePreviewImage = async () => {
    if (selectedHospitals.length === 0) return;
    
    const firstHospital = selectedHospitals[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const scale = 2;
    canvas.width = 950 * scale;
    canvas.height = 950 * scale;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.scale(scale, scale);

    // 복수 등록인지 단일 등록인지에 따라 다른 이미지 생성
    if (activeTab === 'multiple') {
      // 복수 등록: 완전히 다른 디자인
      await generateMultipleNoticePreview(ctx, selectedHospitals);
    } else {
      // 단일 등록: 기존 디자인
      await generateSingleNoticePreview(ctx, firstHospital);
    }

    // 미리보기 이미지 생성 - JPEG 형식으로 변환하여 용량 절감
    const imageData = canvas.toDataURL('image/jpeg', 0.92);
    setPreviewImage(imageData);
  };

  // 단일 등록 이미지 생성
  const generateSingleNoticePreview = async (ctx: CanvasRenderingContext2D, hospital: SelectedHospital) => {
    // 1. 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, 950);
    gradient.addColorStop(0, '#1e2126');
    gradient.addColorStop(0.39316, '#1e2126');
    const gradientColor = hospital.gradientColor || darkenColor(hospital.colorCode || '#2b77f5', 60);
    gradient.addColorStop(1, gradientColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 950, 950);

    // 2. 우측 상단 로고 심볼 (투명도 20%, 크게)
    if (hospital.logoWhite) {
      try {
        const logoImg = await loadImage(hospital.logoWhite);
        ctx.globalAlpha = 0.2;
        const symbolWidth = logoImg.width * logoSymbolScale;
        const symbolHeight = logoImg.height * logoSymbolScale;
        ctx.drawImage(logoImg, logoSymbolX, logoSymbolY, symbolWidth, symbolHeight);
        ctx.globalAlpha = 1;
      } catch (error) {
        // 로고가 없어도 계속 진행
      }
    }

    // 3. NEW OPEN 이미지
    try {
      const newOpenImage = await loadImage(newOpenImg);
      const newOpenWidth = 697;
      const newOpenHeight = 950;
      ctx.drawImage(newOpenImage, 0, 0, newOpenWidth, newOpenHeight);
    } catch (error) {
      console.error('NEW OPEN 이미지 로드 실패:', error);
    }

    // 4. 채널명 배지
    await drawChannelBadge(ctx, hospital.channelName);

    // 5. 하단 컬러바
    ctx.fillStyle = hospital.colorCode;
    ctx.fillRect(0, 830, 950, 120);

    // 6. 하단 로고 및 텍스트
    if (hospital.logoWhite) {
      try {
        const logoImg = await loadImage(hospital.logoWhite);
        const xImg = await loadImage(xIconImg);
        const kakaoImg = await loadImage(kakaoHealthcareImg);
        
        const logoHeight = 30;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        const xHeight = 19;
        const xWidth = (xImg.width / xImg.height) * xHeight;
        const kakaoHeight = 24;
        const kakaoWidth = (kakaoImg.width / kakaoImg.height) * kakaoHeight;
        
        const centerX = 475;
        const gap = 18;
        const totalWidth = logoWidth + gap + xWidth + gap + kakaoWidth;
        const startX = centerX - totalWidth / 2;
        
        ctx.drawImage(logoImg, startX, 890 - logoHeight / 2, logoWidth, logoHeight);
        ctx.drawImage(xImg, startX + logoWidth + gap, 890 - xHeight / 2, xWidth, xHeight);
        ctx.drawImage(kakaoImg, startX + logoWidth + gap + xWidth + gap, 890 - kakaoHeight / 2, kakaoWidth, kakaoHeight);
      } catch (error) {
        // 로고가 없어도 계속 진행
      }
    }
  };

  // 복수 등록 이미지 생성 (Figma 디자인)
  const generateMultipleNoticePreview = async (ctx: CanvasRenderingContext2D, hospitals: SelectedHospital[]) => {
    // 1. 배경 이미지 사용
    try {
      const bgImg = await loadImage(multipleBgImg);
      ctx.drawImage(bgImg, 0, 0, 950, 950);
    } catch (error) {
      console.error('배경 이미지 로드 실패:', error);
      // 실패 시 기존 방식 사용
      ctx.fillStyle = '#1e2126';
      ctx.fillRect(0, 0, 950, 950);
    }

    // 2. 줄별로 병원 분리 (line 속성 기반)
    const lineOneHospitals = hospitals.filter(h => h.line === 1);
    const lineTwoHospitals = hospitals.filter(h => h.line === 2);
    const isMultipleRows = lineTwoHospitals.length > 0; // 2줄에 병원이 있으면 2줄 레이아웃
    
    // 3. 상단 PNG 이미지 사용 (NEW OPEN + 장식 포함)
    const topY = isMultipleRows ? 148 : 177; // 2줄일 때: 148px, 1줄일 때: 177px
    
    try {
      const topImg = await loadImage(isMultipleRows ? multipleTopTwoLinesImg : multipleTopOneLineImg);
      // 이미지 비율 유지하면서 834px 너비에 맞춤
      const imgWidth = 834;
      const imgHeight = (topImg.height / topImg.width) * imgWidth;
      const imgX = 58;
      ctx.drawImage(topImg, imgX, topY, imgWidth, imgHeight);
    } catch (error) {
      console.error('상단 이미지 로드 실패:', error);
    }

    // 4. 병원명 배지 영역
    const gap = isMultipleRows ? 40 : 50; // 2줄일 때: 40px, 1줄일 때: 50px
    // PNG 이미지 높이: 1줄=374px, 2줄=376px
    const imgHeight = isMultipleRows ? 376 : 374;
    const badgeBoxY = topY + imgHeight + gap;
    const badgeBoxX = 58;
    const badgeBoxWidth = 834;
    const badgeBoxPadding = 44;
    const badgePadding = 29.445;
    const badgeHeight = 55.806;
    const badgeGap = 18.403;
    
    // 각 배지 너비 계산 (줄별로)
    ctx.font = '500 25.764px Pretendard';
    const lineOneBadgeWidths: number[] = [];
    const lineTwoBadgeWidths: number[] = [];
    
    for (const hospital of lineOneHospitals) {
      const nameWidth = ctx.measureText(hospital.channelName).width;
      lineOneBadgeWidths.push(badgePadding * 2 + nameWidth);
    }
    
    for (const hospital of lineTwoHospitals) {
      const nameWidth = ctx.measureText(hospital.channelName).width;
      lineTwoBadgeWidths.push(badgePadding * 2 + nameWidth);
    }
    
    // 줄 수 계산 (1줄 또는 2줄)
    const rows: { hospitals: SelectedHospital[], widths: number[] }[] = [];
    if (lineOneHospitals.length > 0) {
      rows.push({ hospitals: lineOneHospitals, widths: lineOneBadgeWidths });
    }
    if (lineTwoHospitals.length > 0) {
      rows.push({ hospitals: lineTwoHospitals, widths: lineTwoBadgeWidths });
    }
    
    // 테두리 박스 높이 계산
    const badgeBoxHeight = badgeBoxPadding * 2 + rows.length * badgeHeight + (rows.length - 1) * badgeGap;
    
    // 반투명 배경
    ctx.fillStyle = 'rgba(255, 219, 30, 0.02)';
    ctx.beginPath();
    ctx.roundRect(badgeBoxX, badgeBoxY, badgeBoxWidth, badgeBoxHeight, 35);
    ctx.fill();
    
    // 테두리
    ctx.strokeStyle = '#988a41';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeBoxX, badgeBoxY, badgeBoxWidth, badgeBoxHeight, 35);
    ctx.stroke();
    
    // 배지 그리기
    let currentY = badgeBoxY + badgeBoxPadding;
    
    for (const row of rows) {
      const { hospitals: rowHospitals, widths: rowWidths } = row;
      
      // 각 행의 총 너비 계산
      let rowWidth = 0;
      for (const width of rowWidths) {
        rowWidth += width;
      }
      rowWidth += (rowWidths.length - 1) * badgeGap;
      
      // 중앙 정렬을 위한 시작 X 좌표
      let currentX = badgeBoxX + (badgeBoxWidth - rowWidth) / 2;
      
      for (let i = 0; i < rowHospitals.length; i++) {
        const hospital = rowHospitals[i];
        const badgeWidth = rowWidths[i];
        
        // 배지 배경
        ctx.fillStyle = '#16181b';
        ctx.beginPath();
        ctx.roundRect(currentX, currentY, badgeWidth, badgeHeight, 92.015);
        ctx.fill();
        
        // 병원명 텍스트
        ctx.font = '500 25.764px Pretendard';
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.9;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hospital.channelName, currentX + badgeWidth / 2, currentY + badgeHeight / 2);
        ctx.globalAlpha = 1;
        
        currentX += badgeWidth + badgeGap;
      }
      
      currentY += badgeHeight + badgeGap;
    }

    // 5. 하단 kakaohealthcare 로고
    try {
      const kakaoImg = await loadImage(kakaoHealthcareImg);
      const logoY = isMultipleRows ? 865 : 833;
      const logoWidth = 229.531;
      const logoHeight = 24.001;
      const logoX = (950 - logoWidth) / 2;
      ctx.drawImage(kakaoImg, logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('kakaohealthcare 로고 로드 실패:', error);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        console.log('이미지 로드 성공:', src);
        resolve(img);
      };
      img.onerror = (error) => {
        console.error('이미지 로드 실패:', src, error);
        reject(error);
      };
      
      // Figma import 이미지는 그대로 사용
      if (src.startsWith('data:') || src.startsWith('blob:') || src.includes('figma:asset')) {
        console.log('Figma 이미지 로드:', src.substring(0, 50) + '...');
        img.src = src;
        return;
      }
      
      // storagePrefix 경로를 Cloudinary URL로 변환
      // 예: "msystech/sunn/logo_white" -> Cloudinary URL
      if (!src.startsWith('http')) {
        const publicId = src;
        const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${publicId}.png`;
        console.log('Cloudinary URL 생성:', cloudinaryUrl);
        img.src = cloudinaryUrl;
      } else {
        img.src = src;
      }
    });
  };

  const generateNoticeImage = async (hospital: SelectedHospital): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas context not available');

    const scale = 2;
    canvas.width = 950 * scale;
    canvas.height = 950 * scale;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.scale(scale, scale);

    // 복수 등록인지 단일 등록인지에 따라 다른 이미지 생성
    if (activeTab === 'multiple') {
      // 복수 등록: 완전히 다른 디자인
      await generateMultipleNoticeImage(ctx, hospital);
    } else {
      // 단일 등록: 기존 디자인
      await generateSingleNoticeImage(ctx, hospital);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
  };

  // 단일 등록용 이미지 생성
  const generateSingleNoticeImage = async (ctx: CanvasRenderingContext2D, hospital: SelectedHospital) => {
    // 1. 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, 950);
    gradient.addColorStop(0, '#1e2126');
    gradient.addColorStop(0.39316, '#1e2126');
    const gradientColor = hospital.gradientColor || darkenColor(hospital.colorCode || '#2b77f5', 60);
    gradient.addColorStop(1, gradientColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 950, 950);

    // 2. 우측 상단 로고 심볼 (투명도 20%, 크게)
    if (hospital.logoWhite) {
      try {
        const logoImg = await loadImage(hospital.logoWhite);
        ctx.globalAlpha = 0.2;
        const symbolWidth = logoImg.width * logoSymbolScale;
        const symbolHeight = logoImg.height * logoSymbolScale;
        ctx.drawImage(logoImg, logoSymbolX, logoSymbolY, symbolWidth, symbolHeight);
        ctx.globalAlpha = 1;
      } catch (error) {
        // 로고가 없어도 계속 진행
      }
    }

    // 3. NEW OPEN 이미지
    try {
      const newOpenImage = await loadImage(newOpenImg);
      const newOpenWidth = 697;
      const newOpenHeight = 950;
      ctx.drawImage(newOpenImage, 0, 0, newOpenWidth, newOpenHeight);
    } catch (error) {
      console.error('NEW OPEN 이미지 로드 실패:', error);
    }

    // 4. 채널명 배지
    await drawChannelBadge(ctx, hospital.channelName);

    // 5. 하단 컬러바
    ctx.fillStyle = hospital.colorCode;
    ctx.fillRect(0, 830, 950, 120);

    // 6. 하단 로고 및 텍스트
    if (hospital.logoWhite) {
      try {
        const logoImg = await loadImage(hospital.logoWhite);
        const xImg = await loadImage(xIconImg);
        const kakaoImg = await loadImage(kakaoHealthcareImg);
        
        const logoHeight = 30;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        const xHeight = 19;
        const xWidth = (xImg.width / xImg.height) * xHeight;
        const kakaoHeight = 24;
        const kakaoWidth = (kakaoImg.width / kakaoImg.height) * kakaoHeight;
        
        const centerX = 475;
        const gap = 18;
        const totalWidth = logoWidth + gap + xWidth + gap + kakaoWidth;
        const startX = centerX - totalWidth / 2;
        
        ctx.drawImage(logoImg, startX, 890 - logoHeight / 2, logoWidth, logoHeight);
        ctx.drawImage(xImg, startX + logoWidth + gap, 890 - xHeight / 2, xWidth, xHeight);
        ctx.drawImage(kakaoImg, startX + logoWidth + gap + xWidth + gap, 890 - kakaoHeight / 2, kakaoWidth, kakaoHeight);
      } catch (error) {
        // 로고가 없어도 계속 진행
      }
    }
  };

  // 복수 등록용 이미지 생성 (개별 병원)
  const generateMultipleNoticeImage = async (ctx: CanvasRenderingContext2D, hospital: SelectedHospital) => {
    // 1. 배경 이미지 사용
    try {
      const bgImg = await loadImage(multipleBgImg);
      ctx.drawImage(bgImg, 0, 0, 950, 950);
    } catch (error) {
      console.error('배경 이미지 로드 실패:', error);
      // 실패 시 존 방식 사용
      ctx.fillStyle = '#1e2126';
      ctx.fillRect(0, 0, 950, 950);
    }

    // 2. 상단 PNG 이미지 - 단일 병원이므로 1줄 이미지 사용
    const topY = 177;
    
    try {
      const topImg = await loadImage(multipleTopOneLineImg);
      const imgWidth = 834;
      const imgHeight = (topImg.height / topImg.width) * imgWidth;
      const imgX = 58;
      ctx.drawImage(topImg, imgX, topY, imgWidth, imgHeight);
    } catch (error) {
      console.error('상단 이미지 로드 실패:', error);
    }

    // 4. 병원명 배지 영역 (단일)
    const gap = 50;
    const imgHeight = 374;
    const badgeBoxY = topY + imgHeight + gap;
    const badgeBoxX = 58;
    const badgeBoxWidth = 834;
    const badgeBoxPadding = 44;
    const badgePadding = 29.445;
    const badgeHeight = 55.806;
    
    // 배지 너비 계산
    ctx.font = '500 25.764px Pretendard';
    const nameWidth = ctx.measureText(hospital.channelName).width;
    const badgeWidth = badgePadding * 2 + nameWidth;
    
    // 테두리 박스 높이
    const badgeBoxHeight = badgeBoxPadding * 2 + badgeHeight;
    
    // 반투명 배경
    ctx.fillStyle = 'rgba(255, 219, 30, 0.02)';
    ctx.beginPath();
    ctx.roundRect(badgeBoxX, badgeBoxY, badgeBoxWidth, badgeBoxHeight, 35);
    ctx.fill();
    
    // 테두리
    ctx.strokeStyle = '#988a41';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeBoxX, badgeBoxY, badgeBoxWidth, badgeBoxHeight, 35);
    ctx.stroke();
    
    // 배지 그리기 (중앙 정렬)
    const badgeX = badgeBoxX + (badgeBoxWidth - badgeWidth) / 2;
    const badgeY = badgeBoxY + badgeBoxPadding;
    
    // 배지 배경
    ctx.fillStyle = '#16181b';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 92.015);
    ctx.fill();
    
    // 병원명 텍스트
    ctx.font = '500 25.764px Pretendard';
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.9;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hospital.channelName, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
    ctx.globalAlpha = 1;

    // 5. 하단 kakaohealthcare 로고
    try {
      const kakaoImg = await loadImage(kakaoHealthcareImg);
      const logoY = 833;
      const logoWidth = 229.531;
      const logoHeight = 24.001;
      const logoX = (950 - logoWidth) / 2;
      ctx.drawImage(kakaoImg, logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('kakaohealthcare 로고 로드 실패:', error);
    }
  };

  const drawChannelBadge = async (ctx: CanvasRenderingContext2D, channelName: string) => {
    const badgeY = 696;
    const badgeHeight = 74;
    const badgePadding = 20.223;
    
    ctx.font = '600 30.335px Pretendard';
    const channelNameWidth = ctx.measureText(channelName).width;
    
    const chIconSize = 47.54;
    const plusIconSize = 29;
    const gap = 9.709;
    const badgeWidth = badgePadding * 2 + chIconSize + gap + channelNameWidth + gap + plusIconSize;
    
    // 배지 배경
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(80, badgeY, badgeWidth, badgeHeight, 21.609);
    ctx.fill();

    // Ch 아이콘
    try {
      const chImg = await loadImage(chIconImg);
      const chX = 80 + badgePadding;
      const chY = badgeY + (badgeHeight - chIconSize) / 2;
      ctx.drawImage(chImg, chX, chY, chIconSize, chIconSize);
    } catch (error) {
      // 아이콘 로드 실패 시 무시
    }

    // 채널명
    ctx.font = '600 30.335px Pretendard';
    ctx.fillStyle = '#24272c';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const channelNameX = 80 + badgePadding + chIconSize + gap;
    ctx.fillText(channelName, channelNameX, badgeY + badgeHeight / 2);

    // + 아이콘
    try {
      const plusImg = await loadImage(plusIconImg);
      const plusX = channelNameX + channelNameWidth + gap;
      const plusY = badgeY + (badgeHeight - plusIconSize) / 2;
      ctx.drawImage(plusImg, plusX, plusY, plusIconSize, plusIconSize);
    } catch (error) {
      // 아이콘 로드 실패 시 무시
    }
  };

  const handleRegister = async () => {
    if (selectedHospitals.length === 0) {
      alert('병원을 선택해주세요.');
      return;
    }

    // 채널명 확인
    const emptyChannelName = selectedHospitals.find(h => !h.channelName.trim());
    if (emptyChannelName) {
      alert('모든 병원의 채널명을 입력해주세요.');
      return;
    }

    if (!confirm(`${selectedHospitals.length}개 병원에 공지 이미지를 등록하시겠습니까?`)) {
      return;
    }

    setIsUploading(true);

    try {
      let successCount = 0;
      const uploadResults: { hospital: string; url: string }[] = [];
      
      for (const hospital of selectedHospitals) {
        try {
          // 1. 이미지 생성
          const blob = await generateNoticeImage(hospital);
          
          // 2. Cloudinary 업로드
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
          formData.append('folder', 'notice_images');
          formData.append('public_id', `${hospital.hspId}_${Date.now()}`);

          const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!cloudinaryResponse.ok) {
            throw new Error('Cloudinary 업로드 실패');
          }

          const cloudinaryData = await cloudinaryResponse.json();
          uploadResults.push({
            hospital: hospital.hspNm,
            url: cloudinaryData.secure_url,
          });

          // 3. Sheety에 메타데이터 저장 또는 업데이트
          try {
            // 기존 Notice 데이터 조회
            const existingNotices = await getAllNotices();
            const existingNotice = existingNotices.find(
              notice => notice.hspId === hospital.hspId && notice.noticeType === activeTab
            );

            if (existingNotice && existingNotice.id) {
              // 기존 데이터가 있으면 덮어쓰기 (UPDATE)
              await updateNoticeInSheet(existingNotice.id, {
                cloudinaryUrl: cloudinaryData.secure_url,
                publicId: cloudinaryData.public_id,
                createdAt: new Date().toISOString(),
                uniqueKey: `${hospital.hspId}_${activeTab}_${Date.now()}`, // 새로운 고유 키
              });
              console.log(`${hospital.hspNm} (${activeTab}) 덮어쓰기 완료`);
            } else {
              // 기존 데이터가 없으면 새로 추가 (POST)
              await saveNoticeToSheet({
                hspId: hospital.hspId,
                hospitalName: hospital.hspNm,
                noticeType: activeTab, // 단일/복수 구분
                cloudinaryUrl: cloudinaryData.secure_url,
                publicId: cloudinaryData.public_id,
                createdAt: new Date().toISOString(),
                uniqueKey: `${hospital.hspId}_${activeTab}_${Date.now()}`, // 고유 키 생성
              });
              console.log(`${hospital.hspNm} (${activeTab}) 신규 등록 완료`);
            }
          } catch (sheetyError) {
            // Sheety 저장 실패해도 계속 진행 (Cloudinary 업로드는 성공)
            console.warn(`${hospital.hspNm} Sheety 저장 실패 (건너뜀):`, sheetyError);
          }

          successCount++;
        } catch (error) {
          console.error(`${hospital.hspNm} 등록 실패:`, error);
        }
      }

      // 업로드된 URL 콘솔에 출력 (Sheety 저장 실패 시 참고용)
      if (uploadResults.length > 0) {
        console.log('업로드된 이미지 URL:');
        uploadResults.forEach(result => {
          console.log(`- ${result.hospital}: ${result.url}`);
        });
      }

      if (successCount > 0) {
        alert(
          `${successCount}개 병원에 공지 이미지가 등록되었습니다.\n\n` +
          `※ Sheety POST가 비활성화되어 있어 Google Sheets에 저장되지 않았습니다.\n` +
          `이미지는 Cloudinary에 업로드되었으며, URL은 콘솔에서 확인할 수 있습니다.`
        );
      } else {
        alert('공지 이미지 등록에 실패했습니다.');
      }
      
      setSelectedHospitals([]);
      
    } catch (error) {
      console.error('등록 실패:', error);
      alert('공지 이미지 등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="h-full flex flex-col bg-white">
      <div className="p-8 pb-0">
        <h2 className="text-[#2C2C2C] text-[24px] font-bold mb-6">공지 이미지 등록</h2>
        
        {/* 탭 */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('single');
              setSelectedHospitals([]);
            }}
            className={`px-6 py-3 transition-colors relative ${
              activeTab === 'single'
                ? 'text-[#2b77f5]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            단일 등록
            {activeTab === 'single' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2b77f5]"></div>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('multiple');
              setSelectedHospitals([]);
            }}
            className={`px-6 py-3 transition-colors relative ${
              activeTab === 'multiple'
                ? 'text-[#2b77f5]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            복수 등록
            {activeTab === 'multiple' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2b77f5]"></div>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 좌측: 병원 선택 및 설정 */}
            <div className="space-y-6">
              {activeTab === 'single' ? (
                // 단일 등록: 통합 UI
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-gray-900 mb-4">병원 선택 및 설정</h3>
                  
                  {/* 병원 검색 */}
                  <div className="relative mb-4">
                    <label className="block text-gray-700 mb-2">병원명 검색</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={selectedHospitals.length > 0 ? selectedHospitals[0].hspNm : searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
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
                          filteredHospitals.map(hospital => {
                            const isSelected = selectedHospitals.some(h => h.hspId === hospital.hspId);
                            return (
                              <div
                                key={hospital.hspId}
                                className={`px-4 py-2 text-sm flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    : 'cursor-pointer hover:bg-[#2b77f5] hover:text-white transition-colors'
                                }`}
                                onClick={() => {
                                  if (!isSelected) {
                                    handleSelectHospital(hospital);
                                  }
                                }}
                              >
                                <span>
                                  {hospital.hspNm}
                                  {hospital.hspTp && (
                                    <span className="ml-2 text-xs opacity-70">({hospital.hspTp})</span>
                                  )}
                                </span>
                                {isSelected && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded">
                                    선택됨
                                  </span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 text-gray-500 text-center text-sm">검색 결과가 없습니다</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 선택된 병원 설정 */}
                  {selectedHospitals.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">채널명</label>
                        <input
                          type="text"
                          value={selectedHospitals[0].channelName}
                          onChange={(e) => updateChannelName(selectedHospitals[0].hspId, e.target.value)}
                          placeholder="병원 채널명을 확인해주세요"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">그라데이션 하단 컬러 (어두운 색상)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedHospitals[0].gradientColor}
                            onChange={(e) => {
                              setSelectedHospitals(
                                selectedHospitals.map(h =>
                                  h.hspId === selectedHospitals[0].hspId ? { ...h, gradientColor: e.target.value } : h
                                )
                              );
                            }}
                            className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedHospitals[0].gradientColor}
                            onChange={(e) => {
                              setSelectedHospitals(
                                selectedHospitals.map(h =>
                                  h.hspId === selectedHospitals[0].hspId ? { ...h, gradientColor: e.target.value } : h
                                )
                              );
                            }}
                            placeholder="#1a4b9c"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // 복수 등록: 분리된 UI
                <>
                  {/* 병원 검색 및 추가 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-gray-900 mb-4">병원 선택</h3>
                    
                    <div className="relative">
                      <label className="block text-gray-700 mb-2">병원명 검색</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onFocus={() => setShowDropdown(true)}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b77f5]"
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
                            filteredHospitals.map(hospital => {
                              const isSelected = selectedHospitals.some(h => h.hspId === hospital.hspId);
                              return (
                                <div
                                  key={hospital.hspId}
                                  className={`px-4 py-2 text-sm flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                      : 'cursor-pointer hover:bg-[#2b77f5] hover:text-white transition-colors'
                                  }`}
                                  onClick={() => {
                                    if (!isSelected) {
                                      handleSelectHospital(hospital);
                                    }
                                  }}
                                >
                                  <span>
                                    {hospital.hspNm}
                                    {hospital.hspTp && (
                                      <span className="ml-2 text-xs opacity-70">({hospital.hspTp})</span>
                                    )}
                                  </span>
                                  {isSelected && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded">
                                      선택됨
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-3 text-gray-500 text-center text-sm">검색 결과가 없습니다</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 선택된 병원 목록 - 드래그 앤 드롭 (줄별 구분) */}
                  {selectedHospitals.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-gray-900 mb-4">
                        선택된 병원 ({selectedHospitals.length}개)
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        드래그하여 줄 간 이동 및 순서 조정이 가능합니다
                      </p>
                      
                      {/* 첫 번째 줄 */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">첫 번째 줄</h4>
                          <span className="text-xs text-gray-500">
                            {selectedHospitals.filter(h => h.line === 1).length}개
                          </span>
                        </div>
                        <DroppableLineArea
                          line={1}
                          hospitals={selectedHospitals.filter(h => h.line === 1)}
                          moveHospital={moveHospitalWithLine}
                          removeHospital={removeHospital}
                        />
                      </div>

                      {/* 두 번째 줄 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">두 번째 줄</h4>
                          <span className="text-xs text-gray-500">
                            {selectedHospitals.filter(h => h.line === 2).length}개
                          </span>
                        </div>
                        <DroppableLineArea
                          line={2}
                          hospitals={selectedHospitals.filter(h => h.line === 2)}
                          moveHospital={moveHospitalWithLine}
                          removeHospital={removeHospital}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 이미지 생성 옵션 - 단일 등록에서만 표시 */}
              {activeTab === 'single' && selectedHospitals.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-gray-900 mb-4">이미지 생성 옵션</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">로고 심볼 위치 및 크기</label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 w-20">X:</span>
                          <input
                            type="range"
                            min="300"
                            max="700"
                            value={logoSymbolX}
                            onChange={(e) => setLogoSymbolX(Number(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-gray-600 w-16">{logoSymbolX}px</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 w-20">Y:</span>
                          <input
                            type="range"
                            min="0"
                            max="300"
                            value={logoSymbolY}
                            onChange={(e) => setLogoSymbolY(Number(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-gray-600 w-16">{logoSymbolY}px</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 w-20">크기:</span>
                          <input
                            type="range"
                            min="0.3"
                            max="2"
                            step="0.1"
                            value={logoSymbolScale}
                            onChange={(e) => setLogoSymbolScale(Number(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-gray-600 w-16">{logoSymbolScale.toFixed(1)}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 등록 버튼 */}
              {selectedHospitals.length > 0 && (
                <button
                  onClick={handleRegister}
                  disabled={isUploading}
                  className="w-full px-6 py-3 bg-[#2b77f5] text-white rounded-lg hover:bg-[#1763E2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {selectedHospitals.length}개 병원에 등록하기
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 우측: 미리보기 */}
            <div className="space-y-6">
              {previewImage ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-gray-900 mb-4">
                    미리보기 (950x950)
                    {selectedHospitals.length > 0 && (
                      <span className="text-gray-500 text-sm ml-2">
                        - {selectedHospitals[0].hspNm}
                      </span>
                    )}
                  </h3>
                  <div className="bg-[#F5F5F7] rounded-lg p-4 flex items-center justify-center">
                    <img
                      src={previewImage}
                      alt="Notice Preview"
                      className="w-full max-w-[500px] rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-[#F5F5F7] rounded-lg p-6">
                  <h3 className="text-[#2C2C2C] font-bold mb-4">공지 이미지 등록 안내</h3>
                  <ul className="space-y-2 text-[#666666] text-sm">
                    <li>• 병원을 검색하여 선택합니다.</li>
                    <li>• 각 병원마다 채널명을 입력합니다 (기본값: 병원명).</li>
                    <li>• 여러 병원을 선택하면 각 병원별로 채널명이 다른 이미지가 생성됩니다.</li>
                    <li>• 로고 위치를 조정할 수 있습니다.</li>
                    <li>• 등록하기를 클릭하면 각 병원별 이미지가 Cloudinary에 업로드됩니다.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
    </DndProvider>
  );
}