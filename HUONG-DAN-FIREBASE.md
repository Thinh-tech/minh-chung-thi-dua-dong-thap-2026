# Firebase đã triển khai

Ứng dụng đã kết nối dự án Firebase **tidy-booking-zmln4** (`ai-builder-project`). Dữ liệu nằm trong Firestore `(default)` và Cloud Storage tại Singapore. Ba cơ sở dữ liệu Firestore có sẵn của ứng dụng khác được giữ nguyên.

## 1. Chuẩn bị dự án

1. Authentication Email/Password, Firestore `(default)`, bucket mặc định, quy tắc truy cập, chỉ mục chat và TTL dự phòng đã thiết lập.
2. Tám Cloud Functions đã triển khai ở `asia-southeast1`, gồm xem trước và xác nhận đặt lại dữ liệu; Scheduler chạy hàm xóa chat mỗi 5 phút.
3. Đã tạo 114 tài khoản Firebase (một quản trị viên, 113 đơn vị) từ mật khẩu ở cột D của tệp Excel gốc. Không đưa mật khẩu vào mã nguồn, website hay tệp ZIP.
4. Đã bổ sung tên miền ứng dụng vào danh sách Authorized domains và cấu hình CORS cho việc tải tệp.

Không gửi mật khẩu Google hay private key trong chat; không đặt tài khoản dịch vụ trong thư mục `dist` hoặc Git.

## Cấu hình ứng dụng

Ứng dụng đã dùng cấu hình Web App sau trong `dist/firebase-config.json`:

```json
{
  "configured": true,
  "region": "asia-southeast1",
  "firebaseConfig": {
    "apiKey": "AIzaSyD7oOLclfqqIXeceR5CUp38TV_SavXjE-w",
    "authDomain": "tidy-booking-zmln4.firebaseapp.com",
    "projectId": "tidy-booking-zmln4",
    "storageBucket": "tidy-booking-zmln4.firebasestorage.app",
    "messagingSenderId": "759314377400",
    "appId": "1:759314377400:web:f914f244e96245eb4d224d"
  }
}
```

Cấu hình Web App không phải khóa tài khoản dịch vụ. Quyền dữ liệu được kiểm tra bằng quy tắc và hàm máy chủ; không bật đăng ký tự do.

## Triển khai lại sau khi chỉnh mã

Từ thư mục ứng dụng, dùng Firebase CLI đã đăng nhập tài khoản có quyền dự án:

```text
firebase deploy --only firestore,storage,functions --project tidy-booking-zmln4
```

Nếu trình triển khai yêu cầu cho phép Storage Rules tra cứu Firestore, hãy kiểm tra và cấp quyền dịch vụ tương ứng trong dự án. Không chuyển database sang test mode. Chờ các chỉ mục Firestore xây dựng xong.

`firebase/firestore.indexes.json` có chỉ mục chat và cấu hình TTL cho `messages.expiresAt`. Tác vụ `purgeExpiredMessages` chạy mỗi 5 phút. Theo dõi Cloud Scheduler/Functions logs để biết tác vụ có chạy thành công. TTL là dự phòng, có thể xóa trễ, thường trong vòng 24 giờ sau hết hạn theo tài liệu Firebase: https://firebase.google.com/docs/firestore/ttl .

## Cấp lại mật khẩu hàng loạt

Chỉ chạy script khởi tạo từ máy tin cậy nếu cần tạo lại danh sách tài khoản. Script đọc cột D trong tệp gốc:

```text
gcloud auth application-default login
gcloud auth application-default set-quota-project PROJECT_ID
node firebase/functions/bootstrap.mjs tidy-booking-zmln4 "DUONG_DAN_DAY_DU/file mật khẩu.xlsx"
```

Script đọc trực tiếp tệp Excel gốc tại máy; không tạo bản sao mật khẩu trong mã nguồn. Script tạo 114 tài khoản Auth, các hồ sơ quyền, danh mục đơn vị và 154 điều kiện chấm điểm. Email kỹ thuật dạng `dv001@minhchung.invalid` chỉ là định danh, không phải địa chỉ nhận thư. Người dùng đăng nhập bằng cách chọn tên đơn vị và nhập mật khẩu từ tệp đã cấp.

Mã `admin` là quản trị viên theo dòng STT 0; tài khoản đơn vị là `dv` + STT đủ 3 chữ số. Quyền quản trị được cấp bằng Admin SDK và kiểm tra trên máy chủ. Script khởi tạo không đổi mật khẩu tài khoản đã có và không xóa hồ sơ thi đua.

Tài liệu về quyền Firebase: https://firebase.google.com/docs/auth/admin/custom-claims .

## Tải tệp từ trình duyệt

Ứng dụng tải tệp bằng Firebase Storage SDK có xác thực, không phát sinh liên kết tải công khai có token. CORS bucket đã cho phép ứng dụng tải tệp bằng `getBlob`. Nếu đổi tên miền, cập nhật CORS riêng cho bucket.

```json
[{"origin":["https://TEN_MIEN_UNG_DUNG"],"method":["GET","HEAD"],"responseHeader":["Content-Type","Content-Disposition"],"maxAgeSeconds":3600}]
```

## Phát hành giao diện

```text
node scripts/build.mjs
node --test tests/security.test.mjs
firebase deploy --only hosting --project tidy-booking-zmln4
```

Giao diện phát hành: https://minh-chung-thi-dua-dong-thap-2026.thinhne3195.chatgpt.site

Trước đợt thi đua chính thức, kiểm tra bằng quản trị viên và hai tài khoản đơn vị trên hai thiết bị:

- Đăng nhập đúng/sai mật khẩu; tài khoản không được cấp quyền không đọc được dữ liệu.
- Đơn vị A không sửa được hồ sơ B; không tự chấm điểm duyệt qua API; chat của A–B không đọc được bằng tài khoản C.
- Gửi hồ sơ, tải PDF/ảnh, kiểm tra cập nhật phía tài khoản khác, phản hồi và chấm điểm.
- Hai người sửa đồng thời: bản cũ bị từ chối thay vì ghi đè.
- Đổi mật khẩu, đặt hạn nộp, khóa hồ sơ và kiểm tra nhật ký.
- Tạo tin nhắn thử, dùng công cụ quản trị đưa `expiresAt` về quá khứ và xác minh tác vụ xóa sau lượt chạy; không chờ 7 ngày để thử. Chỉ thực hiện trên dữ liệu thử của chính người kiểm tra.
- Đối chiếu lại các chênh lệch tiêu chí Đảng/UBND và bổ sung bộ Quân sự trước công bố kết quả chính thức.

Đã kiểm tra trực tiếp bằng hai tài khoản đơn vị và tài khoản quản trị: đăng nhập, tải tệp, quyền đọc, từ chối sửa trực tiếp, đồng bộ thời gian thực, nộp, duyệt, chấm điểm, điểm vượt trần, chat riêng và phân quyền quản trị. Hồ sơ, chat và tệp kiểm thử đã được xóa sau khi xác nhận. Chưa chạy emulator do máy thiếu Java; chưa đợi đủ 7 ngày để quan sát lịch xóa chat.

## Vận hành

Không thay đổi thứ tự ID điều kiện sau khi đã có hồ sơ. Nếu được cung cấp văn bản sửa đổi, lập phiên bản tiêu chí và chuyển dữ liệu có kiểm soát. Thiết lập sao lưu Firestore theo chính sách đơn vị. Giới hạn tệp là 10 MB và 10 tệp/điều kiện. Tệp đã tải nhưng chưa được gắn vào hồ sơ có thể tồn tại trong Storage; nên kiểm kê và dọn tệp mồ côi theo chính sách lưu trữ, không tự động xóa tệp đang được tham chiếu.

Không có tính năng AI tự chấm điểm hay tự sửa tiêu chí chính thức. Kết quả do quản trị viên quyết định, có lưu nhật ký.

### Bản cập nhật quản lý bộ tiêu chí và giải trình

Frontend đọc `criteria` theo thời gian thực, kế thừa tiêu chí ban đầu từ gói ứng dụng. Admin gọi `updateCriterion`; các phiên bản trước/sau lưu ở `criteria/{id}/history`, không xóa cứng tiêu chí hay hồ sơ. `saveSubmission` kiểm tra lại phiên bản/trạng thái tiêu chí trong giao dịch và lưu `criterionRevision`.

Các hàm `sendExplanation`, `respondExplanation` lưu luồng ở `explanations/{unitId}__{criterionId}`, lịch sử bất biến trong `messages`. Rules chỉ cho đơn vị đọc giải trình của mình; admin được đọc toàn bộ. Client không có quyền ghi trực tiếp. Khi khóa, Storage Rules chặn tạo tệp mới; hàm lưu hồ sơ vẫn kiểm tra khóa, hạn nộp và quyền đơn vị. Không chạy lại tập lệnh seed trên cơ sở dữ liệu đang dùng vì sẽ ghi đè tiêu chí đã chỉnh sửa.
