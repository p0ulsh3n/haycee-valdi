/** Cloudinary-backed fixtures for the seller-video demo data. */
const CLOUDINARY_CLOUD_NAME = 'ddnz9y5v2';

export type SellerVideoThumbnailFit = 'cover' | 'contain';

export const DEMO_SELLER_VIDEO_ASSET_IDS: readonly string[] = [
  '5903746-uhd_2160_4096_25fps_mtgmd4',
  '4929273-uhd_2160_4096_25fps_hglbck',
  '7018670-uhd_2160_4096_25fps_lwkkcu',
  '15079810_1080_1920_30fps_l3h9cu',
  '12176406_2160_3840_30fps_fw1vmd',
  '10994870-hd_1080_1920_25fps_ewwe7l',
  '5943972-hd_1280_720_30fps_zkrbyu',
  '14120612-uhd_1440_2160_60fps_ux751y',
  '14726379_3840_2160_30fps_l3knzx',
  '11189255-hd_2160_3840_30fps_rgdj9d',
  '5700365-uhd_2160_3840_24fps_qe2nvm',
  '8465762-uhd_3840_2160_25fps_gyidyi',
  '8465759-uhd_2160_3840_25fps_c0bqme',
  '3545482-uhd_3840_2160_30fps_rit3ug',
  '5699536-uhd_3840_2160_24fps_w2x6cy',
  '7667428-uhd_2160_4096_25fps_grst0i',
  '6994974-uhd_2160_3840_30fps_piyqgv',
  '3736783-uhd_3840_2160_24fps_vhnnml',
  '15261064_3840_2160_30fps_lnimoi',
  '18609655-uhd_2160_3840_50fps_m2ym2l',
  '14525127_3840_2160_25fps_ubxku0',
  '12791704_2160_3840_30fps_p3esdo',
];

export const getSellerVideoThumbnailFit = (assetId: string): SellerVideoThumbnailFit => {
  const dimensions = assetId.match(/_(\d+)_(\d+)_/);
  if (!dimensions) return 'cover';
  return Number(dimensions[1]) > Number(dimensions[2]) ? 'contain' : 'cover';
};

export const getSellerVideoUrl = (assetId: string): string => (
  `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/w_720,c_limit,q_auto:good,vc_h264:baseline:3.0/${assetId}.mp4`
);

export const getSellerVideoThumbnailUrl = (assetId: string): string => {
  const isLandscape = getSellerVideoThumbnailFit(assetId) === 'contain';
  const transform = isLandscape
    ? 'so_1,w_720,c_limit,q_auto'
    : 'so_1,w_720,h_1280,c_fill,q_auto';
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transform}/${assetId}.jpg`;
};
