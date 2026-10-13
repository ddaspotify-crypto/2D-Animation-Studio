# 2D Animation Studio — Phase 4

Ứng dụng local trên Windows: bố trí và tạo animation qua Canvas/Timeline hoặc JavaScript khai báo. Đọc [ARCHITECTURE.md](ARCHITECTURE.md) để xem kiến trúc và phân bổ toàn bộ yêu cầu của hai tài liệu theo từng phase.

**Hướng dẫn từng chức năng:** [HƯỚNG DẪN SỬ DỤNG PHASE 1 VÀ PHASE 2](HUONG_DAN_SU_DUNG_PHASE_1_VA_2.md) — các nút, thao tác Canvas/Layer/Properties, Timeline/keyframes/Auto Key, Code Editor và bài thực hành.

**Review Phase 3:** [PHASE3_REVIEW.md](PHASE3_REVIEW.md) — Motion Path/Bézier/Freehand, Pose Switching, Parent–Child/Bind Modes/Attachments, discrete Z-order keys, đồng bộ Code và migration v1/v2→v3. Bản 0.3.0 giữ lại các chức năng Phase 1–2, thêm tooltip tiếng Việt cho tính năng mới. Chưa làm Camera/multiple scenes/MP4.

## Chạy ứng dụng

**Review Phase 4:** [PHASE4_REVIEW.md](PHASE4_REVIEW.md) — nhiều scenes, Output Camera/Pan/Zoom/keyframes, Camera Preview, Code Editor và Undo/Redo; project schema v4. MP4 tiếp tục ở Phase 5.

**Animation Library:** [ANIMATION_LIBRARY_GUIDE.md](ANIMATION_LIBRARY_GUIDE.md) — 14 presets, lưu chuyển động Layer/Group/Path/Pose, Preview/Apply, thư viện dùng chung và Import/Export mẫu.

**Hoàn thiện Phase 3:** [Group, Asset Properties, chọn Timeline và Ctrl+C/V](PHASE3_GROUP_CLIPBOARD_GUIDE.md). Kiểm thử trình duyệt thêm ở `scripts/phase3-final-smoke.mjs`.

Cần Node.js **22.12+** (đã kiểm tra với 22.23.2) và npm. Trong thư mục project:

```powershell
npm ci
npm run dev
```

Mở `http://127.0.0.1:5173`. Lệnh dev chạy cả Vite và backend local.

Bản production:

```powershell
npm run build
npm start
```

Mở `http://127.0.0.1:4310`. Giữ cửa sổ terminal đang chạy; Ctrl+C để dừng. Các cổng 5173 và 4310 cần còn trống.

Nếu môi trường này báo `shim integrity check failed`, trình quản lý Node trên máy đang trỏ vào shim bị lỗi. Có thể chạy với runtime đã có trên máy:

```powershell
$env:PATH = 'C:\Users\17520\AppData\Local\Author Software\nvm\installs\v22.23.2;' + $env:PATH
& 'C:\Users\17520\AppData\Local\Author Software\nvm\installs\v22.23.2\npm.cmd' run dev
```

## Test nhanh animation Phase 2

1. Import ảnh, kéo vào Canvas và chọn Layer. Bấm **+ Animation** trên Timeline hoặc cuộn Properties xuống **ANIMATION**.
2. Bấm **+ Move / Position**: track có hai key, bắt đầu tại playhead, mặc định kéo dài 2 giây. Chọn key cuối, sửa **Key x / Key y** để đặt điểm đến. Bấm Play hoặc Space ngoài ô nhập/Monaco.
3. Kéo playhead trên thước Timeline hoặc nhập **Time** để xem ngay từng thời điểm. Pause giữ thời điểm; Stop về 0. Playback kết thúc tại Scene Duration.
   Muốn Timeline dài hơn 10s, nhập **Thời lượng (s)** ngay trên thanh Timeline, ví dụ 30/60/120, rồi nhấn Enter. Đây là tổng thời lượng scene; không tự kéo dài các track animation đang có. Có thể chỉnh cùng giá trị tại Properties → Scene → Duration (s).
4. Thêm **Scale / Rotate / Fade** trên cùng Layer để chạy đồng thời. Chỉnh key Scale X/Y độc lập; góc từ 0 đến -360 quay ngược, 0 đến 720 quay hai vòng. Fade dùng Opacity 0–1.
5. Chọn track; sửa **Start Time / Animation Duration / Easing / Loop**. Thử linear/easeIn/easeOut/easeInOut, Repeat và Ping Pong. Easing của một key điều khiển đoạn đi đến key tiếp theo, ưu tiên hơn easing track.
6. Trên Timeline, kéo thân thanh animation để đổi start; kéo handle nhỏ ở cạnh phải để đổi duration (các key đổi thời gian theo tỉ lệ). Kéo hình thoi để đổi thời gian key; snap theo FPS. Mỗi lần thả tạo một bước Undo. Nếu hai key cùng thời điểm thì báo lỗi, giữ dữ liệu cũ.
7. Bật **Auto Keyframe**, đưa playhead tới 1s, kéo ảnh hoặc chỉnh Position/Scale/Rotation/Opacity: key tại thời điểm đó được thêm/cập nhật. Tắt Auto Key để tránh tạo key ngoài ý muốn. Khi OFF, Transform chỉnh dữ liệu nền; nếu thuộc tính có track, preview vẫn ưu tiên track. Muốn chỉnh chuyển động hãy sửa Key values hoặc bật Auto Key.
8. Bấm **+ Key** để thêm key ở playhead. Chọn key bằng hình thoi hoặc dropdown, Copy Keyframe, đổi playhead rồi Paste. Delete Keyframe xóa key đang chọn; xóa key cuối sẽ xóa track. Duplicate Layer sao chép cả các track và tạo ID mới.
9. Code Editor tự sinh `scene.animate(...)`. Sửa keyframes rồi Apply: Timeline và preview cập nhật ngay; Undo khôi phục cả scene/animation. Thử code sai hoặc layer ID không tồn tại: scene cũ giữ nguyên. Sửa draft rồi thay key qua UI: draft không bị ghi đè, badge báo cần đồng bộ.
10. Save/Open và reload: keyframes, easing, loop, track timing giữ nguyên. Project Phase 1 được mở qua migration v1→v2; file cũ chỉ thay đổi khi Save. Nên Save As một bản mới trước khi nâng project quan trọng; bản app Phase 1 không mở schema v2.

Trong code, `time` của keyframe tính **từ startTime của track**. Ví dụ dưới đây thêm sau `scene.addImage` (thay `layer-id` bằng ID đã có):

```javascript
scene.animate("layer-id", {
  property: "position",
  startTime: 1,
  duration: 4,
  easing: "easeInOut",
  loop: "none",
  keyframes: [
    { time: 0, x: 200, y: 150 },
    { time: 4, x: 900, y: 150 }
  ]
});
```

Animation này chạy từ 1s đến 5s. Mỗi Layer có một track cho mỗi property; muốn nhiều đoạn chuyển động, thêm keyframes vào track đó. Giá trị rotation không bị ép về 0–360. Start + Duration không được vượt Scene Duration. Loop lặp đến hết scene.

## Checklist hồi quy Phase 1

1. **New / import:** tạo project, đổi tên trên toolbar. Import PNG trong suốt, JPG và WebP bằng Import ảnh; thử icon thư mục để import cả thư mục con. Tìm tên ảnh, lọc thư mục, mở preview. Import lại cùng ảnh không tạo bản sao.
2. **Canvas:** kéo thumbnail vào Canvas; cũng thử kéo file từ Explorer. Chọn ảnh rồi di chuyển, resize handle góc, xoay bằng handle phía trên. Zoom bằng cuộn chuột; Hand để pan; Fit để căn lại; thử Grid. Ảnh ngoài khung vẫn chỉnh được.
3. **Properties:** nhập Position X = 200, rồi đổi sang 500 và Enter; ảnh phải di chuyển. Chỉnh Width/Height, Scale X/Y, Rotation, Pivot, Opacity. Chọn 9:16 rồi 16:9; thử custom kích thước. Width/Height là kích thước gốc; kích thước hiển thị còn nhân Scale.
4. **Layers:** thêm hai ảnh chồng lên nhau. Kéo hàng layer để đổi thứ tự; thử Front/Back/Forward/Backward. Đổi tên trong Properties, ẩn/hiện, khóa/mở khóa. Layer khóa không kéo/resize hoặc xóa qua Delete; vẫn có thể chọn trong Layers để mở khóa. Thử Duplicate và Delete.
5. **Canvas → Code:** nhìn panel Monaco trong khi kéo ảnh; `x/y` thay đổi sau khi thả chuột. Scale và rotation cũng cập nhật. Không tạo file JS trên đĩa cho mỗi lần kéo.
6. **Code → Canvas:** đổi `"x": 200` thành `"x": 500` trong `scene.addImage`, bấm **Apply Code**; Properties và Canvas phải cùng đổi. Đổi `"scale": 1` thành `"scale": 2` để phóng gấp đôi. Nếu ảnh có scaleX/scaleY riêng, sửa hai giá trị này. Bấm Undo phải khôi phục trước Apply, Redo phải khôi phục sau Apply.
7. **Lỗi và conflict:** xóa một dấu `}` rồi Apply: báo lỗi, ảnh không mất. Thử `alert(...)` hoặc vòng lặp: parser từ chối. Sửa code chưa Apply rồi di chuyển ảnh: draft được giữ, badge báo Canvas đã đổi. Apply hỏi xác nhận thay thế; Generate/Reset hỏi trước khi bỏ draft. Format sắp xếp lại code; Hide/Show giữ draft. Thử nút chuyển panel cạnh/dưới Canvas và resize panel.
8. **Save / Open:** Save với tên thư mục mới. Mặc định ở `projects/`; chọn **Chọn vị trí khác…** trong dialog để chọn ổ/thư mục Windows. Cancel hộp thoại phải giữ root cũ. Kiểm tra `project.json` và `assets/`. Save lại, rồi Save As tên khác; tên có sẵn phải bị từ chối.
9. **Khôi phục:** New (xác nhận bỏ dữ liệu chưa lưu), Open project vừa lưu: ảnh, transform, Z-order, visibility/lock phải còn đúng. Restart ứng dụng, chọn lại vị trí lưu nếu dùng root khác và Open lần nữa. Tạm đổi tên một file trong assets rồi Open: báo lỗi và giữ project hiện tại; khôi phục tên ảnh sau test.
10. **Shortcuts:** ngoài ô nhập/Monaco, Ctrl+Z/Y/Shift+Z, Ctrl+D, Delete, Esc. Ctrl+S lưu scene. Trong Monaco, Undo của Monaco chỉ sửa draft; dùng Undo trên toolbar để Undo scene đã Apply.

Code chưa Apply **không được lưu vào project**. Save sẽ lưu Canvas hiện tại và báo trạng thái nếu còn draft. Khi đóng/reload hoặc New/Open với thay đổi chưa lưu, có cảnh báo.

## Kiểm tra tự động

```powershell
npm run typecheck
npm test
npm run build
```

Browser smoke cần Playwright có sẵn và Microsoft Edge. Mở production server trước, rồi chạy:

```powershell
$env:STUDIO_PLAYWRIGHT_ENTRY = 'C:/Users/17520/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/browser-smoke.mjs
node scripts/animation-smoke.mjs
node scripts/phase3-smoke.mjs
```

Scripts tạo project test với tên `Smoke-<timestamp>` / `Phase2-Smoke-<timestamp>` và screenshot trong `test-results/`; không xóa project người dùng. Chạy browser-smoke trước để tạo fixture ảnh cho animation-smoke. Có thể xóa các project test này sau khi kiểm tra.

## Phạm vi và giới hạn

- Hoàn thành nền editor/Code sync Phase 1, animation/keyframes/timeline Phase 2 và Advanced 2D Motion Phase 3. Một project có một scene; camera, multiple scenes và MP4 chưa triển khai.
- API Code hỗ trợ `createScene`, `scene.addImage`, `scene.animate`, `motionPath`, `poseSet`, `poseTrack`, `bind`, literal values/arrays; import asset trước khi tham chiếu `asset`. Z-order nền qua thứ tự khai báo hoặc `zIndex`; chuyển thứ tự theo thời gian dùng `property: "zOrder"`. Không chạy code tùy ý.
- History tối đa 50 bước. Không có autosave ở phase này. Copy/paste keyframes qua nút đã có; copy/paste Layer, group/ungroup, snapping/alignment/context menu và toàn bộ shortcut chờ Phase 6.
- Timeline zoom/scroll/collapse và panel resize đã có. Chưa kiểm tra stress-test với 500 Layer/2000 tracks hoặc hàng triệu keyframe; engine không render lại toàn bộ editor mỗi frame.
- Panel resize bằng mép/góc resize của panel. UI dành cho desktop rộng ≥1000px.
- Chọn vị trí lưu qua hộp thoại Windows cần test tương tác thủ công. Root được chọn chỉ có hiệu lực trong phiên server; đặt `STUDIO_PROJECTS_DIR` trước khi chạy để giữ root qua các phiên.
- Import ≤64 MB/ảnh, ≤64 megapixel; upload project ≤256 MB. Các project nhiều ảnh lớn cần streaming/optimization trong Phase 6.
- Build có thể cảnh báo kích thước chunk Monaco; đã lazy-load panel và chỉ bundle JavaScript language cùng worker local.

Chưa triển khai Phase 4–6. Kiểm tra Phase 3 trước khi tiếp tục. Chưa commit/push các thay đổi Phase 3, theo yêu cầu review local.
