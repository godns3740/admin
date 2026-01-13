import { useState, useRef, ClipboardEvent, useEffect } from 'react';
import { Upload, X, Plus, Minus } from 'lucide-react';
import type { Resource } from '../App';
import referenceImage from 'figma:asset/1745cd73927875b69a868c8d120a993d2adcab6c.png';

interface RegisterResourceProps {
  onAdd: (resource: Omit<Resource, 'id' | 'createdAt'>) => void;
}

export default function RegisterResource({ onAdd }: RegisterResourceProps) {
  const [hospitalName, setHospitalName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [welcomeBlock, setWelcomeBlock] = useState<string | null>(null);
  const [colorLogo, setColorLogo] = useState<string | null>(null);
  const [whiteLogo, setWhiteLogo] = useState<string | null>(null);
  const [logoHeight, setLogoHeight] = useState(30);
  const [activeUploadArea, setActiveUploadArea] = useState<'thumbnail' | 'welcomeBlock' | 'colorLogo' | 'whiteLogo' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const welcomeBlockInputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const welcomeBlockPasteAreaRef = useRef<HTMLDivElement>(null);
  const colorLogoPasteAreaRef = useRef<HTMLDivElement>(null);
  const whiteLogoPasteAreaRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const colorLogoPreviewRef = useRef<HTMLCanvasElement>(null);

  // 전역 paste 이벤트 리스너 추가
  useEffect(() => {
    const handleGlobalPaste = async (e: globalThis.ClipboardEvent) => {
      console.log('전역 paste 이벤트 발생');
      console.log('activeUploadArea:', activeUploadArea);
      
      if (!activeUploadArea) {
        console.log('activeUploadArea가 없어서 리턴');
        return;
      }

      const items = e.clipboardData?.items;
      console.log('clipboard items:', items);
      if (!items) {
        console.log('items가 없어서 리턴');
        return;
      }

      for (let i = 0; i < items.length; i++) {
        console.log(`item ${i} type:`, items[i].type);
        if (items[i].type.indexOf('image') !== -1) {
          console.log('이미지 발견!');
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            console.log('blob 처리 시작');
            const reader = new FileReader();
            reader.onload = (event) => {
              console.log('FileReader onload');
              const dataUrl = event.target?.result as string;
              
              if (activeUploadArea === 'thumbnail') {
                console.log('썸네일 영역에 붙여넣기');
                const img = new Image();
                img.onload = () => {
                  console.log('이미지 로드 완료, 캔버스 처리 시작');
                  const canvas = document.createElement('canvas');
                  canvas.width = 144;
                  canvas.height = 144;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, 144, 144);
                    const thumbnailData = canvas.toDataURL('image/png');
                    console.log('썸네일 데이터 생성 완료, setThumbnail 호출');
                    setThumbnail(thumbnailData);
                  }
                };
                img.src = dataUrl;
              } else if (activeUploadArea === 'welcomeBlock') {
                console.log('웰컴블럭 영역에 붙여넣기');
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = 800;
                  canvas.height = 400;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, 800, 400);
                    const welcomeBlockData = canvas.toDataURL('image/png');
                    setWelcomeBlock(welcomeBlockData);
                  }
                };
                img.src = dataUrl;
              } else if (activeUploadArea === 'colorLogo') {
                console.log('컬러 로고 영역에 붙여넣기');
                setColorLogo(dataUrl);
              } else if (activeUploadArea === 'whiteLogo') {
                console.log('화이트 로고 영역에 붙여넣기');
                setWhiteLogo(dataUrl);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    console.log('전역 paste 리스너 등록');
    window.addEventListener('paste', handleGlobalPaste);
    
    return () => {
      console.log('전역 paste 리스너 제거');
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [activeUploadArea]);

  // 이미지에서 배경색 추출 함수
  const extractBackgroundColor = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve('#000000');
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // 이미지의 가장자리 픽셀들을 샘플링하여 배경색 추출
        const samples: { r: number; g: number; b: number }[] = [];
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
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
        resolve(hex);
      };
      img.src = imageData;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 144;
          canvas.height = 144;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 144, 144);
            const resizedImage = canvas.toDataURL('image/png');
            setThumbnail(resizedImage);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWelcomeBlockFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 800, 400);
            const resizedImage = canvas.toDataURL('image/png');
            setWelcomeBlock(resizedImage);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorCodeChange = (value: string) => {
    const cleaned = value.replace(/[^0-9a-fA-F]/g, '');
    if (cleaned.length <= 6) {
      setColorCode(cleaned);
    }
  };

  // 썸네일 이미지가 변경되면 자동으로 배경색 추출
  useEffect(() => {
    console.log('썸네일 변경됨:', !!thumbnail);
    if (thumbnail) {
      console.log('배경색 추출 시작...');
      extractBackgroundColor(thumbnail).then((hex) => {
        console.log('추출된 색상:', hex);
        // # 기호 제거하고 컬러코드에 설정
        setColorCode(hex.replace('#', ''));
      });
    }
  }, [thumbnail]);

  // 미리보기 캔버스 업데이트 (2배수로 그려서 화질 개선)
  useEffect(() => {
    if (!whiteLogo || !colorCode || colorCode.length !== 6 || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경 그리기 (2배수: 600x840)
    ctx.fillStyle = `#${colorCode}`;
    ctx.fillRect(0, 0, 600, 840);

    // 흰색 로고 그리기 (2배수)
    const img = new Image();
    img.onload = () => {
      // 이미지 스무딩 비활성화로 선명도 개선
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      const aspectRatio = img.width / img.height;
      const scaledWidth = (logoHeight * 2) * aspectRatio; // 2배수
      ctx.drawImage(img, 48, 52, scaledWidth, logoHeight * 2); // 위치와 크기 모두 2배
    };
    img.src = whiteLogo;
  }, [whiteLogo, logoHeight, colorCode]);

  // 컬러 로고 미리보기 업데이트 (2배수로 그려서 화질 개선)
  useEffect(() => {
    if (!colorLogo || !colorLogoPreviewRef.current) return;

    const canvas = colorLogoPreviewRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 투명 배경으로 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 컬러 로고 그리기 (2배수)
    const img = new Image();
    img.onload = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      const aspectRatio = img.width / img.height;
      const scaledWidth = (logoHeight * 2) * aspectRatio; // 2배수
      
      // 캔버스 크기 조정
      canvas.width = scaledWidth;
      canvas.height = logoHeight * 2;
      
      // 다시 그리기 (캔버스 크기 변경시 초기화되므로)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, scaledWidth, logoHeight * 2);
    };
    img.src = colorLogo;
  }, [colorLogo, logoHeight]);

  const generateImages = async (): Promise<{ logoImage: string; patientCard: string; patientCardImage: string }> => {
    return new Promise((resolve) => {
      if (!colorLogo || !whiteLogo || !colorCode) {
        resolve({ logoImage: '', patientCard: '', patientCardImage: '' });
        return;
      }

      // 1. 컬러 로고 이미지 생성 (2배수)
      const colorImg = new Image();
      colorImg.onload = () => {
        const aspectRatio = colorImg.width / colorImg.height;
        const scaledWidth = logoHeight * aspectRatio;
        
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = scaledWidth * 2;
        colorCanvas.height = logoHeight * 2;
        const colorCtx = colorCanvas.getContext('2d');
        if (colorCtx) {
          colorCtx.drawImage(colorImg, 0, 0, scaledWidth * 2, logoHeight * 2);
        }
        const logoImage = colorCanvas.toDataURL('image/png');

        // 2. 환자 카드 생성 (2배수: 600x840)
        const whiteImg = new Image();
        whiteImg.onload = () => {
          const cardCanvas = document.createElement('canvas');
          cardCanvas.width = 600;
          cardCanvas.height = 840;
          const cardCtx = cardCanvas.getContext('2d');
          if (cardCtx) {
            // 배경
            cardCtx.fillStyle = `#${colorCode}`;
            cardCtx.fillRect(0, 0, 600, 840);
            // 로고 (위치도 2배로)
            cardCtx.drawImage(whiteImg, 48, 52, scaledWidth * 2, logoHeight * 2);
          }
          const patientCard = cardCanvas.toDataURL('image/png');

          // 3. 새로운 환자카드 이미지 생성 (408x255, 3배수로 추출: 1224x765)
          const patientCardImageCanvas = document.createElement('canvas');
          patientCardImageCanvas.width = 1224; // 408 * 3
          patientCardImageCanvas.height = 765;  // 255 * 3
          const patientCardImageCtx = patientCardImageCanvas.getContext('2d');
          if (patientCardImageCtx) {
            // 투명 배경
            patientCardImageCtx.clearRect(0, 0, 1224, 765);
            
            // 이미지 스무딩 설정
            patientCardImageCtx.imageSmoothingEnabled = true;
            patientCardImageCtx.imageSmoothingQuality = 'high';
            
            // 흰색 로고 그리기
            // 아래로부터 24px (3배수: 72px) -> y = 765 - 72 - (logoHeight * 3)
            // 오른쪽으로부터 24px (3배수: 72px) -> x = 1224 - 72 - (scaledWidth * 3)
            const scaledWidth3x = scaledWidth * 3;
            const logoHeight3x = logoHeight * 3;
            const logoX = 1224 - 72 - scaledWidth3x;
            const logoY = 765 - 72 - logoHeight3x;
            
            patientCardImageCtx.drawImage(whiteImg, logoX, logoY, scaledWidth3x, logoHeight3x);
          }
          const patientCardImage = patientCardImageCanvas.toDataURL('image/png');

          resolve({ logoImage, patientCard, patientCardImage });
        };
        whiteImg.src = whiteLogo;
      };
      colorImg.src = colorLogo;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName || !colorCode || !thumbnail || !welcomeBlock || !colorLogo || !whiteLogo) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    if (colorCode.length !== 6) {
      alert('컬러코드는 6자리여야 합니다.');
      return;
    }

    const { logoImage, patientCard, patientCardImage } = await generateImages();

    onAdd({
      hospitalName,
      colorCode,
      thumbnail,
      welcomeBlock,
      logoSvg: '',
      logoHeight,
      logoImage,
      patientCard,
      patientCardImage,
    });

    setHospitalName('');
    setColorCode('');
    setThumbnail(null);
    setWelcomeBlock(null);
    setColorLogo(null);
    setWhiteLogo(null);
    setLogoHeight(30);
    alert('리소스가 등록되었습니다.');
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveWelcomeBlock = () => {
    setWelcomeBlock(null);
    if (welcomeBlockInputRef.current) {
      welcomeBlockInputRef.current.value = '';
    }
  };

  const handleRemoveColorLogo = () => {
    setColorLogo(null);
  };

  const handleRemoveWhiteLogo = () => {
    setWhiteLogo(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h2 className="text-[#2C2C2C] mb-8 text-[24px] font-bold">리소스 등록</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="hospitalName" className="block text-gray-700 mb-2">
              병원명
            </label>
            <input
              id="hospitalName"
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="병원명을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="colorCode" className="block text-gray-700 mb-2">
              컬러코드 (6자리)
            </label>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">#</span>
              <input
                id="colorCode"
                type="text"
                value={colorCode}
                onChange={(e) => handleColorCodeChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
                maxLength={6}
              />
              {colorCode.length === 6 && (
                <div
                  className="w-12 h-12 rounded border border-gray-300"
                  style={{ backgroundColor: `#${colorCode}` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* 이미지 업로드 영역 - 2열 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 좌측 컬럼 */}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">
                병원 썸네일 로고 (144x144 PNG)
              </label>
              
              {!thumbnail ? (
                <div
                  ref={pasteAreaRef}
                  onClick={() => {
                    setActiveUploadArea('thumbnail');
                    pasteAreaRef.current?.focus();
                    console.log('썸네일 영역 클릭됨, activeUploadArea 설정됨');
                  }}
                  onFocus={() => {
                    setActiveUploadArea('thumbnail');
                    console.log('썸네일 영역 포커스됨');
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    // contentEditable의 텍스트 입력 방지
                    e.currentTarget.textContent = '';
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors outline-none ${
                    activeUploadArea === 'thumbnail'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                  tabIndex={0}
                >
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-1">클릭 후 붙여넣기 (Ctrl+V)</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    파일 선택
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={thumbnail}
                    alt="병원 썸네일"
                    className="w-36 h-36 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                병원 컬러 로고 (PNG)
              </label>
              
              {!colorLogo ? (
                <div
                  ref={colorLogoPasteAreaRef}
                  onClick={() => setActiveUploadArea('colorLogo')}
                  onFocus={() => setActiveUploadArea('colorLogo')}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    activeUploadArea === 'colorLogo'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                  tabIndex={0}
                >
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">컬러 로고 붙여넣기</p>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={colorLogo}
                    alt="컬러 로고"
                    className="h-20 border border-gray-300 rounded-lg p-2 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveColorLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 우측 컬럼 */}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">
                웰컴블럭 이미지 (800x400 PNG)
              </label>
              
              {!welcomeBlock ? (
                <div
                  ref={welcomeBlockPasteAreaRef}
                  onClick={() => setActiveUploadArea('welcomeBlock')}
                  onFocus={() => setActiveUploadArea('welcomeBlock')}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    activeUploadArea === 'welcomeBlock'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                  tabIndex={0}
                >
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-1">클릭 후 붙여넣기 (Ctrl+V)</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      welcomeBlockInputRef.current?.click();
                    }}
                    className="mt-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    파일 선택
                  </button>
                  <input
                    ref={welcomeBlockInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleWelcomeBlockFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={welcomeBlock}
                    alt="환영 메시지 배경"
                    className="w-full max-w-sm border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveWelcomeBlock}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                병원 화이트 로고 (PNG)
              </label>
              
              {!whiteLogo ? (
                <div
                  ref={whiteLogoPasteAreaRef}
                  onClick={() => setActiveUploadArea('whiteLogo')}
                  onFocus={() => setActiveUploadArea('whiteLogo')}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    activeUploadArea === 'whiteLogo'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                  tabIndex={0}
                >
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">화이트 로고 붙여넣기</p>
                </div>
              ) : (
                <div className="relative inline-block">
                  <div className="border border-gray-300 rounded-lg p-2 bg-gray-800">
                    <img
                      src={whiteLogo}
                      alt="화이트 로고"
                      className="h-20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveWhiteLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 로고 높이 조절 & 미리보기 */}
        {colorLogo && whiteLogo && (
          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">로고 높이 (H)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLogoHeight(Math.max(1, logoHeight - 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-gray-900 w-12 text-center">{logoHeight}px</span>
                    <button
                      type="button"
                      onClick={() => setLogoHeight(logoHeight + 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {colorCode.length === 6 && (
                <div>
                  <label className="block text-gray-700 mb-3">환자카드 미리보기 비교</label>
                  <div className="flex gap-6 items-start flex-wrap">
                    <div>
                      <p className="text-gray-600 text-sm mb-2">현재 설정</p>
                      <canvas
                        ref={previewCanvasRef}
                        width={600}
                        height={840}
                        className="border border-gray-300 rounded-lg"
                        style={{ width: '300px', height: '420px' }}
                      />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-2">참고 이미지</p>
                      <img 
                        src={referenceImage} 
                        alt="참고 이미지" 
                        className="border border-gray-300 rounded-lg"
                        style={{ width: '300px', height: '420px' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          등록하기
        </button>
      </form>
    </div>
  );
}