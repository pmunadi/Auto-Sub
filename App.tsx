
import React, { useState, useRef } from 'react';
import { transcribeAndTranslateMedia } from './services/gemini';
import { SubtitleItem, Language } from './types';
import { generateSrtString, generateTxtString, downloadFile, formatSrtTime } from './utils/srt-helper';
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
  FileText,
  Youtube,
  Link as LinkIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<Language>(Language.ENGLISH);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size exceeds 100MB. Please upload a smaller file.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setYoutubeUrl(''); // Clear YouTube if file is uploaded
    setError(null);
    setSubtitles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const handleYoutubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
    if (e.target.value) {
      setFile(null); // Clear file if YouTube URL is entered
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setSubtitles([]);
    setError(null);
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
        setError("Invalid file format. Please use audio or video files.");
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
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!file && !youtubeUrl) {
      setError("Please provide a file or a YouTube link.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      let response;
      if (file) {
        const base64Data = await convertFileToBase64(file);
        response = await transcribeAndTranslateMedia(targetLanguage, { base64: base64Data, mimeType: file.type });
      } else {
        response = await transcribeAndTranslateMedia(targetLanguage, undefined, youtubeUrl);
      }
      setSubtitles(response.subtitles);
    } catch (err: any) {
      setError(err.message || "Failed to generate subtitles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSrt = () => {
    if (subtitles.length === 0) return;
    const srtContent = generateSrtString(subtitles);
    const prefix = file ? file.name.split('.')[0] : 'youtube_video';
    const fileName = `${prefix}_${targetLanguage}.srt`;
    downloadFile(srtContent, fileName);
  };

  const handleDownloadTxt = () => {
    if (subtitles.length === 0) return;
    const txtContent = generateTxtString(subtitles);
    const prefix = file ? file.name.split('.')[0] : 'youtube_video';
    const fileName = `${prefix}_${targetLanguage}_transcript.txt`;
    downloadFile(txtContent, fileName);
  };

  const reset = () => {
    setFile(null);
    setYoutubeUrl('');
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
          Transcription & Translation
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Auto<span className="text-indigo-600">Sub</span> Expert
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Generate subtitles in English or Indonesian effortlessly. <br className="hidden md:block" />
          Upload media or provide a YouTube link—AI handles the rest.
        </p>
      </div>

      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            
            {/* Left Section */}
            <div className="flex-1 p-8 md:p-10 space-y-8">
              {/* Step 1: Upload */}
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">01</span>
                  Upload Media (Max 100MB)
                </h2>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative group border-2 border-dashed rounded-[1.5rem] p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[220px] ${
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
                      <div className="bg-emerald-100 p-4 rounded-3xl mb-3 shadow-sm">
                        {file.type.startsWith('video') ? <FileVideo className="w-10 h-10 text-emerald-600" /> : <FileAudio className="w-10 h-10 text-emerald-600" />}
                      </div>
                      <p className="font-bold text-slate-900 text-md truncate max-w-[280px]">{file.name}</p>
                      <p className="text-xs text-emerald-600 font-bold bg-white px-3 py-1 rounded-full border border-emerald-100 mt-2">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className={`p-4 rounded-3xl bg-slate-50 transition-all ${isDragging ? 'bg-indigo-100 rotate-12' : 'group-hover:bg-indigo-50 group-hover:-rotate-3'}`}>
                        <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                      </div>
                      <div className="text-center">
                        <p className="font-extrabold text-slate-700">
                          {isDragging ? 'Drop it here!' : 'Drag & Drop File Here'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">MP4, MKV, MP3, WAV</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Step 2: YouTube Link */}
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">02</span>
                  OR Use YouTube Link
                </h2>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Youtube className={`w-5 h-5 transition-colors ${youtubeUrl ? 'text-red-500' : 'text-slate-400 group-focus-within:text-red-500'}`} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Paste YouTube URL here (e.g. https://youtube.com/watch?...)"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-red-200 focus:bg-white transition-all shadow-sm"
                    value={youtubeUrl}
                    onChange={handleYoutubeChange}
                  />
                </div>
              </div>

              {/* Step 3: Target Language */}
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">03</span>
                  Target Subtitle Language
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTargetLanguage(Language.ENGLISH)}
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-[1.25rem] border-2 font-bold transition-all ${
                      targetLanguage === Language.ENGLISH 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-2xl">🇺🇸</span>
                    <span>English</span>
                  </button>
                  <button 
                    onClick={() => setTargetLanguage(Language.INDONESIAN)}
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-[1.25rem] border-2 font-bold transition-all ${
                      targetLanguage === Language.INDONESIAN 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-[1.02]' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-2xl">🇮🇩</span>
                    <span>Indonesian</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-4">
                <button
                  disabled={(!file && !youtubeUrl) || loading}
                  onClick={handleGenerate}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-white shadow-2xl transition-all ${
                    (!file && !youtubeUrl) || loading 
                      ? 'bg-slate-200 cursor-not-allowed shadow-none' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-[0.97]'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      AI Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Generate Subtitles
                    </>
                  )}
                </button>
                {(file || youtubeUrl || subtitles.length > 0) && (
                  <button 
                    onClick={reset}
                    disabled={loading}
                    className="p-4 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                    title="Reset Everything"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Right Section: Preview */}
            <div className="w-full lg:w-[420px] bg-slate-50/50 p-8 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 flex items-center gap-3">
                  Subtitle Preview
                  {subtitles.length > 0 && (
                    <span className="bg-indigo-600 text-white text-[11px] px-2.5 py-1 rounded-full font-black">
                      {subtitles.length} Lines
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[480px] space-y-4 pr-2 custom-scrollbar">
                {subtitles.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-6">
                    {loading ? (
                      <div className="flex flex-col items-center">
                        <div className="relative mb-6">
                          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                          </div>
                        </div>
                        <p className="text-base font-bold text-indigo-700">AI is working...</p>
                        <p className="text-xs mt-2 font-medium text-slate-400 leading-relaxed">
                          Gemini is analyzing the {youtubeUrl ? 'video link' : 'audio track'} and generating precise timestamps.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                          <LinkIcon className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm italic font-bold text-slate-400">Your subtitles will appear here.</p>
                      </>
                    )}
                  </div>
                ) : (
                  subtitles.map((sub, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white p-4 rounded-2xl border border-slate-200 text-sm shadow-sm hover:border-indigo-400 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" 
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                          {formatSrtTime(sub.start)}
                        </span>
                        <div className="h-[1px] flex-1 bg-slate-50"></div>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                          {formatSrtTime(sub.end)}
                        </span>
                      </div>
                      <div className="text-slate-900 font-bold leading-relaxed">{sub.text}</div>
                    </div>
                  ))
                )}
              </div>

              {subtitles.length > 0 && (
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={handleDownloadSrt}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.25rem] font-black shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" />
                    Export .SRT
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-slate-700 hover:bg-slate-800 text-white rounded-[1.25rem] font-black shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                  >
                    <FileText className="w-5 h-5" />
                    Export Text (.txt)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-8 bg-red-50 border-2 border-red-100 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-red-100 p-2 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="font-black text-sm">{error}</p>
          </div>
        )}

        {/* Quick Guide */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Upload className="text-indigo-600" />, title: 'Local Upload', desc: 'Drag & Drop your media files (up to 100MB).' },
            { icon: <Youtube className="text-red-500" />, title: 'YouTube Link', desc: 'Paste a video URL and let AI do the work.' },
            { icon: <Languages className="text-emerald-600" />, title: 'Translate', desc: 'Get results in English or Indonesian.' },
            { icon: <Download className="text-orange-600" />, title: 'Multiple Formats', desc: 'Export as SRT subtitles or plain text transcript.' },
          ].map((step, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4">{step.icon}</div>
              <h4 className="font-black text-slate-900 text-sm mb-1">{step.title}</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-16 text-slate-400 text-[10px] font-black uppercase tracking-widest">
        Powered by Gemini AI 3 &bull; AutoSub Expert v2.5
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
