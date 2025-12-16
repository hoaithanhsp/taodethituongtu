import React, { useState, useEffect } from 'react';
import { Key, X, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const savedKey = localStorage.getItem('gemini_api_key') || '';
            setApiKey(savedKey);
            setError('');
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!apiKey.trim()) {
            setError('Vui lòng nhập API key');
            return;
        }
        localStorage.setItem('gemini_api_key', apiKey.trim());
        onSave(apiKey.trim());
        onClose();
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <Key size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Cấu hình API Key</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Tại sao cần API Key?</p>
                            <p>Ứng dụng sử dụng Google Gemini AI để tạo đề thi. Bạn cần API key miễn phí từ{' '}
                                <a
                                    href="https://aistudio.google.com/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline font-medium hover:text-blue-900"
                                >
                                    Google AI Studio
                                </a>
                            </p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-slate-700 mb-2">
                            Gemini API Key
                        </label>
                        <input
                            id="api-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setError('');
                            }}
                            placeholder="AIza..."
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </p>
                        )}
                    </div>

                    <div className="text-xs text-slate-500">
                        API key của bạn sẽ được lưu cục bộ trên trình duyệt và không bao giờ được gửi đến bất kỳ server nào ngoài Google AI.
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-b-2xl border-t border-slate-200">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Xóa Key
                    </button>
                    <div className="flex space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
