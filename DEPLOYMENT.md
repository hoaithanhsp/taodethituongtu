# MathGenius AI - Trợ lý tạo đề thi thông minh 🎓

Ứng dụng sử dụng Google Gemini AI để phân tích đề thi mẫu và tự động sinh ra các đề thi tương tự.

## 🚀 Triển khai lên Vercel

### Bước 1: Push code lên GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Bước 2: Triển khai trên Vercel
1. Truy cập [Vercel](https://vercel.com)
2. Click "Import Project"
3. Chọn repository của bạn từ GitHub
4. Cấu hình build:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"

### Bước 3: Cấu hình API Key (Không cần thiết lập trên Vercel)
Người dùng cuối sẽ tự nhập API key của họ khi sử dụng ứng dụng. API key được lưu trong localStorage của trình duyệt.

**Hướng dẫn người dùng lấy API key:**
1. Truy cập [Google AI Studio](https://aistudio.google.com/apikey)
2. Đăng nhập bằng tài khoản Google
3. Click "Create API Key"
4. Copy API key và paste vào modal khi ứng dụng yêu cầu

## ✨ Tính năng

- ✅ **Phân tích đề thi**: AI tự động nhận diện cấu trúc, ma trận, mức độ các câu hỏi
- ✅ **Sinh đề tương tự**: Tạo 2 đề thi mới với cùng cấu trúc nhưng nội dung khác
- ✅ **Đáp án chi tiết**: Kèm lời giải chi tiết cho từng câu hỏi
- ✅ **Xuất PDF**: In hoặc lưu đề thi thành file PDF
- ✅ **API Key cá nhân**: Người dùng tự quản lý API key của mình

## 🛠️ Phát triển local

### Cài đặt dependencies
```bash
npm install
```

### Chạy development server
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## 📝 Cấu trúc dự án

```
├── components/
│   ├── ApiKeyModal.tsx      # Modal để người dùng nhập API key
│   ├── FileUpload.tsx        # Component upload file đề thi
│   └── MarkdownResult.tsx    # Hiển thị kết quả dạng Markdown
├── services/
│   └── geminiService.ts      # Service gọi API Gemini
├── App.tsx                   # Component chính
├── index.html                # HTML template
├── vercel.json              # Cấu hình Vercel cho SPA routing
└── AI_INSTRUCTIONS.md       # Hướng dẫn phát triển cho AI
```

## 🔧 Xử lý lỗi thường gặp

### Lỗi "RESOURCE_EXHAUSTED" hoặc 429
- **Nguyên nhân**: API key đã hết quota
- **Giải pháp**: Tạo API key mới hoặc đợi quota reset

### Lỗi 403 - "API key not valid"
- **Nguyên nhân**: API key không hợp lệ hoặc bị vô hiệu hóa
- **Giải pháp**: Kiểm tra lại API key tại Google AI Studio

### Lỗi 400 - "Bad Request"
- **Nguyên nhân**: File đầu vào không đúng định dạng hoặc quá lớn
- **Giải pháp**: Kiểm tra lại file PDF/ảnh đề thi

## 📄 License

MIT License

---

**Developed with ❤️ using Google Gemini AI**
