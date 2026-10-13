# 2D Animation Studio — kiến trúc và phạm vi

Hai đầu vào là `REQUIREMENTS.md` và `CODE_EDITOR.md`. Tài liệu bổ sung mở rộng editor bằng biểu diễn JavaScript khai báo, không thay thế workflow trực quan. Hiện đã triển khai Phase 1 và Phase 2; Motion Path/Pose/Binding, camera/multiple scenes, video và packaging vẫn thuộc các phase sau.

## Luồng dữ liệu

```text
Visual UI → command/transaction → Zustand Project/Scene JSON
                                      ↓               ↓
                              Konva renderer    JavaScript generator
                                                        ↓
                                                  Monaco draft
                                                        ↓ Apply
                                       Acorn AST → whitelist → Zod schema
                                                        ↓
                                             một transaction + Undo
```

Project/Scene JSON là nguồn dữ liệu duy nhất. React/Konva nodes, ảnh đã decode, object URL, trạng thái selection, viewport và code chưa Apply không được serialize. Code là biểu diễn của scene hiện tại, không phải chương trình được thực thi. `eval`/`new Function` không được dùng.

Code sạch được sinh lại sau transaction. Draft có thay đổi được giữ nguyên khi Canvas thay đổi, kèm `codeStale`. Apply draft cũ cần xác nhận vì thay thế scene; lỗi parse/validate không thay đổi project hoặc history. Generate/Reset cần xác nhận trước khi bỏ draft. Undo/Redo đi qua cùng cơ chế đồng bộ.

## Thư mục và trách nhiệm

- `shared/model.ts`: interface/schema, version, migration, validation cross-reference.
- `shared/animationEngine.ts`: hàm thuần `evaluateSceneAtTime`, interpolation, easing, loop; không phụ thuộc renderer.
- `src/animation/commands.ts`: upsert keyframe và batch transform edits/Auto Key, không chứa playback loop.
- `src/store/playbackStore.ts`: thời gian/play/pause/stop qua requestAnimationFrame, độc lập document/history/code.
- `src/store/timelineStore.ts`: chọn track/keyframe và clipboard UI, không serialize.
- `src/store/editorStore.ts`: document transactions, history, selection, code synchronization; history giới hạn 50 snapshot, không chứa dữ liệu ảnh.
- `src/code/sceneCode.ts`: deterministic generator + AST interpreter chỉ đọc literals/API được cho phép.
- `src/assets/assetManager.ts`: import, SHA-256 dedup, URL lifecycle, decode cache; độc lập renderer.
- `src/ui/`: layout, Konva Canvas, Properties, Layers, Library, Monaco; UI không lưu renderer objects vào model.
- `server/repository.ts`: đọc/ghi project trong root được cho phép, kiểm tra schema/path/checksum, atomic manifest.
- `server/directoryPicker.ts`: adapter hộp thoại Windows, sau này thay bằng Electron dialog.
- `server/index.ts`: API loopback và phục vụ production build; giới hạn Origin/Host/header/body, không nhận đường dẫn filesystem tùy ý.
- `tests/`: parser, round-trip, store history/conflict, schema và filesystem.
- `scripts/browser-smoke.mjs`: kiểm tra tích hợp UI trên production build bằng Playwright có sẵn trong môi trường hoặc được cài riêng.
- `scripts/animation-smoke.mjs`: UI animation, Timeline gestures, Auto Key, code sync và Save/Open sau reload.

## Animation Foundation — Phase 2

Schema v2 thêm `Scene.animations`. V0/V1 được migrate bằng cách giữ nguyên scene/layers/assets, bổ sung animations rỗng; validation strict vẫn chạy sau migration. Mở project cũ không ghi đè file cho đến khi người dùng Save.

Mỗi Layer có tối đa một track cho mỗi thuộc tính `position`, `scale`, `rotation`, `opacity`; bốn track kết hợp đồng thời. Một track có ID/layerId/startTime/duration/easing/loop và danh sách keyframes. Position có x/y; Scale có scaleX/scaleY; Rotation/Opacity có một giá trị. Time keyframe là **tương đối so với startTime**, tăng dần, không trùng, nằm trong duration. Scene validation kiểm tra layer refs, IDs, duplicate tracks, giá trị hữu hạn và animation end không vượt scene duration. Tăng Scene Duration trước nếu cần track dài hơn.

Evaluator: trước start dùng transform nền; sau start trước key đầu giữ key đầu; sau key cuối giữ key cuối. No Loop giữ trạng thái cuối sau duration; Repeat quay về đầu tại ranh giới chu kỳ; Ping Pong đổi chiều tại duration. Rotation nội suy giá trị góc liên tục (có thể ±720°), không ép đường ngắn nhất. Easing ở key nguồn điều khiển đoạn đi đến key tiếp theo; nếu không có dùng easing của track. Binary search keyframes và đánh giá trực tiếp tại t nên scrub ngược/nhảy không cần chạy từ đầu. Camera output trong kết quả hiện tĩnh, animation camera chờ Phase 4.

Canvas subscribe playback và áp kết quả lên các Konva nodes đã có, không cập nhật document store mỗi frame. Timeline playhead/time display là các component riêng, không khiến toàn bộ track list render lại mỗi frame. Properties hiển thị giá trị đã evaluate tại playhead. Playback/scrub không tạo history, không dirty project, không regenerate code. Các chỉnh sửa document tạm dừng playback, giữ playhead; New/Open reset playback về 0.

Auto Key mặc định OFF. Khi ON, chỉnh x/y/scale/rotation/opacity qua Properties hoặc Canvas tạo/cập nhật keyframe tại playhead trong một transaction. Track mới được seed transform nền tại 0 nếu playhead >0 để không thay đổi trạng thái trước đó. Với loop, key được sửa tại local time trong chu kỳ đang xem. Khi OFF, sửa transform nền; track đã có vẫn quyết định giá trị preview. Width/Height/Pivot không được keyframe ở Phase 2.

Timeline có ruler, scrub/click/drag playhead, zoom/scroll, layer tracks thu gọn, bốn animation tracks, chọn/kéo keyframes, kéo track đổi start và kéo handle cạnh phải đổi duration. Drag chỉ commit khi thả pointer; ghost UI không sinh history. Đổi duration scale thời gian các key theo tỉ lệ. Properties có start/duration/end, easing/loop, key time/value/outgoing easing, add/copy/paste/delete. Track/keyframe trên layer khóa không sửa qua UI. Delete key cuối xóa track, trả preview về transform nền.

Generator sinh `scene.animate(layerId, options)`; AST parser chấp nhận arrays/literals và hai API addImage/animate. ID/timing/easing/loop có thể bỏ trong code: ID sinh ổn định theo thứ tự câu lệnh, start=0, duration=key cuối (tối thiểu .001s), easing=linear, loop=none. Apply validate toàn bộ scene rồi commit một bước Undo và preview tại playhead hiện tại. Các quy tắc giữ draft/conflict Phase 1 giữ nguyên.

## Các module ở những phase sau

Animation/Keyframe đã có trong schema v2. Các contract MotionPath/PoseSet/Camera/AttachmentPoint/Binding chưa được đưa vào persisted schema; không tạo nút export hoặc animation camera giả.

- Animation Engine: module thuần, `evaluateSceneAtTime(scene, t)`, không phụ thuộc React/Konva/DOM; tính theo timestamp. Kết quả gồm layer state và output camera. Preview và Export dùng **cùng hàm này**.
- Timeline Engine: dữ liệu track/keyframes và bộ điều khiển playback riêng; `requestAnimationFrame` không cập nhật toàn bộ editor store mỗi frame. Scrub đánh giá trực tiếp tại t.
- Renderer: nhận evaluated scene. Editor thêm viewport, grid, selections, paths; output renderer chỉ vẽ kết quả camera và crop video frame. Editor zoom/pan không thay đổi output camera.
- Export Engine: process Node riêng điều phối từng frame timestamp cố định, bounded queue/backpressure tới FFmpeg, progress/cancel/error, không quay màn hình.
- Project Manager: migration v3+ khi thêm hierarchy/multiple scenes; schema strict không âm thầm bỏ field chưa hỗ trợ. Có thể tách scene ra `scenes/` bằng repository adapter khi Phase 4, giữ cùng model trong memory.
- AST API registry: thêm lệnh animate/path/pose/bind/camera cùng phase tương ứng, validator/generator và round-trip tests đi cùng nhau. Không mở khả năng chạy arbitrary JavaScript.

Z-order hiện tại là thứ tự `scene.layers` từ sau ra trước. Parent–Child sau này là graph riêng qua ID, validate cycle; không dùng vị trí trong layer array làm quan hệ cha con. Kết hợp animation nhiều thuộc tính, pose và binding trước camera/output.

## Persistence Phase 1–2

```text
<root người dùng chọn>/
  My Animation/
    project.json    # canonical Project, gồm scene duy nhất
    assets/
      <sha256>.png
      <sha256>.jpg
      <sha256>.webp
```

Default root là `projects/` dưới thư mục chạy ứng dụng. Save/Open có nút **Chọn vị trí khác…** dùng hộp thoại Windows; root này chỉ được thay bằng lựa chọn trực tiếp trong hộp thoại hoặc biến `STUDIO_PROJECTS_DIR` khi khởi động. Sau restart cần chọn lại root hoặc cấu hình biến môi trường. Save As yêu cầu thư mục mới. Không ghi đè project khác hoặc thư mục chứa file không liên quan. Ảnh immutable được kiểm tra checksum rồi mới atomically replace `project.json`; lỗi trước khi replace giữ manifest cũ. Assets không bị xóa vì còn có thể được tham chiếu bởi Undo.

Import tuần tự bất đồng bộ; PNG/JPEG/WebP, ≤64 MB/ảnh, ≤16384 px mỗi cạnh, ≤64 megapixel. Schema giới hạn 1000 assets/500 layers, upload ≤256 MB. Phase 1 chưa tối ưu streaming cho project lớn. Missing/corrupt asset khi Open làm thao tác thất bại và giữ project đang mở.

## Ma trận yêu cầu / các phase

| Nhóm yêu cầu từ hai tài liệu | Phase |
| --- | --- |
| React/TS strict/Vite/Tailwind/Zustand/Konva, UI dark, loading/error/empty states | 1 |
| Import ảnh/thư mục con, thumbnail/tìm kiếm/lọc/preview, path ổn định/dedup | 1; refresh nguồn thư mục ngoài project: 6 |
| Kéo thả library/Explorer, chọn/di chuyển/resize/rotate, zoom/pan/fit/grid | 1 |
| Layer chọn/rename/ẩn/khóa/duplicate/delete/reorder; 4 lệnh Z-order | 1 |
| Properties general/transform/pivot; tỉ lệ 16:9/9:16, custom size/FPS/duration | 1 |
| Save/Open/New/Save As, chọn root Windows, schema version/migration/validate | 1 |
| Monaco show/hide/resize/right/bottom, autocomplete, syntax/AST errors, Generate/Apply/Reset/Format, draft/conflict | 1 |
| Canvas ↔ Code transform/visibility/lock/opacity/Z-order; Apply atomic Undo | 1 |
| History nền tảng, Ctrl+S/Z/Y/Shift+Z/D, Delete/Esc | 1; history toàn bộ: 4; shortcuts đầy đủ: 6 |
| Move/scale/rotate/fade kết hợp, easing, repeat/ping-pong, keyframes, auto keyframe, timeline/scrub/playback, Code sync tương ứng | 2 |
| Straight/polyline/Bézier/circle/ellipse/freehand paths, handles/simplification/arc length/orient, path Code sync | 3 |
| Scale Keyframes nền tảng | 2 |
| Discrete Z-order keyframes, pose sets/switching/anchors/pose Code sync | 3 |
| Parent–Child, bind position/transform, attachment points, bind Code sync | 3 |
| Camera pan/zoom/keyframes, output frame preview, camera Code sync | 4 |
| Create/rename/duplicate/delete/switch multiple scenes, timeline riêng | 4 |
| Deterministic shared evaluator, FFmpeg H.264 MP4/settings/progress/cancel/errors | 5 |
| Snap/grid/center/alignment, copy/paste/select all/group/ungroup, context menu, autosave/recovery, advanced shortcuts, performance tuning | 6 |
| Electron/Windows installer, docs hoàn thiện | 6 |
| AI/IK/rigging nâng cao/3D/physics/lip sync/cloud/auth/marketplace/plugins/multiplayer | Ngoài phạm vi bản đầu |

Đây là phân bổ phạm vi, không phải tuyên bố các phase sau đã hoàn thành. MP4 là mục tiêu bắt buộc Phase 5. Timeline và preview animation đã có ở Phase 2; các lệnh path/pose/bind/camera vẫn trả lỗi rõ ràng.

## Dependencies và kiểm thử

Các dependency được lấy từ `latest` tại thời điểm triển khai và pin exact version, kèm `package-lock.json`. Ví dụ `4.0.12 → 4.23.1` trong yêu cầu được hiểu là chỉ cập nhật minor/patch trong cùng **major**, không tự nâng major. Production build bundle Monaco và workers local, không cần CDN.

Tests bao phủ serialization/schema/refs/paths, generator/parser round-trip, code không được phép, preserve drafts, Undo/Redo và filesystem, animation interpolation/easing/loop/timeline evaluation/playback/keyframes/Auto Key/migration. Path/hierarchy/pose tests bổ sung ở các phase triển khai tương ứng. Không thêm hoặc nâng dependency ở Phase 2.
