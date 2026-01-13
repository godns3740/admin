import { useEffect, useRef } from 'react';
import referenceImage from 'figma:asset/2b9a7cf3577e6d41ac3ee7f9ec235579c16932a6.png';

interface PatientCardPreviewProps {
  logoWhite: string;
  logoHeight: number;
  logoLeft: number;
  logoTop: number;
  colorCode: string;
  onCardGenerated?: (dataUrl: string) => void;
}

export default function PatientCardPreview({
  logoWhite,
  logoHeight,
  logoLeft,
  logoTop,
  colorCode,
  onCardGenerated,
}: PatientCardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!logoWhite || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 2배수로 그리기 (300x420 @2x = 600x840)
    const scale = 2;
    canvas.width = 300 * scale;
    canvas.height = 420 * scale;

    // 이미지 스무딩 품질 설정 - 로고 화질 개선
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 배경색 그리기
    ctx.fillStyle = colorCode;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 로고 이미지 로드 및 그리기
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const targetHeight = logoHeight * scale;
      const aspectRatio = img.width / img.height;
      const targetWidth = targetHeight * aspectRatio;

      const x = logoLeft * scale;
      const y = logoTop * scale;

      // 고품질 렌더링 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, x, y, targetWidth, targetHeight);

      // 콜백으로 생성된 이미지 전달
      if (onCardGenerated) {
        onCardGenerated(canvas.toDataURL('image/png'));
      }
    };
    img.src = logoWhite;
  }, [logoWhite, logoHeight, logoLeft, logoTop, colorCode, onCardGenerated]);

  return (
    <div>
      <label className="block text-gray-700 mb-2">미리보기</label>
      <div className="grid grid-cols-2 gap-3">
        {/* 참고 이미지 */}
        <div>
          <p className="text-gray-500 mb-2">참고</p>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <img src={referenceImage} alt="참고 이미지" className="w-full h-auto" />
          </div>
        </div>
        
        {/* 실시간 미리보기 */}
        <div>
          <p className="text-gray-500 mb-2">현재 (300x420 @2x)</p>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white inline-block w-full">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}