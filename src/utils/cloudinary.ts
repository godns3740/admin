// Cloudinary 이미지 업로드

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dwc5sqwk5/image/upload';
const CLOUDINARY_CLOUD_NAME = 'dwc5sqwk5';
const CLOUDINARY_API_KEY = '554139757487347'; // Cloudinary 대시보드에서 확인
const CLOUDINARY_API_SECRET = 'wvhT9Wo_OlB-JMJyIfMlT-8Wnr0'; // Cloudinary 대시보드에서 확인
// ⚠️ 보안 경고: 프로덕션에서는 백엔드 API를 통해 서명을 생성해야 합니다!
// 프론트엔드에 API Secret을 노출하면 보안 문제가 발생할 수 있습니다.

const CLOUDINARY_UPLOAD_PRESET = 'm1_default'; // unsigned upload preset 이름

// Cloudinary 설정 export
export const CLOUDINARY_CONFIG = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: CLOUDINARY_UPLOAD_PRESET,
  apiKey: CLOUDINARY_API_KEY,
};

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

// Signed Upload를 위한 서명 생성 (Web Crypto API 사용)
const generateSignature = async (paramsToSign: Record<string, any>): Promise<string> => {
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map(key => `${key}=${paramsToSign[key]}`)
    .join('&');
  
  const stringToSign = sortedParams + CLOUDINARY_API_SECRET;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

export const uploadToCloudinary = async (
  base64Image: string,
  fileName: string,
  tags: string[] = [],
  overwrite: boolean = false
): Promise<string> => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    
    // Signed upload를 위한 파라미터
    const paramsToSign: Record<string, any> = {
      timestamp,
      public_id: fileName,
    };
    
    if (tags.length > 0) {
      paramsToSign.tags = tags.join(',');
    }
    
    if (overwrite) {
      paramsToSign.overwrite = true;
      paramsToSign.invalidate = true; // CDN 캐시 무효화
    }
    
    // 서명 생성
    const signature = await generateSignature(paramsToSign);
    
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('timestamp', timestamp.toString());
    formData.append('public_id', fileName);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);
    
    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }
    
    if (overwrite) {
      formData.append('overwrite', 'true');
      formData.append('invalidate', 'true');
    }

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary 에러 응답:', errorData);
      throw new Error(`Cloudinary 업로드 실패: ${response.statusText} - ${errorData.error?.message || ''}`);
    }

    const data: CloudinaryResponse = await response.json();
    console.log('Cloudinary 업로드 성공:', fileName, '→', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary 업로드 에러:', error);
    throw error;
  }
};

// 여러 이미지를 순차적으로 업로드
export const uploadMultipleImages = async (
  images: Array<{ base64: string; name: string; tags: string[] }>,
  onProgress?: (current: number, total: number, imageName: string) => void
): Promise<Record<string, string>> => {
  const urls: Record<string, string> = {};

  for (let i = 0; i < images.length; i++) {
    const { base64, name, tags } = images[i];
    
    if (onProgress) {
      onProgress(i + 1, images.length, name);
    }

    const url = await uploadToCloudinary(base64, name, tags);
    urls[name] = url;
  }

  return urls;
};

// Cloudinary 태그 업데이트 (Management API 사용)
export const updateCloudinaryTags = async (
  publicId: string,
  tags: string[]
): Promise<void> => {
  try {
    // 참고: Cloudinary Management API는 인증이 필요합니다.
    // 프론트엔드에서 직접 호출하기 어려운 경우, 백엔드 API를 통해 처리하거나
    // 아래처럼 업로드 시 태그를 설정하는 방식으로 우회할 수 있습니다.
    
    // 현재는 클라이언트에서 직접 Management API를 호출할 수 없으므로
    // 재업로드 방식으로 태그를 업데이트합니다.
    // 실제 프로덕션에서는 백엔드 API를 통해 처리하는 것을 권장합니다.
    
    console.log(`Cloudinary 태그 업데이트 시도: ${publicId}`, tags);
    
    // NOTE: 실제 구현에서는 백엔드 API를 호출하거나
    // Cloudinary의 signed upload를 사용해야 합니다.
    // 현재는 로그만 출력하고 Sheets에만 저장합니다.
    
  } catch (error) {
    console.error('Cloudinary 태그 업데이트 에러:', error);
    // 에러를 throw하지 않고 계속 진행 (Sheets 업데이트는 진행)
  }
};

// Cloudinary 이미지 삭제 (Management API 사용)
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    
    // 삭제를 위한 파라미터
    const paramsToSign: Record<string, any> = {
      timestamp,
      public_id: publicId,
    };
    
    // 서명 생성
    const signature = await generateSignature(paramsToSign);
    
    // Cloudinary Destroy API URL
    const destroyUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`;
    
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);
    
    const response = await fetch(destroyUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary 삭제 에러 응답:', errorData);
      throw new Error(`Cloudinary 삭제 실패: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Cloudinary 이미지 삭제 성공:', publicId, data);
  } catch (error) {
    console.error('Cloudinary 이미지 삭제 에러:', error);
    throw error;
  }
};
