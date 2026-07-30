# Trip Planner (Quản lý lịch trình chuyến đi)

## 📌 Tổng Quan Dự Án

Đây là một ứng dụng web được xây dựng để quản lý lịch trình cho một chuyến đi chơi, bao gồm việc tạo các hoạt động (event), sắp xếp thời gian, quản lý thành viên, quản lý chi tiêu và chia tiền nhóm, theo dõi trạng thái diễn ra theo thời gian thực, và thống kê nhanh.

## 🛠 Tech Stack

- **Frontend:** ReactJS (Vite) + Tailwind CSS v4
- **State Management:** React Context API (`AuthContext`, `TripContext`)
- **UI & Icons:** Lucide React (`lucide-react`)
- **Helpers:** DayJS (`dayjs`)
- **Database/Backend:** Supabase

## 🚀 Hướng dẫn chạy dự án

Để chạy dự án này trên máy cục bộ của bạn, hãy làm theo các bước sau:

### 1. Cài đặt Node.js và npm

Đảm bảo bạn đã cài đặt Node.js (phiên bản 18 trở lên) và npm trên máy tính của mình. Bạn có thể tải xuống từ trang web chính thức của Node.js: [nodejs.org](https://nodejs.org/)

### 2. Clone repository

Mở terminal hoặc command prompt và clone dự án về máy của bạn:

```bash
git clone https://github.com/Tus-na/trip-planner.git
cd trip-planner
```

### 3. Cài đặt các dependencies

Trong thư mục dự án, chạy lệnh sau để cài đặt tất cả các thư viện cần thiết:

```bash
npm install
```

### 4. Cấu hình Supabase

Dự án sử dụng Supabase làm backend. Bạn cần thiết lập một dự án Supabase mới và cấu hình các biến môi trường.

#### 4.1. Tạo dự án Supabase

1. Truy cập [Supabase website](https://supabase.com/) và đăng nhập/đăng ký.
2. Tạo một dự án mới.
3. Sau khi dự án được tạo, đi tới `Project Settings` -> `API` để lấy `Project URL` và `anon public key`.

#### 4.2. Cấu hình biến môi trường

Tạo một file `.env` ở thư mục gốc của dự án với nội dung sau:

```.env
VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
```

Thay thế `"YOUR_SUPABASE_PROJECT_URL"` và `"YOUR_SUPABASE_ANON_PUBLIC_KEY"` bằng các giá trị bạn đã lấy từ Supabase.

#### 4.3. Thiết lập Database Schema

Bạn có thể sử dụng file `supabase/schema.sql` để thiết lập schema cho Supabase. File này chứa định nghĩa cho các bảng `profiles` và `events` cùng với các ràng buộc và view cần thiết.

Bạn có thể chạy script này trực tiếp trong SQL Editor của Supabase hoặc thông qua Supabase CLI.

**Lưu ý cấu trúc DB mới nhất:**
App thiết kế theo dạng Single Trip (Chỉ có 1 chuyến đi). Thông tin người dùng và phân quyền nằm trực tiếp ở bảng `profiles` với các cột: `id`, `full_name`, `avatar_url`, `role` ('LEAD' hoặc 'MEMBER'), và `assigned_role` (Mô tả công việc).

### 5. Chạy ứng dụng

Sau khi cài đặt và cấu hình xong, bạn có thể chạy ứng dụng bằng lệnh:

```bash
npm run dev
```

Ứng dụng sẽ khởi động trên `http://localhost:5173/` (hoặc một cổng khác nếu 5173 đã được sử dụng).

## 📝 Tính năng chính

- **Quản lý Event (CRUD):** Tạo, đọc, cập nhật, xóa các sự kiện với đầy đủ thông tin, validation form và phân quyền.
- **Quản lý thời gian:** Tự động cập nhật trạng thái sự kiện (Sắp tới, Đang diễn ra, Đã xong) theo thời gian thực. Hỗ trợ kéo-thả để sắp xếp thứ tự sự kiện.
- **Quản lý nhóm & Thành viên:** Đăng nhập/đăng ký, quản lý thông tin thành viên, phân quyền `LEAD` và `MEMBER`.
- **Luồng Duyệt Event:** Event do `MEMBER` tạo cần `LEAD` duyệt. `LEAD` có thể duyệt hoặc từ chối các sự kiện đang chờ.
- **Quản lý chi tiêu:** Tính toán chi phí, chia tiền giữa các thành viên, thống kê "Ai nợ ai bao nhiêu".
- **Thống kê:** Thống kê sự kiện theo loại, trạng thái và chi phí.

## 🤝 Đóng góp

Nếu bạn muốn đóng góp vào dự án, vui lòng fork repository và tạo pull request.
