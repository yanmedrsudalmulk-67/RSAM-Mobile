import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'bar' | 'pie' | 'line';
  data: any[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  totalInfo?: string;
}

export default function ChartModal({ isOpen, onClose, title, type, data, dataKey, nameKey, colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'], totalInfo }: ChartModalProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  console.log(`ChartModal [${title}]:`, { isOpen, type, dataLength: data.length });

  const handleDownloadPDF = async () => {
    if (!chartRef.current) return;
    try {
      // Use html-to-image instead of html2canvas to support modern CSS colors like oklch
      const dataUrl = await toPng(chartRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const width = chartRef.current.offsetWidth;
      const height = chartRef.current.offsetHeight;
      const pdfHeight = (height * (pdfWidth - 28)) / width;
      
      pdf.setFontSize(16);
      pdf.text(title, 14, 15);
      if (totalInfo) {
        pdf.setFontSize(12);
        pdf.text(totalInfo, 14, 22);
      }
      
      pdf.addImage(dataUrl, 'PNG', 14, 30, pdfWidth - 28, pdfHeight);
      pdf.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Gagal mengunduh PDF');
    }
  };

  const handleDownloadExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel', error);
      alert('Gagal mengunduh Excel');
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                {totalInfo && <p className="text-slate-500 mt-1 font-medium">{totalInfo}</p>}
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              <div className="flex justify-end gap-3 mb-6">
                <button onClick={async () => {
                  if (!chartRef.current) return;
                  try {
                    const dataUrl = await toPng(chartRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
                    const link = document.createElement('a');
                    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.png`;
                    link.href = dataUrl;
                    link.click();
                  } catch (error) {
                    console.error('Error generating PNG', error);
                    alert('Gagal mengunduh PNG');
                  }
                }} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                  <Download size={18} />
                  <span>Download PNG</span>
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors">
                  <FileText size={18} />
                  <span>Download PDF</span>
                </button>
                <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors">
                  <FileSpreadsheet size={18} />
                  <span>Download Excel</span>
                </button>
              </div>

              <div ref={chartRef} className="flex-1 min-h-[450px] w-full bg-white p-4 rounded-xl border border-slate-100">
                {data.length > 0 ? (
                  <div className="w-full h-[450px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={100}>
                      {type === 'bar' ? (
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey={nameKey} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} angle={-45} textAnchor="end" height={80} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                          <Bar dataKey={dataKey} fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={true} animationDuration={1000}>
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : type === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey={dataKey}
                            nameKey={nameKey}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            isAnimationActive={true}
                            animationDuration={1000}
                          >
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      ) : (
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey={nameKey} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                          <Line type="monotone" dataKey={dataKey} stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} isAnimationActive={true} animationDuration={1000} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Data Tidak Tersedia</h3>
                    <p className="text-slate-500 max-w-xs text-center mt-2">
                      Belum ada data kunjungan yang dapat ditampilkan untuk periode ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>

  );
}
