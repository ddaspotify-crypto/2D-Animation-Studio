import type { AnimationProperty } from '../../shared/model.js';

export const animationHelp = {
  animation: 'Animation là chuyển động theo thời gian. Chọn Layer, thêm Move/Scale/Rotate/Fade, sửa hai mốc đầu/cuối rồi bấm Play. Một Layer có thể chạy cả bốn loại cùng lúc.',
  track: 'Track là một hàng điều khiển một loại chuyển động của Layer. Chọn track cần sửa; mỗi Layer có một track cho mỗi loại. Thêm nhiều keyframe để tạo nhiều đoạn chuyển động.',
  autoKey: 'ON: đưa playhead tới thời điểm muốn sửa, rồi kéo ảnh hoặc chỉnh Position/Scale/Rotation/Opacity để tự tạo/cập nhật keyframe. OFF: chỉ sửa giá trị nền; track đang có vẫn quyết định hình ảnh khi xem trước. Tắt sau khi dùng để tránh thêm key ngoài ý muốn.',
  sceneDuration: 'Tổng thời lượng của scene và Timeline. Nhập 30, 60 hoặc 120 rồi nhấn Enter để kéo dài Timeline. Giá trị này không tự kéo dài chuyển động: hãy chỉnh Animation Duration hoặc dùng Loop. Không giảm xuống trước thời điểm kết thúc của track đang có.',
  playhead: 'Playhead là thời điểm đang xem. Nhập số giây hoặc kéo trên thước Timeline để xem ngay trạng thái tại đó; thao tác này tạm dừng playback. Time không phải tổng thời lượng scene.',
  start: 'Thời điểm chuyển động bắt đầu trong scene. Ví dụ Start Time = 2 thì chuyển động bắt đầu ở giây thứ 2. Kéo thân thanh animation trên Timeline cũng đổi được thời điểm này.',
  duration: 'Độ dài một chu kỳ chuyển động. Start = 2 và Duration = 4 nghĩa là chu kỳ đầu chạy từ giây 2 đến 6. Đổi Duration sẽ giãn/co thời gian các key theo tỉ lệ; kéo handle nhỏ ở cạnh phải track cũng làm được. Tăng thời lượng scene trước nếu cần.',
  end: 'End Time = Start Time + Animation Duration, là lúc kết thúc chu kỳ đầu. Muốn đổi, chỉnh Start hoặc Duration. Với Repeat/Ping Pong, chuyển động tiếp tục lặp sau mốc này đến hết scene.',
  easing: 'Easing điều khiển tốc độ giữa hai key: linear = đều; easeIn = chậm đầu, nhanh dần; easeOut = nhanh đầu, chậm cuối; easeInOut = chậm đầu/cuối, nhanh ở giữa. Key có easing riêng sẽ ưu tiên hơn mặc định của track.',
  loop: 'No Loop: chạy một lần rồi giữ giá trị cuối. Repeat: về đầu và chạy lại, có thể nhảy nếu hai đầu khác nhau. Ping Pong: đi tới rồi đi ngược về. Các kiểu lặp đều dừng khi hết thời lượng scene.',
  keyframe: 'Keyframe là mốc thời gian có giá trị cụ thể, hiển thị bằng hình thoi. Ứng dụng tự tính chuyển động giữa các mốc. Click hình thoi hoặc chọn trong danh sách rồi sửa Key values; key đang chọn có thể khác vị trí playhead.',
  keyTime: 'Thời điểm của key đang chọn, tính theo toàn scene. Nhập giây rồi Enter hoặc kéo hình thoi trên Timeline. Hai key cùng track không được trùng thời gian. Trong code, keyframe time lại tính tương đối từ Start Time.',
  keyEasing: 'Chọn cách thay đổi tốc độ từ key đang chọn đến key tiếp theo. “Theo track” dùng easing mặc định. Ví dụ chọn easeOut ở key đầu để chuyển động chậm dần khi đến key cuối. Easing của key cuối không đổi đoạn trước đó.',
  addKey: 'Chọn track, đưa playhead tới thời điểm mong muốn rồi bấm + Key. Key lấy giá trị đang xem; hãy chọn key để chỉnh lại. Nếu đã có key đúng thời điểm, nó được cập nhật. Track Loop dùng thời gian tương ứng trong chu kỳ.',
  copyKey: 'Sao chép giá trị và easing của key đang chọn. Sau đó đổi playhead rồi dùng nút Paste để đặt key tại thời điểm mới. Các nút này dùng clipboard riêng của editor, không phải Ctrl+C/V cho văn bản.',
  pasteKey: 'Dán key đã sao chép tại playhead, giữ loại chuyển động và easing. Ví dụ key Position vẫn đi vào track Position. Nếu đích đã có key đúng thời điểm, giá trị được thay thế. Có thể chọn Layer khác làm đích.',
  deleteKey: 'Xóa key đang chọn, không xóa Layer. Nếu xóa key cuối cùng, track cũng bị xóa và thuộc tính trở về giá trị nền. Dùng Undo để khôi phục nếu cần.',
  deleteTrack: 'Xóa toàn bộ track và các key của loại chuyển động này. Layer và các track khác vẫn còn. Thuộc tính trở về giá trị nền; có thể Undo để khôi phục.',
  timeline: 'Timeline là bảng điều khiển chuyển động theo giây. Kéo trên thước để xem một thời điểm; kéo hình thoi để đổi key; kéo thân thanh để đổi Start Time; kéo handle cạnh phải để đổi Duration. Thu gọn hàng Layer để dễ nhìn.',
  zoom: 'Zoom Timeline thay đổi độ rộng hiển thị mỗi giây (px/s), không đổi tốc độ hay thời lượng. Bấm + để kéo key chính xác hơn, − để thấy nhiều thời gian hơn; cuộn ngang để xem phần phía sau.',
  fps: 'FPS là số frame mỗi giây, ví dụ 30. Khi kéo key/thời gian trên Timeline, mốc được căn theo bước 1/FPS giây. Đổi FPS không tự đổi thời gian các key đã có.',
  play: 'Play chạy từ thời điểm hiện tại; nếu đang ở cuối scene thì chạy lại từ đầu. Có thể nhấn Space khi không nhập text. Các track chạy đồng thời và dừng khi hết thời lượng scene.',
  pause: 'Pause dừng chuyển động và giữ playhead để bạn xem/chỉnh tại thời điểm đó. Bấm Play để tiếp tục; Space cũng đổi Play/Pause khi không nhập text.',
  stop: 'Stop dừng xem trước và đưa playhead về 0 giây. Nó không xóa animation hoặc keyframes.',
  codeTime: 'scene.animate khai báo chuyển động cho ID của Layer. Keyframe time trong code tính từ startTime: startTime = 2, key time = 1 thì hình thoi nằm ở giây 3 trên Timeline. Bấm Apply Code để cập nhật; code chưa Apply chưa được lưu.',
};
export const trackHelp: Record<AnimationProperty, string> = {
  position: 'Move / Position = di chuyển. Đặt Key x/y ở mốc đầu và cuối: X tăng đi sang phải, Y tăng đi xuống. Ví dụ x=200 đến x=900 trong 4 giây. Thêm key giữa để đổi vị trí ở các mốc khác.',
  scale: 'Scale = phóng to/thu nhỏ. Key scaleX điều khiển chiều ngang, scaleY điều khiển chiều dọc: 1 là kích thước gốc, 2 gấp đôi, 0.5 một nửa. Đặt cả hai bằng nhau để giữ tỉ lệ. Chỉ dùng số lớn hơn 0.',
  rotation: 'Rotate = xoay quanh Pivot. Đặt Key rotation theo độ: 0→360 quay một vòng cùng chiều kim đồng hồ, 0→−360 quay ngược, 0→720 quay hai vòng. Chọn Pivot 0.5/0.5 nếu muốn xoay quanh tâm ảnh.',
  opacity: 'Fade / Opacity = hiện/mờ dần. Key opacity từ 0→1 để hiện dần, 1→0 để biến mất; 0.5 là 50% độ rõ. Nếu ảnh mờ hết và khó click, chọn lại từ danh sách Layers.',
};
export const valueHelp: Record<string, string> = {
  x: 'Vị trí ngang ở key đang chọn. Tăng X để đi sang phải. Đặt X khác nhau ở hai key để tạo chuyển động ngang; đây là tọa độ Pivot của ảnh.',
  y: 'Vị trí dọc ở key đang chọn. Tăng Y để đi xuống, giảm Y để đi lên. Kết hợp với X để di chuyển theo cả hai hướng.',
  scaleX: 'Hệ số chiều ngang ở key đang chọn. 1 = giữ kích thước gốc, 2 = gấp đôi, 0.5 = một nửa. Đặt scaleY giống scaleX để giữ tỉ lệ ảnh; chỉ nhận số dương.',
  scaleY: 'Hệ số chiều dọc ở key đang chọn. 1 = giữ chiều cao gốc, 2 = gấp đôi, 0.5 = một nửa. Có thể chỉnh độc lập với scaleX hoặc đặt bằng nhau để giữ tỉ lệ.',
  rotation: 'Góc xoay ở key đang chọn, tính bằng độ quanh Pivot. Góc dương quay theo chiều kim đồng hồ; góc âm quay ngược. Dùng 360/720 nếu muốn một/hai vòng quay.',
  opacity: 'Độ rõ ở key đang chọn: 0 = trong suốt, 1 = rõ hoàn toàn, 0.5 = 50%. Đặt key đầu 0 và key cuối 1 để hiện dần; đảo lại để mờ dần.',
};
export const easingLabels = {linear: 'linear · Đều', easeIn: 'easeIn · Nhanh dần', easeOut: 'easeOut · Chậm dần', easeInOut: 'easeInOut · Chậm đầu/cuối'};
