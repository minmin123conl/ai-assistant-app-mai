# AI Assistant App

Ứng dụng trợ lý AI thông minh với giao diện hiện đại và nhiều tính năng hữu ích.

## 🌟 Tính năng chính

### 📅 Thời Gian Biểu
- Quản lý lịch học và công việc hàng ngày
- Thêm, sửa, xóa các task
- Theo dõi trạng thái hoàn thành
- AI hỗ trợ tối ưu hóa thời gian biểu

### 📝 Ghi Chú
- Tạo và quản lý ghi chú với editor rich text
- Bảo vệ ghi chú bằng mật khẩu
- Thiết lập thời hạn cho ghi chú
- Lưu trữ trên server với API Flask

### 🤖 AI Hỗ Trợ Học Tập
- Chat với AI Gemini để hỗ trợ học tập
- Dịch thuật đa ngôn ngữ
- Phân tích và tư vấn học tập

### 🎮 Giải Trí
- Nghe nhạc từ YouTube, Spotify
- Xem video từ YouTube, Bilibili
- Quản lý playlist cá nhân

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 19** - Framework UI hiện đại
- **Vite 6** - Build tool nhanh chóng
- **TailwindCSS 4** - Styling utility-first
- **Radix UI** - Component library chất lượng cao
- **Framer Motion** - Animation mượt mà

### Backend
- **Flask** - Web framework Python
- **SQLite** - Cơ sở dữ liệu nhẹ
- **Flask-CORS** - Hỗ trợ cross-origin requests

### AI & APIs
- **Google Gemini API** - AI chat và dịch thuật
- **Custom Notes API** - Quản lý ghi chú

## 🚀 Cài đặt và chạy

### Prerequisites
- Node.js 20+
- Python 3.11+
- pnpm

### Frontend
```bash
cd ai-assistant-app-main
pnpm install
pnpm dev
```

### Backend
```bash
cd ai-assistant-app-main/server
pip install -r requirements.txt
python app.py
```

## 🌐 Demo

Ứng dụng đã được triển khai tại: **https://cixnhdio.manus.space**

## 📁 Cấu trúc dự án

```
ai-assistant-app-main/
├── src/
│   ├── components/ui/     # Radix UI components
│   ├── App.jsx           # Component chính
│   ├── api.js            # API client
│   ├── gemini-api.js     # Gemini AI integration
│   └── App.css           # Styles
├── server/
│   ├── app.py            # Flask backend
│   ├── requirements.txt  # Python dependencies
│   └── .env              # Environment variables
├── dist/                 # Build output
└── package.json          # Frontend dependencies
```

## 🔧 Cấu hình

### Environment Variables
Tạo file `.env` trong thư mục `server/`:
```
FLASK_APP=app.py
FLASK_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📱 Responsive Design

Ứng dụng được thiết kế responsive, hoạt động tốt trên:
- Desktop (1280px+)
- Tablet (768px - 1024px)
- Mobile (375px+)

## 🎨 UI/UX Features

- **Glass morphism design** - Hiệu ứng kính mờ hiện đại
- **Smooth animations** - Chuyển động mượt mà
- **Dark/Light theme ready** - Sẵn sàng cho theme tối/sáng
- **Intuitive navigation** - Điều hướng trực quan

## 🔒 Bảo mật

- Mã hóa mật khẩu ghi chú
- CORS protection
- Input validation
- Secure API endpoints

## 📈 Performance

- Lazy loading components
- Optimized bundle size
- Fast HMR development
- Efficient state management

## 🤝 Đóng góp

Dự án được phát triển với mục đích học tập và demo. Mọi đóng góp đều được chào đón!

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**Được phát triển với ❤️ bởi AI Assistant Team**

