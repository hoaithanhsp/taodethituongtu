import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { MarkdownResult } from './components/MarkdownResult';
import { generateExams } from './services/geminiService';
import { AppStatus, GeneratedContent, FileData } from './types';
import { BookOpen, Copy, RotateCcw, BrainCircuit, FileSpreadsheet, CheckCircle, Download, Settings, Key } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'exam1' | 'exam2'>('analysis');
  const [fileName, setFileName] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
    } else if (process.env.GEMINI_API_KEY) {
      setApiKey(process.env.GEMINI_API_KEY);
    } else {
      // If no key found, prompt user to enter it
      setShowSettings(true);
    }
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setShowSettings(false);
  };

  const handleFileSelect = async (fileData: FileData) => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    setStatus(AppStatus.ANALYZING);
    setFileName(fileData.name);
    setErrorMessage('');
    try {
      const generatedContent = await generateExams(apiKey, fileData.base64, fileData.mimeType);
      setResult(generatedContent);
      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      if (error instanceof Error) {
        setErrorMessage(error.message);
        if (error.message.includes("API Key")) {
          alert(error.message);
          setShowSettings(true);
        }
      } else {
        setErrorMessage("Đã xảy ra lỗi không xác định.");
      }
    }
  };

  const resetApp = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setFileName('');
    setErrorMessage('');
    setActiveTab('analysis');
  };

  const handleExportPDF = () => {
    const contentElement = document.getElementById('exam-view-content');
    if (!contentElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup để tải PDF');
      return;
    }

    const title = activeTab === 'analysis' ? 'Phân tích Ma trận' :
      activeTab === 'exam1' ? 'Đề thi số 1' : 'Đề thi số 2';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${fileName}</title>
          <meta charset="UTF-8" />
          <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4;
              margin: 20mm;
            }
            /* Override prose colors for print to ensure absolute black */
            .prose { color: #000 !important; max-width: none !important; }
            .prose h1, .prose h2, .prose h3, .prose h4 { color: #000 !important; }
            .prose strong { color: #000 !important; }
            .prose p { color: #000 !important; }
            .prose ul, .prose ol { color: #000 !important; }
            
            /* Table Styling for Print */
            .prose table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
            .prose th, .prose td { border: 1px solid #000 !important; padding: 8px; text-align: left; }
            .prose th { background-color: #f3f4f6 !important; font-weight: bold; }

            /* Code block clean up */
            pre { background: #fff !important; border: 1px solid #ccc !important; color: #000 !important; }
            code { color: #000 !important; background: transparent !important; }
            
            /* Hide UI elements */
            button, .no-print { display: none !important; } 
          </style>
        </head>
        <body class="p-8">
          <div class="text-center mb-8 border-b-2 border-black pb-4">
             <h1 class="text-2xl font-bold uppercase mb-2">ĐỀ THI TẠO BỞI MATHGENIUS AI</h1>
             <p class="text-sm text-gray-600">Nguồn: ${fileName} | ${title}</p>
          </div>
          <div class="prose prose-slate">
            ${contentElement.innerHTML}
          </div>
          <div class="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
            Generated by MathGenius AI
          </div>
          <script>
            window.onload = () => {
               // Give KaTeX and Fonts a moment to settle
               setTimeout(() => {
                 window.print();
               }, 800);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-bold">Cấu hình API Key</h3>
            </div>

            <p className="text-slate-600 text-sm">
              Để sử dụng ứng dụng, bạn cần nhập Gemini API Key của mình.
              Key được lưu trữ an toàn trên trình duyệt của bạn.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Gemini API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Chưa có key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Lấy key tại đây</a>
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                {apiKey && localStorage.getItem('GEMINI_API_KEY') && (
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                  >
                    Đóng
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                MathGenius AI
              </h1>
              <p className="text-xs text-slate-500 font-medium">Trợ lý tạo đề thi thông minh</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Cài đặt API Key"
            >
              <Key size={20} />
            </button>

            {status === AppStatus.SUCCESS && (
              <button
                onClick={resetApp}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
              >
                <RotateCcw size={16} />
                <span>Tạo đề mới</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {status === AppStatus.IDLE || status === AppStatus.ANALYZING ? (
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Biến một đề thi thành <span className="text-blue-600">vô hạn</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Tải lên đề thi mẫu (PDF/Ảnh). AI sẽ phân tích cấu trúc, độ khó và sinh ra các đề tương tự chỉ trong giây lát.
              </p>
            </div>

            <div className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <FileUpload onFileSelect={handleFileSelect} isLoading={status === AppStatus.ANALYZING} />
            </div>

            {status === AppStatus.ANALYZING && (
              <div className="max-w-lg mx-auto mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-center text-sm font-medium text-blue-700 mt-2">
                  Đang đọc ma trận đề: "{fileName}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
              {[
                { icon: FileSpreadsheet, title: "Phân tích Ma trận", desc: "Tự động nhận diện mức độ nhận biết, thông hiểu, vận dụng." },
                { icon: Copy, title: "Sinh đề song song", desc: "Tạo 2 đề mới giữ nguyên cấu trúc nhưng thay đổi số liệu." },
                { icon: CheckCircle, title: "Đáp án chi tiết", desc: "Kèm lời giải chi tiết và mã TikZ cho hình học." },
              ].map((feature, idx) => (
                <div key={idx} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : status === AppStatus.ERROR ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-6">
              <RotateCcw size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-slate-600 mb-4 font-medium text-red-600">
              {errorMessage || "Không thể xử lý đề thi này. Vui lòng kiểm tra lại file hoặc thử lại sau."}
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Gợi ý: Kiểm tra API Key (đảm bảo key hợp lệ) hoặc file đầu vào.
            </p>
            <button
              onClick={resetApp}
              className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
            {/* Sidebar / Tabs */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-2">
                <div className="px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200 mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">File gốc</p>
                  <p className="text-sm font-medium text-slate-900 truncate" title={fileName}>{fileName}</p>
                </div>

                <nav className="flex flex-col space-y-1">
                  {[
                    { id: 'analysis', label: 'Phân tích Ma trận', icon: FileSpreadsheet },
                    { id: 'exam1', label: 'Đề đề xuất #1', icon: BookOpen },
                    { id: 'exam2', label: 'Đề đề xuất #2', icon: BookOpen },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                        }`}
                    >
                      <tab.icon size={18} />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] p-6 md:p-10 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl opacity-80" />

                {/* Toolbar */}
                <div className="mb-6 pb-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {activeTab === 'analysis' && 'Phân tích Đề thi'}
                    {activeTab === 'exam1' && 'Đề thi Đề xuất 01'}
                    {activeTab === 'exam2' && 'Đề thi Đề xuất 02'}
                  </h2>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                      title="Xuất PDF"
                    >
                      <Download size={16} />
                      <span>Xuất PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        const text = activeTab === 'analysis' ? result?.analysis :
                          activeTab === 'exam1' ? result?.exam1 : result?.exam2;
                        if (text) navigator.clipboard.writeText(text);
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                      title="Sao chép Markdown"
                    >
                      <Copy size={16} />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                {/* Content - Wrapped for Print Capture */}
                <div id="exam-view-content" className="animate-in fade-in slide-in-from-right-4 duration-300">
                  {activeTab === 'analysis' && result && (
                    <MarkdownResult content={result.analysis} />
                  )}

                  {activeTab === 'exam1' && result && (
                    <MarkdownResult content={result.exam1} />
                  )}

                  {activeTab === 'exam2' && result && (
                    <MarkdownResult content={result.exam2} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;