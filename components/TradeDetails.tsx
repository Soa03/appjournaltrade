'use client';

import React, { useState, useRef } from 'react';
import { X, Activity, ZoomIn, Edit2, Download, FileText, ChevronDown, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Trade } from '../types/trade';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TradeDetailsProps {
  trade: Trade;
  onClose: () => void;
  onUpdateImage?: (field: string, newValue: string | null) => void;
}

export const TradeDetails = ({ trade, onClose, onUpdateImage }: TradeDetailsProps) => {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleDeleteImage = async (field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Hofafana ve ity sary ity?")) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...trade, [field]: "" }) 
      });
      if (res.ok && onUpdateImage) onUpdateImage(field, null);
    } catch (err) {
      alert("Tsy nahomby ny famafana sary.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReplaceImage = async (field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: any) => {
      const file = event.target.files?.[0];
      if (file) {
        setIsUpdating(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            const res = await fetch(`/api/trades/${trade.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...trade, [field]: base64 })
            });
            if (res.ok && onUpdateImage) onUpdateImage(field, base64);
          } catch (error) {
            console.error("Upload error:", error);
          } finally {
            setIsUpdating(false);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Fomba fiasa vaovao: Maka ny container manontolo indray mandeha fotsiny mba hisorohana ny elanelana be loatra
  const exportPDF = async () => {
    if (!exportRef.current) return;
    setIsExportMenuOpen(false);

    const element = exportRef.current;
    
    // CSS hanamboarana ny endrika mandritra ny export
    const style = document.createElement('style');
    style.innerHTML = `
      .pdf-export-mode .no-pdf-emoji { display: none !important; }
      .pdf-export-mode { 
        border-radius: 0 !important; 
        width: 1000px !important; 
        padding: 40px !important; 
        background-color: #0f172a !important;
        box-shadow: none !important;
      }
      .pdf-export-mode .no-export { display: none !important; }
      .pdf-export-mode .card-summary { background: #1e293b !important; border: 1px solid rgba(255,255,255,0.05) !important; }
      .pdf-export-header { display: block !important; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
      .pdf-export-mode h1, .pdf-export-mode h2, .pdf-export-mode h3, .pdf-export-mode h4, .pdf-export-mode p, .pdf-export-mode span {
         color: #ffffff !important;
      }
      .pdf-export-mode img {
        filter: none !important; 
      }
      /* Mandidy ny rafitra mba tsy hanapaka ny vata sary eo afovoany */
      .pdf-image-group, .card-summary, .pdf-export-header {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    document.head.appendChild(style);
    element.classList.add('pdf-export-mode');

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 2, // Resolution avo lenta
        useCORS: true,
        logging: false,
        windowWidth: 1000
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - (margin * 2);
      
      // Kajy ny haavon'ny sary manontolo rehefa apetraka amin'ny sakany A4
      const pageHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = pageHeight;
      let position = 0;

      // Pejy Voalohany
      pdf.setFillColor(15, 23, 42); // Loko #0f172a
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      pdf.addImage(imgData, 'JPEG', margin, position + margin, imgWidth, pageHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - (margin * 2));

      // Raha mbola tsy lany ny sary, mamorona pejy manaraka mandeha ho azy ny loop
      while (heightLeft > 0) {
        position = heightLeft - pageHeight - margin;
        pdf.addPage();
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, pageHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`REPORT_${trade.pair.toUpperCase()}_${trade.date.split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
    } finally {
      element.classList.remove('pdf-export-mode');
      document.head.removeChild(style);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Win': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Loss': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'BE': return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
      case 'Pending': return 'bg-[#a67c52]/10 text-[#a67c52] border-[#a67c52]/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[60] flex items-center justify-center p-2 md:p-8">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0f172a] border border-white/5 w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-[3rem] shadow-2xl relative custom-scrollbar"
      >
        {/* Navigation Bar */}
        <div className="sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl p-6 border-b border-white/5 flex justify-between items-center z-30">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl border ${getStatusStyle(trade.status)}`}>
              {((trade.status as string) === 'Pending') ? <Clock size={24} /> : <Activity size={24} />}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                {trade.pair} <span className="w-2 h-2 bg-[#a67c52] rounded-full"></span>
              </h2>
              <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] mt-1">
                {new Date(trade.date).toLocaleDateString('fr-FR', { dateStyle: 'full' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 no-export">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
              className="px-6 py-3 rounded-2xl bg-[#a67c52] hover:bg-[#8e663f] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-[#a67c52]/10"
            >
              <Download size={16} /> Export Report <ChevronDown size={14} className={isExportMenuOpen ? 'rotate-180' : ''} />
            </button>
            <AnimatePresence>
              {isExportMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-24 mt-3 w-56 bg-[#161e2f] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <button onClick={exportPDF} className="w-full px-5 py-4 text-left text-[11px] font-bold text-slate-300 hover:bg-[#a67c52] hover:text-white flex items-center gap-3 transition-colors">
                    <FileText size={16}/> GENERATE PDF (HD)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={onClose} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-2xl transition text-slate-400 hover:text-rose-400">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Export Content Area */}
        <div ref={exportRef} className="p-8 md:p-12 h-auto bg-[#0f172a]">
          <div className="hidden pdf-export-header">
             <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic mb-2">
               {trade.pair} <span className="text-[#a67c52]">ANALYSIS</span>
             </h1>
             <p className="text-slate-400 text-xs font-black tracking-[0.4em] uppercase">
               TRADING LOG | {new Date(trade.date).toLocaleDateString('fr-FR', { dateStyle: 'full' })}
             </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Summary & Levels */}
            <div className="space-y-6">
              {/* Trade Summary */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 card-summary">
                <h3 className="text-[#a67c52] text-[10px] font-black uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-3">Trade Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-slate-500 text-[10px] font-black uppercase">Type</span><span className={`text-xs font-black ${trade.type === 'Long' ? 'text-cyan-400' : 'text-rose-400'}`}>{trade.type.toUpperCase()}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500 text-[10px] font-black uppercase">Volume</span><span className="text-white font-mono font-black text-sm">{trade.lots} LOTS</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500 text-[10px] font-black uppercase">Statut</span><span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase ${getStatusStyle(trade.status)}`}>{trade.status}</span></div>
                  <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-end"><span className="text-[#a67c52] text-[10px] font-black uppercase italic">Total PnL</span><span className={`text-3xl font-mono font-black tracking-tighter ${trade.pnl >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>{trade.pnl >= 0 ? `+${trade.pnl}` : trade.pnl}$</span></div>
                </div>
              </div>

              {/* Levels & PNL Box */}
              <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5 card-summary">
                <h3 className="text-[#a67c52] text-[9px] font-black uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-3">Levels & PNL</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="block text-slate-500 text-[8px] font-black uppercase mb-1">Entry</span>
                    <span className="text-white font-mono font-bold text-[10px]">{(trade as any).entryPrice || "0.0000"}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="block text-rose-400/70 text-[8px] font-black uppercase mb-1">SL</span>
                    <span className="text-rose-400 font-mono font-bold text-[10px]">{(trade as any).stopLoss || "0.0000"}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center">
                    <span className="block text-cyan-400/70 text-[8px] font-black uppercase mb-1">TP</span>
                    <span className="text-cyan-400 font-mono font-bold text-[10px]">{(trade as any).takeProfit || "0.0000"}</span>
                  </div>
                </div>
              </div>

              {/* Errors & Comments */}
              {trade.error && (
                <div className="bg-rose-500/5 p-5 rounded-[1.5rem] border border-rose-500/10">
                  <h4 className="text-rose-400 text-[9px] font-black uppercase mb-2 flex items-center gap-2">
                    <span className="no-pdf-emoji"><AlertCircle size={14}/></span> ERREUR CONSTATÉE
                  </h4>
                  <p className="text-slate-400 text-[11px] italic font-medium">{trade.error}</p>
                </div>
              )}
              
              {trade.comment && (
                <div className="bg-cyan-500/5 p-5 rounded-[1.5rem] border border-cyan-500/10">
                  <h4 className="text-cyan-400 text-[9px] font-black uppercase mb-2 flex items-center gap-2">
                    <span className="no-pdf-emoji"><FileText size={14}/></span> COMMENTAIRE
                  </h4>
                  <p className="text-slate-400 text-[11px] italic font-medium">{trade.comment}</p>
                </div>
              )}
            </div>

            {/* Right Column: Analysis Breakdown & Visual Evidence */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Analysis Breakdown Block */}
              {((trade as any).analysisH1 || (trade as any).analysisLTF) && (
                <div className="space-y-3">
                  <h3 className="text-[#a67c52] text-[9px] font-black uppercase tracking-[0.3em]">Analysis Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(trade as any).analysisH1 && (
                      <div className="bg-slate-900/20 p-4 rounded-xl border border-white/5 card-summary">
                        <span className="text-[8px] font-black text-[#a67c52] uppercase tracking-wider block mb-1.5">Context H1 / Day Analysis</span>
                        <p className="text-slate-400 text-[11px] leading-relaxed font-medium whitespace-pre-line">{(trade as any).analysisH1}</p>
                      </div>
                    )}
                    {(trade as any).analysisLTF && (
                      <div className="bg-slate-900/20 p-4 rounded-xl border border-white/5 card-summary">
                        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-wider block mb-1.5">LTF Confirmation (M15/M5)</span>
                        <p className="text-slate-400 text-[11px] leading-relaxed font-medium whitespace-pre-line">{(trade as any).analysisLTF}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visual Evidence Block */}
              <div className="space-y-3">
                <h3 className="text-[#a67c52] text-[9px] font-black uppercase tracking-[0.3em]">Visual Evidence</h3>
                <div className="flex flex-col gap-6">
                  {[
                    { id: 'imgH1', label: 'H1 ANALYSIS', img: trade.imgH1 },
                    { id: 'imgLTF', label: 'LTF CONTEXT', img: trade.imgLTF },
                    { id: 'imgM1', label: 'EXECUTION M1', img: trade.imgM1 },
                    { id: 'imgExtra1', label: 'EXTRA VIEW 1', img: (trade as any).imgExtra1 },
                    { id: 'imgExtra2', label: 'EXTRA VIEW 2', img: (trade as any).imgExtra2 }
                  ].filter(item => item.img).map((item) => (
                    <div key={item.id} className="pdf-image-group relative bg-slate-900/50 rounded-[1.5rem] border border-white/5 overflow-hidden shadow-xl group">
                      <div className="p-3 bg-slate-800/40 flex justify-between items-center no-export border-b border-white/5">
                        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">{item.label}</span>
                        <div className="flex gap-2">
                          <button onClick={(e) => handleDeleteImage(item.id, e)} className="p-1.5 bg-rose-500/10 text-rose-500 rounded-md hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={12}/></button>
                          <button onClick={(e) => handleReplaceImage(item.id, e)} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-white rounded-md text-[8px] font-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-cyan-500/10"><Edit2 size={10} /> REPLACE</button>
                          <button onClick={() => setSelectedImg(item.img!)} className="p-1.5 bg-slate-700 hover:bg-white hover:text-black text-white rounded-md transition-all"><ZoomIn size={12} /></button>
                        </div>
                      </div>
                      <div className="w-full bg-[#090d16] flex items-center justify-center p-2 max-h-[550px] overflow-hidden">
                        <img 
                          src={item.img!} 
                          alt={item.label} 
                          className="max-w-full max-h-[530px] w-auto h-auto block object-contain rounded-xl pdf-img" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Zoom Modal */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImg(null)}>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedImg} className="max-w-full max-h-full object-contain rounded-xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};