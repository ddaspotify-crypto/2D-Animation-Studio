# Phase 3 — hướng dẫn review

Bản local **0.3.0**, project schema **v3**. Hai phase cũ giữ nguyên; thêm các chức năng Advanced 2D Motion trong REQUIREMENTS.md và mở rộng Code Editor tương ứng. Chưa triển khai Phase 4–6. Không commit hoặc push trong đợt này.

**Bổ sung hoàn thiện Phase 3:** [Group Layer, Asset Properties, viền Timeline và Ctrl+C/V](PHASE3_GROUP_CLIPBOARD_GUIDE.md). Group được lưu/mở và sinh qua `scene.group(...)`; Duplicate/Paste remap Parent–Child nội bộ và sao chép Pose Set riêng.

## Cách mở

Lưu project/draft đang làm, tải lại `http://127.0.0.1:4310`. Toolbar phải ghi **ADVANCED 2D MOTION · PHASE 3**. Nếu server chưa chạy: `npm run build`, `npm start` trong thư mục dự án (xem README về runtime Node trên máy).

Chọn Layer, cuộn Properties xuống các mục **Motion Path**, **Pose Switching**, **Parent / Binding**, **Attachment Points**. Hover/focus icon **?** để xem giải thích tiếng Việt; Esc đóng tooltip.

## 1. Motion Path

**Bổ sung:** menu chuột phải Timeline và điểm bám đường tùy chỉnh trên ảnh. Xem [TIMELINE_PATH_SWORD_GUIDE.md](TIMELINE_PATH_SWORD_GUIDE.md) để thao tác và thêm chuyển động tay cầm kiếm. Double-click track/key mở đúng Properties; click phải có xóa track/key và Undo. Điểm bám đường độc lập với Pivot, kéo vòng xanh hoặc nhập tọa độ 0–1; dữ liệu cũ giữ theo Pivot.

1. Import ảnh, kéo vào Canvas, chọn Layer. Đưa playhead về 0.
2. Trong Motion Path, chọn Straight Line/Polyline/Bézier/Circle/Ellipse/Freehand và bấm **Tạo đường**.
3. Kéo mốc tròn trên Canvas hoặc chọn **Điểm đang sửa**, nhập Path Point X/Y. Điểm đang chọn có màu cam. Circle: mốc đầu là tâm, mốc thứ hai điều khiển bán kính. Ellipse: hai chênh lệch X/Y tạo hai bán kính.
4. Với Polyline/Bézier/Freehand: **+ Điểm**, **Xóa điểm** hoặc double-click đường để thêm. Với Bézier, kéo tay nắm tím để uốn đường; đường được lấy mẫu theo khoảng cách gần đúng để tốc độ đều hơn. Không xóa xuống dưới hai điểm.
5. Với Freehand: **Vẽ lại bằng tay**, giữ chuột vẽ trong Canvas và thả để lưu. Điểm thừa được đơn giản hóa; Esc hủy vẽ. Giới hạn lưu 2000 mốc, giữ đầu/cuối đường.
6. Đặt **Path Start**, **Path Duration**, **Path Easing**, **Path Loop**; tổng Start+Duration cần nằm trong Scene Duration. Bật **Đảo chiều**, **Orient to Path** nếu cần. Tắt Orient để giữ Rotation riêng. Khi Orient bật, góc của đường cộng với Rotation để có thể chỉnh hướng mặt ảnh.
7. **Hiện đường** chỉ điều khiển đường trợ giúp editor. **Xóa Motion Path** bỏ đường, không xóa Layer. Track Motion Path xuất hiện trên Timeline; kéo thân thanh để đổi Start, kéo handle cạnh phải đổi Duration.

Motion Path điều khiển vị trí pivot. Khi path đã bắt đầu, nó ưu tiên Position track; Scale/Rotate/Fade vẫn chạy. Muốn chỉnh vị trí đường hãy chỉnh các điểm, thay vì kéo ảnh và kỳ vọng sửa path. Với Child, điểm lưu theo hệ tọa độ liên kết; thao tác Canvas tự chuyển sang tọa độ đó.

## 2. Scale và Z-order keyframes

### Lật ảnh đối xứng

Chọn layer đã Clone/Duplicate → Transform → **↔ Lật ngang** để đổi tay trái thành tay phải; **↕ Lật dọc** đổi trên/dưới. Bấm lại để bỏ lật. Lật quanh Pivot, nên chỉnh vị trí/pivot tại khớp tay rồi gắn Parent/Attachment như bình thường. Điểm gắn và Child Bind Transform đi theo ảnh lật. Trạng thái lật áp dụng toàn Timeline, kể cả pose switching; không tạo keyframe dù Auto Key bật. Undo/Redo, Duplicate, Code Apply và Save/Open giữ trạng thái lật. Code dùng `flipX: true` / `flipY: true` trong `scene.addImage`, Scale X/Y vẫn là số dương.

Scale X/Y keyframes của Phase 2 vẫn kết hợp được với đường đi; ví dụ 0s=0.3, 2s=0.6, 4s=1 tạo cảm giác tiến gần.

1. Chọn Layer, bấm **+ Z-order · Trước/sau** trong Animation.
2. Chọn key, sửa **Key zOrder** bằng số nguyên 0–500. Số lớn hơn nằm phía trước; các Layer bằng số nhau giữ thứ tự tĩnh.
3. Đặt một key ở 0 với giá trị thấp, key ở 2s với giá trị cao; scrub 1.9/2.0s để thấy thứ tự đổi **tức thời**. Không nội suy và không dùng easing cho Z-order.
4. Kéo/add/copy/paste/delete key như các track khác. Z-order không liên quan tới Parent–Child. Thứ tự Layer Panel hiện vẫn là thứ tự nền; Canvas hiển thị thứ tự được đánh giá tại playhead.

## 3. Pose Set / Pose Switching

1. Import các ảnh tư thế trước. Chọn Layer nhân vật, đặt Pivot hợp lý (thường 0.5/1 ở chân) trước khi tạo nhóm.
2. Bấm **Tạo Pose Set từ Layer**; nhóm có Pose gốc và mốc 0s.
3. Chọn ảnh trong **Pose Asset**, bấm **+ Pose**. Đổi tên Pose Set/Pose nếu cần. Ảnh được giữ tỉ lệ kích thước theo ảnh gốc; pose có kích thước riêng.
4. Chỉnh **Pose Anchor X/Y** cho từng pose; dùng cùng pivot/điểm chân để hạn chế nhảy khi ảnh khác kích thước hoặc khoảng trống.
5. Chọn pose, đưa playhead tới 2s, bấm **Đặt pose tại playhead**. Ảnh đổi tức thời tại 2s; position, scale, rotation, opacity và animation hiện có giữ nguyên.
6. Hàng **Pose · Đổi ảnh** xuất hiện trên Timeline. Kéo hình thoi hoặc nhập mốc trong danh sách Properties để đổi thời gian. Hai pose keys không được trùng thời gian.
7. Để đổi ảnh tại mốc đã có: đưa playhead đúng mốc đó, chọn pose khác, bấm Đặt pose. Xóa mốc bằng **×**; xóa tất cả qua **Bỏ đổi pose cho Layer**. Xóa pose khỏi nhóm cần bỏ các mốc đang dùng pose đó trước.

Mốc Pose dùng giây toàn scene, khác key time tương đối của `scene.animate`. Trước mốc đầu dùng ảnh gốc. Duplicate Layer sao chép Pose Track nhưng chia sẻ Pose Set để giữ cùng nhóm tư thế.

## 4. Parent–Child và Bind Modes

1. Có ít nhất hai Layer. Chọn ảnh con (phụ kiện), chọn ảnh cha trong **Parent · Ảnh cha**.
2. **Bind Position**: theo vị trí cha/điểm gắn, giữ góc xoay và scale riêng.
3. **Bind Transform**: theo cả vị trí, rotation và scale; vẫn có animation riêng của Child trong tọa độ liên kết.
4. Gán/tháo/chuyển liên kết giữ hình Child tại playhead hiện tại. Chọn **Không liên kết** để tháo.
5. Di chuyển/xoay/scale Parent hoặc thêm Motion Path rồi scrub: Child phải đi theo. Thứ tự trước/sau có thể đặt riêng bằng Layer Panel/Z-order keys.
6. Không được tự gán làm cha, tạo vòng cha–con hoặc chọn điểm gắn không tồn tại. Code/UI sai báo lỗi và giữ scene cũ.

Việc đổi liên kết có thể làm chuyển động ở các thời điểm khác thay đổi vì đổi hệ tọa độ. Giữ vị trí tại playhead hiện tại, sau đó review cả Timeline. Với scale không đều và Child xoay, engine xử lý ma trận affine (kể cả shear) để kết quả đúng; không cần chỉnh shear bằng UI.

Xóa Parent sẽ tháo liên kết Child còn lại tại playhead; mở khóa Child trước nếu nó đang khóa. Undo khôi phục graph và dữ liệu liên quan.

## 5. Attachment Points

1. Chọn Parent, chọn preset Head/Left Hand/Right Hand/Center/Custom Point, bấm **+ Điểm gắn**.
2. Đổi tên điểm, kéo chấm vàng trên Canvas hoặc nhập **Point X/Y (0–1)**. 0.5 là giữa ảnh; tọa độ tương đối giúp điểm đi theo kích thước pose.
3. Chọn Child, chọn Parent, rồi chọn điểm trong **Attachment · Điểm gắn**.
4. Gán điểm vẫn giữ vị trí Child hiện tại. Muốn đặt ngay trên điểm, di chuyển Child đến điểm trên Canvas; offset đó được lưu theo binding.
5. Scrub khi Parent có path/scale/rotation/pose: điểm gắn được cập nhật và Child đi theo Bind Mode. Điểm đang được Child dùng cần tháo liên kết trước khi xóa.

## 6. Code Editor

Generator và AST parser hỗ trợ:

| API | Dữ liệu |
| --- | --- |
| `scene.addImage({...})` | Transform, assets, visibility/lock, attachments |
| `scene.animate(layerId, {...})` | Position/Scale/Rotation/Opacity/**zOrder** keys |
| `scene.motionPath(layerId, {...})` | Kiểu đường, điểm/handles, start/duration/easing/loop/direction/orient/show |
| `scene.poseSet({...})` | Danh sách pose, asset IDs, kích thước, anchors |
| `scene.poseTrack(layerId, {...})` | Pose Set ID và các mốc đổi ảnh |
| `scene.bind(layerId, {...})` | Parent ID, mode, Attachment ID |

Tạo dữ liệu bằng UI trước rồi xem/sửa code được sinh. Asset/Pose/Parent/Attachment đều tham chiếu IDs hợp lệ trong project. Apply cập nhật Canvas/Timeline/Properties ở playhead hiện tại; một bước Undo cho toàn scene. Draft chưa Apply không bị ghi đè khi UI đổi. Không chạy JavaScript tùy ý, loop/functions/imports; camera API chờ Phase 4.

## 7. Save/Open và tương thích

Save/Save As lưu đầy đủ paths, pose sets/tracks, graph binding, attachment và Z-order keys vào project.json, assets vẫn dùng đường dẫn tương đối. Open v1/v2 migrate lên v3 trong bộ nhớ; chỉ Save mới cập nhật file. Nên dùng Save As nếu cần giữ bản cũ để mở bằng app 0.2.0.

## Checklist review kết hợp

- Nhân vật: đường Bézier + Scale keys + Pose đổi ở 2s + Rotate/Fade nếu cần.
- Phụ kiện: Child Bind Transform, gắn Right Hand của nhân vật; cho nhân vật xoay/scale và đổi pose.
- Vật che: một Layer khác; đặt Z-order keys để nhân vật đi ra sau rồi ra trước vật che.
- Scrub cả xuôi/ngược, đổi playhead trực tiếp, kiểm tra không cần chạy từ đầu.
- Sửa dữ liệu qua Code Apply, thử một Parent cycle hoặc ID sai để kiểm tra bảo toàn scene.
- Undo/Redo sau Apply/drag; Save As, reload/Open lại và kiểm tra toàn bộ các mốc.

## Kiểm tra và giới hạn

Kết quả kiểm tra bản local ngày 13/10/2026: build thành công; **92/92 tests** đạt trong 4 test files. Browser smoke Phase 1–2 và Phase 3 đạt. Lần chạy Phase 3 cuối kiểm tra cả sáu kiểu path, thao tác Canvas/Timeline, pose, binding/attachment, Z-order, tooltip tiếng Việt, Code Apply/Undo/Redo, từ chối graph sai, Save/Open/reload; không ghi nhận lỗi console/page. Project thử nghiệm cuối: `Phase3-Smoke-1791880651107`. Tests cũng kiểm tra nhân bản Child riêng hoặc cả nhóm dưới Parent xoay/scale không đều, giữ một lần dịch chuyển trong tọa độ Canvas.

Logic tests: đường đi/arc length/freehand, binding/attachments/affine matrices, pose switching, discrete Z-order, combined evaluation, AST round-trip/validation, history và migration cùng hồi quy Phase 1–2. Browser smoke: `scripts/phase3-smoke.mjs` (Playwright/Edge như README), dùng project `Phase3-Smoke-*` riêng, không sửa project người dùng.

Sau bổ sung Lật ngang/Lật dọc: build thành công, **97/97 tests** đạt. Browser smoke xác nhận bật/tắt hai nút, Undo/Redo, Code Apply và Save/Open giữ cờ lật; test ma trận xác nhận điểm gắn/Child theo ảnh phản chiếu và tháo binding giữ hình tại playhead. Project thử nghiệm: `Phase3-Smoke-1791880988609`.

Sau bổ sung menu Timeline và điểm bám tùy chỉnh: build thành công, **99/99 tests** đạt. Browser smoke kiểm tra kéo vòng điểm bám, Properties đúng track, xóa key/animation/path/pose và Undo, Code Apply và Save/Open giữ followPoint; project cuối `Phase3-Smoke-1791883384921`.

Sau hoàn thiện Group/Asset Properties/viền chọn/clipboard: build thành công, **112/112 tests** đạt trong 5 files. Browser smoke cũ và `scripts/phase3-final-smoke.mjs` đều đạt; không có lỗi page/console. Kiểm tra create/rename/duplicate/copy/paste Group và Layer, copy ảnh thành Layer, Asset Properties/xóa ảnh đang dùng/Undo, chọn track/key và paste track/key/path, Code Apply, Pose Set độc lập và Save/Open. Project cuối: `Phase3-Final-Smoke-1791888872532`. Chưa commit/push.

Lấy mẫu đường cong là xấp xỉ số (Bézier tối đa 64 bước mỗi đoạn, circle/ellipse 256 bước); chưa stress-test scene cực lớn. Chưa có rigging/IK, camera động, multiple scenes hoặc MP4. Hộp thoại Windows/native Explorer vẫn cần test thủ công. Build còn cảnh báo bundle Monaco như trước, không nâng/thêm dependency trong Phase 3.
