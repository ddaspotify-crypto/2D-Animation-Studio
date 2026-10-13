# Hướng dẫn sử dụng 2D Animation Studio — Phase 1 và Phase 2

Tài liệu dành cho bản **0.2.0** trong thư mục `C:\Apps\Canvas Product`. Các bước dưới đây mô tả chức năng đã có trong ứng dụng hiện tại. Bạn có thể tạo animation bằng chuột và các ô nhập; Code Editor là cách chỉnh sửa bổ sung, không bắt buộc.

## Mục lục

1. [Khởi động ứng dụng](#1-khởi-động-ứng-dụng)
2. [Nhận biết các vùng giao diện](#2-nhận-biết-các-vùng-giao-diện)
3. [Phase 1 — Tạo, lưu và mở project](#3-phase-1--tạo-lưu-và-mở-project)
4. [Phase 1 — Thư viện ảnh](#4-phase-1--thư-viện-ảnh)
5. [Phase 1 — Thao tác trên Canvas](#5-phase-1--thao-tác-trên-canvas)
6. [Phase 1 — Layers và thứ tự trước/sau](#6-phase-1--layers-và-thứ-tự-trướcsau)
7. [Phase 1 — Properties và thông số scene](#7-phase-1--properties-và-thông-số-scene)
8. [Phase 1 — Code Editor và Undo/Redo](#8-phase-1--code-editor-và-undoredo)
9. [Phase 2 — Timeline và xem trước](#9-phase-2--timeline-và-xem-trước)
10. [Phase 2 — Move, Scale, Rotate, Fade](#10-phase-2--move-scale-rotate-fade)
11. [Phase 2 — Thời gian, easing và loop](#11-phase-2--thời-gian-easing-và-loop)
12. [Phase 2 — Chỉnh sửa keyframe](#12-phase-2--chỉnh-sửa-keyframe)
13. [Phase 2 — Auto Keyframe](#13-phase-2--auto-keyframe)
14. [Phase 2 — Animation trong Code Editor](#14-phase-2--animation-trong-code-editor)
15. [Bài thực hành hoàn chỉnh](#15-bài-thực-hành-hoàn-chỉnh)
16. [Phím tắt](#16-phím-tắt)
17. [Xử lý tình huống thường gặp](#17-xử-lý-tình-huống-thường-gặp)
18. [Giới hạn của bản hiện tại](#18-giới-hạn-của-bản-hiện-tại)

## 1. Khởi động ứng dụng

### 1.1. Nếu ứng dụng đang chạy

Mở [http://127.0.0.1:4310](http://127.0.0.1:4310) để sử dụng bản production. Nếu giao diện vẫn ghi **PHASE 1**, lưu project đang mở rồi tải lại trang. Bản hiện tại ghi **ANIMATION FOUNDATION · PHASE 2** trên thanh trên cùng.

### 1.2. Chạy lại bản production

Mở PowerShell tại thư mục dự án và chạy:

```powershell
cd 'C:\Apps\Canvas Product'
npm start
```

Giữ terminal đang chạy và mở `http://127.0.0.1:4310`. Nếu chưa có bản build hoặc vừa thay đổi mã nguồn, chạy `npm run build` trước `npm start`.

### 1.3. Chạy chế độ phát triển

```powershell
cd 'C:\Apps\Canvas Product'
npm ci
npm run dev
```

Mở `http://127.0.0.1:5173`. Lệnh dev khởi động cả giao diện và backend local. `npm ci` cần dùng khi cài mới hoặc khôi phục các thư viện; không phải chạy lại mỗi lần mở ứng dụng.

### 1.4. Nếu máy báo `shim integrity check failed`

Máy này có runtime Node 22.23.2 tại đường dẫn dưới đây. Có thể chạy trực tiếp:

```powershell
cd 'C:\Apps\Canvas Product'
$env:PATH = 'C:\Users\17520\AppData\Local\Author Software\nvm\installs\v22.23.2;' + $env:PATH
& 'C:\Users\17520\AppData\Local\Author Software\nvm\installs\v22.23.2\npm.cmd' start
```

Đổi `start` thành `run dev` nếu muốn dùng chế độ phát triển, hoặc `run build` để tạo bản build. Dừng server bằng Ctrl+C trong terminal. Các cổng 4310 và 5173 phải còn trống; không chạy thêm một server trùng cổng.

## 2. Nhận biết các vùng giao diện

| Vùng | Vị trí | Dùng để làm gì |
| --- | --- | --- |
| Top Toolbar | Trên cùng | New, Open, Save, Save As, Undo/Redo, playback, tên project, bật/tắt Code |
| Asset Library | Bên trái, phía trên | Import, tìm kiếm, lọc và xem trước ảnh |
| Layers | Bên trái, phía dưới | Chọn, sắp xếp, ẩn, khóa, nhân bản và xóa Layer |
| Canvas | Trung tâm | Bố trí hình ảnh và thao tác trực tiếp bằng chuột |
| Properties | Bên phải | Thông số scene, Layer, Transform và Animation |
| Scene Code | Dưới hoặc cạnh Canvas | Sửa biểu diễn JavaScript của scene rồi Apply |
| Timeline | Dưới khu vực Canvas/Code | Điều khiển thời gian và chỉnh các track/keyframes |
| Status Bar | Dưới cùng | Trạng thái import/lưu/mở, số assets và thay đổi chưa lưu |

Di chuột lên các icon để đọc tooltip. Cuộn bên trong Properties để xem các mục ở dưới. Có thể kéo góc/mép resize của các panel có dấu resize để thay đổi kích thước; không phải mọi đường phân cách đều là thanh kéo.

**Properties bên phải** mặc định rộng 320px. Kéo **mép trái** sang trái để mở rộng tới gần giữa màn hình (tối đa khoảng 52% vùng editor), kéo sang phải để thu gọn, tối thiểu 260px. Double-click mép kéo để về mặc định. Có thể dùng Tab để focus mép này, phím trái/phải để đổi 10px, Shift + trái/phải để đổi 50px, Home để về mặc định. Chiều rộng này là bố cục trong phiên, không được lưu vào project.

Các thuật ngữ animation có biểu tượng **?** bên cạnh: hover hoặc dùng Tab để focus biểu tượng để xem giải thích tiếng Việt, cách dùng và ví dụ. Nhấn Esc để đóng. Trợ giúp này có ở Timeline/Time/Thời lượng, Play/Pause/Stop, Move/Scale/Rotate/Fade, Track, Auto Keyframe, Start/Duration/End, Easing/Loop, Keyframe/Key values và thời gian animation trong Code Editor. Easing/Loop trong dropdown cũng kèm mô tả tiếng Việt. Click dấu ? không bật Auto Key hoặc thay đổi dữ liệu scene.

Các khái niệm cần biết:

- **Project:** toàn bộ dữ liệu đang làm và các ảnh đã import.
- **Scene:** một cảnh với kích thước, FPS, thời lượng, Layer và animation. Hiện mỗi project có một scene.
- **Asset:** ảnh trong thư viện. Import ảnh chưa tự tạo Layer trên Canvas.
- **Layer:** một lần đặt ảnh vào Canvas. Cùng một asset có thể tạo nhiều Layer.
- **Track:** chuyển động của một nhóm thuộc tính, ví dụ Position hoặc Opacity.
- **Keyframe:** một mốc thời gian có giá trị cụ thể; ứng dụng tính giá trị giữa các mốc.
- **Playhead:** thời điểm đang xem trên Timeline.

## 3. Phase 1 — Tạo, lưu và mở project

### 3.1. New Project

1. Bấm **New** trên toolbar.
2. Nếu project hoặc code có thay đổi chưa lưu, ứng dụng hỏi trước khi bỏ thay đổi.
3. Project mới có Canvas 1920 × 1080, FPS 30, thời lượng 10 giây, nền trắng.

New xóa dữ liệu đang mở khỏi editor; không xóa các thư mục project đã lưu trên ổ đĩa.

### 3.2. Đổi tên project

1. Bấm vào tên project ở phía phải toolbar, ban đầu là **Untitled Project**.
2. Nhập tên mới.
3. Nhấn Enter hoặc bấm ra ngoài ô nhập.

Tên hiển thị của project và tên thư mục lưu là hai giá trị khác nhau. Đổi tên trên toolbar không tự đổi tên thư mục đã lưu.

### 3.3. Save lần đầu

1. Bấm **Save** hoặc Ctrl+S.
2. Dialog hiển thị thư mục lưu trữ local, mặc định là `C:\Apps\Canvas Product\projects` nếu khởi động từ thư mục dự án.
3. Nhập tên thư mục project, ví dụ `Bai Tap 01`.
4. Bấm **Save** trong dialog và chờ trạng thái **Đã lưu**.

Dùng tên chứa chữ, số, dấu cách, `_` hoặc `-`, tối đa 80 ký tự. Không dùng dấu `/`, `\`, `:` hoặc tên dành riêng của Windows như `CON`.

Cấu trúc lưu:

```text
projects/
  Bai Tap 01/
    project.json
    assets/
      <checksum>.png
      <checksum>.jpg
      <checksum>.webp
```

`project.json` chứa scene, Layers và animation. Ảnh được chép vào `assets`, đặt tên theo nội dung để tránh lưu trùng. Khi sao chép project sang nơi khác, sao chép **cả thư mục project**, không chỉ file JSON.

### 3.4. Chọn vị trí lưu khác

1. Trong dialog Save/Open, bấm **Chọn vị trí khác…**.
2. Hộp thoại Windows mở ra; chọn **thư mục chứa các project**.
3. Với Save, nhập tên thư mục con mới rồi lưu.
4. Với Open, chọn một project từ danh sách trong thư mục vừa chọn.

Ví dụ: project nằm ở `D:\Animation\Bai Tap 01\project.json` thì chọn root `D:\Animation`, sau đó chọn `Bai Tap 01` trong dialog Open.

Root được chọn có hiệu lực trong phiên server hiện tại. Sau khi khởi động lại server, chọn lại root nếu project không xuất hiện. Có thể cấu hình root cố định trước khi khởi động:

```powershell
$env:STUDIO_PROJECTS_DIR = 'D:\Animation'
npm start
```

Đổi root khiến lần lưu tiếp theo cần chọn lại tên thư mục; dữ liệu đang mở vẫn ở editor.

### 3.5. Save các lần sau

Bấm Save hoặc Ctrl+S để cập nhật project tại vị trí đã chọn. Kiểm tra Status Bar để biết thao tác thành công hay thất bại. Các thay đổi trên Canvas và animation được lưu; **code chưa Apply không được lưu**.

### 3.6. Save As

1. Bấm **Save As**.
2. Chọn root nếu cần, nhập tên thư mục mới.
3. Bấm Save.

Save As cần tên thư mục chưa tồn tại. Bản cũ được giữ lại; những lần Save sau sẽ cập nhật bản mới.

### 3.7. Open Project

1. Bấm **Open**.
2. Chọn đúng root nếu danh sách không có project của bạn.
3. Chọn tên project và bấm Open.
4. Nếu đang có thay đổi chưa lưu, xử lý câu hỏi xác nhận trước khi chuyển project.

Layer, Transform, thứ tự trước/sau, visibility/lock và animation được khôi phục. Playhead trở về 0; Auto Keyframe trở về OFF. Nếu thiếu hoặc hỏng ảnh, Open báo lỗi và giữ project đang mở.

Project Phase 1 được chuyển sang định dạng Phase 2 khi Open, nhưng file cũ chỉ được cập nhật khi Save. Dùng Save As nếu muốn giữ một bản tương thích với app Phase 1.

## 4. Phase 1 — Thư viện ảnh

### 4.1. Import một hoặc nhiều ảnh

1. Bấm **Import ảnh** trong Asset Library.
2. Chọn một hay nhiều file PNG, JPG/JPEG hoặc WebP.
3. Chờ import hoàn tất; thumbnail xuất hiện trong thư viện.

PNG trong suốt giữ nguyên nền trong suốt. Import lại cùng nội dung ảnh không tạo asset trùng. Nếu cùng tên file nhưng nội dung khác, chúng vẫn là hai ảnh khác nhau.

### 4.2. Import thư mục và thư mục con

1. Bấm icon **thư mục** cạnh Import ảnh.
2. Chọn thư mục chứa ảnh, xác nhận chọn thư mục nếu trình duyệt yêu cầu.
3. Các ảnh hỗ trợ trong thư mục và thư mục con được import.

Danh sách thư mục dùng để lọc xuất hiện khi assets có thông tin thư mục. Import không theo dõi thay đổi của thư mục nguồn theo thời gian; sửa ảnh ngoài ứng dụng cần import lại để đưa nội dung mới vào project.

### 4.3. Tìm kiếm và lọc

- Gõ một phần tên ảnh vào **Tìm tên ảnh…**; tìm kiếm không phân biệt chữ hoa/thường.
- Dùng dropdown thư mục để chọn thư mục cụ thể.
- Chọn **Tất cả thư mục** và xóa ô tìm kiếm để thấy toàn bộ assets.

Lọc thư mục chọn đúng thư mục đó; ảnh trong thư mục con có mục lọc riêng.

### 4.4. Xem trước ảnh

Di chuột lên thumbnail rồi bấm icon **↗** ở góc ảnh. Bấm **Đóng** hoặc vùng nền bên ngoài để quay lại editor.

### 4.5. Thêm ảnh vào Canvas

Có ba cách:

1. Kéo thumbnail từ thư viện vào vị trí mong muốn trên Canvas.
2. Double-click thumbnail để thêm ảnh theo vị trí mặc định gần khu vực trung tâm; có thể kéo lại sau đó.
3. Kéo file ảnh từ Windows Explorer vào Canvas: ảnh được import và tạo Layer.

Mỗi lần thêm tạo một Layer mới, dù dùng cùng asset. Ảnh lớn có thể được tự thu nhỏ khi thêm để vừa khu vực làm việc; xem Scale X/Y để biết hệ số hiện tại.

## 5. Phase 1 — Thao tác trên Canvas

### 5.1. Chọn và bỏ chọn

- Click vào ảnh để chọn; bounding box và handles xuất hiện.
- Click hàng tương ứng trong Layers nếu ảnh bị che, ẩn hoặc khó click.
- Shift + click để thêm/bỏ một Layer khỏi nhóm được chọn.
- Click vùng trống hoặc nhấn Esc để bỏ chọn.

Properties sửa **Layer đầu tiên được chọn** khi có nhiều Layer. Kéo một ảnh di chuyển ảnh đó; không có thao tác kéo di chuyển cả nhóm tự động. Transformer có thể resize/rotate nhiều Layer được chọn.

### 5.2. Di chuyển

Chọn công cụ **mũi tên**, kéo phần thân ảnh tới vị trí mới rồi thả chuột. Hoặc nhập Position X/Y trong Properties. Một lần kéo hoàn chỉnh tạo một bước Undo.

Nếu Layer đã có animation, xem mục Auto Keyframe trước khi chỉnh vị trí: khi Auto Key OFF, track có thể đưa ảnh về vị trí được tính tại playhead.

### 5.3. Resize

Chọn ảnh rồi kéo handle ở góc/cạnh bounding box. Handle góc mặc định giữ tỉ lệ; có thể chỉnh Scale X/Y trong Properties để co giãn độc lập. Resize bằng handle chủ yếu thay đổi Scale; Width/Height gốc vẫn được giữ.

### 5.4. Rotate

Kéo handle xoay nằm ngoài bounding box, hoặc nhập **Rotation (°)**. Góc dương quay theo chiều kim đồng hồ; góc âm quay ngược. Với animation nhiều vòng, dùng Key rotation để nhập các giá trị như 360 hoặc -720.

### 5.5. Zoom

Cuộn chuột trên Canvas để zoom quanh vị trí con trỏ. Dùng nút **+ / −** ở thanh Canvas nếu muốn zoom bằng nút. Phần trăm bên cạnh thể hiện mức zoom editor.

Zoom này chỉ thay đổi cách bạn nhìn workspace, không thay đổi Scale của ảnh hoặc dữ liệu video.

### 5.6. Pan

1. Bấm công cụ **Hand**.
2. Kéo workspace để thay đổi vùng đang xem.
3. Bấm lại công cụ mũi tên để chọn và chỉnh ảnh.

Khi Hand đang bật, click/kéo có thể được dùng cho pan thay vì chỉnh Layer.

### 5.7. Fit to Screen

Bấm icon **Fit to Screen** để căn khung scene vào vùng Canvas đang có. Thao tác này chỉ chỉnh góc nhìn editor.

### 5.8. Grid

Bấm icon **lưới** để hiện/ẩn lưới tham khảo. Bản hiện tại chưa có Snap to Grid/Center hoặc đường căn chỉnh tự động.

### 5.9. Vùng ngoài khung

Khung có nền scene là vùng bố cục video; workspace bên ngoài vẫn có thể chứa và chỉnh Layer. Preview editor hiện chưa có chế độ camera/output crop. Chưa có xuất MP4 để kiểm tra khung hình cuối cùng.

## 6. Phase 1 — Layers và thứ tự trước/sau

### 6.1. Chọn và đổi tên Layer

Click hàng trong Layers để chọn. Đổi **Name** trong Properties, nhấn Enter hoặc click ra ngoài. Đổi tên Layer không đổi tên file ảnh nguồn.

### 6.2. Thay đổi thứ tự bằng kéo thả

Kéo hàng Layer và thả lên hàng khác. Hàng trên cùng trong Layers nằm **phía trước**; hàng dưới cùng nằm **phía sau**.

### 6.3. Bốn nút Z-order

Chọn một Layer rồi dùng các icon phía trên danh sách:

| Tooltip | Tác dụng |
| --- | --- |
| Bring to Front | Đưa lên trước tất cả Layer |
| Bring Forward | Đưa lên trước một bậc |
| Send Backward | Đưa xuống sau một bậc |
| Send to Back | Đưa xuống sau tất cả Layer |

Các nút thứ tự làm việc với Layer đầu tiên được chọn. Z-order chỉ điều khiển che trước/sau; chưa có Parent–Child hoặc binding.

### 6.4. Ẩn/hiện

Bấm icon **mắt** trên hàng Layer hoặc bật/tắt **Visible** trong Properties. Layer ẩn vẫn còn trong project và giữ animation; có thể chọn từ danh sách để hiện lại.

### 6.5. Khóa/mở khóa

Bấm icon **khóa** hoặc checkbox **Locked**. Layer khóa không chỉnh Transform hoặc keyframe qua các điều khiển UI, không bị xóa bằng Delete. Chọn Layer trong danh sách rồi mở khóa để tiếp tục chỉnh.

Khóa bảo vệ thao tác chỉnh sửa UI; nó không dừng animation của Layer khi Play. Apply Code là thay thế dữ liệu scene, không nên xem Locked là một cơ chế bảo vệ khỏi thay đổi code.

### 6.6. Duplicate

Chọn Layer rồi bấm icon Duplicate hoặc Ctrl+D. Bản sao có tên thêm `copy`, dịch vị trí một chút để dễ nhận biết và có ID riêng. Nếu Layer có animation, các track/keyframes cũng được sao chép với ID mới; Position keys được dịch cùng vị trí bản sao.

Có thể duplicate nhiều Layer đang chọn. Bản sao giữ cả trạng thái Locked của bản gốc.

### 6.7. Delete

Chọn Layer rồi bấm icon thùng rác hoặc Delete khi focus ở khu vực chỉnh Layer. Xóa Layer cũng xóa các track animation của nó; asset vẫn ở thư viện. Undo có thể khôi phục thao tác trong history hiện tại.

Nếu focus nằm trong Timeline và một keyframe đã được chọn, Delete có thể xóa keyframe thay vì Layer. Dùng nút có tooltip cụ thể khi muốn tránh nhầm đối tượng xóa.

## 7. Phase 1 — Properties và thông số scene

Nhập số rồi nhấn Enter hoặc click ra ngoài để xác nhận. Giá trị không hợp lệ/quá giới hạn sẽ bị từ chối. Các ô Transform có thể bị khóa trong khi playback đang chạy; Pause trước khi chỉnh.

### 7.1. Scene

| Ô | Cách dùng |
| --- | --- |
| Tỉ lệ khung hình | 16:9 = 1920×1080; 9:16 = 1080×1920 |
| Scene Width / Height | Nhập kích thước khác để dùng khung custom |
| FPS | Số frame mỗi giây, 1–120; Timeline kéo key sẽ snap theo FPS |
| Duration (s) | Tổng thời lượng scene, mặc định 10s |
| Background | Chọn màu nền scene |

Chọn mục Custom không tự đặt một kích thước mới; dùng Width/Height để nhập kích thước. Đổi tỉ lệ scene không tự bố trí lại Layer. Đổi FPS không đổi thời gian của các key đã có.

Nếu giảm Duration xuống trước thời điểm kết thúc của track đang có, ứng dụng báo lỗi và giữ duration cũ. Rút ngắn/dịch các track trước, hoặc tăng Duration để có chỗ cho chuyển động dài hơn.

### 7.2. General của Layer

| Ô | Ý nghĩa |
| --- | --- |
| Name | Tên hiển thị của Layer |
| Visible | Có hiển thị ảnh trên Canvas hay không |
| Locked | Khóa thao tác chỉnh sửa UI |
| Opacity | 0 = trong suốt hoàn toàn; 1 = rõ hoàn toàn; 0.5 = 50% |

Opacity có thể đang được điều khiển bởi track Fade. Khi đó giá trị hiển thị là giá trị tại playhead; sửa chuyển động bằng Key opacity hoặc Auto Key.

### 7.3. Transform của Layer

| Ô | Ý nghĩa |
| --- | --- |
| Position X | Tọa độ ngang của pivot; tăng X đi sang phải |
| Position Y | Tọa độ dọc của pivot; tăng Y đi xuống |
| Width / Height | Kích thước ảnh trước khi nhân Scale |
| Scale X / Y | Hệ số co giãn ngang/dọc, chỉ hỗ trợ giá trị dương |
| Rotation (°) | Góc xoay quanh pivot |
| Pivot X / Y (0–1) | Vị trí pivot theo tỉ lệ chiều rộng/chiều cao |

Ví dụ Width=200, Height=100, Scale X=2, Scale Y=2: kích thước trước khi xoay là 400×200. Scale X=2 và Scale Y=1 làm ảnh rộng gấp đôi nhưng giữ chiều cao.

Pivot (0,0) ở góc trên trái; (0.5,0.5) ở tâm; (1,1) ở góc dưới phải. Position X/Y là tọa độ của điểm pivot. Thay pivot mà giữ X/Y có thể làm hình ảnh dịch trên Canvas, vì điểm được neo đã thay đổi.

Phase 2 hỗ trợ keyframe Position, Scale, Rotation và Opacity. Width/Height/Pivot chưa được animate.

## 8. Phase 1 — Code Editor và Undo/Redo

### 8.1. Mở, đóng và đổi vị trí panel

- Bấm **Code** trên toolbar để hiện/ẩn Scene Code.
- Bấm icon **X** trong panel để ẩn.
- Bấm icon đặt cạnh/dưới Canvas trong thanh Code để chuyển vị trí.
- Dùng góc resize của panel để điều chỉnh kích thước.

Hide Code không bỏ draft. Mở lại panel sẽ giữ nội dung chưa Apply trong phiên editor hiện tại.

### 8.2. Canvas → Code

Khi thêm, xóa, di chuyển, resize, rotate, đổi Z-order hoặc chỉnh animation, ứng dụng cập nhật scene và sinh code tương ứng. Sau khi thả chuột, xem các giá trị mới trong `scene.addImage` hoặc `scene.animate`.

Code sạch sẽ tự cập nhật; code đang có thay đổi chưa Apply được giữ nguyên và báo cần đồng bộ nếu scene đổi.

### 8.3. Các nút của Code Editor

| Nút/tooltip | Cách dùng |
| --- | --- |
| Generate | Sinh lại code từ scene hiện tại; hỏi trước nếu sẽ bỏ draft |
| Apply Code | Kiểm tra code và cập nhật Canvas/Properties/Timeline |
| Reset Changes | Bỏ draft và lấy code từ scene hiện tại; cần xác nhận khi có draft |
| Format Code | Sắp xếp khoảng trắng/thụt lề; không tự Apply |
| Hide Code | Đóng panel, giữ draft trong phiên |

Badge **Đã đồng bộ** nghĩa là code khớp scene. **Chưa Apply** nghĩa là bạn đã sửa code. **Canvas đã đổi · Cần đồng bộ** nghĩa là scene đã thay đổi sau khi sửa draft.

### 8.4. Sửa Transform bằng code

1. Import và thêm ảnh vào Canvas trước.
2. Tìm `scene.addImage({...})` đúng Layer, nhận biết bằng `name` và `id`.
3. Đổi `"x": 200` thành `"x": 500`.
4. Bấm Apply Code; nếu không có Position track ghi đè tại playhead, ảnh sẽ ở X=500.

Tương tự, chỉnh y, rotation, opacity, visible, locked hoặc kích thước. Khi code có `scale`, dùng nó để scale cả hai chiều. Nếu dùng `scaleX`/`scaleY` thì chỉnh riêng; không khai báo đồng thời `scale` và `scaleX`/`scaleY` trong cùng ảnh.

Không đổi `asset` thành đường dẫn tùy ý. Dùng đường dẫn đã sinh cho một ảnh được import trong project. Có thể chép nguyên một block addImage để thêm Layer khác, nhưng phải đổi `id` để không trùng.

### 8.5. Z-order trong code

Mặc định, thứ tự các lệnh `scene.addImage` đi **từ sau ra trước**. Lệnh phía sau được vẽ phía trước lệnh trước đó. Có thể thêm `zIndex` khác nhau vào các block; giá trị lớn hơn nằm phía trước.

Sau Apply, generator có thể thể hiện kết quả bằng thứ tự các block, không giữ nguyên trường `zIndex` bạn đã gõ. Hai Layer có zIndex trùng sẽ bị từ chối.

### 8.6. Code sai và xung đột

Sai dấu ngoặc, asset/layer không tồn tại, ID trùng hoặc giá trị không hợp lệ sẽ báo lỗi; scene cũ vẫn giữ nguyên. Nếu draft cũ và Canvas đã đổi, Apply hỏi xác nhận trước khi dùng draft thay thế scene.

Không hỗ trợ vòng lặp, import, hàm tự viết, `fetch`, `alert`, các biểu thức tính toán hoặc JavaScript tùy ý. Hãy nhập giá trị literal, ví dụ `500` thay vì `200 + 300`.

### 8.7. Undo/Redo

- Toolbar Undo hoặc Ctrl+Z: quay lại thao tác scene trước đó.
- Toolbar Redo hoặc Ctrl+Y/Ctrl+Shift+Z: làm lại thao tác vừa Undo.
- Một lần Apply Code hợp lệ có thay đổi dữ liệu là một bước Undo.
- Một lần kéo Layer/key/track được ghi vào history khi thả chuột.

History giữ tối đa 50 bước và không được lưu vào project. New/Open reset history. Trong Monaco, Ctrl+Z sửa draft code; dùng Undo trên toolbar để Undo dữ liệu scene đã Apply. Undo scene không tự xóa một draft chưa Apply.

## 9. Phase 2 — Timeline và xem trước

### 9.1. Cấu trúc Timeline

Timeline dưới Canvas/Code có thước giây, playhead, hàng Layer và các track con. Track hiện có: **Move / Position, Scale, Rotate, Fade / Opacity**. Hình thoi là keyframe; thanh màu là khoảng thời gian một chu kỳ animation.

Bấm hàng Layer/mũi tên bên cạnh để chọn và thu gọn/mở các track. Bấm tên track để chọn track đó; các thông số xuất hiện ở phần Animation trong Properties.

### 9.2. Play / Pause / Stop

| Điều khiển | Kết quả |
| --- | --- |
| Play | Chạy từ thời điểm hiện tại; nếu đang ở cuối scene thì chạy lại từ đầu |
| Pause | Dừng chạy và giữ nguyên playhead |
| Stop | Dừng và đưa playhead về 0 |
| Space | Đổi Play/Pause khi không nhập text |

Các nút trên toolbar và Timeline điều khiển cùng một playback. Chỉnh dữ liệu scene sẽ tạm dừng playback để bạn sửa; playhead được giữ. Play dừng khi hết Scene Duration, kể cả track có loop.

### 9.3. Scrub bằng chuột hoặc nhập thời gian

- Click một điểm trên thước thời gian để xem tại điểm đó.
- Giữ chuột và kéo trên thước để di chuyển playhead liên tục.
- Nhập giây trong ô **Time**, ví dụ `1.5`, để xem tại 1.5s.

Scrub sẽ Pause và cập nhật Canvas ngay; không cần chạy từ đầu. Scrub không tạo history hoặc làm project trở thành chưa lưu.

### 9.4. Zoom và cuộn Timeline

Bấm **+ / −** ở bên phải thanh Timeline để thay đổi độ rộng mỗi giây, biểu thị bằng `px/s`. Zoom lớn giúp kéo key chính xác hơn. Dùng thanh cuộn ngang để xem đoạn phía sau; cuộn dọc khi có nhiều Layers/tracks. Zoom Timeline không đổi thời lượng animation.

**Tăng giới hạn thời gian Timeline:** nhập vào ô **Thời lượng (s)** ngay trên thanh Timeline, chẳng hạn `30`, `60` hoặc `120`, rồi nhấn Enter/click ra ngoài. Thước Timeline và giới hạn Play/Time sẽ tăng theo giá trị đó; kéo thanh cuộn ngang hoặc Zoom Out để thấy phần thời gian mới. Giá trị này cũng đồng bộ với Properties → Scene → Duration (s), Code và dữ liệu project được lưu.

Ô **Time** chọn thời điểm đang xem; ô **Thời lượng (s)** đặt tổng độ dài scene. Tăng thời lượng scene không tự kéo dài hoặc đổi các keyframes của track đang có. Muốn chuyển động chạy lâu hơn, tăng Animation Duration hoặc kéo handle track; muốn lặp nhiều lần, dùng Repeat/Ping Pong. Thời lượng nhập tại Timeline từ 0.01 tới 86400 giây. Giảm xuống trước End Time của track hiện có sẽ báo lỗi và giữ dữ liệu cũ.

### 9.5. Nút + Animation

Chọn một Layer, bấm **+ Animation** trên Timeline để cuộn Properties tới phần Animation. Nút này giúp tìm các điều khiển; để tạo track, bấm tiếp một loại Move/Scale/Rotate/Fade.

## 10. Phase 2 — Move, Scale, Rotate, Fade

Trước khi tạo track, chọn Layer và đưa playhead tới thời điểm muốn bắt đầu. Track mới có hai keyframes, mặc định kéo dài 2 giây hoặc ngắn hơn nếu scene sắp kết thúc. Nếu playhead ở cuối scene, đưa về trước cuối rồi mới tạo.

Mỗi Layer có **một track cho mỗi loại**, nhưng có thể có cả bốn loại chạy đồng thời. Bấm lại một loại đã có sẽ chọn track đó, không tạo track thứ hai. Muốn nhiều đoạn chuyển động, thêm keyframes vào track hiện tại.

### 10.1. Move / Position

1. Chọn Layer → + Animation → **+ Move / Position**.
2. Track ban đầu đi sang phải 300 đơn vị, giữ nguyên Y.
3. Chọn key đầu trong dropdown **Keyframe** hoặc click hình thoi đầu.
4. Đặt **Key x / Key y** cho điểm bắt đầu.
5. Chọn key cuối, nhập điểm kết thúc.
6. Play hoặc scrub để kiểm tra.

Ví dụ: từ (200,300) tới (900,300) trong 4s. Đặt Animation Duration=4, key đầu x=200/y=300, key cuối x=900/y=300. Các ô Position X/Y phía trên Properties cho biết vị trí đang được tính tại playhead.

### 10.2. Scale

1. Bấm **+ Scale**.
2. Chọn key đầu và cuối để sửa **Key scaleX / Key scaleY**.
3. Play để thấy ảnh phóng to/thu nhỏ.

Mặc định key cuối bằng 1.5 lần scale lúc tạo. Ví dụ cả hai scale từ 0.3 tới 1 tạo cảm giác tiến gần; scaleX=2/scaleY=1 tạo co giãn ngang. Scale phải lớn hơn 0; chưa có scale âm/lật ảnh.

### 10.3. Rotate

1. Bấm **+ Rotate**.
2. Sửa **Key rotation** ở từng key.
3. Chọn pivot phù hợp ở phần Transform trước nếu cần xoay quanh tâm.

Mặc định tăng 90°. Từ 0 tới 360 quay một vòng cùng chiều kim đồng hồ; 0 tới -360 quay một vòng ngược; 0 tới 720 quay hai vòng. Các góc được nội suy liên tục, không tự chọn đường xoay ngắn nhất.

### 10.4. Fade / Opacity

1. Bấm **+ Fade / Opacity**.
2. Sửa **Key opacity** trong khoảng 0–1.

Mặc định từ opacity hiện tại tới 0. Để xuất hiện dần: key đầu=0, key cuối=1. Để mờ dần: key đầu=1, key cuối=0. Ảnh opacity=0 khó chọn trên Canvas; chọn từ Layers để tiếp tục chỉnh.

### 10.5. Kết hợp nhiều loại

Thêm Move, Scale, Rotate và Fade trên cùng Layer, đặt start/duration phù hợp cho từng track. Chúng độc lập nên có thể bắt đầu cùng lúc hoặc lệch nhau. Ví dụ Layer vừa đi từ trái sang phải, thu nhỏ, xoay và biến mất.

## 11. Phase 2 — Thời gian, easing và loop

### 11.1. Start Time, Duration và End Time

Chọn track trong Timeline hoặc dropdown **Track đang sửa**:

- **Start Time (s):** lúc animation bắt đầu trong scene.
- **Animation Duration (s):** độ dài một chu kỳ animation.
- **End Time:** hiển thị Start Time + Duration, không có ô nhập riêng.

Ví dụ Start=1, Duration=4 thì chu kỳ đầu chạy từ 1s tới 5s. Tổng này phải nằm trong Scene Duration. Tăng thời lượng scene trước nếu muốn kéo dài hơn.

Trên Timeline, kéo **thân thanh** để đổi Start Time. Kéo **handle nhỏ ở cạnh phải** để đổi Duration. Đổi Duration cũng đổi thời gian các key theo tỉ lệ; nếu tăng duration từ 2 lên 4, key ở giữa từ 1s tương đối thành 2s tương đối.

### 11.2. Easing

| Giá trị | Diễn biến giữa hai key |
| --- | --- |
| linear | Tốc độ đều |
| easeIn | Chậm lúc đầu, nhanh dần |
| easeOut | Nhanh lúc đầu, chậm dần |
| easeInOut | Chậm đầu/cuối, nhanh ở giữa |

**Easing mặc định** áp dụng cho track. Một key có thể chọn **Easing đến key tiếp theo** riêng để ghi đè mặc định cho đoạn đó. Key cuối không có đoạn sau nên easing của nó không tạo khác biệt cho đoạn trước.

### 11.3. Loop

- **No Loop:** chạy một lần, sau đó giữ giá trị cuối.
- **Repeat:** tới cuối chu kỳ thì quay về đầu và chạy lại; có thể thấy bước nhảy nếu đầu/cuối khác nhau.
- **Ping Pong:** chạy đến cuối rồi chạy ngược về đầu, lặp lại.

Loop tiếp tục sau End Time của chu kỳ đầu, nhưng chỉ trong thời lượng scene. Trước Start Time, Layer dùng Transform nền. Sau Start, trước key đầu hoặc sau key cuối trong một chu kỳ, giá trị được giữ ở key gần nhất tương ứng.

## 12. Phase 2 — Chỉnh sửa keyframe

### 12.1. Chọn key

Click hình thoi trên Timeline hoặc chọn mốc trong dropdown **Keyframe** ở Properties. Các ô Key values luôn sửa key đang chọn, không nhất thiết là key nằm tại playhead.

### 12.2. Thêm key tại playhead

1. Chọn track cần thêm key.
2. Đưa playhead tới thời điểm mong muốn.
3. Bấm **+ Key**.
4. Key lấy giá trị đang preview tại thời điểm đó; chọn key và chỉnh lại giá trị nếu cần.

Nếu đã có key đúng thời điểm, thao tác cập nhật key thay vì tạo key trùng. Với No Loop, thêm key sau phạm vi track có thể kéo dài track tới thời điểm đó. Với loop, key được đặt ở thời gian tương ứng trong chu kỳ.

### 12.3. Đổi thời gian của key

Kéo hình thoi sang trái/phải; thời gian snap theo FPS, và dữ liệu chỉ được xác nhận khi thả. Hoặc nhập **Key Time (s)** trong Properties. Ô này dùng thời gian toàn scene, nên nếu track bắt đầu ở 1s, key tương đối 2s hiển thị thành 3s.

Không cho hai key trong cùng track có cùng thời gian. Nếu thao tác gây trùng, ứng dụng báo lỗi và giữ dữ liệu cũ. Kéo key bị giới hạn trong khoảng một chu kỳ của track.

### 12.4. Sửa giá trị

Chọn key rồi sửa Key x/y, Key scaleX/scaleY, Key rotation hoặc Key opacity tùy track. Nhấn Enter/click ra ngoài để xác nhận. Scrub qua hai bên mốc để kiểm tra nội suy.

### 12.5. Copy/Paste

1. Chọn key nguồn rồi bấm **Copy Keyframe**.
2. Đưa playhead tới thời điểm đích.
3. Bấm **Paste Keyframe at Playhead**.

Paste chép giá trị và easing của key, đặt tại thời điểm đích với ID phù hợp; nó không giữ nguyên thời gian nguồn. Loại thuộc tính nguồn được giữ: key Position vẫn đi vào track Position, dù dropdown đang chọn loại khác. Có thể paste sang Layer khác đang chọn nếu Layer đích không khóa và phần điều khiển paste đang có trong Properties.

Nếu đích đã có key tại thời điểm đó, nó được cập nhật. Clipboard này nằm trong editor; không phải nội dung văn bản của clipboard Windows. Dùng các nút Copy/Paste keyframe; Ctrl+C/V chưa được gán cho thao tác này.

### 12.6. Xóa key hoặc track

- **Delete Keyframe** trong Properties xóa key đang chọn.
- Icon Delete Timeline Keyframe trên Timeline xóa key được chọn rõ ràng tại Timeline.
- Xóa key cuối sẽ xóa track; Layer trở lại giá trị nền của thuộc tính đó.
- **Delete Animation Track** xóa cả track, không xóa Layer hay ảnh trong thư viện.

Undo có thể khôi phục các thao tác này trong history hiện tại. Key/track thuộc Layer khóa cần mở khóa trước.

## 13. Phase 2 — Auto Keyframe

### 13.1. Bật/tắt

Checkbox **Auto Keyframe** trong Properties và **Auto Key** trên Timeline điều khiển cùng một trạng thái. Mặc định OFF khi New/Open. Nhìn trạng thái này trước khi chỉnh Transform.

### 13.2. Khi ON

1. Đưa playhead tới mốc muốn chỉnh, ví dụ 2s.
2. Kéo ảnh/resize/rotate trên Canvas, hoặc nhập Position/Scale/Rotation/Opacity ở Properties.
3. Ứng dụng tạo hoặc cập nhật key cho thuộc tính thay đổi tại mốc đó.

Nếu tạo track mới tại một thời điểm sau 0, ứng dụng thêm key nền ở 0 để giữ trạng thái bắt đầu. Một thao tác có thể thay đổi nhiều thuộc tính nhưng vẫn được ghi thành một transaction Undo.

Width/Height/Pivot không có Auto Key trong Phase 2. Khi đang xem Repeat/Ping Pong, chỉnh sửa được ghi vào thời gian local của chu kỳ, không tạo một track riêng cho lần lặp đó.

### 13.3. Khi OFF

Chỉnh Transform nền, không tự tạo key. Nếu thuộc tính đã có track đang điều khiển preview, bạn có thể thấy ảnh quay lại giá trị animation sau khi thả chuột. Để đổi chuyển động, chọn và sửa Key values, hoặc bật Auto Key rồi chỉnh tại playhead.

### 13.4. Ví dụ tạo chuyển động bằng chuột

1. Chọn Layer, bật Auto Key.
2. Playhead=0, đặt Position X=200/Y=300.
3. Playhead=2, kéo ảnh sang vị trí khác, hoặc đặt X=800/Y=300.
4. Tắt Auto Key và bấm Play.

Nếu giá trị ở 0 đã đúng và không thay đổi, có thể chưa có key mới ở thao tác đầu. Khi tạo key ở 2s, hệ thống sẽ seed trạng thái nền ở 0 cho track mới.

## 14. Phase 2 — Animation trong Code Editor

Không cần dùng phần này nếu bạn làm hoàn toàn bằng UI. Code vẫn được sinh để bạn xem scene hoặc chỉnh các giá trị chính xác.

### 14.1. Xác định Layer ID

Tìm `id` trong block `scene.addImage` của ảnh cần animate. Sao chép đúng chuỗi ID đó vào đối số đầu tiên của `scene.animate`. Tên Layer và ID là hai giá trị khác nhau.

### 14.2. Ví dụ Move

Thêm block dưới đây sau các lệnh addImage, thay `ID_LAYER_CUA_BAN` bằng ID thật:

```javascript
scene.animate("ID_LAYER_CUA_BAN", {
  property: "position",
  startTime: 1,
  duration: 4,
  easing: "easeInOut",
  loop: "none",
  keyframes: [
    { time: 0, x: 200, y: 300 },
    { time: 4, x: 900, y: 300 }
  ]
});
```

Bấm Apply Code. Track xuất hiện trên Timeline; scrub 1s thấy X=200, 3s thấy X=550, 5s thấy X=900. Trước 1s, ảnh dùng Transform nền của addImage.

**Quan trọng:** `time` trong code là thời gian tương đối với startTime. `Key Time (s)` trên UI và thước Timeline là thời gian toàn scene. Block trên có các key ở 1s và 5s trên Timeline, không phải 0s và 4s.

### 14.3. Các dạng keyframes khác

| property | Giá trị bắt buộc trong mỗi key |
| --- | --- |
| position | time, x, y |
| scale | time, scaleX, scaleY |
| rotation | time, rotation |
| opacity | time, opacity |

Ví dụ Scale và Fade trên cùng Layer:

```javascript
scene.animate("ID_LAYER_CUA_BAN", {
  property: "scale",
  duration: 4,
  keyframes: [
    { time: 0, scaleX: 0.5, scaleY: 0.5 },
    { time: 4, scaleX: 1, scaleY: 1 }
  ]
});

scene.animate("ID_LAYER_CUA_BAN", {
  property: "opacity",
  duration: 4,
  keyframes: [
    { time: 0, opacity: 1 },
    { time: 4, opacity: 0 }
  ]
});
```

Không thêm một animate cùng property nếu Layer đã có track đó; sửa block hiện có hoặc thêm keyframes vào nó. Trong code sinh tự động có các ID của track/key; giữ ID khi sửa để dễ theo dõi. Nếu viết block mới, ID có thể bỏ để ứng dụng sinh; startTime mặc định 0, easing=linear, loop=none, duration lấy từ key cuối nếu không khai báo.

### 14.4. Apply, preview và lưu

Apply cập nhật scene tại playhead hiện tại và tạm dừng playback; không cần reload. Kiểm tra lại Time nếu muốn xem đầu animation. Undo trên toolbar khôi phục trạng thái trước Apply, bao gồm cả các track.

Code sai giữ nguyên scene. Code chưa Apply không được ghi vào project, dù bấm Save. Apply hoặc sao chép draft ra nơi khác nếu cần giữ nội dung đó trước khi New/Open/đóng trang.

## 15. Bài thực hành hoàn chỉnh

Mục tiêu: một ảnh đi sang phải, phóng lớn và mờ dần trong 4 giây, rồi lưu để mở lại.

1. New, đổi tên project thành `Bai Tap Animation`.
2. Scene 1920×1080, FPS=30, Duration=10.
3. Import một PNG; kéo vào Canvas.
4. Đổi Name thành `Doi tuong`. Đặt Width=200, Height=200, Scale X/Y=1, Position=(200,300), Pivot=(0,0), Opacity=1.
5. Đưa playhead về 0. Chọn + Animation → + Move / Position.
6. Đặt Animation Duration=4. Chọn key đầu: x=200/y=300; key cuối: x=900/y=300. Easing=linear, Loop=none.
7. Thêm + Scale. Duration=4. Key đầu scaleX/Y=1; key cuối scaleX/Y=2.
8. Thêm + Fade / Opacity. Duration=4. Key đầu opacity=1; key cuối opacity=0.
9. Nhập Time=2. Kết quả dự kiến: Position X=550, Scale X/Y=1.5, Opacity=0.5. Cả ba track chạy đồng thời.
10. Stop rồi Play để xem toàn bộ; sau 4s ảnh đã mờ hết, nhưng scene vẫn chạy tới 10s.
11. Chọn Move track, thử easeInOut rồi scrub 1s/3s để thấy tốc độ khác linear; tại 2s vẫn ở giữa.
12. Save với tên thư mục mới. New, sau đó Open project vừa lưu. Scrub về 2s để kiểm tra dữ liệu đã khôi phục.

Nếu muốn di chuyển xong rồi Fade mới bắt đầu, đặt Start Time của Fade=4, Duration=2; kiểm tra tổng không vượt Scene Duration.

## 16. Phím tắt

| Phím | Chức năng hiện có |
| --- | --- |
| Ctrl+S | Save trạng thái scene; không Apply draft |
| Ctrl+Z | Undo scene khi ngoài vùng nhập |
| Ctrl+Y hoặc Ctrl+Shift+Z | Redo scene khi ngoài vùng nhập |
| Ctrl+D | Duplicate các Layers được chọn |
| Delete | Xóa Layers được chọn, hoặc keyframe khi focus Timeline và có key được chọn |
| Esc | Bỏ chọn Layers |
| Space | Play/Pause khi ngoài vùng nhập |
| Shift + click | Thêm/bỏ Layer khỏi selection |

Các shortcut chỉnh sửa scene không chạy khi nhập trong Input/Textarea/Select hoặc Monaco. Ctrl+S vẫn Save scene. Trong Monaco, Ctrl+Z dùng cho draft text. Ctrl+C/V của Windows vẫn dùng để chép/dán văn bản; chưa có shortcut Copy/Paste Layers hay keyframes. Ctrl+A chọn toàn bộ Layers chưa được triển khai.

## 17. Xử lý tình huống thường gặp

| Tình huống | Cách xử lý |
| --- | --- |
| Không thấy Timeline | Lưu project rồi reload; kiểm tra toolbar ghi PHASE 2 |
| Không thấy Animation trong Properties | Chọn Layer và bấm + Animation trên Timeline, hoặc cuộn Properties xuống |
| Kéo ảnh mà nó quay về vị trí cũ | Thuộc tính đang có track; bật Auto Key hoặc sửa Key x/y |
| Sửa Key values nhưng tại playhead chưa thấy khác | Key đang sửa có thể ở thời điểm khác; scrub tới key đó hoặc qua đoạn liên quan |
| Không kéo được ảnh | Tắt Hand, mở khóa Layer, kiểm tra Visible; chọn từ Layers nếu bị che |
| Ảnh mất sau khi Play | Kiểm tra Fade opacity=0, Visible và Position có ra ngoài vùng đang xem không |
| Không thêm được animation | Playhead có thể ở cuối scene; đưa về trước cuối, mở khóa Layer |
| Track không dài thêm được | Tăng Scene Duration hoặc giảm Start Time trước |
| Giảm Scene Duration bị lỗi | Một track đang kết thúc sau duration mới; chỉnh các track trước |
| Kéo key bị từ chối | Thời gian trùng key khác hoặc ngoài track; nhập Key Time khác |
| Repeat có bước nhảy | Điểm đầu/cuối khác nhau; dùng Ping Pong hoặc chỉnh key để vòng lặp liền mạch |
| Chỉnh easing track không thấy tác dụng | Key nguồn đang có easing riêng; chọn Theo track ở Easing đến key tiếp theo |
| Layer trong suốt không click được | Chọn hàng trong Layers rồi chỉnh Visible/Opacity hoặc key Fade |
| Code không cập nhật theo Canvas | Có draft chưa Apply; chọn Apply hoặc Generate/Reset sau khi quyết định giữ bản nào |
| Apply báo asset không tồn tại | Dùng path của asset đã import, lấy từ block addImage được sinh |
| Apply báo Layer/ID không tồn tại hoặc trùng | Dùng ID đúng và duy nhất, không dùng Name thay cho ID |
| Save As báo tên đã tồn tại | Nhập tên thư mục mới; dùng Save nếu cập nhật project đang mở |
| Không thấy project khi Open | Chọn đúng root chứa thư mục project, nhất là sau khi restart server |
| Open báo thiếu ảnh | Khôi phục file assets, hoặc bản sao đầy đủ của thư mục project |
| Không kết nối backend local | Kiểm tra terminal server và mở đúng URL 4310/5173 |
| Import bị từ chối | Kiểm tra định dạng thật, kích thước và tên đuôi file; không chỉ đổi đuôi để giả định dạng |

Các kiểm tra tự động đã bao phủ workflow chính. Hộp thoại Windows, ảnh thực tế của bạn và project lớn vẫn nên kiểm tra trên máy đang sử dụng.

## 18. Giới hạn của bản hiện tại

- Một project có một scene. Chưa có camera animation hoặc quản lý nhiều scenes.
- Chưa có Motion Path/Bézier/Freehand, Pose Switching, Parent–Child, Bind hoặc Attachment Points.
- Có Scale keyframes cơ bản; chưa có Z-order keyframes. Z-order hiện là thứ tự tĩnh của Layers.
- Chưa xuất MP4, chưa có FFmpeg export, installer Windows hoặc autosave.
- Chưa có Group/Ungroup, Copy/Paste Layers, Snap/Grid/Center, alignment guides hoặc context menu.
- Mỗi Layer có tối đa một track cho mỗi property; dùng nhiều keyframes thay cho nhiều clip chồng nhau cùng property.
- History 50 bước trong phiên; không phục hồi history/draft sau khi đóng hoặc Open project khác.
- Giới hạn hiện tại: 1000 assets/project, 500 Layers/scene, 2000 tracks/scene, 2000 keyframes/track. Ảnh tối đa 64 MB, 16384 px mỗi cạnh và 64 megapixel; upload lưu project tối đa 256 MB. Không nên coi các mức tối đa là cam kết hiệu năng trên mọi máy.
- Code Editor chỉ hỗ trợ API khai báo createScene/addImage/animate cùng literal/array; không phải môi trường chạy JavaScript tùy ý.

Các mục này thuộc các phase tiếp theo hoặc phần hoàn thiện. Đối chiếu kiến trúc tại [ARCHITECTURE.md](ARCHITECTURE.md), cách chạy/test kỹ thuật tại [README.md](README.md), kết quả kiểm tra tại [PHASE2_TEST_REPORT.md](PHASE2_TEST_REPORT.md).
