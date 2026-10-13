# Phase 4 — Camera và quản lý Scene

Bản local **0.4.0**, schema project **v4**. Lưu project/draft đang làm rồi tải lại http://127.0.0.1:4310/. Toolbar ghi CAMERA & SCENES · PHASE 4. Không commit/push. MP4 vẫn thuộc Phase 5.

**Bổ sung hướng dẫn Camera:** icon ? cạnh từng nút/input/select giải thích bằng tiếng Việt. Camera thêm Rotation/Rotation Key và nút **Tạo xoay 360°**; dữ liệu v4 cũ không có rotation được hiểu là 0°.

### Bài thực hành camera dễ hiểu

- **Zoom in:** ở 0s đặt Camera Zoom=1, + Zoom Key; bật Auto Key, đến 3s đặt Zoom=2. Căn X/Y vào nhân vật trước để phóng đúng nơi.
- **Zoom out:** ở 0s đặt Zoom=2, ghi Zoom Key; ở 3s bật Auto Key và đặt Zoom=1.
- **Pan theo nhân vật:** chọn Layer nhân vật, ở 0s bấm **Ghi Pan theo Layer**; tới 2s/4s bấm lại. Mỗi lần bấm ghi một Pan Key. App dùng điểm bám Motion Path nếu có, không thì tâm ảnh. Đây chưa phải tự follow liên tục; thêm nhiều mốc nếu nhân vật đi đường cong.
- **Xoay 360° kiểu giấc mơ:** đưa playhead tới điểm bắt đầu, bấm **Tạo xoay 360°**. App tạo Rotation từ góc hiện tại tới +360° trong tối đa 4s, Linear/Repeat, thay Rotation track cũ. Có thể chỉnh Duration, Loop, hai key trong Rotation track. Camera Preview cho thấy hình xoay, Layer không bị xoay dữ liệu. Camera xoay một chiều thì hình nhìn thấy xoay ngược chiều đó; dùng -360° để đổi chiều.
- **Cách làm tay:** + Rotation Key ở 0s với Rotation=0; Auto Key ON, đến 4s đặt Rotation=360. Key cuối 0° sẽ không tạo vòng xoay. Có thể kết hợp Pan và Zoom đồng thời. Khi xoay khung, ảnh nền cần đủ rộng hoặc zoom gần để tránh lộ vùng ngoài ảnh.

Key Time là thời gian từ Start của track. Ví dụ Start=2s, Key Time=1s thì mốc ở 3s. Chọn key trong Properties để sửa giá trị của key đó; khác với Camera X/Y/Zoom/Rotation đang hiển thị tại playhead. Mọi mục có ? để xem lại cách dùng.

## 1. Tạo và quản lý Scene

Thanh tab Scene nằm ngay phía trên Canvas:

- **+ Scene**: tạo scene trống theo Width/Height/FPS/Duration/Background của scene hiện tại, camera mới căn giữa, Zoom 1.
- **Tên Scene** trong Properties: nhập tên rồi Enter/rời ô để lưu.
- **Duplicate**: sao chép scene đang mở, giữ bố cục và toàn bộ animation, path, pose, Group, Parent/Attachment và camera. IDs được tạo mới; không dịch đối tượng +30 như Duplicate Layer.
- **Xóa**: xóa scene đang mở. Undo khôi phục cả scene và camera. Không xóa được scene cuối cùng.
- **Click tab**: chuyển scene, giữ playhead riêng trong phiên làm việc. Mỗi scene có Timeline, kích thước, FPS, thời lượng và camera riêng; Asset Library dùng chung.

Giới hạn 100 scenes/project. Scene switch là điều hướng, không tạo bước Undo riêng; activeSceneId được lưu nên chuyển tab có thể làm trạng thái project thành chưa lưu. Sau khi Undo sửa/xóa ở scene khác, editor mở đúng scene của snapshot đó. View pan/zoom được Fit lại khi chuyển scene.

## 2. Output Camera

Trong Properties, mục **OUTPUT CAMERA** luôn hiện dù chưa chọn Layer. Hover icon ? để xem giải thích tiếng Việt.

- **Camera X/Y**: tâm camera trong tọa độ scene. 1920×1080 mặc định X=960, Y=540.
- **Camera Zoom**: 1 là camera mặc định; 2 nhìn gần gấp đôi, khung bao phủ vùng nhỏ bằng một nửa chiều rộng/chiều cao. Giá trị hợp lệ 0.01–100.
- **Kéo khung Camera**: trong Editor View, kéo viền vàng để pan camera; kéo chấm góc dưới phải để đổi zoom, giữ tỉ lệ khung hình. Một lần kéo = một bước Undo.
- **Reset Camera**: camera về giữa, Zoom 1 và bỏ camera tracks. Undo khôi phục.

Khung vàng là công cụ editor. Layer không bị di chuyển khi camera thay đổi. Các ảnh ngoài khung scene mặc định vẫn có thể xuất hiện khi camera đi tới đó. Muốn đi qua bản đồ lớn, bố trí ảnh bản đồ đủ lớn trong workspace rồi animate camera.

Đổi 16:9/9:16 làm khung camera thay tỉ lệ tương ứng. Camera chưa được chỉnh/chưa có tracks sẽ tự căn giữa kích thước mới. Với camera đã animate, tọa độ và zoom đã tạo được giữ; review lại khung hình sau đổi tỉ lệ.

## 3. Camera Preview và Editor View

- Bấm **Camera Preview** trong Properties hoặc trên toolbar Canvas để xem khung hình đầu ra.
- Output preview clip đúng vùng camera, vẽ theo thứ tự Z-order, transform, binding, pose và camera tại playhead. Không có selection handles, lưới hay Motion Path.
- Bấm **← Editor View** để trở về bố trí ảnh và chỉnh đường đi.
- Pan/zoom workspace, Fit to Screen và zoom bằng cuộn chuột chỉ đổi Editor View, không ghi Camera keys hoặc đổi camera video.
- Output preview là chế độ chỉ xem; thả ảnh vào Canvas trong chế độ này bị bỏ qua. Về Editor View trước khi bố trí thêm Layer.

## 4. Camera keyframes

1. Đưa playhead về 0s, đặt camera ban đầu.
2. Bấm **+ Pan Key** / **+ Zoom Key** để ghi camera tại playhead.
3. Bật **Auto Key** trên Timeline, đưa playhead tới 2s, sửa X/Y/Zoom hoặc kéo khung. Camera key được tạo/cập nhật; camera nền giữ nguyên.
4. Scrub về 1s: camera được nội suy, không phải chạy từ đầu.
5. Chọn Camera Track trong Properties; chỉnh Start, Duration, Easing và Loop. Chọn Camera Key để sửa thời gian/giá trị/easing tới key tiếp theo.

Auto Key OFF sửa camera nền. Nếu track đang chạy, giá trị track vẫn ưu tiên khi xem. Reset/bỏ track hoặc sửa key để thay chuyển động đang có. Key time trong Properties tính tương đối từ Start của track. Camera có ba track độc lập: Pan (X/Y), Zoom và Rotation; có thể chạy đồng thời, Repeat hoặc Ping Pong.

## 5. Camera trên Timeline

Camera Pan/Zoom tracks nằm đầu Timeline:

Rotation track cũng có các thao tác chọn/kéo/copy/paste/Delete giống Pan/Zoom. Camera base và camera keys được lưu/mở, sinh code đầy đủ rotation; renderer dùng camera rotation độc lập với Layer rotation.

- Click để chọn thanh/key; chỉ viền animation/key, không viền cả hàng Timeline.
- Kéo thanh đổi Start; kéo handle phải đổi Duration; kéo hình thoi đổi key time.
- Double-click hoặc click phải → **Mở Properties** tới mục Camera.
- Chọn thanh rồi **Delete** xóa camera track; chọn key rồi Delete xóa key. Layer không bị xóa.
- **Ctrl+C/V** copy camera track/key; đặt playhead tại scene nhận rồi Paste. Camera không cần Layer nhận. Track cùng loại được thay; dữ liệu vượt thời lượng báo lỗi và giữ project.

## 6. Code Editor và draft theo Scene

Code Editor chỉ sinh/sửa scene đang mở. Apply Code giữ các scene khác. API thêm:

```js
scene.camera({ x: 960, y: 540, zoom: 1 });
scene.cameraAnimate({
  id: "camera-zoom",
  property: "zoom",
  startTime: 0,
  duration: 3,
  easing: "easeInOut",
  loop: "none",
  keyframes: [
    { id: "zoom-wide", time: 0, zoom: 1 },
    { id: "zoom-close", time: 3, zoom: 2 }
  ]
});
```

Pan dùng property `position`, keys có `x`/`y`. UI tự sinh đủ camera code, không cần viết tay. Vẫn dùng AST/data validation, không eval JavaScript.

Draft chưa Apply được giữ riêng theo Scene trong phiên làm việc. Chuyển tab rồi trở về không ghi đè draft. Save Project không lưu draft; cảnh báo đóng/mở project xét cả draft ở scene khác. Generate Code có thể bỏ draft của scene đang mở. Undo/Redo bảo toàn draft và đánh dấu cần đồng bộ khi dữ liệu nền thay đổi.

## 7. Save/Open, assets và migration

Project JSON v4 lưu toàn bộ scenes và camera, ảnh dùng đường dẫn tương đối trong assets/. Open v1/v2/v3 migrate camera về giữa scene trong bộ nhớ; chỉ Save mới cập nhật file. Dùng Save As để giữ bản mở bằng app cũ.

Asset Library dùng chung; xóa ảnh khỏi project sẽ dọn các Layer/Pose tham chiếu trong **mọi scene**, tháo binding của Child còn lại (scene đang mở tại playhead, scene khác tại 0s). Nếu có Layer ảnh hưởng đang khóa, thao tác bị từ chối trước commit. Undo khôi phục toàn project.

Animation Library vẫn dùng được cho scene đang mở và giữ scene khác. Mẫu Library là chuyển động Layer/Group; camera tracks không nằm trong mẫu animation v1 hiện có.

## Checklist test

1. Scene 1: tạo camera Pan + Zoom keys ở 0/2s; scrub 1s, kiểm tra nội suy. Xoay/scale/pose nhân vật vẫn đúng.
2. Camera Preview: kiểm tra khung hình; về Editor, zoom/pan workspace rồi xác nhận Camera X/Y/Zoom không đổi.
3. Bật Kéo khung Camera, kéo viền và chấm góc; Auto Key ON ghi keys; Undo mỗi lần kéo.
4. Thêm Scene 2, đổi tên và 9:16, thêm ảnh. Chuyển lại Scene 1, dữ liệu cũ phải giữ nguyên.
5. Duplicate Scene 2, sửa bản sao, xóa rồi Undo/Redo. Thử draft code ở hai scene; chuyển tab không mất draft.
6. Save As, reload/Open: đủ scene, camera, group/binding/pose/path. Apply code một scene không làm mất scene khác.

Build: `npm run build`. Logic: `npm test`. Browser: `scripts/phase4-smoke.mjs`, cùng hồi quy Phase 3 và Animation Library. Còn cảnh báo bundle Monaco như trước. Chưa có MP4/FFmpeg, scene sequencing hay chuyển cảnh; Phase 4 chỉ quản lý từng scene và camera 2D.

**Kết quả:** build thành công; **155/155 tests** đạt trong 7 files. Browser Phase 4 đạt camera Pan/Zoom/Auto Key/scrub, kéo khung và handle zoom, Editor View độc lập, Camera Timeline/context/Delete/copy key, scene CRUD/Undo/Redo/drafts, Save/Open và pixel ảnh thật trong Output Camera Preview. Bổ sung kiểm tra tooltip từng mục, Ghi Pan theo Layer, Rotation 0→360° và lưu rotation. Hồi quy Phase 3 và Animation Library đạt, không có lỗi page/console. Project thử cuối: `Phase4-Smoke-1791905464298`. Không commit/push.
