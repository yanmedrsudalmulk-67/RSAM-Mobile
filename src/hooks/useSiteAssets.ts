import { useState, useEffect } from 'react';

interface SiteAsset {
  asset_key: string;
  asset_url: string;
}

const DEFAULT_ASSETS: Record<string, string> = {
  logo_main: '/logo-1.jpg',
  welcome_slide1: '/rsud-al-mulk.jpg',
  welcome_slide2: '/fasilitas-1.jpg',
  welcome_slide3: '/fasilitas-4.jpg',
  welcome_slide4: '/fasilitas-5.jpg',
  hero_bg: '/rsud-al-mulk.jpg',
  login_bg: '/rsud-al-mulk.jpg',
  about_image1: '/tentang-kami.jpg',
  about_image2: '/uploads/foto_pasien/gedung-baru.jpg',
  footer_logo: '/logo-1.jpg'
};

export function useSiteAssets() {
  const [assets, setAssets] = useState<Record<string, string>>(DEFAULT_ASSETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch('/api/site-assets');
        if (!res.ok) throw new Error('Gagal mengambil aset');
        const data: SiteAsset[] = await res.json();
        
        const assetMap: Record<string, string> = { ...DEFAULT_ASSETS };
        data.forEach(asset => {
          assetMap[asset.asset_key] = asset.asset_url;
        });
        
        setAssets(assetMap);
      } catch (error) {
        console.error('Error fetching site assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return { assets, loading };
}
