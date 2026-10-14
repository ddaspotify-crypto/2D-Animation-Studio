# Phase 5 — Xuất video MP4

Bản local **0.5.0**, giữ schema project v4. Chưa commit/push. Không triển khai Phase 6.

## Cách sử dụng

1. Save project/draft đang làm rồi tải lại http://127.0.0.1:4310/. Toolbar hiển thị VIDEO EXPORT · PHASE 5.
2. Kiểm tra animation bằng Timeline và **Camera Preview**. Các thao tác zoom/pan workspace không ảnh hưởng video.
3. Nếu vừa sửa Code Editor, bấm **Apply Code** trước. Export lấy dữ liệu Canvas tại lúc bấm Xuất, không xuất draft chưa Apply và không yêu cầu lưu project trước.
4. Bấm **Export MP4** trên toolbar. Chọn Scene muốn xuất; mỗi lần xuất một Scene, không nối các Scene.
5. **Width/Height** mặc định theo Scene (Scene mặc định 1920×1080). Giữ cùng tỉ lệ: 1920×1080 hoặc 1280×720 cho ngang; 1080×1920 hoặc 720×1280 cho dọc. Đổi khác tỉ lệ sẽ kéo hình theo tỉ lệ đã nhập. H.264 cần số chẵn; tối đa 4096 px mỗi chiều.
6. **FPS** mặc định theo Scene (30), từ 1–120. 30 FPS phù hợp thông thường; 60 cho chuyển động mượt hơn. FPS không đổi tốc độ animation.
7. **Chất lượng:** Cao (CRF 18), Cân bằng (23), File nhỏ (28). File xuất là MP4 H.264/yuv420p, không có âm thanh. Nền trong suốt được ghép lên Background của Scene.
8. Đặt tên file, ví dụ `nhan-vat-di-bo.mp4`. Dùng chữ/số, dấu cách, gạch dưới hoặc gạch ngang; không nhập đường dẫn trong ô tên file. File đã tồn tại được giữ nguyên; đổi tên để xuất bản mới.
9. Mặc định video ở `C:\Apps\Canvas Product\exports`. Bấm **Chọn thư mục xuất…** để chọn nơi khác bằng hộp thoại Windows. Thư mục này độc lập với nơi Save project.
10. Bấm **Xuất MP4**. Theo dõi phần trăm, frame đã vẽ, frame đã mã hóa và trạng thái hoàn tất. Khi thành công, đường dẫn đầy đủ xuất hiện; mở file đó trong trình phát video hoặc import vào CapCut.
11. Bấm **Cancel Export · Hủy** để dừng. App dừng FFmpeg và dọn MP4 tạm; không tạo video dở dang. Có thể đổi thông số rồi xuất lại.

Các ô resolution/FPS/quality có icon **?** với giải thích tiếng Việt. Khi xuất, hộp thoại vẫn phản hồi và có thể hủy; các thông số bị khóa để không đổi công việc đang chạy. Nên giữ tab mở trong lúc xuất. Nếu đóng/reload tab, backend dừng job không nhận thêm frame sau 2 phút; giai đoạn hoàn tất có giới hạn 10 phút.

## Kiến trúc và tính đúng của hình ảnh

`evaluateSceneAtTime(scene,t)` dùng chung với Preview. `src/render/outputRenderer.ts` dùng chung cho Output Camera Preview và Export: Layer/Z-order/transform/flip/skew/opacity/pose/parent–child/attachment, Pan/Zoom/Rotation của camera. Export tạo Konva Stage riêng, không đưa selection handles, grid, Motion Path hoặc editor UI vào video. Không quay màn hình và không thay đổi playhead/project/history.

Frame i được tính ở `i/FPS`, bắt đầu tại 0. Tổng frame là `ceil(Duration×FPS)`; không thêm frame trùng ở cuối. Duration không chia hết cho bước frame sẽ được làm tròn lên tối đa dưới một frame trong video. Tốc độ máy chỉ ảnh hưởng thời gian xuất.

Ảnh dùng được tải/cache trước khi chạy. Chỉ một PNG được gửi mỗi lần, đợi backpressure của FFmpeg trước frame tiếp theo; không lưu toàn bộ frame trong RAM hoặc ổ đĩa. Backend kiểm tra thứ tự/kích thước PNG, giới hạn payload và một job đang chạy. Mức giới hạn thực tế: tối đa 1 triệu frame/job. FFmpeg được gọi bằng mảng tham số, không shell. File tạm có UUID và cùng thư mục với file đích; chỉ công bố file đích sau khi FFmpeg thành công, bằng tạo link độc quyền để không ghi đè file cũ.

## FFmpeg trên máy này và máy mới

Đã cài **FFmpeg 9.0.2 Essentials (Gyan Windows build)** tại `tools/ffmpeg.exe`, kiểm tra SHA256 của ZIP trước khi giải nén. Binary/video không đưa vào Git. Script `scripts/install-ffmpeg.ps1` chỉ chấp nhận checksum build đã kiểm tra, không tự nâng phiên bản khi nhà cung cấp đổi release.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-ffmpeg.ps1
npm run build
npm start
```

Hoặc cài executable riêng và cấu hình đường dẫn tuyệt đối trước khi chạy backend:

```powershell
$env:STUDIO_FFMPEG_PATH = 'C:\ffmpeg\bin\ffmpeg.exe'
npm start
```

Nếu chưa có FFmpeg, hộp thoại báo rõ và khóa nút xuất. Nếu không đọc được ảnh, frame sai hoặc FFmpeg không hỗ trợ codec/không ghi được file, app báo lỗi và giữ project. Bản Gyan có GPLv3; license đã giữ trong tools/FFMPEG-LICENSE.txt. Việc đóng gói binary cho Windows installer thuộc Phase 6.

Nguồn: [FFmpeg Download](https://ffmpeg.org/download.html), [Gyan Windows builds](https://www.gyan.dev/ffmpeg/builds/), [FFmpeg pipeline/progress](https://ffmpeg.org/ffmpeg.html), [image2pipe](https://www.ffmpeg.org/ffmpeg-formats.html).

## Kiểm tra

- `npm test`: 161 tests đạt, gồm FFmpeg thật: đủ frame, finish, thứ tự frame, PNG lỗi, file trùng, cancel và thiếu executable.
- `npm run build`: TypeScript và build production đạt; cảnh báo bundle Monaco lớn như trước.
- `scripts/phase5-smoke.mjs`: UI xuất ngang/dọc, ffprobe kiểm tra H.264/kích thước/FPS/số frame/thời lượng; giải mã frame ở 2s và so với Camera Preview. Sai khác trung bình 0.459/255 do nén H.264/resampling. Thử file trùng và Cancel dọn file tạm.
- Hộp thoại chọn thư mục Windows có adapter dùng lại của Project Manager; cần thử thao tác chọn thư mục bằng tay trên máy.

Test tay: tạo một Scene ngắn 3–5s, thêm Move/Rotate/Fade hoặc Motion Path/Pose/Binding, Camera Zoom/Rotation, xuất 1280×720/30 FPS; so với Camera Preview. Xuất lại tên cũ để kiểm tra báo lỗi; xuất tên mới rồi Cancel. Chuyển Scene dọc và xuất 720×1280. MP4 không gồm soundtrack/ghép cảnh/chuyển cảnh.
