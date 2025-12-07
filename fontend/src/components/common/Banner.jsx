import React from 'react';
import { Carousel } from 'react-bootstrap';
import { useSettings } from '../../context/SettingsContext';

const Banner = () => {
  const { settings, getBannerUrls } = useSettings();
  const bannerUrls = getBannerUrls();

  // Nếu không có banner images, không hiển thị component
  if (!bannerUrls || bannerUrls.length === 0) {
    return null;
  }

  return (
    <div className="banner-container mb-4">
      <Carousel 
        fade 
        interval={5000} 
        controls={bannerUrls.length > 1}
        indicators={bannerUrls.length > 1}
        className="banner-carousel"
      >
        {bannerUrls.map((bannerUrl, index) => (
          <Carousel.Item key={index}>
            <div
              className="banner-item"
              style={{
                height: '700px',
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Overlay để làm mờ ảnh nếu cần */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.05))'
                }}
              />
              
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};

export default Banner;


