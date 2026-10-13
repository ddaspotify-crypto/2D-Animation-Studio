# Animation Library — hướng dẫn sử dụng

Lưu project/draft, tải lại http://127.0.0.1:4310/. Bấm **Animation Library** ở thanh trên. Khi mở, playback chính tạm dừng. Thay đổi local, không commit/push.

## 1. Mẫu có sẵn

Chọn Layer hoặc Group trước, mở Library, chọn nhóm và mẫu:

| Nhóm | Mẫu |
| --- | --- |
| Background | Trôi nhẹ, Zoom nhẹ, Rung, Xuất hiện |
| Nhân vật | Đứng thở, Nhấp nhô, Nhảy, Nghiêng, Trúng đòn |
| Vũ khí / phụ kiện | Đung đưa quanh chuôi, Nâng/hạ, Chém, Giật lùi, Rung nhẹ |

Các mẫu Background di chuyển/scale ảnh nền, chưa phải Camera animation của Phase 4. Mẫu Nhấp nhô tạo chuyển động lên/xuống; không tự sinh rig hoặc chuyển động bước chân.

1. Gán vai trò vào **Layer nhận**. Mẫu một role dùng một layer; Group tùy chỉnh có thể có nhiều role.
2. **Bắt đầu (s)** mặc định là playhead lúc mở. **Thời lượng** nhỏ hơn làm nhanh hơn, lớn hơn làm chậm hơn.
3. **Độ mạnh:** 1 là mức gốc, 0.5 nhẹ bằng nửa, 2 mạnh gấp đôi. Hướng chỉ đổi các độ lệch Position/đường đi, không đổi góc Rotation.
4. **Lặp lại:** theo mẫu, một lần, Repeat hoặc Ping Pong. Pose Switching giữ các mốc đổi ảnh toàn scene; tùy chọn Loop áp dụng các track chuyển động/path.
5. **Track đã có:** Thay track cùng loại, hoặc Giữ track hiện tại. Các loại không trùng được giữ. Motion Path đang chạy ưu tiên Position; muốn dùng mẫu nhấp nhô trên nhân vật đi path, thường gán cho Child hoặc bỏ path của layer nhận.
6. Bấm **▶ Preview** hoặc kéo thanh thời gian để xem. Preview riêng, tự căn khung, không đổi scene, code, Undo history hoặc trạng thái Saved.
7. Bấm **Apply mẫu** để cập nhật Canvas/Timeline/Code. Một bước Undo khôi phục toàn bộ lần Apply. Save Project lưu animation đã Apply, không cần Library để mở lại project đó.

Đối với kiếm, **đặt Pivot vào chuôi trước khi dùng mẫu Rotation**. Binding đang có được giữ. Các mẫu Giật lùi/Position dịch cả chuôi; không phù hợp khi muốn chuôi giữ nguyên tại tay. Vai trò có icon ? ghi Pivot/Parent gợi ý; Apply không tự đổi setup của ảnh nhận.

## 2. Lưu animation tùy chỉnh

1. Tạo animation đẹp bằng UI hoặc Code như bình thường.
2. Chọn Layer hoặc hàng Group, mở Library → **Lưu animation tùy chỉnh**.
3. Nhập tên, nhóm Background/Nhân vật/Vũ khí, mô tả.
4. Tick các track muốn lưu: Position, Scale, Rotation, Opacity, Z-order, Motion Path hoặc Pose Switching.
5. Bấm **Lưu vào Animation Library**. Mẫu được lưu ngay trên máy và xuất hiện trong nhóm đã chọn.

Thời gian được đưa về đầu mẫu, giữ khoảng cách giữa các track. Position lưu độ lệch chuẩn hóa theo Width×Scale; Rotation lưu độ lệch góc; Scale lưu tỉ lệ; Opacity/Z-order lưu độ lệch so với nền. Do đó mẫu có thể dùng trên ảnh khác kích thước/vị trí. Nền khi lưu là Transform gốc của layer, không phải giá trị một keyframe đang hiển thị. Khi Apply, nền nhận là giá trị được đánh giá tại thời điểm bắt đầu.

Mẫu Group lưu từng role theo tên layer, không lưu ID Layer gốc. Khi dùng lại, chọn Group mới trước khi mở; app tự ghép tên gần giống và cho chỉnh từng role. Gán các role đang có chuyển động vào các layer khác nhau. Giữ/thiết lập Parent–Child phù hợp trên Group nhận; mẫu chuyển động không tự tạo rig.

**Pose Switching:** mẫu lưu timing, tên pose, kích thước tương đối và anchor, nhưng không mang ảnh theo. Import ảnh tư thế vào project mới rồi gán các mục **Ảnh pose** trước Preview/Apply. Một Pose Set mới được tạo khi Apply, không sửa Pose Set cũ đang được layer khác dùng.

Lưu mẫu không đổi project hoặc xóa các track gốc. Mẫu là snapshot lúc lưu; sửa animation gốc sau đó không thay mẫu. Để tạo biến thể, lưu thành mẫu mới với tên khác. Muốn sửa metadata trực tiếp có thể Export, chỉnh JSON, Import thành bản mới.

## 3. Nơi lưu và Import/Export

Thư mục mặc định dùng chung cho mọi project:

```text
C:\Apps\Canvas Product\Animation Library\
  background\<id>.animation.json
  character\<id>.animation.json
  weapon\<id>.animation.json
```

Tên file dùng ID an toàn, tên mẫu nằm trong JSON. Đổi thư mục Projects trong app không đổi thư mục Library. Có thể cấu hình `STUDIO_ANIMATION_LIBRARY_DIR` khi chạy server. Folder này được bỏ qua bởi Git; sao lưu riêng khi cần.

- **Export mẫu** tải file `.animation.json`, gồm định dạng `studio-animation`, version 1, metadata và dữ liệu chuyển động/roles. Có thể export mẫu có sẵn hoặc tùy chỉnh.
- **Import mẫu** kiểm tra file JSON (tối đa 4 MB), luôn tạo ID mới, không ghi đè mẫu đang có. Có thể có hai mẫu cùng tên; nên đổi tên trong JSON trước Import để dễ phân biệt.
- **Xóa mẫu tùy chỉnh** bỏ file khỏi Library. Mẫu có sẵn được giữ. Animation đã Apply vào project không bị ảnh hưởng. Library có vòng đời riêng, việc xóa mẫu không nằm trong Undo của project; Export để giữ bản sao trước khi xóa nếu cần.
- File sai version/schema, ID/đường dẫn không hợp lệ hoặc symlink bị từ chối/bỏ qua và có thông báo. Không thực thi JavaScript từ file mẫu.

Thư viện này chứa **mẫu chuyển động**. Gói nguyên nhân vật kèm file ảnh/rig là loại template khác, chưa nằm trong chức năng này.

## 4. Test nhanh

1. Chọn kiếm có Pivot tại chuôi → Vũ khí → Đung đưa quanh chuôi → Preview. Chuôi phải giữ vị trí, lưỡi xoay; Close trước Apply không tạo thay đổi.
2. Đặt độ mạnh 0.5, thời lượng 2s → Apply → kiểm tra Rotate track, Undo/Redo.
3. Lưu chuyển động kiếm thành mẫu; dùng trên kiếm khác với góc nền khác, kiểm tra góc không bị đưa về 0°.
4. Lưu Group có body path + kiếm Rotate + Pose; chọn Group nhận, gán role và ảnh pose, Preview/Apply, Save/Open.
5. Export/Import mẫu, reload hoặc mở project mới, kiểm tra mẫu tùy chỉnh còn trong Library. Thử Layer khóa hoặc start+duration vượt Scene: app báo lỗi và giữ scene cũ.

Kiểm thử tự động: `npm run build`, `npm test`, `scripts/animation-library-smoke.mjs`. Script dùng các project/mẫu thử riêng và xóa mẫu thử sau khi hoàn tất; không sửa project/mẫu người dùng.

Kết quả review: build thành công, **139/139 tests** đạt trong 6 files; mẫu có sẵn và custom được kiểm tra về delta/ratio (kể cả scale ratio lớn), chuôi kiếm giữ vị trí, role/ảnh pose, timing/conflict, validation và persistence. Browser smoke Library cùng hồi quy Group/Timeline/clipboard đạt, không ghi nhận lỗi console/page. Project thử Library cuối: `Library-Smoke-1791901357034`. Chưa commit/push.
