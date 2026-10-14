# Vector Layer và Code Frames — 0.7.0

Chức năng dành cho ảnh **đã tách sẵn**: mây, sông, mặt đất, nhân vật hoặc vũ khí. Dùng PNG trực tiếp để chỉnh tư thế từng frame trên Canvas; có thể chuyển thành vector để sửa đường nét bằng code. Chạy local, không dùng AI/API, không tự nhận diện bộ phận.

## 1. Chuyển ảnh thành vector

1. Save công việc hiện tại rồi reload http://127.0.0.1:4310/. Toolbar ghi VECTOR & CODE FRAMES · 0.7.
2. Import PNG/JPG/WebP và thêm ảnh vào Canvas như cũ.
3. Chọn một ảnh trên Canvas hoặc trong danh sách Layer, bấm **Chuyển ảnh → Vector** ngay trên thanh công cụ Canvas. Hoặc trong Properties → VECTOR / FRAME-BY-FRAME bấm **Chuyển ảnh thành Vector**.
4. Chọn **Chi tiết** (64/128/192), **Số màu** (4–24), **Đơn giản hóa**. Bấm **Tạo bản xem trước** để so với ảnh gốc.
5. Bấm **Chấp nhận Vector**. Giữ nguyên bố cục/transform/binding/animation; có thể Undo. Ảnh nguồn vẫn nằm trong Asset Library để so sánh và làm thumbnail.

Bộ chuyển lấy mẫu ở độ phân giải nhỏ, giảm màu và dựng đường bao; kết quả gần giống, không sao chép chính xác từng pixel. Ảnh màu phẳng phù hợp nhất. Texture/gradient/bóng phức tạp bị đơn giản hóa. Lỗ trong suốt dùng contours và even-odd fill. Có giới hạn 16000 điểm, 100 contours mỗi path; khi ảnh quá nhiều chi tiết, app báo giảm Chi tiết/Số màu. Worker không khóa toàn bộ UI; Đóng/Hủy dừng xử lý.

Vector không đổi hình bằng Pose Switching ảnh. Nếu Layer có Pose track, hãy bỏ track trước hoặc dùng bản sao không có Pose. Bấm **Về ảnh PNG** sẽ bỏ vector và Code Frames của Layer (có xác nhận/Undo).

## 2. Click Timeline để nhập code cho từng đoạn

### Chỉnh trực tiếp trên Canvas — không cần nhập code, không cần Vector

1. Chọn **một Layer**, **Group**, hoặc Shift+click nhiều Layer muốn tạo tư thế chung.
2. Bấm **+ Code Frame** ở đầu Timeline hoặc **+ Code Frame tại playhead** trong Properties. Frame đầu lấy tư thế đang xem; các frame sau kế thừa tư thế frame trước của từng Layer.
3. Click ô F0/F10… trên Timeline. Frame của Group chọn lại những Layer thuộc tư thế đó. Có thể click riêng tay/kiếm trong Canvas hoặc danh sách Layers để sửa từng bộ phận.
4. Kéo ảnh, xoay bằng tay nắm trên Canvas, thay đổi kích thước, hoặc chỉnh Transform/Opacity/Visible trong Properties. Thay đổi được ghi vào tư thế của đúng frame, không đổi transform gốc hay tự tạo animation key, kể cả Auto Key đang bật. Kiếm vẫn đi theo tay theo binding đã thiết lập.
5. Bấm **Lưu frame** hoặc **Ctrl+S** để lưu project xuống đĩa. Lần đầu chọn thư mục lưu. Các thao tác chỉnh được ghi ngay vào project đang làm việc và có Undo; chuyển qua frame khác không làm mất tư thế vừa chỉnh. Code nhập tay chưa Apply vẫn là draft và không được lưu như tư thế.
6. Bấm **+ Tiếp nối Frame** ở đầu Timeline hoặc **Duplicate / tiếp nối** trong Properties để tạo tư thế tiếp theo cho toàn bộ những Layer thuộc frame hiện tại. Frame mới mặc định **Hold Frames = 1**. Scene mới mặc định **24 FPS**: 24 frame trong một giây, mỗi frame 1/24 giây. Frame/Scene cũ giữ thời lượng và FPS đã có; nếu muốn Scene cũ dùng 24 FPS, chỉnh FPS trong Properties của Scene. Duplicate giữ độ dài của frame đang chọn. Timeline tự zoom gần khi có ô một frame; có thể zoom thêm/thu nhỏ bằng nút +/-.
7. Click các ô để xem lại từng tư thế, hoặc bấm Play để review. **Hold** giữ rồi đổi ngay sang tư thế mới; không cần set animation. Tư thế trực quan cuối được giữ đến cuối Scene, kể cả khi ô hiển thị đã kết thúc. Trước frame đầu vẫn xem trạng thái nền.

Nếu tạo ở giữa một ô, app chia ô trước tại playhead rồi tạo ô mới, không chồng đoạn. Tạo lại ở đúng đầu ô sẽ chọn ô có sẵn. Thời gian và Hold của các ô thuộc cùng tư thế Group được chỉnh cùng nhau; Delete một ô Group xóa tư thế đó ở các Layer trong scope, giữ các Layer/ảnh. Nếu đã scrub sang frame khác, click đúng ô trước khi chỉnh Canvas. Mở khóa các thành viên Group trước khi tạo/sửa thời gian.

Tư thế lưu transform cục bộ, opacity và visible của Layer. Binding/attachment, tên, khóa, thứ tự Layer và nội dung ảnh vẫn là thiết lập chung. Muốn đổi hình nội bộ, dùng code Vector hoặc ảnh pose khác; tính năng này chưa thêm lưới uốn PNG.

### Code tùy chọn

**Ctrl+click chọn riêng lẻ:** Click ô đầu, giữ Ctrl rồi click những ô bất kỳ để thêm từng tư thế vào lựa chọn; Ctrl+click ô đã chọn để bỏ chọn nó. Frame ở giữa không tự được chọn. Với Group, Ctrl+click bất kỳ thành viên nào của một tư thế sẽ chọn/bỏ chọn cả tư thế đó. Thả Ctrl rồi kéo thân một ô có viền để di chuyển những frame đã chọn cùng nhau, giữ khoảng cách; Ctrl+C/V cũng dùng được với lựa chọn rời rạc. Shift+click vẫn chọn cả dải từ ô đầu tới ô cuối.

**Kéo nhiều frame cùng lúc:** Chọn các ô bằng Shift, thả Shift rồi kéo **thân** một ô đang có viền. Tất cả ô được chọn và các thành viên frame Group di chuyển cùng một số frame, giữ khoảng cách và độ dài. Thả chuột để lưu một bước Undo. Kéo được giới hạn trong đầu/cuối Scene; nếu chồng ô không được chọn hoặc có thành viên bị khóa, giữ vị trí cũ và báo lỗi. Kéo mép phải vẫn chỉnh Hold của riêng tư thế đó. Click thường không kéo để trở lại chọn một ô.

**Chọn nhiều frame:** Click ô đầu, giữ **Shift** rồi click ô cuối trên cùng track để chọn cả dải. Các ô được chọn có viền; frame Group cũng đánh dấu các thành viên tương ứng. Shift+click track khác có thể thêm frame vào lựa chọn. Ctrl+C hoặc chuột phải → **Copy các frame đã chọn** lấy cả lượt; Ctrl+V đặt ô đầu tại playhead và giữ khoảng cách thời gian giữa các ô. Click thường để trở lại chọn một frame. Copy/Paste nhiều frame vẫn kiểm tra chồng đoạn và đủ thời lượng Scene. Frame mới mặc định **Interpolate · Chuyển mượt**; frame cũ giữ Hold/Interpolate đã lưu, và paste giữ lựa chọn của nguồn.

**Tái sử dụng frame:** Chuột phải vào ô → **Duplicate / tiếp nối frame** để chèn bản sao ngay sau ô đã chọn. Các ô sau của những Layer trong scope được dịch ra sau; Duration tự tăng nếu cần. Copy bằng **Copy frame · Ctrl+C** hoặc click ô rồi Ctrl+C. Chọn Layer/Group nhận, đưa playhead tới chỗ trống, Ctrl+V hoặc chuột phải track → **Paste frame tại playhead · Ctrl+V**. Có thể dùng lại ở cùng Scene hoặc Scene khác trong project hiện tại. Frame Group copy cả các thành viên; nhóm nhận cần cùng số Layer và cùng tên bộ phận (hậu tố “copy” được bỏ qua). Khi nhận ở nhóm/layer khác, tư thế được đổi tương đối theo transform nền nơi nhận để giữ bố cục. Copy/Paste không tạo ảnh mới và không ghi đè frame đã có; nếu chồng đoạn hoặc vượt Duration, app báo lỗi. Code/điểm vector phải phù hợp hình nhận. Ctrl+C/V trong ô nhập code vẫn copy/paste văn bản như bình thường.

Mỗi Layer có một hàng **Code Frames**, kể cả PNG chưa chuyển vector:

- Đưa playhead tới vị trí rồi bấm **+ Code Frame** trên Timeline, hoặc **+ Code Frame tại playhead** trong Properties.
- Double-click chỗ trống trên Code Frames track cũng tạo đoạn tại vị trí đó. Nếu click nằm trong đoạn đã có, app chọn đoạn đó.
- Click ô **F0 / F10 / F20…** để chọn; chỉ ô đó có viền. Properties tự cuộn tới CODE FRAMES và hiện code của đúng Layer/đoạn.
- **Start Frame** là chỉ số frame tính từ đầu Scene. 30 FPS: frame 30 = 1 giây.
- **Hold Frames** là số frame đoạn chiếm. Start 10, Hold 10 nghĩa là frame 10–19, kết thúc trước frame 20.
- Kéo thân ô đổi Start; kéo mép phải đổi Hold. Không cho chồng đoạn/vượt Duration; nếu sai, giữ dữ liệu cũ và báo lỗi. Mỗi lần thả là một bước Undo.
- Nhập code vào **Frame Code**, bấm **Apply Frame Code** hoặc Ctrl+Enter. Canvas được cập nhật và playhead về đầu đoạn. Draft chưa Apply chưa làm đổi hình.
- **Duplicate / tiếp nối** chèn bản sao của đoạn được chọn ngay phía sau, giữ thời lượng và code đã Apply. Frame mới từ + Code Frame mặc định một frame và Interpolate. Có thể chỉnh Start/Hold tiếp.
- **Reset Frame Code** bỏ sửa chưa Apply. **Mẫu code** thay draft bằng mẫu Move/Rotate/Scale/Fade để bắt đầu nhanh.
- Chuột phải → Properties hoặc xóa. Chọn ô rồi Delete chỉ xóa ô; chọn track rồi Delete bỏ Code Frames, giữ Layer và hình vector.
- Ctrl+C/V copy ô hoặc toàn track; Paste bắt đầu ở playhead, trên Layer nhận đã chọn. Point IDs phải tồn tại ở Drawing nhận, nếu không app báo lỗi. Ctrl+D Layer/Group hoặc Duplicate Scene giữ vector + frames và tạo clip IDs mới.
- Nút **◀ / ▶** bên nhãn Code Frames bước lùi/tiến một frame để xem.

## 3. Di chuyển cả hình bằng code

Các lệnh tính tương đối từ chuyển động nền của Layer, không cộng dồn mỗi lần render:

```js
frame.offset({ x: 20, y: -5 });
frame.rotate(5);
frame.scale({ x: 1.1, y: 1.1 });
frame.opacity(0.8);
```

- `offset`: cộng X/Y vào tư thế frame trực quan (hoặc vị trí sau animation/Motion Path nếu là đoạn code cũ), trước binding. Y âm lên trên, Y dương xuống dưới.
- `rotate`: cộng góc xoay (độ).
- `scale`: nhân scale nền theo hai chiều. 1/1 giữ nguyên, 1.1/1.1 lớn hơn 10%.
- `opacity`: nhân độ rõ nền. 1 giữ nguyên, 0 ẩn.
- Lệnh không viết dùng mặc định: offset 0/0, rotate 0, scale 1/1, opacity 1.

PNG vẫn dùng được bốn lệnh trên. Chỉnh điểm/đường cong/màu bên trong cần Vector Layer.

## 4. Mây vừa đi ngang vừa nhấp nhô đường nét

Chọn **Path** và **Point** trong Properties. Bật **Hiện điểm trên Canvas**, zoom gần hình bằng cuộn chuột rồi click điểm để lấy ID. Canvas hiển thị tối đa 250 điểm của Path đang chọn để không quá nặng; danh sách Point có toàn bộ điểm. Tên điểm đã chọn hiện bên nó.

Bấm **Chèn pointOffset**, **Chèn handle in/out** để chèn vào draft, rồi sửa giá trị. Các nút chèn giữ các thông số đã có nhưng chuẩn hóa code (comments có thể mất). Ví dụ Path `path-0`, Point `p-0-0`; dùng ID thật trên ảnh của bạn:

**Đoạn F0, Start 0, Hold 10:**

```js
frame.offset({ x: 0, y: 0 });
frame.pointOffset("path-0", "p-0-0", { x: 0, y: 0 });
frame.handleOffset("path-0", "p-0-0", "out", { x: 0, y: 0 });
```

**Đoạn F10, Start 10, Hold 10:**

```js
frame.offset({ x: 40, y: 0 });
frame.pointOffset("path-0", "p-0-0", { x: 0, y: -12 });
frame.handleOffset("path-0", "p-0-0", "out", { x: 10, y: -5 });
```

**Đoạn F20, Start 20, Hold 10:**

```js
frame.offset({ x: 80, y: 0 });
frame.pointOffset("path-0", "p-0-0", { x: 0, y: 0 });
frame.handleOffset("path-0", "p-0-0", "out", { x: 0, y: 0 });
```

Chọn **Interpolate** cho F0 và F10, Apply mỗi đoạn. Ở frame 15, hình lệch ngang 60 px, điểm nâng lên 6 px; vừa trôi vừa biến dạng. Có thể chỉnh nhiều điểm để mây phồng/co. Không cần gọi AI hay sinh lại code mỗi frame.

- `pointOffset(pathId, pointId, {x,y})`: dịch điểm từ hình vector gốc. Handle đã có đi theo điểm.
- `handleOffset(pathId, pointId, "in"/"out", {x,y})`: thêm độ lệch vào handle gốc; nếu chưa có handle thì bắt đầu từ điểm gốc. Kết hợp pointOffset để cong nét.
- `frame.fill("path-0", "#ffeecc")`: đổi màu vùng. Màu đổi rời rạc; chưa nội suy màu.
- Đơn vị point/handle là pixel trong kích thước vector gốc. Width/Height/Scale của Layer phóng hình sau đó.

Không thay số lượng/ID điểm qua Frame Code; các frame dùng cùng cấu trúc để nội suy. Sửa cấu trúc vector nền qua Scene Code sẽ ảnh hưởng tất cả frame và cần giữ các ID đang tham chiếu.

## 5. Hold, Interpolate và Onion Skin

- **Hold:** giữ trạng thái code suốt đoạn; tới đoạn kế tiếp đổi ngay. Dùng cho phong cách vẽ từng frame. Hold 1 để mỗi ô là một frame.
- **Interpolate:** chuyển mượt từ trạng thái đoạn này tới trạng thái đoạn kế tiếp **nếu liền nhau**. Nội suy offset, rotate, scale, opacity, điểm và handles.
- Nếu không có đoạn kế tiếp liền nhau, đoạn giữ nguyên. Frame trực quan giữ tư thế tới ô sau/cuối Scene; đoạn code legacy không có visual trở về animation/transform nền ở gap hoặc sau cuối track. Muốn lặp, copy/paste chuỗi đoạn; Code Frames chưa có Loop riêng.
- Bật **Onion Skin** để hiện mờ hình ở frame trước (hồng) và sau (xanh). Chỉ ở Editor View, không xuất MP4.
- Motion Path, keyframes và binding vẫn dùng được. Code Frames là phần bổ sung vào chuyển động nền. Chỉnh Transform ở một frame đã có offset được bù để không cộng offset hai lần.

Đây là frame-by-frame bằng các trạng thái/biến dạng của hình vector, chưa phải bộ công cụ vẽ bút/tẩy như Moho. Frame Code chỉ nhận lệnh khai báo đã liệt kê; không nhận vòng lặp, hàm, import, Math.sin/time hoặc JavaScript tùy ý.

## 6. Lưu hình và code để tái sử dụng

- Trong Properties, đặt **Tên mẫu Vector** rồi bấm **Lưu vào Vector Library**.
- Bấm **Vector Library** trên toolbar, chọn mẫu → **Thêm Vector vào Scene**. Có tìm kiếm, Preview, Import/Export mẫu JSON và xóa mẫu có xác nhận.
- Mẫu lưu toàn bộ geometry, màu, kích thước và code của các đoạn **đã Apply**; không cần ảnh gốc để dùng lại.
- Thêm vào project khác tạo một thumbnail PNG mới để Asset Manager quản lý và một Vector Layer độc lập; hình thật vẫn vẽ từ geometry.
- Frame timing được đổi theo FPS của Scene nhận để giữ thời gian gần tương đương; nếu làm tròn gây chồng đoạn (FPS nhận quá thấp), app báo lỗi. Dùng cùng FPS hoặc chỉnh mẫu. Scene tăng Duration nếu mẫu dài hơn Scene.
- Thư viện dùng chung trong thư mục `Vector Library/`; không đưa mẫu người dùng vào Git. File `.vector.json` xuất được để sao chép sang máy khác.
- Scene Code tự sinh **scene.addVector({...})** gồm paths/points/handles/màu và codeFrames. Có thể sửa rồi Apply Scene Code; lỗi giữ scene cũ và Undo quay lại.

## 7. Save, autosave và MP4

Save Project lưu geometry + các đoạn code đã Apply trong project.json. Code chưa Apply ở Frame Code và Scene Code được cảnh báo; autosave/emergency recovery giữ draft riêng để khôi phục sau reload. Apply Frame Code khác Apply Code của toàn Scene: dùng nút đúng panel.

Schema mới **v5**, mở v1–v4 migrate trong bộ nhớ, chưa tự sửa file. Dùng Save As để giữ bản dùng với app cũ; bản cũ không đọc được project v5.

Camera Preview và MP4 dùng cùng engine và vector renderer. Frame sampling theo timestamp của FPS export; không có điểm chỉnh/Onion Skin/selection trong video. Sửa Frame Code ở 30 FPS rồi xuất 60 FPS vẫn giữ tốc độ, có thêm mẫu nội suy nếu bật Interpolate.

## 8. Kết quả kiểm tra

- **216/216 tests đạt**, 14 files, TypeScript/build production đạt. Không thêm npm dependency; dùng Acorn/Zod/Konva đã có.
- Browser `scripts/frame-drag-smoke.mjs`: kéo nhiều frame Group, giữ khoảng cách và lựa chọn, Undo một lượt, báo lỗi chồng frame và giữ dữ liệu cũ.
- Browser `scripts/single-frames-smoke.mjs`: Scene mới 24 FPS, Hold=1, tạo 24 tư thế liên tiếp từ nút trên Timeline và kiểm tra chiều rộng đúng tỷ lệ thời gian.
- Browser `scripts/visual-frames-smoke.mjs`: PNG Layer/Group, kế thừa tư thế, chỉnh tay/kiếm, kéo trực tiếp Canvas, cách ly frame cũ, đồng bộ Hold, Ctrl+S/Lưu frame, Play và mở lại project.
- Browser `scripts/vector-frames-smoke.mjs`: PNG→vector worker, click Timeline/edit/duplicate, offset + point/Bezier nội suy, code sai không đổi scene, Ctrl+C/V/Delete giữ Layer, library reuse, Scene Code round-trip, Onion Skin, MP4 30 frames/30 FPS khớp Preview, autosave reload giữ vector và Frame Code chưa Apply.
- Hồi quy Phase 4/5/6 đạt camera/scene, MP4 ngang/dọc/file trùng/Cancel và recovery/backup/keyboard/context menus.
- Còn cảnh báo kích thước bundle Monaco như trước.

Test nhanh: dùng ảnh mây PNG tách nền → chuyển Vector → tạo F0/F10/F20 theo ví dụ (thay IDs thật) → bật Interpolate và scrub frame 15 → lưu mẫu thư viện → Save As → export Scene thành MP4. Xem kết quả cạnh Camera Preview.
