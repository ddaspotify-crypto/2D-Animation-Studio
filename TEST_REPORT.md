# Phase 1 — kết quả kiểm tra

Ngày kiểm tra: 13/10/2026, Windows, Node 22.23.2, Edge headless, bản production local.

## Đã kiểm tra

- TypeScript strict: đạt, không có lỗi.
- Production build frontend + Node TypeScript backend: đạt. Còn cảnh báo kích thước chunk Monaco (~2.7 MB, worker TypeScript ~6.9 MB); panel lazy-load và assets/worker được bundle local.
- Unit/integration logic: **33 tests**, model/schema/migration, generator/parser round-trip, value/reference validation, từ chối code tùy ý, một bước Undo cho Apply, draft/conflict, layer lock/Z-order và filesystem save/load/dedup/Save As/path/overwrite/error cases.
- Browser smoke trên bản build: đạt; import PNG, HTML drag/drop library → Canvas, di chuyển ảnh bằng chuột, resize/rotate qua handle thật và Undo từng thao tác, duplicate/visible/lock/delete, Properties, Format + Apply, Undo/Redo sau Apply, invalid code giữ scene, draft conflict/Generate, Save và Open sau reload; không có page/console/resource errors.
- Visual review screenshot: layout desktop 1600×1000, Canvas, Layer/Properties, Monaco hiển thị đúng; screenshot tại `test-results/studio-phase1.png`.

## Cần kiểm tra thủ công

- Hộp thoại Windows **Chọn vị trí khác…**: mở hộp thoại, chọn/cancel, quyền ghi ổ đĩa; adapter đã compile nhưng chưa tự động thao tác hộp thoại.
- File picker thư mục con, JPG/WebP/ảnh trong suốt thực tế của người dùng, Explorer native drag/drop, màn hình/DPI khác, project nhiều ảnh lớn.
- Panel resize/đặt bên phải, trải nghiệm autocomplete và toàn bộ workflow thường ngày.

## Ghi chú môi trường và phạm vi

Shim Node mặc định trên máy báo `shim integrity check failed`; chạy build/test bằng runtime Node 22.23.2 đã cài trực tiếp. Sandbox Windows chặn `realpath` dùng bởi bundler và test filesystem, nên các kiểm tra này được chạy ngoài sandbox sau khi xin quyền. Những lần browser smoke lỗi do selector test và kiểm tra Format ở sai bước đã được sửa; lượt kiểm tra cuối đạt.

Install báo 2 cảnh báo audit mức low trong dependency tree. Không dùng auto-fix nâng major; dependencies pin exact và có lockfile. Đây là giới hạn dependency còn được ghi nhận, không phải lỗi build/runtime phát hiện trong test.

Không kiểm tra hoặc tuyên bố animation/timeline/camera/MP4, vì chưa triển khai Phase 2–6. Root tùy chọn không tự nhớ sau khi server restart; chọn lại root hoặc đặt `STUDIO_PROJECTS_DIR`.
