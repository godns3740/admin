export interface IconResource {
  id: string;
  tags: string[]; // 태그 배열
  englishName: string; // 영어 파일명
  image: string; // 180x180
  createdAt: number;
}

export interface BannerResource {
  id: string;
  title: string; // 배너 타이틀
  englishName: string; // 영어 파일명
  iconId: string; // 선택된 아이콘 ID
  bannerImage: string; // 800x400 생성된 배너 이미지
  createdAt: number;
}

export interface DesignResource {
  id: string;
  hspId?: string; // 병원 ID (선택적 - 기존 데이터 호환성)
  hospitalName: string;
  colorCode: string;
  thumbnail: string; // 144x144
  welcomeBlock: string; // 800x400
  logoColor: string;
  logoWhite: string;
  logoHeight: number;
  logoLeft: number;
  logoTop: number;
  patientCard: string;
  patientCardTransparent: string;
  patientCardThumb: string;
  noticeImage?: string; // 950x950 공지 이미지
  createdAt: number;
}