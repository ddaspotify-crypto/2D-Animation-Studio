# Phase 2 — kết quả kiểm tra

Ngày kiểm tra: 13/10/2026; Windows, Node 22.23.2, Edge headless; bản production 0.2.0.

## Kết quả

- TypeScript strict + build Vite frontend/Node backend: đạt, không có lỗi compile. Còn cảnh báo bundle Monaco lớn như Phase 1.
- **65 unit/integration tests**: tất cả đạt, gồm hồi quy Phase 1 và interpolation/easing/loop/combined tracks, direct timestamp evaluation, AST animation round-trip/validation, Auto Key, key editing/collisions/history, clipboard values/easing, playback elapsed-time/pause/resume/end, schema migration và persistence v1→v2 không ghi đè file cũ khi chỉ Open.
- Browser hồi quy Phase 1: import/drop/move/resize/rotate, Layer visibility/lock/duplicate/delete, Properties, Format/Apply, Undo/Redo, errors/draft conflict và Save/Open/reload: đạt.
- Browser Phase 2: tạo Move/Scale/Rotate/Fade bằng UI, kết hợp cả bốn track, easing/loop, nhập thời gian và kéo playhead, Canvas đổi hình theo scrub, Auto Key, kéo thời gian key, kéo Start Time/Duration của track và Undo, copy/paste/delete key, Play/Pause/Stop: đạt.
- Code animation: Apply tạo Timeline/keyframes và preview đúng tại playhead; Undo/Redo khôi phục; orphan layer input bị từ chối và scene giữ nguyên; Save/Open sau reload giữ animation: đạt.
- Không có page/console/resource errors trong các lượt browser smoke cuối.
- Visual review ở 1680×1080: Timeline, Canvas, Properties và Code hiển thị đúng. Screenshot `test-results/studio-phase2.png`.

## Giới hạn và thao tác thủ công

### Bổ sung trợ giúp thuật ngữ tiếng Việt

Các nhãn animation có icon ? với tooltip tiếng Việt: Timeline/playhead/thời lượng, playback, bốn loại chuyển động, Auto Key, Track, Start/Duration/End, easing/loop, keyframe/time/values/easing và thao tác thêm/copy/paste/xóa. Dropdown easing/loop có giải nghĩa ngắn bằng tiếng Việt, giữ nguyên giá trị dữ liệu/API.

Kiểm tra `scripts/animation-help-smoke.mjs` đã đạt: hover/focus/Esc, nội dung tiếng Việt, tooltip không ra ngoài viewport 1440×1000, click ? không bật checkbox Auto Key. Đã chạy lại animation-smoke và 65 unit/integration tests. Tooltip được render bên ngoài panel cuộn để tránh bị cắt; screenshot tại `test-results/animation-help.png`.

Chạy thêm kiểm tra trợ giúp sau khi build/server đã mở:

```powershell
node scripts/animation-help-smoke.mjs
```

Script dùng Playwright như các smoke tests khác, đọc project Phase2-Smoke đã có và chỉ chỉnh trong editor, không ghi đè project đó.

### Các giới hạn còn lại

- Hộp thoại chọn root Windows, native import folder/Explorer drag/drop và file JPG/WebP của người dùng vẫn cần test thủ công như Phase 1.
- Chưa stress-test với 500 Layer/2000 tracks hoặc 2000 keyframes/track; cần đo hiệu năng trước khi dùng project cực lớn. Playback store độc lập document; Canvas dùng Konva nodes có sẵn, Timeline track list không subscribe thời gian mỗi frame.
- Các track cùng property trên cùng layer được gộp thành một track nhiều keyframes. Không hỗ trợ nhiều clip chồng nhau trên cùng property ở Phase 2.
- Rotation dùng góc liên tục để hỗ trợ nhiều vòng/cả hai chiều. Keyframe time tương đối với startTime; Timeline hiển thị thời gian toàn scene.
- Khi Auto Key OFF, sửa transform nền không ghi đè track đang animate. Khi ON, sửa tại local time của chu kỳ đang preview.
- Schema mới v2 không đọc được bằng app Phase 1; dùng Save As nếu cần giữ bản project v1. Open/migration không tự ghi đè project cũ.
- Motion Path, Pose, Binding, Camera animation, multiple scenes, Z-order keyframes, MP4 và packaging chưa triển khai. Snapshot camera trong evaluator hiện tĩnh, không phải camera editor.
- Không thêm/nâng dependency. Hai cảnh báo dependency audit mức low ghi nhận ở Phase 1 chưa được thay đổi trong đợt này.

## Tái chạy

```powershell
npm run typecheck
npm run build
npm test
npm start
```

Ở terminal khác (Playwright và Edge có sẵn):

```powershell
$env:STUDIO_PLAYWRIGHT_ENTRY = 'C:/Users/17520/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/browser-smoke.mjs
node scripts/animation-smoke.mjs
```

Các scripts chỉ tạo project `Smoke-*` / `Phase2-Smoke-*` riêng trong root hiện tại và screenshots; không xóa hoặc sửa project người dùng. Xem README để test bằng UI.
