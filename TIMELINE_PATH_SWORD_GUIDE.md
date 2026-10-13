# Timeline, điểm bám đường và tay cầm kiếm

## Thao tác trực tiếp trên Timeline

- Click track/key để chọn layer và animation tương ứng.
- Double-click track/key để cuộn thẳng tới Properties của track đó.
- Click phải tên track, thanh animation hoặc key: **Mở Properties**, **Xóa animation/track**; với key có **Xóa keyframe đang chọn**.
- Áp dụng cho Move, Scale, Rotate, Fade, Z-order, Motion Path và Pose. Layer khóa không được xóa. Xóa có thể Undo; xóa pose key cuối cùng sẽ bỏ track đổi pose.

## Điểm bám Motion Path

Ảnh của bạn có một khung lớn chứa khoảng trắng; Pivot X/Y=0 khiến góc trên trái của khung ảnh bám đường. Đường không tự nhận ra khuôn mặt/chân nhân vật.

Chọn layer → Motion Path → **Điểm bám đường trên ảnh**:

1. Chọn **Tâm ảnh**, **Giữa chân ảnh**, hoặc nhập X/Y từ 0 đến 1.
2. Với ảnh nhiều khoảng trắng, kéo **vòng xanh Điểm bám đường** trên Canvas vào ngực hoặc chân thật của nhân vật. Kéo mép vòng; mốc tròn nhỏ ở giữa vẫn để chỉnh đường đi.
3. Điểm vừa chọn sẽ bám vào đường. Đổi điểm bám giữ nguyên đường và dịch ảnh để điểm mới nằm trên đường; các Child sẽ đi theo Parent. Sau đó chỉnh đường xuống mặt đất/vị trí mong muốn.
4. **Theo Pivot** trả về cách cũ. Điểm bám độc lập với Pivot xoay: có thể dùng chân để đi đường, nhưng dùng khớp vai để xoay tay.

Code lưu `followPoint: {x: 0.5, y: 0.8}` trong `scene.motionPath(...)`. Tọa độ dựa trên toàn khung ảnh, không tự cắt khoảng trắng. Thử scrub khi xoay/scale/lật/đổi pose để kiểm tra. Các project cũ chưa có followPoint giữ cách dùng Pivot.

Moho cung cấp **Set Origin** để chọn điểm gốc của layer trên hình; điểm này điều khiển tâm xoay/scale. Xem tài liệu chính thức: https://www.lostmarble.com/moho/manual/layer_tools.html và https://www.lostmarble.com/manual/13.5/Moho%20Users%20Manual.pdf (Set Origin / Follow Path). Studio cho chọn riêng điểm bám đường để không phải thay Pivot của rig đang có.

## Kiếm nhấp nhô khi nhân vật đi ngang

Trong đoạn code bạn gửi: `right.png` và `left.png` bind Position vào body; **weapon.png chỉ bind Position vào left.png**, không bind đồng thời vào hai tay, cũng chưa tham chiếu Attachment. Điểm Right Hand khai báo trên weapon không tự tạo liên kết.

Để nhấp nhô cả tay trái và kiếm, giữ các binding hiện tại, thêm đoạn sau **cuối code trước khi Apply**. Nếu tay đã có Position track, sửa track đó thay vì thêm track trùng:

```js
scene.animate("fd1cf0dc-ca64-4998-91ee-304399fbc62e", {
  id: "left-hand-bob",
  property: "position",
  startTime: 0,
  duration: 0.8,
  easing: "easeInOut",
  loop: "repeat",
  keyframes: [
    { id: "bob-down", time: 0, x: 54.1326461719928, y: 439.28620763786483 },
    { id: "bob-up", time: 0.4, x: 54.1326461719928, y: 427.28620763786483 },
    { id: "bob-back", time: 0.8, x: 54.1326461719928, y: 439.28620763786483 }
  ]
});
```

Đây là chuyển động lên 12 đơn vị trong tọa độ con rồi xuống, chu kỳ 0.8 giây. Body tiếp tục đi theo đường; tay thêm chuyển động riêng; kiếm tự đi theo tay, giữ nguyên khoảng cách cầm. Trong UI có thể chọn left → + Move → đặt 3 keys và Loop Repeat; dùng giá trị Position nền/code của Child, không chép tọa độ thế giới đang hiện trong Properties vào Code của Child. Properties + Auto Key tự đổi về tọa độ con.

Muốn nhấp nhô cả hai tay, tạo track Position tương tự cho right với X=592.8514441839932, Y nền=442.39987410721466 và Y lên=430.39987410721466.

Muốn **vung kiếm theo góc tay**:

1. Đặt Pivot của left tại vai thật; kiểm tra/chỉnh lại vị trí ảnh khi đổi Pivot.
2. Thêm Attachment lên **left**, kéo điểm tới bàn tay thật.
3. Chọn weapon → Parent left → **Bind Transform**, chọn điểm bàn tay vừa tạo. Việc đổi binding bằng UI giữ hình tại playhead hiện tại; review lại cả Timeline.
4. Tạo Rotate trên **left** với góc nhẹ (ví dụ -6 → +6 → -6), Loop Repeat. Kiếm đi theo cả vị trí và góc tay.

Nếu cần kiếm xoay riêng quanh chuôi, đặt Pivot weapon tại chuôi và thêm Rotate của weapon. Xoay kiếm quanh góc ảnh sẽ làm nó quét vòng rất lớn. Chỉ một Parent cho mỗi layer; kiếm cầm bằng hai tay cần chỉnh tay còn lại theo hoặc dùng rig/IK ở phạm vi sau.

## Kiểm tra

Build và logic tests kiểm tra điểm bám sau xoay/scale/lật, Code round-trip và chuyển động body → tay → kiếm. Browser test kiểm tra menu/xóa/Undo và Save/Open. Thay đổi local, không commit/push.
