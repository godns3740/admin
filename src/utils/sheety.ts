// Sheety API 통신

const SHEETY_API_URL = 'https://api.sheety.co/6190ad4516b650514a1f20095a75efa9/designAdminDb/sheet1';
const SHEETY_ICONS_API_URL = 'https://api.sheety.co/6190ad4516b650514a1f20095a75efa9/designAdminDb/icons';
const SHEETY_BANNERS_API_URL = 'https://api.sheety.co/6190ad4516b650514a1f20095a75efa9/designAdminDb/banners';
const SHEETY_NOTICE_API_URL = 'https://api.sheety.co/6190ad4516b650514a1f20095a75efa9/designAdminDb/notice';
const CACHE_KEY = 'sheety_designs_cache';
const CACHE_TIMESTAMP_KEY = 'sheety_designs_cache_timestamp';
const ICONS_CACHE_KEY = 'sheety_icons_cache';
const ICONS_CACHE_TIMESTAMP_KEY = 'sheety_icons_cache_timestamp';
const BANNERS_CACHE_KEY = 'sheety_banners_cache';
const BANNERS_CACHE_TIMESTAMP_KEY = 'sheety_banners_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// ===== 로컬 스토리지 백업 키 =====
const LOCAL_DESIGNS_KEY = 'local_backup_designs';
const LOCAL_ICONS_KEY = 'local_backup_icons';
const LOCAL_BANNERS_KEY = 'local_backup_banners';
const LOCAL_NOTICES_KEY = 'local_backup_notices';
const SHEETY_AVAILABLE_KEY = 'sheety_api_available'; // Sheety API 상태 추적

// Sheety API 사용 가능 여부 확인
let sheetyApiAvailable = localStorage.getItem(SHEETY_AVAILABLE_KEY) !== 'false';

// Sheety API 상태 업데이트
const setSheetyApiStatus = (available: boolean) => {
  sheetyApiAvailable = available;
  localStorage.setItem(SHEETY_AVAILABLE_KEY, available ? 'true' : 'false');
};

// Sheety API 사용 가능 여부 반환
export const isSheetyAvailable = (): boolean => {
  return sheetyApiAvailable;
};

export interface SheetData {
  id?: number; // Sheety row ID
  hspId: string;
  hospitalName: string;
  storagePrefix?: string; // storagePrefix 추가
  colorCode: string;
  hspThumb: string;
  welcome: string;
  logoColor: string;
  logoWhite: string;
  logoHeight: number;
  logoLeft: number;
  logoTop: number;
  card: string;
  img: string;
  createdAt: string;
}

// 캐시 무효화 (데이터 변경 시 호출)
export const invalidateCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('캐시 삭제 실패:', error);
  }
};

// 캐시에서 데이터 가져오기
const getCachedData = (): SheetData[] | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const timestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) {
      return null;
    }
    
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_DURATION) {
      // 캐시 만료
      invalidateCache();
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('캐시 읽기 실패:', error);
    return null;
  }
};

// 캐시에 데이터 저장
const setCachedData = (data: SheetData[]) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('캐시 저장 실패:', error);
    // sessionStorage 용량 초과 시 캐시 삭제
    invalidateCache();
  }
};

// 특정 hspId로 데이터 조회
export const getDesignByHspId = async (hspId: string): Promise<SheetData | null> => {
  try {
    const allData = await getAllDesigns();
    const found = allData.find(item => item.hspId === hspId);
    return found || null;
  } catch (error) {
    console.error('hspId로 조회 에러:', error);
    return null;
  }
};

// 새로운 데이터 추가
export const saveToSheet = async (data: SheetData): Promise<void> => {
  try {
    const response = await fetch(SHEETY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheet1: {
          hspId: data.hspId,
          hospitalName: data.hospitalName,
          storagePrefix: data.storagePrefix || '', // storagePrefix 추가
          colorCode: data.colorCode,
          hspThumb: data.hspThumb,
          welcome: data.welcome,
          logoColor: data.logoColor,
          logoWhite: data.logoWhite,
          logoHeight: data.logoHeight,
          logoLeft: data.logoLeft,
          logoTop: data.logoTop,
          card: data.card,
          img: data.img,
          createdAt: data.createdAt,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sheety API 저장 실패: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Sheety 저장 성공:', result);
    // 캐시 무효화
    invalidateCache();
  } catch (error) {
    console.error('Sheety API 에러:', error);
    throw error;
  }
};

// 기존 데이터 업데이트
export const updateSheet = async (rowId: number, data: SheetData): Promise<void> => {
  try {
    const response = await fetch(`${SHEETY_API_URL}/${rowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheet1: {
          hspId: data.hspId,
          hospitalName: data.hospitalName,
          storagePrefix: data.storagePrefix || '', // storagePrefix 추가
          colorCode: data.colorCode,
          hspThumb: data.hspThumb,
          welcome: data.welcome,
          logoColor: data.logoColor,
          logoWhite: data.logoWhite,
          logoHeight: data.logoHeight,
          logoLeft: data.logoLeft,
          logoTop: data.logoTop,
          card: data.card,
          img: data.img,
          createdAt: data.createdAt,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sheety API 업데이트 실패: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Sheety 업데이트 성공:', result);
    // 캐시 무효화
    invalidateCache();
  } catch (error) {
    console.error('Sheety API 업데이트 에러:', error);
    throw error;
  }
};

export const getAllDesigns = async (): Promise<SheetData[]> => {
  try {
    const cachedData = getCachedData();
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(SHEETY_API_URL);

    if (!response.ok) {
      // 402 에러(할당량 초과)인 경우
      if (response.status === 402) {
        console.warn('📦 Sheety API 할당량 초과 - 로컬 백업 데이터 사용');
        setSheetyApiStatus(false);
        
        // 로컬 백업에서 데이터 로드
        const localBackup = localStorage.getItem(LOCAL_DESIGNS_KEY);
        if (localBackup) {
          return JSON.parse(localBackup);
        }
        return [];
      }
      
      const errorText = await response.text();
      console.warn('⚠️ Sheety API 응답 에러:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      throw new Error(`Sheety API 조회 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.sheet1 || [];
    
    // Sheety API 정상 작동 시 상태 업데이트
    setSheetyApiStatus(true);
    setCachedData(result);
    
    // 로컬 백업에도 저장
    localStorage.setItem(LOCAL_DESIGNS_KEY, JSON.stringify(result));
    
    return result;
  } catch (error) {
    // 로컬 백업에서 데이터 로드
    const localBackup = localStorage.getItem(LOCAL_DESIGNS_KEY);
    if (localBackup) {
      console.log('✅ 로컬 백업 데이터 사용 중');
      return JSON.parse(localBackup);
    }
    
    // 백업 데이터도 없으면 빈 배열 반환
    console.warn('⚠️ Sheety API 및 로컬 백업 데이터 없음');
    return [];
  }
};

export const deleteFromSheet = async (rowId: number): Promise<void> => {
  try {
    const response = await fetch(`${SHEETY_API_URL}/${rowId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Sheety API 삭제 실패: ${response.statusText}`);
    }

    console.log('Sheety 삭제 성공');
    // 캐시 무효화
    invalidateCache();
  } catch (error) {
    console.error('Sheety API 삭제 에러:', error);
    throw error;
  }
};

// ===== Icons 시트 관련 함수 =====

export interface IconData {
  id?: number; // Sheety row ID
  tags: string; // 쉼표로 구분된 태그 문자열
  englishName: string; // 영어 파일명
  cloudinaryUrlTransparent: string; // 투명 배경 Cloudinary URL (배너용)
  cloudinaryUrlWhite: string; // 흰색 배경 Cloudinary URL (갤러리용)
  publicIdTransparent: string; // 투명 버전 public_id
  publicIdWhite: string; // 흰배경 버전 public_id
  createdAt: string; // 생성일시
}

// 아이콘 데이터 저장
export const saveIconToSheet = async (data: IconData): Promise<void> => {
  try {
    const response = await fetch(SHEETY_ICONS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon: {
          tags: data.tags,
          englishName: data.englishName,
          cloudinaryUrlTransparent: data.cloudinaryUrlTransparent,
          cloudinaryUrlWhite: data.cloudinaryUrlWhite,
          publicIdTransparent: data.publicIdTransparent,
          publicIdWhite: data.publicIdWhite,
          createdAt: data.createdAt,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Icons Sheety API 저장 실패: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Icons Sheety 저장 성공:', result);
  } catch (error) {
    console.error('Icons Sheety API 에러:', error);
    throw error;
  }
};

// 아이콘 데이터 업데이트
export const updateIconInSheet = async (rowId: number, data: Partial<IconData>): Promise<void> => {
  try {
    const response = await fetch(`${SHEETY_ICONS_API_URL}/${rowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icon: data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Icons Sheety API 업데이트 실패: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Icons Sheety 업데이트 성공:', result);
  } catch (error) {
    console.error('Icons Sheety API 업데이트 에러:', error);
    throw error;
  }
};

// 모든 아이콘 조회
export const getAllIcons = async (): Promise<IconData[]> => {
  try {
    // 캐시 확인
    const cachedIcons = sessionStorage.getItem(ICONS_CACHE_KEY);
    const cachedTimestamp = sessionStorage.getItem(ICONS_CACHE_TIMESTAMP_KEY);
    
    if (cachedIcons && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cachedIcons);
      }
    }

    const response = await fetch(SHEETY_ICONS_API_URL);

    if (!response.ok) {
      // 404 에러인 경우 (시트가 없는 경우) 빈 배열 반환
      if (response.status === 404) {
        return [];
      }
      
      // 402 에러(할당량 초과)인 경우
      if (response.status === 402) {
        console.warn('📦 Icons Sheety API 할당량 초과 - 로컬 백업 사용');
        
        // 로컬 백업에서 데이터 로드
        const localBackup = localStorage.getItem(LOCAL_ICONS_KEY);
        if (localBackup) {
          return JSON.parse(localBackup);
        }
        return [];
      }
      
      throw new Error(`Icons Sheety API 조회 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const icons = data.icons || [];
    
    // 캐시 저장
    sessionStorage.setItem(ICONS_CACHE_KEY, JSON.stringify(icons));
    sessionStorage.setItem(ICONS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    
    // 로컬 백업에도 저장
    localStorage.setItem(LOCAL_ICONS_KEY, JSON.stringify(icons));
    
    return icons;
  } catch (error) {
    // 로컬 백업에서 데이터 로드
    const localBackup = localStorage.getItem(LOCAL_ICONS_KEY);
    if (localBackup) {
      console.log('✅ 아이콘 로컬 백업 데이터 사용 중');
      return JSON.parse(localBackup);
    }
    
    // 백업 데이터도 없으면 빈 배열 반환
    return [];
  }
};

// 아이콘 삭제
export const deleteIconFromSheet = async (rowId: number): Promise<void> => {
  try {
    const response = await fetch(`${SHEETY_ICONS_API_URL}/${rowId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Icons Sheety API 삭제 실패: ${response.statusText}`);
    }

    console.log('Icons Sheety 삭제 성공');
  } catch (error) {
    console.error('Icons Sheety API 삭제 에러:', error);
    throw error;
  }
};

// ===== Banners 시트 관련 함수 =====

export interface BannerData {
  id?: number; // Sheety row ID
  serviceFunction: string; // 서비스/기능명
  title: string; // 타이틀 (디스크립션)
  description?: string; // 배너 설명 (옵션)
  tags: string; // 태그 (쉼표로 구분)
  iconPublicId: string; // 선택된 아이콘 public ID (transparent)
  iconCloudinaryUrl: string; // 아이콘 Cloudinary URL
  cloudinaryUrl: string; // 생성된 배너 URL (bannerCloudinaryUrl에서 변경)
  publicId: string; // 배너 public ID (bannerPublicId에서 변경)
  createdAt: string; // 생성일시
}

// 새로운 배너 데이터 추가
export const saveBannerToSheet = async (data: BannerData): Promise<void> => {
  try {
    const response = await fetch(SHEETY_BANNERS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        banner: {
          serviceFunction: data.serviceFunction,
          title: data.title,
          description: data.description || '',
          tags: data.tags,
          iconPublicId: data.iconPublicId,
          iconCloudinaryUrl: data.iconCloudinaryUrl,
          cloudinaryUrl: data.cloudinaryUrl,
          publicId: data.publicId,
          // Google Sheets 컬럼명이 다를 수 있으므로 양쪽 모두 저장
          bannerCloudinaryUrl: data.cloudinaryUrl,
          bannerPublicId: data.publicId,
          createdAt: data.createdAt,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Banners Sheety API 저장 실패: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Banners Sheety 저장 성공:', result);
    
    // 캐시 무효화
    sessionStorage.removeItem(BANNERS_CACHE_KEY);
    sessionStorage.removeItem(BANNERS_CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Banners Sheety API 에러:', error);
    throw error;
  }
};

// 기존 배너 데이터 업데이트
export const updateBannerInSheet = async (rowId: number, data: Partial<BannerData>): Promise<void> => {
  try {
    const response = await fetch(`${SHEETY_BANNERS_API_URL}/${rowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        banner: data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Banners Sheety API 업데이트 실패: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Banners Sheety 업데이트 성공:', result);
  } catch (error) {
    console.error('Banners Sheety API 업데이트 에러:', error);
    throw error;
  }
};

// 모든 배너 조회
export const getAllBanners = async (): Promise<BannerData[]> => {
  try {
    // 캐시 확인
    const cachedBanners = sessionStorage.getItem(BANNERS_CACHE_KEY);
    const cachedTimestamp = sessionStorage.getItem(BANNERS_CACHE_TIMESTAMP_KEY);
    
    if (cachedBanners && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cachedBanners);
      }
    }

    const response = await fetch(SHEETY_BANNERS_API_URL);

    if (!response.ok) {
      // 404 에러인 경우 (시트가 없는 경우) 빈 배열 반환
      if (response.status === 404) {
        return [];
      }
      
      // 402 에러(할당량 초과)인 경우
      if (response.status === 402) {
        console.warn('📦 Banners Sheety API 할당량 초과 - 로컬 백업 사용');
        
        // 로컬 백업에서 데이터 로드
        const localBackup = localStorage.getItem(LOCAL_BANNERS_KEY);
        if (localBackup) {
          return JSON.parse(localBackup);
        }
        return [];
      }
      
      throw new Error(`Banners Sheety API 조회 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawBanners = data.banners || [];
    
    // 필드명 매핑 (bannerCloudinaryUrl -> cloudinaryUrl, bannerPublicId -> publicId)
    const banners = rawBanners.map((banner: any) => ({
      ...banner,
      cloudinaryUrl: banner.cloudinaryUrl || banner.bannerCloudinaryUrl,
      publicId: banner.publicId || banner.bannerPublicId,
    }));
    
    // 캐시 저장
    sessionStorage.setItem(BANNERS_CACHE_KEY, JSON.stringify(banners));
    sessionStorage.setItem(BANNERS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    
    // 로컬 백업에도 저장
    localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(banners));
    
    return banners;
  } catch (error) {
    // 로컬 백업에서 데이터 로드
    const localBackup = localStorage.getItem(LOCAL_BANNERS_KEY);
    if (localBackup) {
      console.log('✅ 배너 로컬 백업 데이터 사용 중');
      return JSON.parse(localBackup);
    }
    
    // 백업 데이터도 없으면 빈 배열 반환
    return [];
  }
};

// 배너 삭제
export const deleteBannerFromSheet = async (rowId: number): Promise<void> => {
  try {
    const response = await fetch(`${SHEETY_BANNERS_API_URL}/${rowId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Banners Sheety API 삭제 실패: ${response.statusText}`);
    }

    console.log('Banners Sheety 삭제 성공');
    
    // 캐시 무효화
    sessionStorage.removeItem(BANNERS_CACHE_KEY);
    sessionStorage.removeItem(BANNERS_CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Banners Sheety API 삭제 에러:', error);
    throw error;
  }
};

// ===== Notice 시트 관련 함수 =====

export interface NoticeData {
  id?: number; // Sheety row ID
  hspId: string; // 병원 ID
  hospitalName: string; // 병원명
  noticeType: 'single' | 'multiple'; // 단일/복수 구분
  cloudinaryUrl: string; // 공지 이미지 URL
  publicId: string; // Cloudinary public ID
  createdAt: string; // 생성일시
  uniqueKey: string; // 고유 키 (React key용)
}

// 공지 이미지 데이터 저장
export const saveNoticeToSheet = async (data: NoticeData): Promise<void> => {
  try {
    const response = await fetch(SHEETY_NOTICE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notice: {
          hspId: data.hspId,
          hospitalName: data.hospitalName,
          noticeType: data.noticeType,
          cloudinaryUrl: data.cloudinaryUrl,
          publicId: data.publicId,
          createdAt: data.createdAt,
          uniqueKey: data.uniqueKey,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notice Sheety API 저장 실패: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Notice Sheety 저장 성공:', result);
  } catch (error) {
    console.error('Notice Sheety API 에러:', error);
    throw error;
  }
};

// 공지 이미지 데이터 업데이트
export const updateNoticeInSheet = async (rowId: number, data: Partial<NoticeData>): Promise<void> => {
  try {
    const response = await fetch(`${SHEETY_NOTICE_API_URL}/${rowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notice: data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notice Sheety API 업데이트 실패: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Notice Sheety 업데이트 성공:', result);
  } catch (error) {
    console.error('Notice Sheety API 업데이트 에러:', error);
    throw error;
  }
};

// 모든 공지 이미지 조회
export const getAllNotices = async (): Promise<NoticeData[]> => {
  try {
    const response = await fetch(SHEETY_NOTICE_API_URL);

    if (!response.ok) {
      // 404 에러인 경우 (시트가 없는 경우) 빈 배열 반환
      if (response.status === 404) {
        return [];
      }
      
      // 402 에러(할당량 초과)인 경우
      if (response.status === 402) {
        console.warn('📦 Notice Sheety API 할당량 초과 - 로컬 백업 사용');
        
        // 로컬 백업에서 데이터 로드
        const localBackup = localStorage.getItem(LOCAL_NOTICES_KEY);
        if (localBackup) {
          return JSON.parse(localBackup);
        }
        return [];
      }
      
      throw new Error(`Notice Sheety API 조회 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const notices = data.notice || [];
    
    // 로컬 백업에 저장
    localStorage.setItem(LOCAL_NOTICES_KEY, JSON.stringify(notices));
    
    return notices;
  } catch (error) {
    // 로컬 백업에서 데이터 로드
    const localBackup = localStorage.getItem(LOCAL_NOTICES_KEY);
    if (localBackup) {
      console.log('✅ 공지 이미지 로컬 백업 데이터 사용 중');
      return JSON.parse(localBackup);
    }
    
    // 백업 데이터도 없으면 빈 배열 반환
    return [];
  }
};

// 특정 병원의 공지 이미지 조회
export const getNoticesByHspId = async (hspId: string): Promise<NoticeData[]> => {
  try {
    const allNotices = await getAllNotices();
    return allNotices.filter(notice => notice.hspId === hspId);
  } catch (error) {
    console.error('병원별 공지 이미지 조회 에러:', error);
    return [];
  }
};

// 공지 이미지 삭제
export const deleteNoticeFromSheet = async (rowId: number): Promise<void> => {
  try {
    const response = await fetch(`${SHEETY_NOTICE_API_URL}/${rowId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Notice Sheety API 삭제 실패: ${response.statusText}`);
    }

    console.log('Notice Sheety 삭제 성공');
  } catch (error) {
    console.error('Notice Sheety API 삭제 에러:', error);
    throw error;
  }
};