BỔ SUNG TÍNH NĂNG: VISUAL CANVAS ↔ JAVASCRIPT CODE EDITOR

Hãy bổ sung vào yêu cầu của 2D Animation Studio một hệ thống chỉnh sửa hai chiều giữa Canvas và JavaScript Code Editor.

1. Mục tiêu

Người dùng có thể tạo Scene bằng cách kéo thả hình ảnh, chỉnh vị trí, kích thước, rotation và animation trực tiếp trên Canvas.

Ứng dụng tự động sinh JavaScript tương ứng với Scene hiện tại.

Ngược lại, người dùng có thể chỉnh sửa JavaScript trong Code Editor và bấm nút Apply Code để cập nhật Canvas.

Không cần reload trang.

2. Giao diện

Bổ sung một Code Editor Panel có thể mở/đóng, resize và đặt cạnh hoặc bên dưới Canvas.

Sử dụng Monaco Editor để hỗ trợ JavaScript syntax highlighting, autocomplete và báo lỗi cú pháp.

Có các nút:

Show/Hide Code

Generate Code

Apply Code

Reset Changes

Format Code

Hiển thị trạng thái khi code có thay đổi chưa áp dụng.

3. Canvas to Code

Khi người dùng:

Thêm hoặc xóa hình ảnh

Kéo thả hình ảnh

Resize

Rotate

Đổi thứ tự Layer

Thêm Animation

Chỉnh Keyframe

Tạo Motion Path

Đổi Pose

Chỉnh Camera

Ứng dụng cập nhật Scene Data Model và tự động sinh JavaScript từ dữ liệu này.

JavaScript phải dễ đọc, có cấu trúc rõ ràng và sử dụng các API được định nghĩa sẵn của Animation Engine.

Không tạo một JavaScript file mới cho mỗi lần kéo chuột.

Nếu người dùng đang chỉnh sửa code chưa Apply, không được tự động ghi đè phần code đó. Hiển thị cảnh báo hoặc trạng thái cần đồng bộ.

4. Code to Canvas

Khi người dùng sửa JavaScript và bấm Apply Code:

Kiểm tra cú pháp và tính hợp lệ.

Chuyển code thành dữ liệu Scene theo schema của ứng dụng.

Validate dữ liệu.

Cập nhật Zustand Store.

Render lại Canvas.

Cập nhật Layer Panel, Properties và Timeline.

Ghi nhận một bước Undo/Redo.

Nếu code không hợp lệ, hiển thị lỗi và giữ nguyên Scene trước đó.

5. JavaScript API

Thiết kế một API khai báo đơn giản, ví dụ:

const scene = createScene({
  width: 1920,
  height: 1080,
  duration: 10,
  fps: 30,
});

scene.addImage({
  id: "ship-1",
  asset: "assets/ship.png",
  x: 200,
  y: 150,
  scale: 1.2,
  rotation: 0,
});

scene.animate("ship-1", {
  property: "position",
  keyframes: [
    { time: 0, x: 200, y: 150 },
    { time: 5, x: 900, y: 150 },
  ],
  easing: "easeInOut",
});

Khi Apply, Canvas phải hiển thị đúng ảnh và animation được khai báo.

6. Kiến trúc bắt buộc

Scene JSON là Single Source of Truth.

JavaScript là một dạng biểu diễn có thể chỉnh sửa của Scene, không phải nguồn dữ liệu độc lập.

Sử dụng luồng:

Canvas → Scene JSON → JavaScript Generator

JavaScript Editor → Parser/Validator → Scene JSON → Canvas

Không dùng eval(), new Function() hoặc thực thi JavaScript tùy ý từ Code Editor.

Ở phiên bản đầu, chỉ hỗ trợ một tập con JavaScript có cấu trúc khai báo được định nghĩa trước. Sử dụng AST parser như Babel Parser hoặc Acorn để phân tích code và chuyển đổi thành Scene Data Model.

Không hỗ trợ arbitrary JavaScript, vòng lặp hoặc các lệnh tùy ý trong Code Editor ở phiên bản đầu.

Nếu người dùng viết code ngoài cú pháp được hỗ trợ, phải hiển thị thông báo rõ ràng thay vì thực thi.

7. Đồng bộ Animation

Code Editor phải hỗ trợ biểu diễn và chỉnh sửa:

Layer Transform

Z-order

Position Keyframes

Scale Keyframes

Rotation Keyframes

Opacity Keyframes

Motion Path

Pose Switching

Parent–Child Binding

Camera Animation

Khi Apply Code, Timeline và Preview phải cập nhật tương ứng.

8. Acceptance Criteria

Kéo ảnh vào Canvas → JavaScript được tạo.

Kéo ảnh sang phải → giá trị x trong JavaScript thay đổi.

Thay đổi x từ 200 thành 500 trong code → bấm Apply → ảnh di chuyển đến x=500.

Thay đổi scale từ 1 thành 2 → bấm Apply → ảnh phóng to.

Thêm position keyframes bằng code → bấm Apply → Timeline xuất hiện keyframes và Preview chạy đúng.

Code sai cú pháp → hiển thị lỗi, Canvas không bị mất dữ liệu.

Undo sau Apply → trở về trạng thái trước khi Apply.

9. Thứ tự triển khai

Bổ sung Code Editor Panel và đồng bộ Transform cơ bản vào cuối PHASE 1.

Mở rộng đồng bộ Animation và Keyframes trong PHASE 2.

Mở rộng Motion Path, Pose Switching và Camera ở các Phase tương ứng.

Không làm ảnh hưởng các chức năng đã hoàn thành, nếu có dùng thư viện hãy dùng thư viện version mới nhất và khóa version lại, nếu update chỉ update ở phía major (ex: 4.0.12 -> 4.23.1) không update ở phía version lớn (Minor)