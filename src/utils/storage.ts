import { DesignResource, IconResource, BannerResource } from '../types/design';

const STORAGE_KEY = 'hospital_designs';
const ICON_STORAGE_KEY = 'hospital_icons';
const BANNER_STORAGE_KEY = 'hospital_banners';

// localStorage 용량 체크 함수
export const getStorageSize = (): { used: number; total: number; percentage: number } => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  
  // 대부분의 브라우저에서 localStorage는 5MB~10MB
  const maxSize = 10 * 1024 * 1024; // 10MB로 가정
  const usedMB = (total / 1024 / 1024).toFixed(2);
  const totalMB = (maxSize / 1024 / 1024).toFixed(2);
  const percentage = Math.round((total / maxSize) * 100);
  
  return {
    used: parseFloat(usedMB),
    total: parseFloat(totalMB),
    percentage
  };
};

// localStorage 전체 초기화
export const clearAllStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ICON_STORAGE_KEY);
  localStorage.removeItem(BANNER_STORAGE_KEY);
};

export const saveDesign = (design: DesignResource): void => {
  const designs = getDesigns();
  designs.push(design);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('저장 공간이 부족합니다. 기존 데이터를 삭제하거나 관리자에게 문의하세요.');
    }
    throw error;
  }
};

export const getDesigns = (): DesignResource[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getDesignById = (id: string): DesignResource | undefined => {
  const designs = getDesigns();
  return designs.find(d => d.id === id);
};

export const deleteDesign = (id: string): void => {
  const designs = getDesigns();
  const filtered = designs.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const updateDesign = (id: string, updates: Partial<DesignResource>): void => {
  const designs = getDesigns();
  const index = designs.findIndex(d => d.id === id);
  if (index !== -1) {
    designs[index] = { ...designs[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  }
};

export const saveIcon = (icon: IconResource): void => {
  const icons = getIcons();
  icons.push(icon);
  localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(icons));
};

export const getIcons = (): IconResource[] => {
  const data = localStorage.getItem(ICON_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getIconById = (id: string): IconResource | undefined => {
  const icons = getIcons();
  return icons.find(i => i.id === id);
};

export const deleteIcon = (id: string): void => {
  const icons = getIcons();
  const filtered = icons.filter(i => i.id !== id);
  localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(filtered));
};

export const saveBanner = (banner: BannerResource): void => {
  const banners = getBanners();
  banners.push(banner);
  localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(banners));
};

export const getBanners = (): BannerResource[] => {
  const data = localStorage.getItem(BANNER_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getBannerById = (id: string): BannerResource | undefined => {
  const banners = getBanners();
  return banners.find(b => b.id === id);
};

export const deleteBanner = (id: string): void => {
  const banners = getBanners();
  const filtered = banners.filter(b => b.id !== id);
  localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(filtered));
};