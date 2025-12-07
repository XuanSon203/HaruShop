import React from "react";
import Carousel from "react-bootstrap/Carousel";
import { useSettings } from '../../context/SettingsContext';
import FiedImage from '../../assets/bongda.jpg';
import FieldTennis from '../../assets/tennis.jpg'
import FieldBadMiton from '../../assets/caulong.jpg'

function Carousels() {
  const { settings, getBannerUrls } = useSettings();
  const bannerUrls = getBannerUrls();

  // Default carousel items if no banner images from settings
  const defaultCarouselItems = [
    {
      id: 1,
      image: FiedImage,
      title: "Best Destination",
      subtitle: "For Your Pets",
      description: "SAVE 10 - 20% OFF",
      buttonText: "SHOP NOW →",
      background: "linear-gradient(135deg, #f5f5dc 0%, #e6ddd4 100%)",
      buttonBg: "#f5f5dc"
    },
    {
      id: 2,
      image: FieldBadMiton,
      title: "Pet Accessories",
      subtitle: "& Supplies",
      description: "PREMIUM QUALITY",
      buttonText: "EXPLORE NOW →",
      background: "linear-gradient(135deg, #f0e68c 0%, #daa520 100%)",
      buttonBg: "#f0e68c"
    },
    {
      id: 3,
      image: FieldTennis,
      title: "Pet Care",
      subtitle: "Essentials",
      description: "HEALTHY & HAPPY",
      buttonText: "LEARN MORE →",
      background: "linear-gradient(135deg, #deb887 0%, #d2691e 100%)",
      buttonBg: "#deb887"
    }
  ];

  // If we have banner images from settings, use them; otherwise use default
  const carouselItems = bannerUrls.length > 0 ? 
    bannerUrls.map((bannerUrl, index) => ({
      id: index + 1,
      image: bannerUrl,
      title: "Best Destination",
      subtitle: "For Your Pets",
      description: "PREMIUM QUALITY",
      buttonText: "SHOP NOW →",
      background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
      buttonBg: "#0ea5e9"
    })) : 
    defaultCarouselItems;

  return (
    <>
      <Carousel>
        {carouselItems.map((item) => (
          <Carousel.Item key={item.id} interval={3000}>
          <div 
            className="d-block w-100 position-relative"
            style={{ 
              height: "700px", 
              background: item.background,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0"
            }}
          >
            {/* Full width image */}
            <img
              src={item.image}
              alt={item.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center"
              }}
            />
          </div>
        </Carousel.Item>
        ))}
      </Carousel>
    </>
  );
}

export default Carousels;
