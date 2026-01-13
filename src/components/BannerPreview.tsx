import { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

interface BannerPreviewProps {
  title: string;
  iconImage: string;
  onBannerGenerated: (dataUrl: string) => void;
}

export default function BannerPreview({ title, iconImage, onBannerGenerated }: BannerPreviewProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateBanner = async () => {
      // 타이틀이 비어있으면 배너 생성하지 않음
      if (!title || title.trim() === '') {
        return;
      }

      if (!bannerRef.current) {
        return;
      }

      // 약간의 딜레이 (폰트 및 이미지 로딩 대기)
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const canvas = await html2canvas(bannerRef.current, {
          backgroundColor: '#f9f9f9',
          scale: 2.5, // 2000x1000 고화질로 생성
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        // 2000x1000을 800x400으로 리사이징
        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = 800;
        resizedCanvas.height = 400;
        const ctx = resizedCanvas.getContext('2d');
        
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(canvas, 0, 0, 800, 400);
        }

        const dataUrl = resizedCanvas.toDataURL('image/png');
        onBannerGenerated(dataUrl);
      } catch (error) {
        console.error('배너 생성 실패:', error);
      }
    };

    generateBanner();
  }, [title, iconImage, onBannerGenerated]);

  return (
    <div>
      {/* 미리보기 (50% 크기) */}
      <div
        style={{
          width: '400px',
          height: '200px',
          margin: '0 auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f9f9f9',
          position: 'relative',
          fontFamily: '"Spoqa Han Sans Neo", sans-serif',
        }}
      >
        {/* 타이틀 텍스트 */}
        <div
          style={{
            position: 'absolute',
            top: '20px', // 40 * 0.5
            left: '18px', // 36 * 0.5
            width: '260px', // 520 * 0.5
            height: '120px', // 240 * 0.5
            fontSize: '27px', // 54 * 0.5
            fontWeight: '700',
            lineHeight: '37px', // 74 * 0.5
            color: '#333333',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {/* 아이콘 이미지 */}
        {iconImage && (
          <img
            src={iconImage}
            alt="icon"
            style={{
              position: 'absolute',
              right: '10px', // 20 * 0.5
              bottom: '8px', // 16 * 0.5
              width: '90px', // 180 * 0.5
              height: '90px', // 180 * 0.5
              objectFit: 'contain',
            }}
            crossOrigin="anonymous"
          />
        )}
      </div>

      {/* 실제 배너 생성용 (숨김) */}
      <div
        ref={bannerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '400px', // scale 2 적용하면 800px
          height: '200px', // scale 2 적용하면 400px
          backgroundColor: '#f9f9f9',
          fontFamily: '"Spoqa Han Sans Neo", sans-serif',
        }}
      >
        {/* 타이틀 텍스트 */}
        <div
          style={{
            position: 'absolute',
            top: '9.5px', // 19 / 2
            left: '18px', // 36 / 2
            width: '260px', // 520 / 2
            height: '120px', // 240 / 2
            fontSize: '27px', // 54 / 2
            fontWeight: '700',
            lineHeight: '37px', // 74 / 2
            color: '#333333',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          {title}
        </div>

        {/* 아이콘 이미지 */}
        {iconImage && (
          <img
            src={iconImage}
            alt="icon"
            style={{
              position: 'absolute',
              right: '10px', // 20 / 2
              bottom: '8px', // 16 / 2
              width: '90px', // 180 / 2
              height: '90px', // 180 / 2
              objectFit: 'contain',
            }}
            crossOrigin="anonymous"
          />
        )}
      </div>
    </div>
  );
}