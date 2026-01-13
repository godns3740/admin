import { useEffect, useRef } from 'react';

interface PatientCardTransparentProps {
  logoWhite: string;
  logoHeight: number;
  onCardGenerated?: (dataUrl: string) => void;
}

export default function PatientCardTransparent({
  logoWhite,
  logoHeight,
  onCardGenerated,
}: PatientCardTransparentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!logoWhite || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 3배수로 그리기 (408x255 @3x = 1224x765)
    const scale = 3;
    canvas.width = 1224;  // 408 * 3
    canvas.height = 765;  // 255 * 3

    // 이미지 스무딩 품질 설정 - 로고 화질 개선
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 투명 배경
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 로고 이미지 로드 및 그리기
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const targetHeight = logoHeight * scale;
      const aspectRatio = img.width / img.height;
      const targetWidth = targetHeight * aspectRatio;

      // 하단으로부터 24*3=72, 우측으로부터 24*3=72
      const x = canvas.width - targetWidth - 72;
      const y = canvas.height - targetHeight - 72;

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
  }, [logoWhite, logoHeight, onCardGenerated]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
}