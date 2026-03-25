import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stethoscope, ChevronsRight } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      id: 1,
      image: '/rsud-al-mulk.jpg',
      alt: 'Pendaftaran'
    },
    {
      id: 2,
      image: '/fasilitas-1.jpg',
      alt: 'Ruang Tunggu Rajal'
    },
    {
      id: 3,
      image: '/fasilitas-4.jpg',
      alt: 'tentang kami'
    },
    {
      id: 4,
      image: '/fasilitas-5.jpg',
      alt: 'rsud al-mulk'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    } else if (info.offset.x > swipeThreshold) {
      setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-[#F4FBF4] to-[#E6F4E8] flex flex-col relative overflow-hidden font-sans items-center justify-center p-0 lg:p-8">
      <div className="w-full max-w-7xl bg-transparent h-full lg:min-h-[800px] flex flex-col lg:flex-row relative lg:rounded-[40px] lg:shadow-2xl lg:bg-white overflow-hidden">
        
        {/* Left Section with Images (Top on Mobile) */}
        <div className="flex-1 lg:w-1/2 relative flex flex-col items-center justify-center pt-6 pb-4 lg:pt-12 lg:pb-8 lg:bg-gradient-to-br lg:from-[#F4FBF4] lg:to-[#E6F4E8]">
          <div className="relative w-full h-[220px] lg:h-[500px] flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {slides.map((slide, index) => {
                let offset = index - currentIndex;
                if (offset < 0) offset += slides.length;

                if (offset > 2) return null;

                const isFront = offset === 0;
                const isLeft = offset === 1;
                const isRight = offset === 2;

                let x = 0;
                let y = 0;
                let rotate = 0;
                let scale = 1;
                let zIndex = 0;

                if (isFront) {
                  x = 0;
                  y = 20;
                  rotate = 0;
                  scale = 1;
                  zIndex = 30;
                } else if (isLeft) {
                  x = -30;
                  y = -20;
                  rotate = -12;
                  scale = 0.9;
                  zIndex = 20;
                } else if (isRight) {
                  x = 30;
                  y = -10;
                  rotate = 12;
                  scale = 0.85;
                  zIndex = 10;
                }

                return (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      x, 
                      y, 
                      rotate, 
                      scale,
                      zIndex
                    }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    drag={isFront ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={isFront ? handleDragEnd : undefined}
                    className={`absolute w-56 h-48 lg:w-80 lg:h-96 rounded-3xl lg:rounded-[32px] overflow-hidden shadow-xl lg:shadow-2xl border-[4px] lg:border-[8px] border-white bg-white ${isFront ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <img 
                      src={slide.image} 
                      alt={slide.alt}
                      className="w-full h-full object-cover pointer-events-none"
                      referrerPolicy="no-referrer"
                      draggable="false"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-2 lg:bottom-12 left-0 right-0 flex justify-center space-x-2">
            {slides.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-[#8CE81C]' : 'w-2 bg-[#A3CBA9]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Section (Bottom on Mobile) */}
        <div className="lg:w-1/2 bg-gradient-to-b from-[#D4F3E0] to-[#C2E8D0] lg:bg-none lg:bg-white rounded-t-[32px] lg:rounded-none px-6 pt-6 pb-8 lg:p-16 flex flex-col items-center lg:items-start justify-center text-center lg:text-left z-40 relative flex-shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex items-center justify-center mb-4 lg:mb-8 mx-auto lg:mx-0"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white-600 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden">
              <img src="/logo-1.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-[22px] lg:text-[42px] font-bold text-[#0F3D26] mb-2 lg:mb-6 leading-tight"
          >
            Selamat datang di<br className="lg:hidden" /> <span className="hidden lg:inline">UOBK RSUD AL-MULK</span>
            <span className="lg:hidden">UOBK RSUD AL-MULK</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="text-[#1A523A] lg:text-slate-600 text-[14px] lg:text-xl mb-6 lg:mb-12 max-w-[280px] lg:max-w-md mx-auto lg:mx-0 leading-snug lg:leading-relaxed"
          >
            Layanan pendaftaran online untuk akses pelayanan kesehatan yang lebih mudah, cepat, dan terpercaya.
          </motion.p>
          
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
            onClick={onGetStarted}
            className="w-[90%] max-w-sm lg:max-w-md bg-gradient-to-r from-[#8CE81C] to-[#51C98B] text-white rounded-full p-1.5 lg:p-3 flex items-center justify-between hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-green-500/30 group"
          >
           <div className="w-10 h-10 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center text-[#51C98B] shadow-sm">
              <Stethoscope className="w-5 h-5 lg:w-7 lg:h-7" />
            </div>
            <span className="font-bold text-base lg:text-xl tracking-wide">Ayo Mulai</span>
            <div className="w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all">
              <ChevronsRight className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
          </motion.button>
          
          {/* Home Indicator line for mobile feel */}
          <div className="w-24 h-1 bg-[#0F3D26]/20 rounded-full mt-6 lg:hidden"></div>
        </div>
      </div>
    </div>
  );
}
