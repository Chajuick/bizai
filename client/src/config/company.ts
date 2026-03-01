import APP_LOGO from '@/assets/logos/bizai-icon.svg';
import COMPANY_LOGO from '@/assets/logos/focuswin-icon.png';

export const COMPANY = {
  appLogo: APP_LOGO,
  companyLogo: COMPANY_LOGO,
  legalName: "(주)포커스윈",
  address: "경남 창원시 마산회원구 내서읍 광려천남로 59 (경남로봇랜드재단 618호)",
  tel: "055-224-6633",
  fax: "070-8255-6633",
  links: {
    terms: null as string | null,
    privacy: null as string | null,
  },
} as const;