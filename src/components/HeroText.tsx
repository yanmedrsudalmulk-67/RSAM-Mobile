import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function HeroText() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const runAnimation = async () => {
      // Delay awal dikurangi agar lebih responsif
      await new Promise(r => setTimeout(r, 100));
      if (!isMounted) return;
      
      while (isMounted) {
        setVisible(true);
        // Tampil selama 5 detik
        await new Promise(r => setTimeout(r, 5000));
        if (!isMounted) break;
        
        setVisible(false);
        // Tunggu animasi exit selesai + sedikit jeda sebelum loop ulang
        await new Promise(r => setTimeout(r, 1500));
      }
    };
    
    runAnimation();
    
    return () => { isMounted = false; };
  }, []);

  const containerVariants = {
    hidden: {
      transition: {
        staggerChildren: 0.1,
        staggerDirection: -1
      }
    },
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <motion.div
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      variants={containerVariants}
      className="flex flex-col justify-center items-start text-left text-white w-full"
    >
      <motion.div variants={itemVariants} className="mb-3 md:mb-6 flex justify-start">
        <span className="inline-block px-4 py-1.5 bg-emerald-500/30 backdrop-blur-md rounded-full text-[clamp(0.7rem,1.5vw,0.875rem)] font-semibold tracking-wide border border-emerald-400/30 text-white uppercase">
          Terakreditasi Paripurna
        </span>
      </motion.div>

      <motion.h1 
        variants={itemVariants}
        className="font-bold leading-[1.3] tracking-wide mb-4 md:mb-6 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent text-[clamp(3rem,4vw,3rem)]"
      >
        Pelayanan Kesehatan
        <br />
        Terbaik Untuk Masyarakat
        <br />
        Kota Sukabumi
      </motion.h1>

      <motion.p 
        variants={itemVariants}
        className="text-[clamp(0.875rem,2vw,1.125rem)] text-emerald-50 leading-relaxed tracking-wide opacity-90 max-w-xl"
      >
        UOBK RSUD AL-MULK berkomitmen memberikan layanan kesehatan yang profesional, modern, dan ramah bagi seluruh lapisan masyarakat.
      </motion.p>
    </motion.div>
  );
}
