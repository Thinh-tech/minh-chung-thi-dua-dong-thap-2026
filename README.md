# Hệ thống minh chứng thi đua tỉnh Đoàn Đồng Tháp năm 2026

Phiên bản **v1.2.2** · Tài khoản đơn vị và quản trị viên tự đổi mật khẩu tại mục **Đổi mật khẩu** trong danh mục. Cần nhập mật khẩu hiện tại, mật khẩu mới từ 10 đến 128 ký tự và xác nhận trùng khớp; Firebase xác thực lại trước khi đổi. Quên mật khẩu thì liên hệ quản trị viên. Không lưu mật khẩu mới vào mã nguồn, dữ liệu hồ sơ hoặc nhật ký.

Ứng dụng có giao diện tiếng Việt dành cho máy tính và điện thoại. Ứng dụng đã kết nối Firebase **tidy-booking-zmln4** (ai-builder-project), cơ sở dữ liệu `(default)` tại Singapore. Đăng nhập bằng cách chọn đơn vị và nhập mật khẩu khởi tạo ở cột D của tệp Excel tài khoản gốc. Nếu đã tự đổi mật khẩu, dùng mật khẩu mới.

Giới hạn tải mới: **5 MB mỗi ảnh JPG/PNG/WEBP**, **10 MB mỗi tệp PDF/DOCX/XLSX**, tối đa 10 tệp/điều kiện. Giới hạn ảnh được kiểm tra trên giao diện và Storage Security Rules. Tệp cũ không bị xóa hoặc chặn đọc bởi thay đổi này.

## Đã xây dựng

- Giao diện điều hành mới với danh mục xanh đậm, bố cục điện thoại, tổng quan theo khối, bộ lọc trạng thái nhanh và các nhóm tiêu chí có thể thu gọn.
- Tìm nhanh bằng Ctrl K, danh sách công việc cần xử lý, tìm người trò chuyện và gom hồ sơ duyệt theo đơn vị.
- Admin đặt lại số liệu theo một đơn vị hoặc toàn tỉnh: xem số hồ sơ, xác nhận lại mật khẩu, nhập `DAT LAI 2026` và tích ô xác nhận. Hồ sơ được lưu bản sao trước khi đưa khỏi đợt hiện tại. Chưa thực hiện đặt lại dữ liệu chính thức trong phiên nâng cấp.
- Tải bản sao JSON tại Thiết lập hệ thống. Nếu thao tác bị gián đoạn, chọn Tiếp tục thao tác đang dở; hệ thống giữ khóa nộp/chấm cho tới khi hoàn tất.
- Giảm tải ban đầu: phần tạo Excel chỉ tải khi xuất báo cáo; gộp cập nhật giao diện, giữ nội dung đang nhập và dừng lắng nghe chat khi rời cuộc trò chuyện.

- 5 bộ tiêu chí với 154 điều kiện chi tiết, giữ nguyên nội dung, điểm và yêu cầu minh chứng từ văn bản được cung cấp.
- Danh mục 114 tài khoản: 1 quản trị viên, 113 đơn vị. Mật khẩu không nằm trong mã nguồn hoặc tệp công khai.
- Nhập kết quả, tự chấm điểm, đính kèm PDF/ảnh/DOCX/XLSX và đường dẫn; lưu nháp, gửi duyệt, yêu cầu bổ sung, duyệt và chấm điểm.
- Quản trị viên đổi mật khẩu, đặt hạn nộp, khóa đợt thi đua, xem nhật ký. Đơn vị chỉ sửa hồ sơ của mình khi chưa gửi hoặc được trả lại. Hồ sơ đã gửi không sửa trực tiếp.
- Tổng quan, biểu đồ tiến độ, bảng xếp hạng cùng khối, tìm kiếm, bộ lọc; báo cáo Excel có tổng hợp và toàn bộ chi tiết.
- Firebase Authentication, Firestore, Storage và Cloud Functions đã được triển khai; hồ sơ đồng bộ theo thời gian thực. Tài khoản chỉ xem được hội thoại có mình tham gia.
- Chat ẩn tin nhắn hết hạn 7 ngày; tác vụ máy chủ chạy mỗi 5 phút để xóa vật lý. Firestore TTL là dự phòng. Thời gian xóa thực tế phụ thuộc tác vụ máy chủ; không cam kết xóa chính xác đến từng giây. Trong khoảng chờ tác vụ xóa, hai người tham gia vẫn có quyền đọc tài liệu tin nhắn qua API.

## Cần xác nhận trước khi dùng chính thức

| Bộ tiêu chí | Tổng đầu văn bản | Theo từng dòng chi tiết | Xử lý trong ứng dụng |
|---|---|---|---|
| Xã, phường | 42 / 189 điểm | 42 / 189 điểm | Khớp |
| Cao đẳng, Đại học | 36 / 166 điểm | 36 / 166 điểm | Khớp |
| Công an | 21 / 111 điểm | 21 / 111 điểm | Khớp |
| Cơ quan Đảng | 26 / 113 điểm | 27 / 123 điểm | Giữ toàn bộ dòng; cảnh báo chênh lệch |
| UBND | 25 / 117 điểm | 28 / 130 điểm | Giữ toàn bộ dòng; cảnh báo chênh lệch |

Tiêu chí 4 khối Đảng ghi 10 điều kiện/43 điểm nhưng có 11 dòng/53 điểm. Tiêu chí 4 khối UBND ghi 40 điểm nhưng các dòng cộng thành 53 điểm. Danh sách có **Đoàn Thanh niên Quân sự Tỉnh** nhưng chưa có bộ tiêu chí tương ứng, nên tài khoản này chưa được gán bộ tiêu chí. Tên “Tân Khánh Trung” được giữ nguyên như bảng tài khoản.

Chỉ có Phần 1 được cung cấp. Không tự thêm tiêu chí khuyến khích, điểm thưởng hoặc mức xếp loại chính thức. Bảng xếp hạng tạm thời dựa trên tổng điểm đã duyệt trong cùng khối, đồng điểm đồng hạng. Chưa có điểm duyệt thì chưa xếp hạng.

## Đăng nhập

Mở ứng dụng, chọn **admin Tỉnh Đoàn** để quản trị hoặc tên đơn vị để nộp minh chứng. Mật khẩu khởi tạo ở cột D cùng dòng trong tệp Excel gốc; sau khi đổi, dùng mật khẩu mới. Dữ liệu nhập mới được lưu trên Firebase. Dữ liệu từng nhập ở chế độ trải nghiệm không tự chuyển thành hồ sơ thật.

## Triển khai Firebase

Thông tin cấu hình và cách triển khai lại nằm trong [HUONG-DAN-FIREBASE.md](HUONG-DAN-FIREBASE.md).

## Kiểm tra đã thực hiện

- 13 bài kiểm tra quyền, điểm, xác nhận đặt lại, lưu bản sao, phạm vi một đơn vị, chống đặt lại hai lần, dữ liệu thay đổi sau khi xem trước và tiếp tục sau lỗi đều đạt. Luồng đặt lại được kiểm tra bằng dữ liệu giả trong bộ kiểm thử.
- Trên Firebase thật: đã kiểm tra bước xem trước và chặn xác nhận sai, chặn tài khoản đơn vị. Dữ liệu hồ sơ chính thức chưa bị đặt lại.

- Đối chiếu số điều kiện, tổng điểm chi tiết và danh sách tài khoản.
- Kiểm thử tự động: quyền sửa khác đơn vị; khóa hồ sơ; xung đột phiên bản; hạn nộp theo giờ Việt Nam; điểm âm/vượt trần; chỉ quản trị viên được duyệt; yêu cầu minh chứng và chống URL nguy hiểm; xếp hạng chỉ dùng điểm đã duyệt.
- Trình duyệt: nhập/gửi, chặn điểm vượt trần, chấm điểm, cập nhật xếp hạng, xuất Excel; bố cục điện thoại 390px không tràn ngang.
- Báo cáo tải xuống có 113 dòng tổng hợp, 4.606 dòng chi tiết, 3 trang tính. Điểm 2,5 trong kiểm thử được ghi nhận đúng dưới dạng số.
- Kiểm tra trực tiếp trên Firebase: mật khẩu quản trị và hai đơn vị; đọc dữ liệu thành viên, từ chối truy cập chưa xác thực và ghi trực tiếp; tải tệp riêng; nhận hồ sơ qua listener thời gian thực; gửi minh chứng, chặn sửa khác đơn vị, duyệt và chấm điểm, từ chối điểm vượt trần, chat riêng và quyền quản trị. Hồ sơ/tệp/chat kiểm thử đã được dọn sau khi kiểm tra.
- Chưa chờ 7 ngày để quan sát hết hạn chat tự động. Tác vụ xóa chạy 5 phút một lần; theo dõi Cloud Scheduler trong vận hành. Máy hiện tại chưa có Java để chạy Firestore emulator.

## Cấu trúc và chạy cục bộ

Yêu cầu Node.js 22 trở lên. Cài các phụ thuộc ở thư mục gốc bằng `pnpm install` hoặc `npm install`, chạy `node scripts/build.mjs`, rồi phục vụ thư mục `dist` qua HTTP. Không mở trực tiếp index.html bằng file://. Kiểm thử: `node --test tests/security.test.mjs`.

Mã ứng dụng ở `src/`, tài sản triển khai ở `dist/`, backend và quy tắc ở `firebase/`. Tệp `.openai/hosting.json` chứa định danh bản xem trước Sites, không phải cấu hình Firebase. Nếu tạo một Sites mới độc lập, không dùng lại định danh này.

Tất cả người dùng đã cấp quyền xem được các hồ sơ, kể cả bản nháp, phù hợp mô hình dữ liệu dùng chung. Chat chỉ hai bên được xem. Nếu nghiệp vụ yêu cầu ẩn bản nháp hoặc tài liệu giữa các đơn vị, cần đổi quy tắc và truy vấn trước triển khai.

## Phiên bản và ghi chú cập nhật

Số phiên bản lấy từ package.json và được ghi chung vào bản giao diện khi chạy `npm run build`. Nếu nội dung nguồn, tài sản giao diện hoặc cấu hình thay đổi, quy trình xây dựng tự tăng số cuối (ví dụ 1.2.2 → 1.2.3); xây dựng lại cùng nội dung giữ nguyên phiên bản và ngày cập nhật. Có thể chủ động đặt phiên bản cao hơn trong package.json. Viết ghi chú mới trong trường `releaseNote`; nếu không đổi ghi chú khi có cập nhật, hệ thống dùng mô tả chung để tránh hiển thị lại nội dung cũ. Thông tin phát hành được lưu trong dist/release.json. Cần đẩy cả package.json và dist đã xây dựng lên GitHub để Vercel/Pages nhận đúng bản mới.

## Quản lý tiêu chí và kiến nghị, giải trình

Admin vào **Quản lý bộ tiêu chí** để thêm điều kiện, sửa mã, nội dung, nhóm, điểm tối đa, hướng dẫn và yêu cầu minh chứng. Bốn lĩnh vực gồm Tổ chức - Kiểm tra, Phong trào, Mặt trận Thanh thiếu nhi, Tuyên giáo - Hành chính; bộ lọc dùng được trong danh sách minh chứng, duyệt và giải trình. Phân loại ban đầu được gợi ý theo nhóm nội dung; admin có thể điều chỉnh từng điều kiện.

**Ngừng áp dụng** cần xác nhận và có thể khôi phục. Điều kiện ngừng áp dụng không tính vào tiến độ/tổng điểm hiện hành; hồ sơ và tệp cũ vẫn được giữ, xem tại **Lịch sử**. Mỗi chỉnh sửa lưu phiên bản trước/sau và nhật ký. Không thể giảm điểm tối đa xuống thấp hơn điểm trong hồ sơ hiện có. Các điều kiện mới dùng mã định danh ổn định để không làm lẫn hồ sơ.

Khi admin khóa hoặc hết hạn nộp, đơn vị không thể lưu nháp, gửi hoặc sửa minh chứng. Trong từng điều kiện có **Kiến nghị, giải trình**, cho phép gửi lý do và ngày dự kiến hoàn thành. Giải trình không mở lại quyền nộp và không cộng điểm. Nội dung được lưu riêng, chỉ đơn vị sở hữu và admin được xem; không tự xóa sau 7 ngày như chat. Admin giám sát tại **Kiến nghị, giải trình**, lọc lĩnh vực/khối/trạng thái, phản hồi hoặc kết thúc theo dõi. Đơn vị có thể tiếp tục giải trình khi đợt vẫn khóa; toàn bộ lịch sử được giữ. Báo cáo Excel có thêm lĩnh vực và trang kiến nghị, giải trình.
