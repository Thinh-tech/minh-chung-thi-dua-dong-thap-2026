# Hệ thống minh chứng thi đua tỉnh Đoàn Đồng Tháp năm 2026

Phiên bản **v1.7.3**. Menu trái chia thành Không gian làm việc, Quản trị / Hỗ trợ và Tiện ích; nút ☰ ở đầu trang ẩn/hiện menu và ghi nhớ lựa chọn. Tài khoản đơn vị tự đổi mật khẩu trong Trung tâm tài khoản; admin đổi mật khẩu tại Quản lý tài khoản.

## Công bố bảng xếp hạng v1.7.3

Admin vào **Thiết lập hệ thống → Công bố bảng xếp hạng**, bật/tắt **Hiển thị bảng xếp hạng các đơn vị**, rồi bấm **Lưu công bố xếp hạng**. Mặc định ẩn nếu chưa bật. Cài đặt đồng bộ Firebase; khi tắt, menu và lối vào xếp hạng của các tài khoản khác được ẩn, người đang xem được đưa về Tổng quan. Admin vẫn xem để quản lý. Với xã/phường, vẫn cần đang trong khung giờ giải trình công bố điểm; mở giải trình không tự bật xếp hạng. Không thay đổi điểm, hồ sơ hoặc lịch giải trình.

Kiểm tra: **63 bài kiểm tra tự động đạt**, bao gồm quyền admin, bật/tắt, mặc định đóng và giữ công tắc khi thay thiết lập khác.

## Công bố điểm và chế độ quan sát v1.7.2

- Xã, phường chỉ xem điểm duyệt và bảng xếp hạng trong thời gian giải trình do admin bật và đặt lịch. Trước giờ bắt đầu, khi hết giờ hoặc admin tắt, các mục này hiện **Chưa công bố** hoặc được ẩn. Điểm tự chấm, hồ sơ và tiến độ vẫn xem được. Không thay đổi điểm đã chấm.
- Quyền đọc Firebase kiểm tra thời gian tại máy chủ. Ngoài giờ, xã/phường chỉ đọc bản hồ sơ không chứa điểm duyệt; bản này được ghi cùng giao dịch với thao tác lưu, chấm, cập nhật lĩnh vực và đặt lại hồ sơ.
- Chế độ quan sát đăng nhập bằng mã được cấp trong ô mật khẩu, không cần chọn tên đơn vị. Có thể xem toàn tỉnh, hồ sơ, báo cáo, điểm và xếp hạng; không có quyền sửa, gửi, chấm, quản lý tài khoản hoặc xuất báo cáo. Mã được xác thực bằng Firebase Authentication, không lưu trong mã nguồn.
- Tài khoản quan sát không xuất hiện trong danh sách đơn vị/cán bộ và quản lý tài khoản của ứng dụng. Chủ dự án Firebase vẫn có thể kiểm tra danh tính và nhật ký trong hệ thống quản trị Firebase.

Kiểm tra: **61 bài kiểm tra tự động đạt**; kiểm tra giao diện xã/phường trước và trong giờ trên dữ liệu trải nghiệm; đăng nhập quan sát thực tế, xem báo cáo/xếp hạng và kiểm tra máy chủ chặn ghi. Không sửa điểm, hồ sơ minh chứng hoặc lịch tiếp nhận chính thức để thử nghiệm. Chưa chạy Firebase Emulator hoặc kiểm thử tải đồng thời 113 tài khoản.

## Xuất báo cáo và thời gian giải trình v1.6.4

- **Chỉ admin xuất báo cáo thi đua Excel.** Nút xuất ở Tổng quan, Minh chứng thi đua, Duyệt & chấm điểm, Xếp hạng và lối tắt chỉ hiện cho admin. Trước khi tạo báo cáo, ứng dụng yêu cầu máy chủ xác nhận quyền admin và ghi nhật ký. Quyền xuất cũ của cán bộ đã được thu hồi; admin không còn ô cấp quyền xuất cho cán bộ. Quyền xem hồ sơ hiện hành vẫn được giữ.
- Admin vào **Thiết lập hệ thống → Thời gian tiếp nhận giải trình**, bật cho phép, đặt đủ giờ bắt đầu và kết thúc rồi lưu. Mọi thời điểm theo giờ Việt Nam; bắt đầu được tính gồm thời điểm đó, kết thúc là thời điểm dừng nhận. Có thể đặt lịch trước hoặc tắt tiếp nhận sớm.
- Giải trình **mặc định đóng** nếu admin chưa bật và đặt lịch. Khóa nộp hoặc hết hạn minh chứng không tự mở giải trình. Đơn vị chỉ gửi giải trình mới và bổ sung trong khoảng được cho phép; máy chủ kiểm tra ở mỗi lần gửi. Lịch sử luôn xem được. Admin và cán bộ có quyền phản hồi vẫn xử lý các giải trình đã nhận sau khi đóng.
- Cửa sổ hồ sơ đang mở cập nhật quyền gửi theo thiết lập và thời gian; dữ liệu minh chứng/điểm không bị thay đổi bởi giải trình.

Kiểm tra v1.6.4: **57 bài kiểm tra tự động đạt**, kiểm tra giao diện trải nghiệm admin tải Excel, đơn vị/cán bộ không có nút xuất, chặn lịch chưa bắt đầu, gửi trong giờ cho phép và giữ lịch sử sau khi tắt. Phần máy chủ đã triển khai trên Firebase. Không tạo hồ sơ giải trình thử hoặc thay lịch tiếp nhận trên dữ liệu chính thức.

## Cấp quyền chấm lại và lọc tiêu chí v1.6.3

- Admin mở **Quản lý tài khoản → Sửa quyền / mật khẩu**, tích **Chấm lại điểm đã duyệt** và lưu phân quyền. Quyền mới không tự cấp cho tài khoản cũ; chỉ áp dụng trong lĩnh vực được phân công. Có thể cấp/thu hồi riêng với quyền chấm lần đầu. Mỗi lần chấm lại vẫn kiểm tra quyền và phiên bản hồ sơ tại máy chủ, lưu nhật ký điểm/nhận xét cũ và mới, và hoạt động khi khóa nộp.
- Trong **Duyệt & chấm điểm**, dùng **Lọc tiêu chí** để chọn 1.1, 1.2… Danh sách xổ xuống chia theo từng bộ tiêu chí, kèm nội dung rút gọn; cùng mã 1.1 ở các khối khác nhau được tách riêng. Bộ lọc kết hợp với khối, lĩnh vực, trạng thái và ô tìm kiếm, chỉ hiện các tiêu chí trong phạm vi được xem.
- Chọn một tiêu chí để hiện hồ sơ của mọi đơn vị phù hợp. Sau khi chấm, hồ sơ rời danh sách chờ; lựa chọn tiêu chí được giữ để chấm tiếp. Không có hồ sơ vẫn giữ bộ lọc, không tự nhảy sang tiêu chí khác. Khi đổi khối/lĩnh vực làm tiêu chí không còn phù hợp, bộ lọc trở về Tất cả tiêu chí.

Kiểm tra v1.6.3: **52 bài kiểm tra tự động đạt**; thử admin cấp quyền, cán bộ chấm lại, lọc riêng tiêu chí 1.1 qua hai đơn vị và chấm lần lượt đến hết, vẫn giữ riêng hồ sơ 1.2. Kiểm tra giao diện dùng dữ liệu trải nghiệm, không thay quyền cán bộ hoặc điểm thi đua chính thức.

## Chấm lại điểm v1.6.2

Admin mở **Duyệt & chấm điểm → Đã chấm điểm → Chấm lại**. Trong hồ sơ, chọn **Chấm lại** để mở sửa điểm, điều chỉnh điểm/nhận xét rồi bấm **Lưu điểm chấm lại**. Điểm mới cập nhật vào hồ sơ đã duyệt, tổng hợp và xếp hạng. Điểm 0 hợp lệ; không nhận ô trống hoặc điểm ngoài giới hạn tiêu chí. Có thể chấm lại ngay cả khi khóa nộp hoặc hết hạn. Không thay đổi nội dung, tệp, đường dẫn và điểm tự chấm của đơn vị.

Từ v1.6.3, admin có thể cấp riêng quyền chấm lại cho cán bộ trong lĩnh vực được phân công. Mỗi lần lưu kiểm tra phiên bản hồ sơ để ngăn ghi đè thay đổi đồng thời; nhật ký lưu người thực hiện, thời điểm, điểm/nhận xét trước và sau. Thông báo trong ứng dụng được cập nhật cho đơn vị.

Kiểm tra v1.6.2: **49 bài kiểm tra tự động đạt**; kiểm tra giao diện trải nghiệm sửa điểm 2 → 0 → 3, chặn điểm vượt mức, chấm lại khi khóa nộp và kiểm tra nhật ký. Không sửa điểm thi đua chính thức trong quá trình kiểm tra.

## Cập nhật v1.6

- Sửa ô tìm kiếm: giữ nguyên ô nhập và vị trí con trỏ trong khi lọc; không dựng lại ô giữa lúc bộ gõ tiếng Việt đang ghép chữ.
- Xã Trường Xuân (`dv099`) dùng bộ tiêu chí xã, phường. Đã sửa danh mục và hồ sơ tài khoản Firebase; không xóa hồ sơ minh chứng.
- Admin mở **Quản lý tài khoản → Thêm tài khoản cán bộ**, chọn một hoặc nhiều lĩnh vực và cấp riêng sáu quyền: xem minh chứng/giải trình, chấm điểm, chấm lại điểm, yêu cầu bổ sung, quản lý tiêu chí, phản hồi giải trình. Từ v1.6.4, chỉ admin xuất báo cáo thi đua Excel. Quyền được kiểm tra tại máy chủ, Firestore và Storage. Cán bộ không được quản lý tài khoản, khóa đợt, đặt lại dữ liệu hoặc truy cập các mục điều hành toàn tỉnh. Admin có thể sửa quyền, khóa hoạt động và đổi mật khẩu cán bộ.
- Cán bộ đăng nhập bằng lựa chọn **Cán bộ phụ trách lĩnh vực**, nhập tên đăng nhập dạng `cb-ten-can-bo` và mật khẩu được cấp. Chỉ nhìn thấy minh chứng/giải trình trong lĩnh vực được phân công; quyền chấm điểm được cấp vẫn hoạt động khi khóa nộp minh chứng.
- Admin xóa **Thông báo, Báo cáo, Khen thưởng** qua hộp xác nhận. Nội dung được chuyển vào **Thùng rác**, ẩn khỏi danh sách đơn vị và ngừng nhận hồ sơ; có thể khôi phục. Tệp và hồ sơ đã nộp được giữ lại. Đây không phải xóa vĩnh viễn.
- Đơn vị phải nhập rõ **điểm tự chấm** trước khi lưu/gửi hồ sơ. Ô trống bị chặn; nhập số **0** vẫn hợp lệ.

Kiểm tra v1.6: **46 bài kiểm tra tự động đạt**; kiểm tra giao diện bằng dữ liệu trải nghiệm cho tìm kiếm tiếng Việt, tạo/đăng nhập cán bộ và chấm điểm trong phạm vi quyền, xóa/khôi phục cả ba loại nội dung, điểm trống và điểm 0. Không tạo tài khoản hoặc hồ sơ thử trong Firebase chính thức; chưa chạy thử Firebase Emulator hoặc tải đồng thời 113 tài khoản.

## Tính năng bổ sung v1.5

- **Thông báo:** admin công bố văn bản và tệp cho toàn tỉnh, một khối hoặc các đơn vị được chọn. Chuông có số chưa đọc, đánh dấu đã đọc và công việc minh chứng đang chờ xử lý. Đây là thông báo trong ứng dụng, chưa phải thông báo nền khi trình duyệt đóng.
- **Báo cáo:** tạo kỳ tháng, 3/6/9 tháng, năm hoặc chuyên đề. Admin tự định nghĩa chỉ tiêu kiểu số/văn bản, đơn vị tính, bắt buộc, hạn và đối tượng nhận; có thể dùng lại danh mục từ báo cáo trước. Không có danh mục chỉ tiêu chính thức được tự tạo sẵn. Đơn vị nhập số liệu, gửi kèm tệp; máy chủ ghi lần nhận đầu và lần cập nhật, đánh dấu nộp muộn. Admin xem đã/chưa nộp, xem hồ sơ, tải tệp và xuất Excel.
- **Khen thưởng:** tạo đợt với điều kiện/đối tượng/hạn; đơn vị gửi nhiều tập thể và cá nhân cùng thành tích. Admin tổng hợp và xuất Excel; hệ thống không tự quyết định người được khen thưởng.
- Đợt đã công bố giữ nguyên cấu trúc chỉ tiêu và đối tượng để bảo toàn hồ sơ; admin có thể đóng/mở nhận hồ sơ có xác nhận. Cần thay cấu trúc thì tạo đợt mới, dùng lại chỉ tiêu cũ khi phù hợp.
- **Trung tâm tài khoản:** cập nhật địa chỉ, điện thoại, email, Bí thư, Phó Bí thư và ba ảnh theo thứ tự đại diện đơn vị/Bí thư/Phó Bí thư. Admin quản lý mọi hồ sơ; đơn vị chỉ sửa hồ sơ mình. Danh bạ hiển thị thông tin trong phạm vi tài khoản đã đăng nhập.
- **Tiện ích:** Danh bạ tìm kiếm theo khối/cán bộ; Mẫu biểu phân loại và xem trước/tải xuống; liên kết phần mềm Mặt trận và Fanpage Tuổi trẻ Đồng Tháp.
- **Giao diện:** xanh Đoàn #0072BC, giờ Việt Nam và lời chào theo buổi, banner dùng chung admin thay được (đề xuất 1920×480 px), xuất Excel ở cuối tổng quan; duyệt minh chứng nhóm theo đơn vị hoặc lĩnh vực.
- Hồ sơ chi tiết báo cáo/khen thưởng được tải khi mở đợt; tài khoản đơn vị chỉ được đọc các đợt dành cho mình và hồ sơ của mình. Minh chứng và chat trước đây vẫn được giữ nguyên.

Kiểm tra: 40 bài kiểm tra tự động; thử luồng báo cáo có tệp PDF → đơn vị nộp → admin xem trước/xuất Excel; thử khen thưởng tập thể/cá nhân, hồ sơ/danh bạ, menu desktop và điện thoại 390 px. Kiểm tra giao diện dùng dữ liệu trải nghiệm; chưa thực hiện thử tải 113 tài khoản đồng thời hoặc gửi báo cáo thử vào dữ liệu chính thức.

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

Khóa nộp minh chứng chỉ khóa việc đơn vị lưu/sửa/gửi và nộp lại. Admin vẫn duyệt, chấm điểm và trả hồ sơ đã gửi, kể cả sau hạn nộp; việc trả hồ sơ không tự mở lại quyền nộp của đơn vị.
