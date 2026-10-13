export const phase3Help={
  path:'Motion Path là đường ảnh sẽ đi theo. Chọn kiểu đường rồi Tạo đường; kéo các điểm trên Canvas để chỉnh. Đường chỉ là công cụ editor, không thuộc hình ảnh đầu ra. Có thể chạy cùng Scale, Rotate, Fade và Pose.',
  curve:'Bézier là đường cong. Điểm tròn là mốc đi qua, tay nắm nhỏ là hướng uốn cong. Kéo tay nắm để làm đường cong mềm; double-click đường hoặc dùng + Điểm để thêm mốc.',
  freehand:'Vẽ tay: bấm Vẽ lại bằng tay rồi giữ chuột và vẽ trên Canvas. Thả chuột để lưu đường; điểm thừa được đơn giản hóa. Sau đó có thể kéo các mốc để sửa. Esc hủy chế độ vẽ.',
  orient:'Orient to Path = tự quay theo hướng đang đi. Bật để mũi ảnh hướng theo đường; Rotation của ảnh/track là góc chỉnh thêm. Tắt (Keep Rotation) để giữ góc xoay riêng. Ping Pong quay lại theo chiều về.',
  pathSpace:'Tọa độ điểm là tọa độ scene nếu ảnh không có Parent. Với Child, đường ở hệ tọa độ của Parent/binding; kéo trực tiếp trên Canvas tự chuyển tọa độ giúp bạn. Motion Path ưu tiên Position track từ lúc đường bắt đầu.',
  bind:'Parent–Child là liên kết chuyển động: ảnh con đi theo ảnh cha, dù hai ảnh ở thứ tự trước/sau khác nhau. Chọn Parent; không được tự làm cha hoặc tạo vòng liên kết. Gán/tháo liên kết giữ hình tại playhead hiện tại và ghi một bước Undo.',
  mode:'Bind Position: chỉ đi theo vị trí điểm gắn, giữ góc xoay/scale riêng. Bind Transform: cả vị trí, góc xoay và scale đi theo cha. Child vẫn có animation riêng trong tọa độ liên kết.',
  attachment:'Attachment Point là điểm gắn trên ảnh cha, ví dụ Head/Left Hand/Right Hand. Thêm điểm, đổi tên, kéo chấm vàng trên Canvas hoặc nhập X/Y từ 0 tới 1 (0.5 là giữa ảnh). Chọn điểm đó khi gắn Child.',
  pose:'Pose Set là nhóm ảnh tư thế của cùng nhân vật. Thêm ảnh đã import vào nhóm; chọn pose và bấm Đặt pose tại playhead để đổi ảnh tức thời. Move/Scale/Rotation/Fade/binding vẫn chạy.',
  anchor:'Pivot/Anchor chung giúp đổi ảnh không bị nhảy. Nên đặt 0.5/1 cho vị trí chân trên mọi pose; có thể sửa riêng từng ảnh nếu khoảng trống khác nhau. Tọa độ nhân vật và scale/rotation được giữ khi đổi pose.',
  poseKey:'Mốc Pose dùng giây toàn scene. Tại mốc đó ảnh đổi ngay, không nội suy/morphing. Kéo mốc trên hàng Pose để đổi thời gian; chọn pose khác để thay giá trị. Trước mốc đầu, ảnh gốc vẫn được dùng.',
  zOrder:'Z-order keyframe đổi thứ tự trước/sau tại một mốc, không đổi Parent. Số lớn hơn nằm phía trước; thứ tự đổi tức thời, không nội suy. Các layer cùng số giữ thứ tự tĩnh của chúng. Dùng + Z-order hoặc thêm key tại playhead.',
};
export const pathTypeLabels={line:'Straight Line · Đường thẳng',polyline:'Polyline · Gấp khúc',bezier:'Bézier · Đường cong',circle:'Circle · Vòng tròn',ellipse:'Ellipse · Bầu dục',freehand:'Freehand · Vẽ tay'};
