# 2D Animation Studio — kiến trúc và phạm vi

Hai đầu vào là `REQUIREMENTS.md` và `CODE_EDITOR.md`. Tài liệu bổ sung mở rộng editor bằng biểu diễn JavaScript khai báo, không thay thế workflow trực quan. Hiện đã triển khai Phase 1–4 trong bản local 0.4.0/schema v4, gồm camera và multiple scenes. Video và packaging thuộc Phase 5–6. Các mục Phase 1–3 dưới đây mô tả lịch sử triển khai; phần Phase 4 ghi kiến trúc hiện tại.

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

## Advanced 2D Motion — Phase 3

Scene v3 thêm motionPaths/poseSets/poseTracks, Layer thêm binding/attachments và Transform thêm skewX tùy chọn cho biểu diễn affine. Animation có property zOrder rời rạc. Z-order vẫn riêng biệt với graph Parent–Child. Validation kiểm tra ID/reference/cycle, radius/point counts, time ranges và pose keys; migration v0/v1/v2 giữ dữ liệu cũ và thêm các danh sách rỗng. Không tự ghi đè file khi chỉ Open.

- `shared/motionPaths.ts`: polyline tessellation, Bézier/circle/ellipse sampling, bảng khoảng cách cache theo object path và binary search vị trí theo arc length xấp xỉ; RDP freehand simplification và giới hạn mốc giữ endpoint.
- `shared/transforms.ts`: affine multiply/inverse/decompose; Bind Position chỉ nhận translation của điểm gắn, Bind Transform nhận đủ rotation/non-uniform scale (kể cả shear). Attachment theo tọa độ chuẩn hóa 0–1 của ảnh và pivot, do đó theo kích thước pose.
- `shared/animationEngine.ts`: chọn pose tức thời → các track transform/opacity/zOrder → path position/orientation → resolve hierarchy theo dependency → sort Z-order. Pure evaluation không phụ thuộc thứ tự scrub hoặc Z-order để resolve Parent. Visibility/opacity riêng, không tự kế thừa từ Parent.
- `src/advanced/commands.ts`: tạo dữ liệu path preset và đổi binding giữ world pose tại playhead, rebase transform/keys/path coordinates; `actions.ts` commit qua store, validation/history/code sync chung.
- `PathOverlay`: editor-only đường/mốc/Bézier handles/attachment markers, chuyển world↔binding-local khi drag. `MotionPathPanel`, `PosePanel`, `BindingPanel` và `AdvancedTimelineRows` cung cấp UI/tooltip tiếng Việt và thời gian/geometry edits.
- Canvas renderer dùng image cache đã preload, đổi image/size/pivot theo pose và thứ tự nodes theo evaluated Z-order; không tạo lại image nodes mỗi frame. Shapes overlay nằm ở Konva layer riêng, không thuộc dữ liệu đầu ra.

Path ưu tiên Position sau start; Orient cộng góc tangent/direction với rotation riêng, có xét reverse và Ping Pong. Pose key time toàn scene; Animation key time tương đối startTime. Các hệ thống Scale/Rotate/Fade/Pose/Path/Bind chạy cùng nhau. Đổi Duration path không thay geometry; đổi binding giữ hình tại playhead hiện tại, có thể thay chuyển động ở thời điểm khác do hệ tọa độ thay đổi. Xóa Parent detach Child; Child khóa phải mở khóa trước.

API AST mới: motionPath/poseSet/poseTrack/bind. Generator round-trip cả graph/pose/path/attachments; không thực thi code tùy ý. Các schema v1/v2 sau migration được đánh giá bằng cùng evaluator v3. Camera trong kết quả hiện vẫn tĩnh, export tiếp tục dự kiến dùng evaluator này ở Phase 5.

## Các module ở những phase sau

Animation/Keyframe có từ v2, MotionPath/PoseSet/PoseTrack/AttachmentPoint/Binding đã có trong schema v3. Camera animation chưa được đưa vào persisted schema; không tạo nút export hoặc animation camera giả.

- Animation Engine: module thuần, `evaluateSceneAtTime(scene, t)`, không phụ thuộc React/Konva/DOM; tính theo timestamp. Kết quả gồm layer state và output camera. Preview và Export dùng **cùng hàm này**.
- Timeline Engine: dữ liệu track/keyframes và bộ điều khiển playback riêng; `requestAnimationFrame` không cập nhật toàn bộ editor store mỗi frame. Scrub đánh giá trực tiếp tại t.
- Renderer: nhận evaluated scene. Editor thêm viewport, grid, selections, paths; output renderer chỉ vẽ kết quả camera và crop video frame. Editor zoom/pan không thay đổi output camera.
- Export Engine: process Node riêng điều phối từng frame timestamp cố định, bounded queue/backpressure tới FFmpeg, progress/cancel/error, không quay màn hình.
- Project Manager: migration v3+ khi thêm hierarchy/multiple scenes; schema strict không âm thầm bỏ field chưa hỗ trợ. Có thể tách scene ra `scenes/` bằng repository adapter khi Phase 4, giữ cùng model trong memory.
- AST API registry: thêm lệnh animate/path/pose/bind/camera cùng phase tương ứng, validator/generator và round-trip tests đi cùng nhau. Không mở khả năng chạy arbitrary JavaScript.

Z-order hiện tại là thứ tự `scene.layers` từ sau ra trước. Parent–Child sau này là graph riêng qua ID, validate cycle; không dùng vị trí trong layer array làm quan hệ cha con. Kết hợp animation nhiều thuộc tính, pose và binding trước camera/output.

## Persistence Phase 1–3

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

### Phase 4 — Camera và nhiều Scene

Project schema v4 có 1–100 scenes, camera base và hai track position/zoom cho mỗi scene. Migration v1/v2/v3 thêm camera centered mà không ghi disk trước Save. Shared evaluator trả Camera theo cùng timestamp/easing/loop với layers; `cameraProjection` / `cameraFrame` dùng công thức tâm camera và zoom cho output hoặc khung editor. Output renderer không dùng editor view transform và không vẽ guides/handles.

Bổ sung camera rotation: base default 0° cho file v4 trước đó, track thứ ba `rotation` với nội suy góc không normalize về đoạn ngắn (0→360 giữ trọn vòng). Output dùng phép quay nghịch đảo quanh camera center; khung editor và handle zoom xét cùng góc. Ghi Pan theo Layer là thao tác key tại playhead, dùng world-space điểm bám/tâm ảnh; không thêm automatic follow constraint.

Editor transaction cập nhật scene hiện tại, bảo toàn scene khác; CRUD scene có transaction riêng. Duplicate remap graph/poses/group/camera IDs nhưng không offset. History toàn project, scene navigation không thêm Undo; drafts/time riêng theo scene là session state. Global asset delete dọn tham chiếu mọi scene trước commit. DSL camera/cameraAnimate chỉ áp dụng scene hiện tại. Phase 5 sẽ dùng shared evaluator/projection cho deterministic export; chưa có export implementation ở Phase 4.

### Animation Library

Định dạng dữ liệu riêng `studio-animation` v1 trong `shared/animationLibrary.ts`, không thay project schema v3. `animationPresets.ts` cung cấp 14 mẫu. `motionTemplates.ts` chuyển track thành các delta/ratio theo role và instantiate bằng baseline local tại startTime; không đổi binding/Pivot. Path lưu hình học tương đối, Pose lưu asset slots thay ID ảnh project. Apply dùng transaction hiện có, một bước Undo; project lưu kết quả độc lập với Library.

`AnimationLibraryRepository` lưu JSON dùng chung ngoài thư mục projects, kiểm tra schema/ID, giới hạn file, tránh symlink và overwrite. API `/api/animation-library` GET/POST/DELETE chỉ chấp nhận local origin, mutation yêu cầu X-Studio-Request. UI lazy load Library; Preview có project snapshot và renderer riêng, không commit hoặc dùng playback store của project. Import chỉ là dữ liệu JSON, không eval.

### Bổ sung Phase 3 theo yêu cầu người dùng

Group/clipboard/context menu Asset được đưa lên Phase 3, thay cho lịch dự kiến Phase 6 trong bảng ban đầu. `Scene.groups?` lưu ID/tên nhóm; `Layer.groupId?` lưu membership, không thêm Transform/Parent cho thư mục. DSL thêm `scene.group({id,name,layerIds})`. Schema kiểm tra group refs và IDs; nhóm một cấp.

`cloneLayers.ts` là luồng chung Duplicate/Paste, remap IDs/graph, dịch một lần ở root và clone Pose Sets độc lập. `workspaceStore.ts` theo vùng thao tác; `clipboard.ts` giữ snapshot nội bộ theo project, không can thiệp clipboard văn bản. Timeline selection thêm kind animation/path/pose và hiển thị viền. `removeAsset.ts` dọn layers/poses/keys, tháo binding Child sống sót và dùng transaction Undo/Redo. Asset Properties chỉ sửa metadata project; không xóa ảnh gốc.

Các dependency được lấy từ `latest` tại thời điểm triển khai và pin exact version, kèm `package-lock.json`. Ví dụ `4.0.12 → 4.23.1` trong yêu cầu được hiểu là chỉ cập nhật minor/patch trong cùng **major**, không tự nâng major. Production build bundle Monaco và workers local, không cần CDN.

Tests bao phủ serialization/schema/refs/paths, generator/parser round-trip, code không được phép, preserve drafts, Undo/Redo và filesystem, animation interpolation/easing/loop/timeline evaluation/playback/keyframes/Auto Key/migration. Path/hierarchy/pose tests bổ sung ở các phase triển khai tương ứng. Không thêm hoặc nâng dependency ở Phase 2.
