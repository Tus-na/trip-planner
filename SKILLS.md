# 🛠️ CLINE SKILLS & WORKFLOWS - TRIP PLANNER

Mỗi khi người dùng gõ lệnh `/name-of-skill`, hãy thực hiện đúng quy trình được định nghĩa bên dưới.

---

## 1. `/create-component`

**Mục tiêu:** Tạo một React Component mới theo chuẩn dự án.
**Quy trình:**

1. Tạo file `.jsx` trong thư mục `src/components/` hoặc `src/pages/`.
2. Dùng Functional Component với React Hooks.
3. Import icons từ `lucide-react` nếu cần UI/UX.
4. Sử dụng Tailwind CSS v4 hoàn toàn cho styling (đảm bảo responsive).
5. Thêm Proptypes hoặc JSDoc comment ngắn gọn ở đầu component bằng tiếng Việt.

---

## 2. `/add-event-logic`

**Mục tiêu:** Viết hoặc cập nhật logic xử lý Event.
**Quy trình:**

1. Kiểm tra validation: `title` không rỗng, `endTime` > `startTime`.
2. Kiểm tra trùng khung giờ với các Event hiện có.
3. Nếu người dùng hiện tại là `MEMBER`:
   - Set `isApproved = false`.
   - Set `status = 'PENDING'`.
4. Nếu người dùng hiện tại là `LEAD`:
   - Set `isApproved = true`.
   - Set `status = 'UPCOMING'`.

---

## 3. `/split-bill-calc`

**Mục tiêu:** Bổ sung hoặc refactor hàm tính toán chia tiền chuyến đi.
**Quy trình:**

1. Lấy tổng chi phí của Event (`cost`).
2. Chia đều cho danh sách `assignedUserIds` để ra số tiền mỗi người phải trả (`share`).
3. Cập nhật số dư Balance của từng user:
   - Người trả tiền (`payerId`): `+ (cost - share)`
   - Người tham gia khác: `- share`
4. Xuất kết quả dạng mảng object: `{ userId, totalPaid, totalOwed, balance }`.

---

## 4. `/check-realtime`

**Mục tiêu:** Viết hook/hàm kiểm tra trạng thái tự động theo thời gian thực.
**Quy trình:**

1. Lấy giờ hiện tại (`dayjs()`).
2. So sánh với `startTime` và `endTime` của Event.
3. Bỏ qua nếu Event đang ở trạng thái `DELAYED` hoặc `CANCELLED`.
4. Cập nhật status:
   - Trước `startTime` -> `UPCOMING`
   - Từ `startTime` đến `endTime` -> `IN_PROGRESS`
   - Sau `endTime` -> `COMPLETED`

---

## 5. `/review-code`

**Mục tiêu:** Review lại file vừa sửa trước khi commit Git.
**Quy trình:**

1. Kiểm tra xem có hardcode dữ liệu không.
2. Kiểm tra có đúng phân quyền Lead/Member không.
3. Kiểm tra các class Tailwind CSS xem có bị lỗi syntax v4 không.
