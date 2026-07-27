# BÀI TẬP CUỐI KHÓA - ĐỀ NHÓM: ỨNG DỤNG QUẢN LÝ LỊCH TRÌNH CHUYẾN ĐỊA (TRIP PLANNER)

## 📌 Tổng Quan Dự Án

Với các công nghệ đã học trong khóa học như HTML, CSS, ReactJS,... Hãy xây dựng ứng dụng **Quản lý lịch trình cho một chuyến đi chơi**: tạo các hoạt động (event), sắp xếp thời gian, quản lý thành viên, quản lý chi tiêu và chia tiền nhóm, theo dõi trạng thái diễn ra theo thời gian thực, và thống kê nhanh.

---

## 🛠️ Yêu Cầu Chức Năng

### 1. Quản lý Event (CRUD)

* **Thông tin mỗi Event:**
  * Title (Tiêu đề)
  * Mô tả
  * Khoảng thời gian (Giờ bắt đầu – Giờ kết thúc)
  * Địa điểm
  * Loại hoạt động (Ví dụ: Ăn uống / Ngắm cảnh / Bonding / Khác/...)
  * Trạng thái: `Sắp tới` → `Đang diễn ra` → `Đã xong`, và 2 trạng thái phụ: `Hủy`, `Tạm hoãn`
  * Đánh dấu đã hoàn thành
  * Assign thành viên: Chọn những ai tham gia event (Multi-select)
  * Chi phí của event:
    * Số tiền
    * Người đại diện trả (Payer)
  * Luồng duyệt event: Event do thành viên thường (Member) tạo phải ở trạng thái `Chờ duyệt` trước khi vào lịch trình chính thức.

* **Form nhập Event:**
  * Có thể dùng Modal hoặc chuyển trang để nhập thông tin.
  * **Validate:**
    * Title là bắt buộc.
    * Giờ kết thúc phải sau giờ bắt đầu.
    * Không cho phép 2 event của cùng khung giờ chồng chéo hoàn toàn đè lên nhau.
  * Chọn loại hoạt động qua Dropdown hoặc Tag.

---

### 2. Quản lý thời gian

* **Thứ tự Event:**
  * Kéo–thả (Drag & Drop) để sắp xếp lại thứ tự event trong ngày, hoặc kéo để đổi khung giờ.
  * *Lưu ý:* Nếu không có thời gian làm drag-drop có thể thay thế bằng nút mũi tên `↑` `↓` để đổi thứ tự.
* **Realtime Engine (Hệ thống tự kiểm tra giờ hiện tại):**
  * Tự động chuyển event sang `Đang diễn ra` khi tới giờ bắt đầu.
  * Tự động chuyển sang `Đã xong` khi qua giờ kết thúc.
  * **Không** áp dụng với Event ở trạng thái `Tạm hoãn`.
  * Event ở trạng thái `Hủy` vẫn hiển thị trong danh sách, vẫn "chiếm" khung giờ nhưng **không** áp dụng bất kỳ business logic tự động nào.
* Hiển thị event nào đang diễn ra tại thời điểm hiện tại.

---

### 3. Quản lý nhóm & Thành viên

* **Xác thực (Auth):** Đăng nhập / Đăng ký thành viên.
* **CRUD thành viên:** Tên, vai trò mô tả (dẫn đoàn / xem map / nấu ăn / chụp hình...).
* **Phân quyền cơ bản:**
  * **Lead (Trưởng đoàn):** Toàn quyền — tạo/sửa/xóa event, duyệt event của người khác, xóa thành viên.
  * **Member (Thành viên):** Tạo event (vào trạng thái chờ duyệt), sửa/xóa event do chính mình tạo và chưa được duyệt; **không** được xóa event đã duyệt.
  * *Gợi ý đơn giản hóa:* 1 trip chỉ có 1 Lead (người tạo trip mặc định là Lead), không cần multi-lead.

---

### 4. Quản lý chi tiêu

* Chi phí mỗi event được chia đều cho các thành viên được assign vào event đó.
* **Tính toán "Ai nợ ai bao nhiêu":** `Đã trả bao nhiêu – Phải trả bao nhiêu = Dư/Nợ`.
* **Thống kê chi tiêu:**
  * Mỗi người đã chi bao nhiêu.
  * Mỗi người phải trả bao nhiêu.
  * Tổng chi phí toàn chuyến đi.

---

### 5. Thống kê

* Thống kê số lượng Event theo loại hoạt động.
* Thống kê theo trạng thái event.
* Hiển thị sự kiện đang diễn ra.
* Thống kê chi phí chi tiết.

---

### 6. Lưu dữ liệu & Nộp bài

* **Database:** Có thể sử dụng Database như MySQL, PostgreSQL,... hoặc Supabase, Firebase...
* **Lưu ý nộp bài:**
  * Push code lên GitHub (Public) hoặc upload lên Google Drive, sau đó gửi link trong form nộp bài.
  * **Không** upload thư mục `node_modules`.
  * Bắt buộc có file `README.md` hướng dẫn chạy code của dự án.
