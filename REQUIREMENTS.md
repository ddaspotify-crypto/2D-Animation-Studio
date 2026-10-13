# PROMPT: XÂY DỰNG ỨNG DỤNG 2D ANIMATION STUDIO

Bạn là một Senior Software Engineer chuyên về React, TypeScript, Canvas, animation editor và desktop applications.

Hãy xây dựng một ứng dụng có tên **2D Animation Studio**, chạy trên máy tính Windows, giúp người dùng tạo video hoạt hình 2D từ những hình ảnh có sẵn.

Ứng dụng phải hoạt động như một phần mềm chỉnh sửa animation trực quan, không phải công cụ tạo video bằng cách viết code cho từng cảnh.

**Nguyên tắc quan trọng:**

- Người dùng tự cung cấp ảnh PNG, JPG, JPEG hoặc WebP.
- Ứng dụng không phụ thuộc vào chủ đề nội dung. Có thể làm hoạt hình nhân vật, động vật, phương tiện, bản đồ, phong cảnh, đồ vật hoặc bất kỳ nội dung 2D nào.
- Người dùng kéo ảnh vào Canvas, chỉnh vị trí, kích thước, chuyển động và thời gian bằng chuột.
- Không yêu cầu người dùng viết JavaScript, JSON hoặc CSS để tạo animation.
- Các animation được cấu hình thông qua giao diện và lưu thành dữ liệu.
- Có thể xem trước animation ngay trong editor.
- Có thể xuất video MP4 để tiếp tục chỉnh sửa bằng CapCut hoặc phần mềm khác.
- Ưu tiên ứng dụng đơn giản, ổn định, dễ mở rộng hơn là xây dựng quá nhiều tính năng phức tạp ngay từ đầu.

---

# 1. TECH STACK VÀ KIẾN TRÚC

Sử dụng:

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand để quản lý trạng thái editor
- Konva.js và react-konva để xây dựng Canvas tương tác
- Lucide React cho icon

**Backend local**
- Node.js
- TypeScript
- API local để thao tác với filesystem
- FFmpeg để xuất video

**Desktop**
- Trong giai đoạn phát triển, ứng dụng có thể chạy bằng localhost.
- Thiết kế kiến trúc để có thể đóng gói thành ứng dụng Windows bằng Electron sau này.
- Không cần cloud backend, đăng nhập hoặc database online.
- Không sử dụng MongoDB.
- Lưu project bằng JSON và lưu ảnh trong thư mục project.
- Chỉ sử dụng SQLite nếu thực sự cần thiết về sau.

Tách các thành phần:

1. Editor UI
2. Scene Data Model
3. Animation Engine
4. Canvas Renderer
5. Timeline Engine
6. Asset Manager
7. Project Manager
8. Export Engine

**Yêu cầu đặc biệt:** Preview và Export phải dùng chung logic animation. Không được xây dựng hai hệ thống chuyển động khác nhau khiến video xuất ra không giống preview.

---

# 2. GIAO DIỆN EDITOR

Thiết kế giao diện desktop tương tự các phần mềm animation và video editor.

## 2.1. Top Toolbar

Thanh công cụ trên cùng gồm:

- New Project
- Open Project
- Save Project
- Save As
- Undo
- Redo
- Play
- Pause
- Stop
- Current Time
- FPS
- Resolution
- Export MP4

Mặc định:

- Resolution: 1920 × 1080
- Aspect Ratio: 16:9
- FPS: 30
- Scene Duration: 10 giây

Cho phép thay đổi các thông số này, có thể chọn thông số theo tỉ lệ mobile (màn hình dọc): 9:16 để làm animation cho mobile, camera tự điều chỉnh theo

## 2.2. Asset Library — Panel bên trái

Người dùng có thể:

- Chọn thư mục chứa hình ảnh trên máy.
- Import nhiều hình ảnh cùng lúc.
- Import cả thư mục và thư mục con.
- Hiển thị thumbnail của từng ảnh.
- Tìm kiếm theo tên file.
- Lọc theo thư mục.
- Kéo ảnh từ Asset Library vào Canvas.
- Xem trước ảnh.
- Refresh danh sách ảnh.

Hỗ trợ:

- PNG có nền trong suốt
- JPG/JPEG
- WebP

Khi import, cần quản lý đường dẫn ảnh ổn định để project có thể mở lại sau khi đóng ứng dụng.

Ưu tiên sao chép ảnh vào thư mục `assets` của project, đồng thời tránh tạo file trùng lặp không cần thiết.

## 2.3. Canvas — Khu vực trung tâm

Canvas là nơi người dùng bố trí và tạo animation.

Yêu cầu:

- Hiển thị khung video 16:9 hoặc theo khung mà người dùng chọn thêm: 9:16
- Có vùng workspace bên ngoài khung video.
- Zoom In/Out bằng chuột.
- Pan Canvas.
- Fit Canvas to Screen.
- Hiển thị lưới tùy chọn.
- Hiển thị đường căn chỉnh.
- Snap to Grid.
- Snap to Center.
- Kéo thả ảnh từ Asset Library.
- Chọn một hoặc nhiều đối tượng.
- Di chuyển đối tượng bằng chuột.
- Resize bằng các handle.
- Rotate 2D.
- Duplicate.
- Delete.
- Copy/Paste.
- Group/Ungroup.
- Phím tắt cơ bản.

Các đối tượng nằm ngoài khung video vẫn có thể chỉnh sửa nhưng không xuất hiện trong video cuối cùng, trừ khi di chuyển vào khung hình.

Khi chọn một đối tượng, hiển thị bounding box và transform handles.

## 2.4. Properties — Panel bên phải

Khi chọn đối tượng, hiển thị:

**General**
- Name
- Visible
- Locked
- Opacity

**Transform**
- Position X
- Position Y
- Width
- Height
- Scale X
- Scale Y
- Rotation 2D
- Anchor/Pivot Point

**Hierarchy**
- Parent
- Bind Mode
- Attachment Point

**Animation**
- Animation Type
- Start Time
- End Time
- Duration
- Easing
- Loop
- Keyframes

Các thông số có thể chỉnh bằng input hoặc thao tác trực tiếp trên Canvas.

---

# 3. LAYER MANAGEMENT

Mỗi ảnh kéo vào Canvas tạo thành một Layer.

Xây dựng Layer Panel cho phép:

- Hiển thị toàn bộ Layer trong scene.
- Đổi tên.
- Chọn Layer.
- Kéo thả để thay đổi thứ tự.
- Ẩn/hiện.
- Khóa/mở khóa.
- Duplicate.
- Delete.
- Group/Ungroup.

Các thao tác thứ tự:

- Bring to Front
- Send to Back
- Bring Forward
- Send Backward

**Phân biệt rõ hai khái niệm:**

1. **Z-order:** quyết định đối tượng nằm trước hay sau đối tượng khác.
2. **Parent–Child:** quyết định đối tượng có đi theo chuyển động của đối tượng cha hay không.

Không được đồng nhất Z-order với Parent–Child.

Ví dụ: Một nhân vật có thể đứng phía sau một chiếc bàn nhưng vẫn có một vật thể khác được liên kết với nhân vật đó.

---

# 4. BIND LAYER VÀ ATTACHMENT POINT

Xây dựng hệ thống liên kết Layer để các đối tượng chuyển động cùng nhau.

## 4.1. Parent–Child

Cho phép gán Layer A làm Parent của Layer B.

Ví dụ:

- Nhân vật là Parent.
- Một phụ kiện là Child.
- Khi nhân vật di chuyển, phụ kiện đi theo.

## 4.2. Bind Mode

Hỗ trợ ít nhất hai chế độ:

**Bind Position**
- Child đi theo vị trí Parent.
- Child giữ rotation và scale riêng.

**Bind Transform**
- Child kế thừa position, rotation và scale của Parent.

Cho phép chuyển đổi Bind Mode trong Properties.

## 4.3. Attachment Point

Cho phép tạo các điểm gắn trên Layer:

- Head
- Left Hand
- Right Hand
- Center
- Custom Point

Tên attachment có thể tùy chỉnh.

Người dùng có thể kéo attachment point đến vị trí mong muốn trên ảnh.

Một Child có thể gắn vào attachment point cụ thể của Parent.

Khi Parent di chuyển, xoay hoặc scale, hệ thống phải cập nhật vị trí Child theo đúng Bind Mode.

Không cần xây dựng hệ thống xương hoặc Inverse Kinematics trong phiên bản đầu tiên.

---

# 5. ANIMATION ENGINE

Xây dựng một animation engine tái sử dụng cho mọi scene.

Animation phải được mô tả bằng dữ liệu, không phải JavaScript riêng cho từng đối tượng.

Hỗ trợ:

## 5.1. Move

Di chuyển từ vị trí A đến B.

Thuộc tính:

- Start Position
- End Position
- Start Time
- Duration
- Easing

## 5.2. Scale

Thay đổi kích thước theo thời gian.

Hỗ trợ Scale X và Scale Y độc lập.

## 5.3. Rotate

Xoay đối tượng trong mặt phẳng 2D.

Hỗ trợ quay theo chiều kim đồng hồ và ngược chiều kim đồng hồ.

## 5.4. Fade

Thay đổi Opacity theo thời gian.

Có thể dùng để tạo hiệu ứng xuất hiện hoặc biến mất.

## 5.5. Combined Animation

Một đối tượng có thể đồng thời:

- Di chuyển.
- Scale.
- Rotate.
- Fade.

Ví dụ: Một con chim vừa bay sang phải, vừa thu nhỏ và dần biến mất.

Không được giới hạn mỗi Layer chỉ có một loại animation.

## 5.6. Easing

Hỗ trợ:

- Linear
- Ease In
- Ease Out
- Ease In Out

Thiết kế hệ thống để bổ sung easing khác sau này.

## 5.7. Loop

Hỗ trợ:

- No Loop
- Repeat
- Ping Pong

Animation phải được tính toán dựa trên thời gian hiện tại, không phụ thuộc vào số lần render hoặc tốc độ máy tính.

Khi tua Timeline đến bất kỳ thời điểm nào, Canvas phải hiển thị đúng trạng thái animation tại thời điểm đó.

---

# 6. MOTION PATH EDITOR

Đây là một tính năng quan trọng.

Người dùng có thể tạo đường chuyển động trực tiếp trên Canvas bằng chuột.

## 6.1. Các loại Motion Path

Hỗ trợ:

- Straight Line
- Polyline
- Bézier Curve
- Circle
- Ellipse
- Freehand Path

Đối với Freehand Path, cho phép đơn giản hóa các điểm để tránh quá nhiều dữ liệu.

## 6.2. Chỉnh sửa Path

Người dùng có thể:

- Tạo Motion Path cho một Layer.
- Kéo các điểm điều khiển.
- Thêm điểm.
- Xóa điểm.
- Chỉnh Bézier handles.
- Đảo ngược hướng chuyển động.
- Xem trước đường đi.
- Bật/tắt hiển thị Motion Path.

Motion Path chỉ là công cụ hỗ trợ trong editor, không xuất hiện trong video cuối cùng.

## 6.3. Motion Along Path

Layer phải di chuyển theo Motion Path dựa trên:

- Start Time
- Duration
- Easing
- Direction
- Loop

Có tùy chọn:

- Orient to Path: tự xoay theo hướng di chuyển.
- Keep Rotation: giữ nguyên góc xoay.

Ưu tiên chuyển động theo khoảng cách thực trên đường cong để tránh tốc độ không đều do cách phân bố điểm.

---

# 7. KEYFRAME SYSTEM

Xây dựng hệ thống Keyframe cho các thuộc tính:

- Position X/Y
- Scale X/Y
- Rotation
- Opacity
- Camera Position
- Camera Zoom

Người dùng có thể:

- Thêm Keyframe tại Playhead.
- Di chuyển Keyframe trên Timeline.
- Xóa Keyframe.
- Copy/Paste Keyframe.
- Chỉnh giá trị Keyframe.
- Chỉnh Easing giữa hai Keyframe.

Khi thay đổi một thuộc tính tại thời điểm đang bật Auto Keyframe, editor tự tạo hoặc cập nhật Keyframe tương ứng.

Phải có nút bật/tắt **Auto Keyframe** rõ ràng để tránh tạo Keyframe ngoài ý muốn.

## 7.1. Scale Keyframes — Giả lập chiều sâu

Cho phép Layer vừa di chuyển vừa thay đổi Scale.

Ví dụ:

- 0 giây: Scale 0.3
- 2 giây: Scale 0.6
- 4 giây: Scale 1.0

Nhờ đó có thể tạo cảm giác một đối tượng đang tiến lại gần camera.

Đây là hiệu ứng 2D giả lập chiều sâu, không cần xây dựng hệ thống 3D.

## 7.2. Z-order Keyframes

Cho phép thay đổi thứ tự trước/sau của đối tượng tại các mốc thời gian cụ thể.

Ví dụ: Một đối tượng có thể đi ra phía sau một tòa nhà rồi xuất hiện phía trước.

Z-order là giá trị rời rạc, không nội suy như Position hoặc Scale.

---

# 8. POSE SWITCHING — ĐỔI ẢNH NHÂN VẬT THEO THỜI GIAN

Một nhân vật có thể được tạo từ nhiều ảnh tư thế khác nhau.

Ví dụ:

- character_idle.png
- character_walk.png
- character_run.png
- character_jump.png
- character_action.png

Người dùng có thể tạo một **Sprite/Pose Set**.

Một Pose Set chứa nhiều ảnh đại diện cho cùng một nhân vật hoặc đối tượng.

## 8.1. Pose Timeline

Cho phép đặt các mốc thay đổi Pose.

Ví dụ:

- 0–2 giây: Idle
- 2–4 giây: Walk
- 4–5 giây: Jump
- 5–7 giây: Idle

Pose được thay đổi tức thời tại thời điểm chỉ định, không cần morphing.

## 8.2. Giữ Transform

Khi thay đổi Pose:

- Giữ nguyên vị trí nhân vật.
- Giữ nguyên Scale.
- Giữ nguyên Rotation.
- Giữ nguyên animation đang chạy.
- Hạn chế hiện tượng nhân vật bị nhảy vị trí do kích thước ảnh khác nhau.

Sử dụng pivot/anchor chung hoặc cấu hình riêng cho từng Pose để căn chỉnh.

## 8.3. Kết hợp Pose và Motion Path

Một nhân vật có thể vừa:

- Di chuyển theo Motion Path.
- Đổi Pose.
- Scale theo Keyframe.
- Xoay 2D.
- Mang theo các Child Layer đã Bind.

Các hệ thống này phải hoạt động đồng thời.

---

# 9. TIMELINE EDITOR

Timeline nằm ở phía dưới Canvas.

Đây là khu vực điều khiển thời gian và chuyển động.

## 9.1. Timeline cơ bản

Hiển thị:

- Time Ruler
- Playhead
- Scene Duration
- Layer Tracks
- Animation Tracks
- Keyframes
- Pose Tracks
- Camera Tracks

Người dùng có thể:

- Kéo Playhead.
- Play/Pause/Stop.
- Zoom Timeline.
- Cuộn ngang.
- Chọn Keyframe.
- Kéo Keyframe.
- Chỉnh thời lượng animation.
- Thay đổi Start Time.

## 9.2. Track theo Layer

Mỗi Layer có thể mở rộng để hiển thị:

- Position
- Scale
- Rotation
- Opacity
- Motion Path
- Pose

Có thể thu gọn Track để giao diện không quá rối.

## 9.3. Scrubbing

Khi kéo Playhead, Canvas phải cập nhật ngay trạng thái tương ứng.

Không được bắt buộc chạy animation từ đầu mới xem được một thời điểm cụ thể.

## 9.4. Timeline Performance

Cần tránh render lại toàn bộ giao diện React mỗi frame.

Tách trạng thái Playback tần suất cao khỏi các thành phần UI không cần cập nhật liên tục.

Sử dụng `requestAnimationFrame` để preview và đồng bộ với thời gian animation.

---

# 10. CAMERA SYSTEM

Xây dựng một Camera 2D độc lập với các Layer.

Camera hỗ trợ:

- Position X/Y
- Zoom
- Keyframes
- Easing

## 10.1. Camera Pan

Cho phép camera di chuyển qua một scene lớn.

Ví dụ: Camera di chuyển từ bên trái sang bên phải của một tấm bản đồ.

## 10.2. Camera Zoom

Cho phép zoom vào hoặc zoom ra một khu vực.

Ví dụ: Camera bắt đầu ở toàn cảnh rồi phóng to vào một nhân vật.

## 10.3. Camera Preview

Phải phân biệt:

- Editor View: góc nhìn người dùng đang chỉnh sửa.
- Output Camera: góc nhìn xuất hiện trong video.

Zoom hoặc Pan giao diện editor không được tự động thay đổi Camera của video.

Có chế độ xem trước khung hình cuối cùng của Camera.

---

# 11. SCENE MANAGEMENT

Một Project có thể chứa nhiều Scene.

Mỗi Scene có:

- ID
- Name
- Width
- Height
- FPS
- Duration
- Background
- Layers
- Animations
- Camera
- Timeline

Người dùng có thể:

- Create Scene
- Rename Scene
- Duplicate Scene
- Delete Scene
- Switch Scene

Mỗi Scene có Timeline riêng.

Không cần xây dựng trình dựng phim nhiều track phức tạp như CapCut.

Mục tiêu chính là tạo từng đoạn animation và xuất MP4 để ghép trong phần mềm dựng video khác.

---

# 12. PROJECT SAVE / LOAD

Project phải được lưu trên máy tính.

Đề xuất cấu trúc:

```text
MyAnimationProject/
├── project.json
├── assets/
│   ├── characters/
│   ├── backgrounds/
│   └── objects/
├── scenes/
│   ├── scene-001.json
│   └── scene-002.json
└── exports/
```

Yêu cầu:

- Tạo Project mới.
- Chọn vị trí lưu Project.
- Save.
- Save As.
- Open Project.
- Autosave tùy chọn.
- Cảnh báo khi đóng Project chưa lưu.
- Phục hồi Project từ dữ liệu đã lưu.

Ưu tiên dùng đường dẫn tương đối trong Project.

Không lưu trực tiếp đối tượng Konva hoặc React component vào JSON.

Scene JSON chỉ lưu dữ liệu cần thiết để khôi phục editor và animation.

Dùng TypeScript interfaces rõ ràng cho:

- Project
- Scene
- Layer
- Asset
- Transform
- Animation
- Keyframe
- MotionPath
- PoseSet
- Camera
- AttachmentPoint

Có version cho schema và cơ chế migration cơ bản để sau này cập nhật cấu trúc Project.

---

# 13. EXPORT VIDEO MP4

Đây là tính năng bắt buộc.

Sử dụng FFmpeg để xuất MP4.

## 13.1. Export Settings

Cho phép chọn:

- Scene
- Resolution
- FPS
- Output Path
- Quality

Mặc định:

- 1920 × 1080
- 30 FPS
- H.264
- MP4

## 13.2. Render Logic

Yêu cầu:

- Export không phụ thuộc vào tốc độ Play của editor.
- Render từng frame theo timestamp xác định.
- Không bỏ frame khi máy chạy chậm.
- Không xuất video bằng cách quay màn hình.
- Không xuất hiện UI editor, bounding box, selection handles hoặc Motion Path.
- Giữ đúng thứ tự Layer.
- Giữ đúng Parent–Child Transform.
- Giữ đúng Pose Switching.
- Giữ đúng Camera.
- Giữ đúng Keyframes và Easing.

Thiết kế một hàm đánh giá trạng thái scene tại thời gian `t`, chẳng hạn:

```ts
evaluateSceneAtTime(scene, time)
```

Hàm này phải trả về trạng thái các Layer và Camera tại thời điểm đó.

Preview và Export cùng sử dụng kết quả của animation engine.

## 13.3. Export Progress

Hiển thị:

- Progress %
- Frames Rendered
- Total Frames
- Export Status
- Error Message

Có nút Cancel Export.

Xuất file vào thư mục người dùng chọn.

Không được làm treo toàn bộ giao diện khi export.

Nếu render trong trình duyệt, cần thiết kế phương án tạo frame và chuyển sang tiến trình FFmpeg local an toàn, có kiểm soát bộ nhớ.

---

# 14. UNDO / REDO

Xây dựng Undo/Redo cho các thao tác chỉnh sửa:

- Move Layer
- Resize Layer
- Rotate Layer
- Add/Delete Layer
- Reorder Layer
- Change Properties
- Add/Delete/Move Keyframe
- Edit Motion Path
- Bind/Unbind Layer
- Change Pose

Ưu tiên Command Pattern hoặc history state phù hợp.

Không lưu một history entry mới cho từng pixel khi kéo chuột.

Một thao tác kéo liên tục nên tạo thành một bước Undo.

---

# 15. KEYBOARD SHORTCUTS

Hỗ trợ tối thiểu:

- Ctrl+S: Save
- Ctrl+Z: Undo
- Ctrl+Y hoặc Ctrl+Shift+Z: Redo
- Ctrl+C: Copy
- Ctrl+V: Paste
- Ctrl+D: Duplicate
- Delete: Delete Selected
- Space: Play/Pause
- Ctrl+A: Select All Layers
- Esc: Deselect

Không kích hoạt shortcut chỉnh sửa khi người dùng đang nhập text trong Input hoặc Textarea.

---

# 16. PERFORMANCE

Ứng dụng phải hoạt động tốt với các Scene chứa nhiều hình ảnh.

Yêu cầu:

- Cache ảnh đã tải.
- Không tải lại ảnh ở mỗi frame.
- Không tạo lại Konva nodes không cần thiết.
- Hạn chế React rerender.
- Quản lý object URLs và giải phóng tài nguyên.
- Tối ưu hit testing khi cần.
- Hỗ trợ ảnh độ phân giải lớn ở mức hợp lý.
- Giữ preview mượt khi chạy animation.
- Không khóa UI khi import nhiều ảnh hoặc export video.

Không tối ưu quá mức khi chưa có vấn đề thực tế, nhưng phải thiết kế kiến trúc tránh các lỗi hiệu năng cơ bản.

---

# 17. UX / UI REQUIREMENTS

Thiết kế giao diện:

- Dark Theme.
- Gọn gàng, hiện đại.
- Phù hợp màn hình desktop.
- Các panel có thể resize.
- Có tooltip.
- Có context menu khi click chuột phải.
- Có loading và error states.
- Có empty states khi chưa có Project, Scene hoặc Asset.
- Có xác nhận trước các thao tác xóa quan trọng.

Ưu tiên trải nghiệm giống một animation editor thực sự.

Người dùng không cần biết lập trình để sử dụng ứng dụng.

Tránh tạo UI đẹp nhưng các nút không có chức năng.

**Mỗi chức năng được triển khai phải thực sự hoạt động.**

---

# 18. CÁC GIỚI HẠN PHIÊN BẢN ĐẦU

Chưa cần triển khai:

- AI Image Generation
- AI Video Generation
- Text-to-Animation bằng prompt
- Rigging xương nâng cao
- Inverse Kinematics
- 3D Rendering
- Physics Simulation
- Lip Sync tự động
- Multiplayer
- Cloud Storage
- User Authentication
- Marketplace
- Plugin System

Tập trung vào một phần mềm animation 2D dựa trên ảnh, thao tác trực quan, có thể xuất MP4 ổn định.

Thiết kế để có thể bổ sung các tính năng nâng cao sau này mà không phải viết lại toàn bộ ứng dụng.

---

# 19. IMPLEMENTATION PLAN — BẮT BUỘC LÀM THEO GIAI ĐOẠN

**Không được cố triển khai toàn bộ ứng dụng trong một lần.**

Trước tiên, hãy kiểm tra repository hiện tại, sau đó đề xuất cấu trúc thư mục và kế hoạch thực hiện.

Triển khai theo thứ tự:

## PHASE 1 — Editor Foundation

- Khởi tạo Project.
- React + TypeScript + Vite.
- Tailwind CSS.
- Zustand.
- Konva Canvas.
- Editor Layout.
- Asset Library cơ bản.
- Import ảnh.
- Drag & Drop ảnh vào Canvas.
- Select, Move, Resize, Rotate.
- Properties Panel.
- Layer Panel.
- Z-order.
- Save/Load Project cơ bản.

**Kết quả:** Người dùng có thể mở app, import ảnh, sắp xếp trên Canvas và lưu Project.

## PHASE 2 — Animation Foundation

- Animation Data Model.
- Animation Engine.
- Move.
- Scale.
- Rotate.
- Fade.
- Easing.
- Basic Keyframes.
- Timeline.
- Play/Pause/Stop.
- Scrubbing.

**Kết quả:** Người dùng tạo chuyển động bằng UI và xem trước trên Timeline.

## PHASE 3 — Advanced 2D Motion

- Motion Path.
- Bézier Editor.
- Freehand Path.
- Scale Keyframes.
- Z-order Keyframes.
- Pose Sets.
- Pose Switching.
- Parent–Child.
- Bind Modes.
- Attachment Points.

**Kết quả:** Có thể tạo hoạt hình từ nhiều ảnh, chuyển động phức hợp mà không cần viết code.

## PHASE 4 — Camera and Scene

- Camera Pan.
- Camera Zoom.
- Camera Keyframes.
- Multiple Scenes.
- Scene Management.
- Undo/Redo hoàn chỉnh hơn.

**Kết quả:** Người dùng tạo được nhiều cảnh và điều khiển khung hình video.

## PHASE 5 — Video Export

- Local Export Engine.
- FFmpeg Integration.
- Deterministic Frame Rendering.
- MP4 Export.
- Export Progress.
- Cancel Export.
- Error Handling.

**Kết quả:** Xuất MP4 giống với animation đã xem trước.

## PHASE 6 — Polish and Packaging

- Performance Optimization.
- Keyboard Shortcuts.
- Context Menus.
- Autosave.
- Error Recovery.
- Electron Packaging.
- Windows Installer nếu phù hợp.
- Documentation.

---

# 20. CODING RULES

Tuân thủ:

1. Sử dụng TypeScript strict mode.
2. Không dùng `any` nếu có thể định nghĩa kiểu rõ ràng.
3. Tách UI và business logic.
4. Không hardcode animation vào React components.
5. Không sử dụng `eval` hoặc chạy JavaScript tùy ý từ dữ liệu Project.
6. Không xây dựng animation bằng cách thay đổi trực tiếp DOM ngoài React/Konva.
7. Dùng các module và custom hooks có trách nhiệm rõ ràng.
8. Tránh component quá lớn.
9. Viết code dễ đọc và dễ bảo trì.
10. Không thêm dependency không cần thiết.
11. Có xử lý lỗi filesystem và asset không tồn tại.
12. Validate dữ liệu Project khi load.
13. Không ghi đè file người dùng ngoài ý muốn.
14. Các thao tác filesystem phải được giới hạn và kiểm soát trong local backend.
15. Không để tiến trình export hoặc import chặn giao diện.

Viết unit tests cho các phần logic quan trọng, đặc biệt:

- Animation interpolation
- Easing
- Timeline evaluation
- Parent–Child transforms
- Motion Path sampling
- Keyframe evaluation
- Pose switching
- Project serialization

---

# 21. ACCEPTANCE CRITERIA

Ứng dụng được xem là đạt mục tiêu khi người dùng có thể thực hiện quy trình sau mà không viết code:

1. Tạo một Project mới.
2. Import thư mục chứa hình ảnh.
3. Kéo ảnh nền vào Canvas.
4. Kéo ảnh nhân vật hoặc đối tượng vào Canvas.
5. Chỉnh kích thước và vị trí.
6. Tạo Motion Path cho đối tượng.
7. Thiết lập thời gian chuyển động.
8. Thêm Scale Keyframes để tạo cảm giác tiến gần hoặc đi xa.
9. Đổi Pose tại các thời điểm khác nhau.
10. Bind một đối tượng vào nhân vật để chuyển động cùng.
11. Thêm Camera Pan hoặc Zoom.
12. Xem trước bằng Timeline.
13. Lưu Project.
14. Đóng và mở lại Project mà không mất dữ liệu.
15. Xuất Scene thành MP4 đúng với Preview.

Không cần người dùng viết JavaScript, chỉnh JSON thủ công hoặc sử dụng terminal để tạo từng animation.

---

# 22. HƯỚNG DẪN CÁCH BẮT ĐẦU

Bây giờ hãy bắt đầu công việc theo trình tự:

**Bước 1:** Kiểm tra repository và môi trường hiện tại.

**Bước 2:** Đề xuất cấu trúc thư mục phù hợp với kiến trúc trên.

**Bước 3:** Trình bày kế hoạch triển khai PHASE 1, liệt kê các thành phần và luồng dữ liệu quan trọng.

**Bước 4:** Bắt đầu code PHASE 1. Không triển khai các Phase khác khi chưa cần thiết.

**Bước 5:** Sau khi hoàn thành PHASE 1, chạy kiểm tra TypeScript, build, tests liên quan và sửa lỗi.

**Bước 6:** Tóm tắt những gì đã hoàn thành, những gì chưa hoàn thành, cách chạy ứng dụng và những vấn đề còn tồn tại.

**Bước 7:** Dừng lại để người dùng kiểm tra PHASE 1 trước khi chuyển sang PHASE 2.

Không tuyên bố một tính năng đã hoàn thành nếu chưa triển khai hoặc chưa kiểm tra được.

Nếu có nhiều giải pháp kỹ thuật, hãy ưu tiên giải pháp đơn giản, ổn định và phù hợp với ứng dụng animation 2D chạy local trên Windows.

Nếu có dùng thư viện hãy dùng thư viện version mới nhất và khóa version lại, nếu update chỉ update ở phía major (ex: 4.0.12 -> 4.23.1) không update ở phía version lớn (Minor)

**Bắt đầu với PHASE 1 ngay bây giờ.**

