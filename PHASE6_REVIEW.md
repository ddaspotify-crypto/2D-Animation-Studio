# Phase 6 — Hoàn thiện bản local

Bản **0.6.0**, schema project vẫn v4. Hoàn thiện Performance Optimization, Keyboard Shortcuts, Context Menus, Autosave, Error Recovery và Documentation. **Bỏ qua Electron Packaging và Windows Installer theo yêu cầu.** Chưa commit/push Phase 5–6.

## 1. Tự lưu và khôi phục khi đóng trang

- **Tự lưu** ở thanh dưới cùng: mặc định tắt, bật nếu muốn bảo vệ phiên chỉnh sửa. Lựa chọn được giữ trong trình duyệt.
- Khi bật: tự lưu sau **2 giây ngừng chỉnh sửa**, hoặc tối đa mỗi **30 giây** nếu chỉnh liên tục. Click **Lưu ngay** để tạo bản hiện tại. Xem thời gian tự lưu ở thanh trạng thái; hover để đọc đầy đủ.
- Bản tự lưu chứa **toàn bộ Scene/Layer/animation/camera, ảnh và code chưa Apply ở từng Scene**. Ảnh là dữ liệu thật, không chỉ đường dẫn/object URL. Mỗi project giữ bản tự lưu mới nhất, các project khác có bản riêng.
- Bản này được lưu bằng IndexedDB trong trình duyệt, **độc lập với Save Project**; không ghi đè project.json và không đánh dấu project đã Save. Save Project vẫn cần dùng để có thư mục project mang sang máy khác.
- Sau reload/mở lại app: nếu có bản tự lưu hợp lệ, hộp thoại xuất hiện. Bấm **Khôi phục [Tên Project]** để mở. Hoặc mở danh sách qua **Khôi phục** ở thanh dưới.
- Khôi phục giữ draft **chưa Apply**, không tự áp dụng code. Dùng **Apply Code** khi đã kiểm tra draft, rồi **Save As** để lưu ra thư mục mới.
- **Xóa bản tự lưu** chỉ xóa bản trong trình duyệt, có xác nhận. Không xóa project.json hoặc ảnh trong project đã Save.
- Nếu đang có thay đổi chưa lưu trong editor, khôi phục hỏi trước khi thay thế. Nếu ảnh hỏng/thiếu hoặc snapshot không hợp lệ, giữ editor hiện tại và báo lỗi. Record malformed được bỏ qua khi liệt kê, không làm crash editor.
- Khi thiếu dung lượng/quyền lưu, thanh dưới báo lỗi; dùng Save Project rồi **Lưu ngay** để thử lại. Bản cũ vẫn được giữ nếu transaction mới thất bại.

Autosave phụ thuộc đúng trình duyệt và địa chỉ app: `127.0.0.1:4310`, `localhost:4310` và dev `127.0.0.1:5173` có vùng lưu riêng. Xóa dữ liệu trình duyệt hoặc dùng phiên riêng tư sẽ không bảo đảm giữ autosave. Khi vừa sửa chưa đủ 2 giây, bản cuối có thể chưa lưu; kiểm tra thời gian tự lưu hoặc bấm Lưu ngay trước khi đóng.

## 2. Khôi phục project.json bị hỏng

Sau khi project được Save lần thứ hai, thư mục có **project.backup.json**: dữ liệu hợp lệ của **lần Save trước**. Ảnh được lưu theo checksum và không xóa khi không còn tham chiếu, nên backup có thể dùng lại ảnh của lần lưu đó.

1. Bấm **Open**, chọn project.
2. Nếu Open báo lỗi, editor đang làm vẫn được giữ.
3. Bấm **Mở bản sao lưu** trong hộp thoại Open. Project có backup hợp lệ vẫn xuất hiện trong danh sách dù project.json bị hỏng.
4. Kiểm tra Scene/Layer và bấm **Save As** để lưu vào thư mục mới. Bản khôi phục không tự ghi đè project.json bị hỏng.

Lần Save đầu chưa có backup; thử **Khôi phục tự lưu** nếu đã bật. Backup không thể khôi phục ảnh bị xóa/hỏng khỏi thư mục assets. Save lỗi không thay backup hợp lệ bằng dữ liệu lỗi.

## 3. Phím tắt

Bấm **Phím tắt** ở thanh dưới để xem lại:

| Phím | Tác dụng |
|---|---|
| Ctrl+S | Save Project; từ Code Editor vẫn lưu Canvas, cần Apply để đưa code vào Canvas |
| Ctrl+Shift+S | Save As |
| Ctrl+Z | Undo |
| Ctrl+Y hoặc Ctrl+Shift+Z | Redo |
| Ctrl+C / Ctrl+V | Copy/Paste Layer, Group hoặc Timeline/Key theo vùng đang thao tác |
| Ctrl+D | Duplicate Layer/Group, giữ setup và animation |
| Ctrl+A | Chọn tất cả Layer của Scene hiện tại |
| Ctrl+G | Group các Layer đã chọn |
| Ctrl+Shift+G | Ungroup Group đang chọn |
| Delete | Xóa Layer/Group, hoặc track/key đã chọn trên Timeline |
| Space | Play/Pause |
| Esc | Bỏ chọn Layer/Timeline và hủy vẽ Path; đóng context menu |

Các shortcut chỉnh sửa không chạy khi đang nhập text, select, Monaco hoặc trong hộp thoại. Ctrl+A trong ô nhập/Code Editor vẫn chọn text. Dialog không cho Delete vô tình xóa Layer phía sau. Layer khóa được giữ khỏi thao tác xóa. Shift+click vẫn chọn nhiều.

## 4. Menu chuột phải

- **Canvas hoặc hàng Layer:** Properties, Copy, Paste, Duplicate, Bring to Front, Send to Back, Ẩn/hiện, Khóa/mở khóa, Group và Delete.
- **Hàng Group** (click vào icon/vùng hàng ngoài ô tên): cùng menu, thêm Ungroup. Duplicate/Copy giữ animation, path, pose và binding như trước. Xóa Group hỏi xác nhận; Undo khôi phục.
- Click phải vào Layer chưa chọn sẽ chọn Layer đó; click phải vào tập Layer đang chọn giữ lựa chọn nhiều.
- Click phải vào ảnh trên Canvas chọn đúng Layer; menu không can thiệp menu văn bản của Code Editor hoặc ô nhập.
- **Asset Library:** menu Properties/xóa ảnh đã có ở Phase 3.
- **Timeline:** click phải mở Properties/xóa track hoặc key; Delete chỉ tác động selection trong Timeline, không xóa Layer.
- Esc/click ngoài đóng menu. Menu giới hạn vị trí và cuộn được trên màn hình thấp.

## 5. Hiệu năng và xử lý lỗi

- Engine tạo map Path/Pose/Layer IDs để tránh tìm tuyến tính lặp lại trên từng Layer; Pose keys dùng binary search. Giữ kết quả animation và logic timestamp chung Preview/Export.
- Output renderer dùng map Konva node; Canvas và Output chỉ đổi thứ tự nodes khi Z-order thực sự đổi, giảm việc di chuyển toàn bộ nodes mỗi frame.
- Cache ảnh/Object URL, WeakMap sampling Motion Path, state Playback riêng và lịch sử giới hạn 50 bước được giữ; không tạo React project/history mới mỗi frame.
- Autosave xử lý bất đồng bộ và chỉ ghi một transaction tại một thời điểm; nếu chỉnh tiếp trong lúc đang ghi, ghi bổ sung snapshot mới.
- React ErrorBoundary thử tạo emergency snapshot khi lỗi render, có nút **Mở lại editor** / **Tải lại trang**. Nếu storage không hoạt động, dùng project đã Save hoặc backup; không tuyên bố bản khẩn cấp chắc chắn đã lưu.
- Open/Save/Export lỗi vẫn có thông báo và giữ trạng thái editor. MP4 hủy/error dọn file tạm như Phase 5.

Bài đo `node --import tsx scripts/performance-check.mjs`: 750 Layers + 750 Motion Paths + 750 Pose Sets/Tracks, 200 samples, khoảng **0.48 ms/evaluation** trên máy này. Đây là chi phí engine, không phải FPS render hoặc cam kết tốc độ ở mọi máy.

## 6. Kiểm tra và review

- **166/166 tests** đạt trong 9 files: animation/poses/binding/camera/export, backup giữ dữ liệu hợp lệ và recovery validation.
- Build production/TypeScript đạt; cảnh báo bundle Monaco lớn như trước.
- Browser Phase 6: Ctrl+A/Group/Ungroup/Undo, input isolation, Canvas/Layer context menu, Layer khóa không xóa; sửa hỏng manifest của project thử, mở backup có ảnh, không sửa file hỏng; IndexedDB reload phục hồi đủ 3 Scene/ảnh/draft; dialog chặn Delete.
- Browser hồi quy Phase 4 và Phase 5: camera/scene/save/open và MP4 thật ngang/dọc; ffprobe kiểm tra codec/FPS/số frame; frame video so với Preview, file trùng và Cancel.

Test tay: Save công việc hiện tại rồi reload app. Bật Tự lưu, thêm/sửa ảnh, chờ xuất hiện thời gian tự lưu, sửa code chưa Apply, bấm Lưu ngay rồi reload. Chọn Khôi phục và kiểm tra ảnh/code; Save As vào thư mục mới. Thử Ctrl+A/G/Shift+G, click phải Layer/Group và Undo. Save project hai lần, mở lại bằng Mở bản sao lưu để thấy trạng thái lần trước. Cuối cùng xuất MP4 một Scene để xác nhận hình giống Camera Preview.

Chạy local như cũ: `npm run dev` ở port 5173 hoặc `npm run build` rồi `npm start` ở port 4310. Xem [README.md](README.md), [PHASE5_REVIEW.md](PHASE5_REVIEW.md), [PHASE4_REVIEW.md](PHASE4_REVIEW.md), [PHASE3_REVIEW.md](PHASE3_REVIEW.md) và [ANIMATION_LIBRARY_GUIDE.md](ANIMATION_LIBRARY_GUIDE.md) cho từng chức năng.
