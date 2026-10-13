# Hoàn thiện Phase 3: Group, Asset Properties, chọn Timeline và Copy/Paste

Lưu project/draft rồi tải lại http://127.0.0.1:4310/. Thay đổi local; không commit/push.

## 1. Group Layer

1. Trong Layers, click body rồi giữ **Shift** chọn right, weapon và left.
2. Bấm nút hình thư mục **Group Layer đã chọn** trên thanh công cụ Layers.
3. Sửa tên ngay ở hàng Group, Enter hoặc rời ô để lưu. Nút mũi tên thu gọn/mở các layer con.
4. Click biểu tượng thư mục hoặc khoảng trống trên hàng Group để chọn toàn nhóm. Bấm **Duplicate Group** trên hàng đó, **Duplicate** ở toolbar hoặc **Ctrl+D**.
5. Bản sao gồm các layer, Transform/Pivot/lật, điểm gắn, animation và keyframes, Motion Path/điểm bám, Pose Set/Pose Track. Parent–Child bên trong nhóm trỏ sang layer bản sao; Pose Set được sao chép riêng. Ảnh nguồn trong Asset Library được dùng chung.
6. **Ungroup** bỏ thư mục, giữ các layer và setup. Nếu chỉ chọn một layer trong Group rồi Duplicate/Copy, bản sao là layer riêng ngoài Group.

Group là thư mục tổ chức/chọn chung, không tự tạo Parent hoặc thay thứ tự Z-order. Group một cấp; chưa có Group lồng nhau hoặc Transform riêng cho thư mục. Binding tới Parent bên ngoài nhóm được giữ; nếu cần bản sao nhân vật độc lập, chọn đủ các Parent/Child liên quan. Layers Panel trình bày các thành viên bên nhau, thứ tự hiển thị Canvas vẫn theo scene và Z-order keys.

## 2. Asset Library

Click phải ảnh để mở menu:

- **Properties · Thông tin ảnh**: preview, kích thước, định dạng, số Layer/Pose dùng ảnh; sửa tên và thư mục trong Library.
- **Thêm vào Canvas** tạo Layer từ ảnh.
- **Copy ảnh · Ctrl+C** chuẩn bị ảnh để Paste thành Layer.
- **Xóa ảnh khỏi project** bỏ ảnh khỏi Library. Nếu ảnh đang dùng, nhãn menu nêu rõ việc bỏ cả Layer/Pose liên quan.

Xóa dùng chung Undo/Redo. Child không bị xóa sẽ tháo binding tại playhead; các track/pose keys không còn hợp lệ được dọn. Phải mở khóa các Layer/Child bị ảnh hưởng trước. Không xóa file ảnh gốc trên máy. Đổi tên asset không tự đổi tên Layer đã tạo trước đó.

## 3. Nhận biết Timeline đang chọn

Click trái tên track, thanh animation, vùng track hoặc key sẽ chọn mục đó. **Chỉ thanh animation/key đang chọn có viền**, không viền cả hàng ngang Timeline. Áp dụng Move/Scale/Rotate/Fade/Z-order, Motion Path và Pose. Click phải mở menu; double-click tới đúng Properties. Viền chọn là trạng thái editor, không xuất hiện trong hình/animation.

**Delete trong Timeline:** chọn track/thanh animation rồi Delete để xóa track đó; chọn key rồi Delete chỉ xóa key đó. Layer và ảnh của nó được giữ nguyên. Nếu track đã bị xóa hoặc chưa chọn track, Delete trong Timeline không chuyển sang xóa Layer. Chọn lại Layer trong Layers/Canvas để dùng Delete xóa Layer. Undo khôi phục track/key.

## 4. Ctrl+C / Ctrl+V

| Copy ở đâu | Paste làm gì |
| --- | --- |
| Click ảnh trong Asset Library, Ctrl+C | Ctrl+V tạo Layer dùng ảnh đó |
| Chọn Layer hoặc nhiều Layer trong Layers/Canvas | Ctrl+V tạo các Layer mới cùng setup |
| Click hàng Group (ngoài ô sửa tên), Ctrl+C | Ctrl+V tạo Group mới với toàn bộ setup |
| Click tên/thân track animation, Ctrl+C | Chọn Layer nhận, đặt playhead, Ctrl+V để dán track bắt đầu ở playhead |
| Click key animation, Ctrl+C | Chọn Layer nhận, đặt playhead, Ctrl+V để dán giá trị key |
| Click Motion Path, Ctrl+C | Chọn Layer nhận, đặt playhead, Ctrl+V dán đường/timing |
| Click track Pose hoặc pose key, Ctrl+C | Chọn Layer nhận, đặt playhead, Ctrl+V dán track/key đổi ảnh |

Clipboard chứa snapshot lúc Copy: sửa nguồn sau Copy không thay dữ liệu đã copy. Chọn nơi nhận không làm mất clipboard. Copy lại để cập nhật snapshot. Mỗi lần Paste là một bước Undo.

Dán track thay track cùng loại của Layer nhận (ví dụ Rotate thay Rotate); các loại khác giữ nguyên. Motion Path thay đường hiện có. Pose Track thay track đổi pose, sao chép nhóm pose riêng nếu cần. Khi dán cả track Pose, key đầu nằm tại playhead, các khoảng cách thời gian được giữ. Dán một pose key vào track dùng cùng Pose Set giữ các key khác; nếu Pose Set khác sẽ tạo track riêng thay track cũ.

Layer nhận đang khóa hoặc dữ liệu vượt Scene Duration sẽ báo lỗi và giữ document cũ; mở khóa/tăng thời lượng hoặc đổi playhead rồi Paste lại. Clipboard nội bộ dùng trong cùng project. Không đọc ảnh/văn bản từ clipboard của ứng dụng khác. Khi con trỏ đang ở ô nhập hoặc Code Editor, Ctrl+C/V vẫn copy/paste văn bản bình thường.

## Checklist review

1. Group nhân vật bốn layer; đổi tên; Duplicate, kiểm tra kiếm gắn vào tay bản sao và animation/pose riêng.
2. Ctrl+C/V Group, Layer và ảnh; Undo/Redo; chỉnh pose của bản sao, kiểm tra bản gốc không bị đổi.
3. Copy Rotate track/key từ kiếm sang một Layer khác, thử playhead mới và kiểm tra viền chọn.
4. Click phải Asset, sửa tên; xóa ảnh đang dùng rồi Undo, kiểm tra đầy đủ setup trở lại.
5. Save As, reload/Open, Apply Code được sinh; các Group và Parent/Child phải giữ đúng.

Kiểm thử: `npm run build`, `npm test`, `scripts/phase3-final-smoke.mjs` cùng script Phase 3 trước đó. Browser test dùng project `Phase3-Final-Smoke-*` riêng.
