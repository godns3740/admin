import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import ResourceRegister from './components/ResourceRegister';
import IconRegister from './components/IconRegister';
import BannerRegister from './components/BannerRegister';
import NoticeImageRegister from './components/NoticeImageRegister';
import ResourceGallery from './components/ResourceGallery';
import DesignList from './components/DesignList';
import DesignDetail from './components/DesignDetail';
import PatientCardList from './components/PatientCardList';
import PatientCardDetail from './components/PatientCardDetail';
import HospitalChannelList from './components/HospitalChannelList';
import HospitalChannelDetail from './components/HospitalChannelDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: ResourceRegister },
      { path: 'register', Component: ResourceRegister },
      { path: 'notice-register', Component: NoticeImageRegister },
      { path: 'icon-register', Component: IconRegister },
      { path: 'banner-register', Component: BannerRegister },
      { path: 'resource-gallery', Component: ResourceGallery },
      { path: 'patient-cards', Component: PatientCardList },
      { path: 'patient-cards/:id', Component: PatientCardDetail },
      { path: 'hospital-channels', Component: HospitalChannelList },
      { path: 'hospital-channels/:id', Component: HospitalChannelDetail },
      { path: 'designs', Component: DesignList },
      { path: 'designs/:id', Component: DesignDetail },
    ],
  },
]);