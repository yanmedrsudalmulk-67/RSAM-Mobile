import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, X } from 'lucide-react';
import { incrementArticleViewDB } from '../db';

export default function ArticleSlider() {
  const [articles, setArticles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  useEffect(() => {
    const fetchFeaturedArticles = async () => {
      try {
        const res = await fetch('/api/articles/featured');
        if (res.ok) {
          const data = await res.json();
          setArticles(data);
        }
      } catch (error) {
        console.error('Failed to fetch featured articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedArticles();
  }, []);

  useEffect(() => {
    if (articles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length);
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(interval);
  }, [articles.length]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + articles.length) % articles.length);
  };

  const handleReadMore = async (article: any) => {
    setSelectedArticle(article);
    try {
      await incrementArticleViewDB(article.id_artikel.toString());
    } catch (error) {
      console.error('Failed to increment view:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-slate-100 animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null; // Don't render anything if there are no featured articles
  }

  return (
    <div className="mb-8 relative">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-1">Informasi & Edukasi</h3>
          <h2 className="text-xl font-bold text-slate-900">Kabar Terbaru RSUD AL-MULK</h2>
        </div>
        <div className="hidden md:flex space-x-2">
          <button 
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {articles.map((article) => (
                <div key={article.id_artikel} className="w-full flex-shrink-0 relative group">
                  <div className="aspect-[21/9] md:aspect-[21/7] relative overflow-hidden bg-slate-200">
                    <img 
                      src={article.gambar_slider || `https://picsum.photos/seed/${article.id_artikel}/1200/400`} 
                      alt={article.judul_artikel}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="max-w-3xl">
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                          {article.kategori_artikel}
                        </span>
                        <div className="flex items-center text-slate-300 text-sm">
                          <Calendar size={14} className="mr-1" />
                          {new Date(article.tanggal_publish).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
                        {article.judul_artikel}
                      </h3>
                      <p className="text-slate-200 text-base md:text-lg mb-6 line-clamp-2 md:line-clamp-3">
                        {article.ringkasan_artikel}
                      </p>
                      <button 
                        onClick={() => handleReadMore(article)}
                        className="inline-flex items-center space-x-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors group/btn"
                      >
                        <span>Baca Selengkapnya</span>
                        <ArrowRight size={18} className="transform group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Navigation & Indicators */}
          <div className="flex items-center justify-between mt-6 md:hidden">
            <div className="flex space-x-2">
              {articles.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          {/* Desktop Indicators */}
          <div className="hidden md:flex justify-center mt-6 space-x-2">
            {articles.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-64 md:h-80 w-full">
                <img 
                  src={selectedArticle.gambar_slider || `https://picsum.photos/seed/${selectedArticle.id_artikel}/1200/400`} 
                  alt={selectedArticle.judul_artikel}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                <button 
                  onClick={() => setSelectedArticle(null)} 
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                      {selectedArticle.kategori_artikel}
                    </span>
                    <div className="flex items-center text-slate-300 text-sm">
                      <Calendar size={14} className="mr-1" />
                      {new Date(selectedArticle.tanggal_publish).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {selectedArticle.judul_artikel}
                  </h2>
                </div>
              </div>
              
              <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
                <div className="prose prose-emerald max-w-none">
                  <p className="text-lg text-slate-700 font-medium mb-6 leading-relaxed">
                    {selectedArticle.ringkasan_artikel}
                  </p>
                  <div 
                    className="text-slate-600 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.isi_artikel }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
