import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { MarkdownResult } from './components/MarkdownResult';
import { generateExams } from './services/geminiService';
import { AppStatus, GeneratedContent, FileData, DiagramMode, SolutionMode } from './types';
import { BookOpen, Copy, RotateCcw, BrainCircuit, FileSpreadsheet, CheckCircle, Download, Settings, FileText, Sliders, Image, List } from 'lucide-react';
import { saveAs } from 'file-saver';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';
import ReactDOMServer from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'examContent' | 'detailedSolution'>('analysis');
  const [fileName, setFileName] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string>('');

  const [fileData, setFileData] = useState<FileData | null>(null);

  // New State for Modes
  // New State for Modes
  const [diagramMode, setDiagramMode] = useState<DiagramMode>('standard');
  const [solutionMode, setSolutionMode] = useState<SolutionMode>('detailed');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');

  React.useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    const storedModel = localStorage.getItem('GEMINI_SELECTED_MODEL');
    if (storedKey) setApiKey(storedKey);
    else setIsSettingsOpen(true);

    if (storedModel) setSelectedModel(storedModel);
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    localStorage.setItem('GEMINI_SELECTED_MODEL', selectedModel);
    setApiKey(key);
    setIsSettingsOpen(false);
  };

  const handleFileSelect = async (data: FileData) => {
    setFileData(data);
    setFileName(data.name);
    // Auto-generate removed to allow manual trigger
  };

  const handleGenerate = async (data: FileData) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setStatus(AppStatus.ANALYZING);
    setErrorDetail('');

    try {
      const generatedContent = await generateExams(data.base64, data.mimeType, apiKey, {
        diagramMode,
        solutionMode
      }, selectedModel);
      setResult(generatedContent);
      setStatus(AppStatus.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      setErrorDetail(error.message || JSON.stringify(error));
    }
  };

  const resetApp = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setFileName('');
    setFileData(null);
    setFileData(null);
    setActiveTab('analysis');
    setErrorDetail('');
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
      activeTab === 'examContent' ? 'Đề thi' : 'Lời giải chi tiết';

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

  const handleExportWord = async () => {
    // If exporting Solution, we prepend the Exam Content for context? Or just export what is seen?
    // User requested "Part 1 Exam, Part 2 Solution" format in export.
    // Let's check which tab is active.

    let content = '';
    if (activeTab === 'analysis') {
      content = result?.analysis || '';
    } else {
      // If on Exam or Solution tab, export BOTH combined for a complete document
      // matching the "Step 1, Step 2" requirement in the file.
      if (result) {
        content = result.examContent + '\n\n---\n\n' + result.detailedSolution;
      }
    }

    if (!content) return;

    try {
      // 1. Convert Markdown to HTML (keeping LaTeX as raw text by NOT using remark-math)
      // We use remark-gfm to support tables
      // 0. Pre-process content to fix formatting issues
      // - Replace literal escaped "\n" with real newlines
      // - Force newline before options (A., B., C., D.) if they are inline
      // - Add double spaces before newlines to force Markdown hard breaks
      const cleanContent = content
        .replace(/\\n/g, '\n') // Fix literal \n
        .replace(/([^\n])\s+([A-D]\.)/g, '$1\n$2') // Force newline before options A. B. C. D.
        .replace(/\n/g, '  \n'); // Force hard breaks

      const htmlContent = ReactDOMServer.renderToStaticMarkup(
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom styling for paragraphs to ensure separation in Word
            p: ({ node, ...props }) => <p style={{ marginBottom: '10pt', lineHeight: '1.5' }} {...props} />,
            // Ensure headers are distinct
            h1: ({ node, ...props }) => <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginTop: '12pt', marginBottom: '6pt' }} {...props} />,
            h2: ({ node, ...props }) => <h2 style={{ fontSize: '16pt', fontWeight: 'bold', marginTop: '12pt', marginBottom: '6pt' }} {...props} />,
            h3: ({ node, ...props }) => <h3 style={{ fontSize: '14pt', fontWeight: 'bold', marginTop: '10pt', marginBottom: '6pt' }} {...props} />,
            h4: ({ node, ...props }) => <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginTop: '10pt', marginBottom: '6pt' }} {...props} />,
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      );

      // 2. Wrap via full HTML document with styles for Word
      // Note: Word handles basic CSS tables well
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Export</title>
            <style>
              body { font-family: 'Times New Roman', serif; font-size: 12pt; }
              h1, h2, h3 { font-family: 'Arial', sans-serif; color: #333; }
              table { border-collapse: collapse; width: 100%; margin: 1em 0; }
              th, td { border: 1px solid #000; padding: 5px; vertical-align: top; }
              th { background-color: #f0f0f0; font-weight: bold; }
              img { max-width: 100%; }
              /* Enhance raw latex visibility if needed, though plain text is standard */
            </style>
          </head>
          <body>
            ${htmlContent}
            <br/>
            <p style="text-align: center; color: #888; font-size: 10pt;">Generated by MathGenius AI</p>
          </body>
        </html>
      `;

      // 3. Convert to Docx Blob
      const blob = await asBlob(fullHtml, {
        orientation: 'portrait',
        margins: { top: 720, right: 720, bottom: 720, left: 720 } // twips (1440 = 1 inch, so 0.5 inch margins)
      }) as Blob;

      // 4. Save file
      // const docName is already declared? No it's block scoped.
      // Wait, replacement chunk had duplicate.
      const docName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "de-thi";

      const suffix = activeTab === 'analysis' ? 'phan-tich' : 'de-va-loi-giai';
      saveAs(blob, `${docName}_${suffix}.docx`);

    } catch (error) {
      console.error('Export Word Error:', error);
      alert('Có lỗi khi xuất file Word. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
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
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
              title="Cài đặt API Key"
            >
              <Settings size={18} />
              <span className="font-medium">Settings (API Key)</span>
              {!apiKey && <span className="text-red-500 text-xs font-bold animate-pulse">Lấy API key để sử dụng app</span>}
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

            {/* Configuration Options */}
            <div className="max-w-2xl mx-auto mb-8 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200/60 text-left animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
              <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
                <Sliders size={18} className="text-blue-600" />
                <h3>Cấu hình sinh đề</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Diagram Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Image size={16} className="text-slate-400" />
                    Chất lượng hình vẽ
                  </label>
                  <select
                    value={diagramMode}
                    onChange={(e) => setDiagramMode(e.target.value as DiagramMode)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="standard">Tiêu chuẩn (Ưu tiên tốc độ)</option>
                    <option value="detailed">Cao cấp (Chi tiết & Chính xác)</option>
                  </select>
                </div>

                {/* Solution Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <List size={16} className="text-slate-400" />
                    Chi tiết lời giải
                  </label>
                  <select
                    value={solutionMode}
                    onChange={(e) => setSolutionMode(e.target.value as SolutionMode)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="concise">Ngắn gọn (Chỉ đáp án)</option>
                    <option value="detailed">Tiêu chuẩn (Giải chi tiết)</option>
                    <option value="very_detailed">Chuyên sâu (Giải thích & Mẹo)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <FileUpload onFileSelect={handleFileSelect} isLoading={status === AppStatus.ANALYZING} />
            </div>

            {/* Manual Generate Trigger */}
            <div className="mt-8 flex flex-col items-center justify-center space-y-4">
              {fileName && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle size={16} />
                  <span>Đã chọn: {fileName}</span>
                </div>
              )}

              <button
                onClick={() => fileData && handleGenerate(fileData)}
                disabled={!fileData || status === AppStatus.ANALYZING}
                className={`
                  group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-full 
                  shadow-lg shadow-blue-500/30 transition-all duration-300
                  ${!fileData || status === AppStatus.ANALYZING
                    ? 'opacity-50 cursor-not-allowed grayscale'
                    : 'hover:-translate-y-1 hover:shadow-blue-500/50 hover:scale-105 active:scale-95'
                  }
                `}
              >
                <span className="flex items-center gap-3">
                  <BrainCircuit size={24} className={status === AppStatus.ANALYZING ? "animate-spin" : ""} />
                  {status === AppStatus.ANALYZING ? "ĐANG PHÂN TÍCH..." : "TẠO ĐỀ TƯƠNG TỰ"}
                </span>

                {(!fileData) && (
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Vui lòng tải lên đề thi trước
                  </span>
                )}
              </button>
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
                { icon: Copy, title: "Sinh đề tương tự", desc: "Tạo 1 đề mới giữ nguyên cấu trúc nhưng thay đổi số liệu." },
                { icon: CheckCircle, title: "Đáp án chi tiết", desc: "Kèm lời giải chi tiết và bảng đáp án nhanh." },
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
            <p className="text-red-600 font-medium mb-4 px-4 break-words">
              {errorDetail || "Không thể xử lý đề thi này. Vui lòng kiểm tra lại file hoặc thử lại sau."}
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
              <div className="sticky top-24 space-y-6">

                {/* File Info & Nav */}
                <div className="space-y-2">
                  <div className="px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200 mb-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">File gốc</p>
                    <p className="text-sm font-medium text-slate-900 truncate" title={fileName}>{fileName}</p>
                  </div>

                  <nav className="flex flex-col space-y-1">
                    {[
                      { id: 'analysis', label: 'Phân tích Ma trận', icon: FileSpreadsheet },
                      { id: 'examContent', label: 'Đề thi (Bước 1)', icon: BookOpen },
                      { id: 'detailedSolution', label: 'Lời giải (Bước 2)', icon: List },
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

                {/* Quick Regen Config */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold pb-2 border-b border-slate-100">
                    <Sliders size={16} className="text-blue-600" />
                    <h3 className="text-sm">Cấu hình sinh đề</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Hình vẽ</label>
                      <select
                        value={diagramMode}
                        onChange={(e) => setDiagramMode(e.target.value as DiagramMode)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500"
                      >
                        <option value="standard">Tiêu chuẩn</option>
                        <option value="detailed">Cao cấp</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Lời giải</label>
                      <select
                        value={solutionMode}
                        onChange={(e) => setSolutionMode(e.target.value as SolutionMode)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500"
                      >
                        <option value="concise">Ngắn gọn</option>
                        <option value="detailed">Tiêu chuẩn</option>
                        <option value="very_detailed">Chuyên sâu</option>
                      </select>
                    </div>

                    <button
                      onClick={() => fileData && handleGenerate(fileData)}
                      className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} />
                      <span>Tạo đề</span>
                    </button>
                  </div>
                </div>

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
                    {activeTab === 'examContent' && 'NỘI DUNG ĐỀ THI'}
                    {activeTab === 'detailedSolution' && 'HƯỚNG DẪN GIẢI CHI TIẾT'}
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
                      onClick={handleExportWord}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                      title="Xuất Word (.docx)"
                    >
                      <FileText size={16} />
                      <span>Xuất Word</span>
                    </button>
                    <button
                      onClick={() => {
                        const text = activeTab === 'analysis' ? result?.analysis :
                          activeTab === 'examContent' ? result?.examContent : result?.detailedSolution;
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

                  {activeTab === 'examContent' && result && (
                    <MarkdownResult content={result.examContent} />
                  )}

                  {activeTab === 'detailedSolution' && result && (
                    <MarkdownResult content={result.detailedSolution} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-800 text-slate-300 py-8 px-4 mt-auto border-t border-slate-700 no-print">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
            <p className="font-bold text-lg md:text-xl text-blue-200 mb-3 leading-relaxed">
              ĐĂNG KÝ KHOÁ HỌC THỰC CHIẾN VIẾT SKKN, TẠO APP DẠY HỌC, TẠO MÔ PHỎNG TRỰC QUAN <br className="hidden md:block" />
              <span className="text-yellow-400">CHỈ VỚI 1 CÂU LỆNH</span>
            </p>
            <a
              href="https://forms.gle/d7AmcT9MTyGy7bJd8"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all transform hover:-translate-y-1 shadow-lg shadow-blue-900/50"
            >
              ĐĂNG KÝ NGAY
            </a>
          </div>

          <div className="space-y-2 text-sm md:text-base">
            <p className="font-medium text-slate-400">Mọi thông tin vui lòng liên hệ:</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
              <a
                href="https://www.facebook.com/tranhoaithanhvicko/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
              >
                <span className="font-bold">Facebook:</span> tranhoaithanhvicko
              </a>
              <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span className="hover:text-emerald-400 transition-colors duration-200 cursor-default flex items-center gap-2">
                <span className="font-bold">Zalo:</span> 0348296773
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* API Key Modal */}
      {(isSettingsOpen || !apiKey) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Cài đặt API Key
              </h3>
              {apiKey && (
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <RotateCcw className="w-5 h-5 rotate-45" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Để sử dụng MathGenius AI, bạn cần cung cấp Gemini API Key của riêng mình (Google AI Studio).
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>



              {/* Model Selection */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Chọn Model AI
                </label>
                <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto">
                  {[
                    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', desc: 'Tốc độ cao, mặc định' },
                    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', desc: 'Cân bằng tốt' },
                    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Ổn định, nhanh' },
                    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Mạnh mẽ nhất' },
                  ].map((model) => (
                    <div
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedModel === model.id
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${selectedModel === model.id ? 'text-blue-700' : 'text-slate-700'}`}>
                          {model.name}
                        </p>
                        <p className="text-xs text-slate-500">{model.desc}</p>
                      </div>
                      {selectedModel === model.id && <CheckCircle size={16} className="text-blue-600" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveApiKey(apiKey)}
                  disabled={!apiKey}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Lưu & Bắt đầu
                </button>
              </div>

              <p className="text-xs text-center text-slate-400 mt-4">
                Key được lưu cục bộ trên trình duyệt của bạn (LocalStorage).
              </p>
            </div>
          </div>
        </div >
      )}
    </div >
  );
};

export default App;
