
import React, { useState, useRef } from 'react';
import { transcribeAndTranslateMedia } from './services/gemini';
import { SubtitleItem, Language } from './types';
import { generateSrtString, downloadFile, formatSrtTime } from './utils/srt-helper';
import { 
  FileAudio, 
  FileVideo, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Upload,
  RefreshCw,
  Languages,
  ArrowRightLeft,
  FileText
} from 'lucide-react';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<Language>(Language.INDONESIAN);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Ukuran file melebihi 100MB. Silakan unggah file yang lebih kecil.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
    setSubtitles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type.startsWith('audio/') || droppedFile.type.startsWith('video/')) {
        validateAndSetFile(droppedFile);
      } else {
        setError("Format file tidak valid. Gunakan audio atau video.");
      }
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const base64Data = await convertFileToBase64(file);
      const response = await transcribeAndTranslateMedia(base64Data, file.type, targetLanguage);
      setSubtitles(response.subtitles);
    } catch (err: any) {
      setError(err.message || "Gagal menghasilkan subtitle. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (subtitles.length === 0) return;
    const srtContent = generateSrtString(subtitles);
    const fileName = file ? `${file.name.split('.')[0]}_${targetLanguage}.srt` : 'subtitles.srt';
    downloadFile(srtContent, fileName);
  };

  const reset = () => {
    setFile(null);
    setSubtitles([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest shadow-lg shadow-indigo-200">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Transcribe & Translate
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Auto<span className="text-indigo-600">Sub</span> Expert
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Hasilkan subtitle otomatis dalam Bahasa Indonesia atau Inggris. <br className="hidden md:block" />
          AI akan otomatis mendeteksi apakah perlu transkripsi atau terjemahan.
        </p>
      </div>

      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            
            {/* Left Section */}
            <div className="flex-1 p-8 md:p-10 space-y-10">
              {/* Step 1: Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">01</span>
                    Unggah File (Maks 100MB)
                  </h2>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative group border-2 border-dashed rounded-[1.5rem] p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-5 min-h-[260px] ${
                    isDragging 
                      ? 'border-indigo-600 bg-indigo-50 scale-[1.02] shadow-inner' 
                      : file 
                        ? 'border-emerald-400 bg-emerald-50/30' 
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex flex-col items-center text-center animate-in zoom-in duration-300">
                      <div className="bg-emerald-100 p-5 rounded-3xl mb-4 shadow-sm">
                        {file.type.startsWith('video') ? <FileVideo className="w-12 h-12 text-emerald-600" /> : <FileAudio className="w-12 h-12 text-emerald-600" />}
                      </div>
                      <p className="font-bold text-slate-900 text-lg truncate max-w-[320px]">{file.name}</p>
                      <p className="text-sm text-emerald-600 font-bold bg-white px-3 py-1 rounded-full border border-emerald-100 mt-2">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className={`p-5 rounded-3xl bg-slate-50 transition-all ${isDragging ? 'bg-indigo-100 rotate-12' : 'group-hover:bg-indigo-50 group-hover:-rotate-3'}`}>
                        <Upload className={`w-10 h-10 transition-colors ${isDragging ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                      </div>
                      <div className="text-center">
                        <p className="font-extrabold text-slate-700 text-lg">
                          {isDragging ? 'Lepaskan File Sekarang' : 'Tarik & Lepas File di Sini'}
                        </p>
                        <p className="text-sm text-slate-400 mt-2 font-medium">Mendukung MP4, MKV, MP3, WAV</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Step 2: Result Language */}
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">02</span>
                  Pilih Bahasa Subtitle (Hasil Akhir)
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTargetLanguage(Language.INDONESIAN)}
                    className={`flex flex-col items-center justify-center gap-2 py-5 px-4 rounded-[1.25rem] border-2 font-bold transition-all ${
                      targetLanguage === Language.INDONESIAN 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-3xl">🇮🇩</span>
                    <span>Bahasa Indonesia</span>
                  </button>
                  <button 
                    onClick={() => setTargetLanguage(Language.ENGLISH)}
                    className={`flex flex-col items-center justify-center gap-2 py-5 px-4 rounded-[1.25rem] border-2 font-bold transition-all ${
                      targetLanguage === Language.ENGLISH 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-3xl">🇺🇸</span>
                    <span>English</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 italic text-center">
                  *AI akan otomatis melakukan transkripsi atau terjemahan ke bahasa yang dipilih.
                </p>
              </div>

              {/* Action */}
              <div className="pt-4 flex gap-4">
                <button
                  disabled={!file || loading}
                  onClick={handleGenerate}
                  className={`flex-1 flex items-center justify-center gap-3 py-5 px-6 rounded-2xl font-black text-white shadow-2xl transition-all ${
                    !file || loading 
                      ? 'bg-slate-200 cursor-not-allowed shadow-none' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-[0.97]'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Memproses AI...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Proses Subtitle
                    </>
                  )}
                </button>
                {(file || subtitles.length > 0) && (
                  <button 
                    onClick={reset}
                    disabled={loading}
                    className="p-5 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                    title="Mulai Ulang"
                  >
                    <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Right Section: Preview */}
            <div className="w-full lg:w-[420px] bg-slate-50/50 p-8 md:p-10 flex flex-col min-h-[600px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 flex items-center gap-3">
                  Preview Subtitle
                  {subtitles.length > 0 && (
                    <span className="bg-indigo-600 text-white text-[11px] px-2.5 py-1 rounded-full font-black">
                      {subtitles.length} Baris
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[500px] space-y-4 pr-2 custom-scrollbar">
                {subtitles.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-6">
                    {loading ? (
                      <div className="flex flex-col items-center">
                        <div className="relative mb-6">
                          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                          </div>
                        </div>
                        <p className="text-base font-bold text-indigo-700">Gemini sedang bekerja...</p>
                        <p className="text-xs mt-2 font-medium text-slate-400 leading-relaxed">
                          AI sedang mendengarkan audio dan menentukan apakah perlu transkripsi atau terjemahan.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                          <Languages className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="text-sm italic font-bold text-slate-400">Preview subtitle akan muncul di sini.</p>
                      </>
                    )}
                  </div>
                ) : (
                  subtitles.map((sub, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white p-5 rounded-2xl border border-slate-200 text-sm shadow-sm hover:border-indigo-400 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" 
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                          {formatSrtTime(sub.start)}
                        </span>
                        <div className="h-[2px] flex-1 bg-slate-50"></div>
                        <span className="text-[10px] font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                          {formatSrtTime(sub.end)}
                        </span>
                      </div>
                      <div className="text-slate-900 font-bold leading-relaxed">{sub.text}</div>
                    </div>
                  ))
                )}
              </div>

              {subtitles.length > 0 && (
                <button
                  onClick={handleDownload}
                  className="mt-10 w-full flex items-center justify-center gap-3 py-5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.25rem] font-black shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
                >
                  <Download className="w-6 h-6" />
                  Unduh File .SRT
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-8 bg-red-50 border-2 border-red-100 text-red-700 px-8 py-5 rounded-[1.5rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-6">
            <div className="bg-red-100 p-3 rounded-2xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="font-black">{error}</p>
          </div>
        )}

        {/* Quick Guide */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Upload className="text-indigo-600" />, title: 'Upload', desc: 'Seret video/audio Anda (maks 100MB).' },
            { icon: <Languages className="text-emerald-600" />, title: 'Pilih Bahasa', desc: 'Ingin hasil Indo atau Inggris?' },
            { icon: <CheckCircle2 className="text-orange-600" />, title: 'AI Otomatis', desc: 'AI mendeteksi & memproses subtitle.' },
            { icon: <Download className="text-blue-600" />, title: 'Unduh SRT', desc: 'Subtitle siap digunakan segera.' },
          ].map((step, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4">{step.icon}</div>
              <h4 className="font-black text-slate-900 mb-1">{step.title}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-16 text-slate-400 text-xs font-black uppercase tracking-widest">
        Powered by Gemini AI 3 &bull; AutoSub Translator v2.0
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
