# Memento FE + Supabase

FE React/Vite đã nối với Supabase của ứng dụng Non_F. Giao diện công khai nằm trong `.design-source/src/app/App.tsx`; kết nối và màn nghiệp vụ nằm trong `src/backend/`.

## Chạy local

```sh
npm install
npm run dev
```

Đã tạo `.env.local` từ public configuration trong ZIP. File được Git bỏ qua. Khi chạy máy khác hoặc deploy FE, điền biến theo `.env.example`:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: URL và public key.
- `VITE_HCAPTCHA_SITE_KEY`: public site key; Supabase đang bật CAPTCHA.
- `VITE_PAYMENT_BANK`, `VITE_PAYMENT_ACCOUNT`, `VITE_PAYMENT_ACCOUNT_NAME`: thông tin nhận tiền từ cấu hình ứng dụng gốc.

Không đưa service_role, secret key, mật khẩu database hoặc mật khẩu người dùng vào biến VITE_*. Các biến này được đưa vào bundle trình duyệt. Đã xóa file tài khoản mock khỏi FE.

## Chức năng đã nối

- Auth: đăng nhập/đăng xuất, session, Google OAuth, đăng ký, gửi link khôi phục/cập nhật mật khẩu và CAPTCHA.
- Role từ profiles: customer ánh xạ sang client; không lấy quyền từ localStorage tự khai báo.
- Danh sách/tìm kiếm/hồ sơ thợ, bảng giá, portfolio, thống kê thật; loại hồ sơ tài khoản bị khóa/xóa.
- Yêu thích lưu trên server, đánh giá qua RPC, thông báo và đánh dấu đã đọc.
- Tạo đơn pending bằng giá dịch vụ thật, thông tin liên hệ, ngày/giờ. Không báo thành công khi API lỗi.
- Quản lý đơn: chấp nhận/từ chối, hủy, yêu cầu hủy có đồng thuận, xác nhận chụp, bàn giao Drive, góp ý ảnh, hoàn tất và thông tin hoàn tiền.
- Chuyển khoản cọc 20%, số dư 80%; admin đối soát mới cập nhật. Không giả lập MoMo/thẻ. Chủ project cần xác nhận tài khoản nhận tiền trước khi dùng thanh toán thực.
- Chat theo đơn, inbox/realtime; upload portfolio và avatar.
- Thợ cập nhật thông tin/portfolio/bảng giá qua update_my_ptg_profile; khách gửi hồ sơ xét duyệt.
- Admin: người dùng, khóa/mở khóa, danh sách thợ, duyệt hồ sơ qua RPC, đơn/đối soát và ẩn/hiện đánh giá. Dashboard/biểu đồ lấy dữ liệu thật; giá trị đơn hoàn thành chưa trừ hoa hồng.

## Phần cần xác minh khi chạy thật

- Người dùng tự hoàn tất CAPTCHA. Nếu widget báo sai domain, thêm hostname FE vào hCaptcha, không tắt bảo vệ để né lỗi.
- Thêm URL FE vào Supabase Auth URL Configuration để xác nhận/khôi phục/OAuth quay về đúng nơi. Google OAuth cần cấu hình phía project.
- Đã kiểm tra đăng nhập admin, dashboard và đọc các màn người dùng, đơn, hồ sơ chờ duyệt, đánh giá bằng tài khoản thật. Chưa kiểm thử ghi dữ liệu và hai vai trò customer/photographer. Không tự tạo đơn, gửi tin, gửi email khôi phục hay ghi nhận tiền trong kiểm tra kết nối.
- RLS/RPC phía server quyết định quyền. Route guard chỉ điều khiển giao diện. Truy vấn public thành công không chứng minh dữ liệu riêng được bảo vệ đúng: chủ project cần kiểm tra chính sách profiles và photographer_applications, nhất là dữ liệu liên hệ/định danh.
- Danh mục lấy từ tag thợ; chưa có API quản lý danh mục độc lập hay lưu cài đặt hệ thống. Màn cài đặt thông báo chưa hỗ trợ.
- FE không suy đoán lịch bận khách khác từ bảng riêng tư. Thợ xác nhận lịch sau khi nhận yêu cầu; cần API availability và kiểm soát trùng lịch phía server nếu muốn khóa slot ngay.
- Push notification native, Firebase analytics và các luồng riêng Android không thuộc FE web này.

## Kiểm tra

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run check:backend
```

check:backend chỉ đọc bằng public key, không đăng nhập/ghi; kiểm tra 8 bảng và RPC get_photographers_stats. Bảng trả rỗng có thể do RLS.

npm test chạy 6 kiểm tra tách khỏi Supabase thật: chuẩn hóa giá, chia cọc, lỗi tạo đơn, tự đặt lịch, cập nhật 0 dòng do RLS và thống kê theo năm/trạng thái.

Kiểm thử thủ công: đăng nhập qua CAPTCHA → kiểm tra role → tìm thợ/hồ sơ/bảng giá → tạo đơn thử đã thống nhất → kiểm tra bằng tài khoản thợ. Chỉ thử thanh toán trên dữ liệu thử được chủ project chỉ định.

## Đồng bộ dữ liệu thật

FE gọi Supabase qua VITE_SUPABASE_URL trong .env.local. Danh mục và số lượng thợ được tính từ hồ sơ trả về; đánh giá, avatar và thống kê lấy từ database. Không dùng lịch trống giả hoặc thay thế hồ sơ không tồn tại bằng thợ đầu tiên. Khi API lỗi, hiển thị lỗi; khi database rỗng, hiển thị trạng thái trống. Ảnh trang trí và nhãn giao diện là tài nguyên UI, không phải dữ liệu nghiệp vụ mẫu.

Subscriptions theo dõi photographers, photographer_reviews, bookings, notifications, pinned_photographers và các bảng quản trị phù hợp vai trò. Các bảng cần được bật trong publication Realtime phía Supabase để đẩy thay đổi ngay. FE cũng đồng bộ lại mỗi 30 giây khi tab đang hiển thị, và khi quay lại tab.

## Google Analytics: biểu đồ Memento, không cần đăng nhập Google trên FE

Dashboard và Cài đặt Analytics đọc dữ liệu qua GET /api/analytics. Không dùng iframe Looker Studio. Người dùng chỉ cần phiên Supabase có role admin đang hoạt động. Backend xác thực token bằng Supabase Auth và đọc role từ profiles trước mỗi lần trả báo cáo, kể cả cache.

Báo cáo gồm: tổng người dùng, người dùng hoạt động/mới, phiên, lượt xem, sự kiện, biểu đồ theo ngày và các bảng nguồn truy cập, thiết bị/hệ điều hành, quốc gia, sự kiện. Chọn 7/30/90 ngày và tất cả nền tảng hoặc chỉ web/Android/iOS. Tất cả nền tảng bao gồm dữ liệu app cũ. Không dùng số liệu demo; lỗi API được hiển thị và dữ liệu rỗng có trạng thái riêng. Đây không phải số người online realtime.

### Backend local

Trong .env.local (được Git bỏ qua), cấu hình:

- GA4_PROPERTY_ID: ID số của property GA4.
- GOOGLE_APPLICATION_CREDENTIALS: đường dẫn tuyệt đối tới JSON Service Account nằm ngoài repo.
- VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY: public configuration dùng xác thực admin.

Chạy npm run dev. Vite có middleware backend tại /api/analytics. Không dùng vite preview để test API này vì preview chỉ phục vụ file build tĩnh. Cần khởi động lại Vite khi cập nhật cấu hình backend.

Backend dùng OAuth scope analytics.readonly, ký JWT bằng private key ở server. Không chuyển private key, Google access token hay JSON credentials cho trình duyệt. Báo cáo cache trong bộ nhớ tối đa 60 giây; FE tự đồng bộ lại mỗi 60 giây khi tab đang hiển thị. Cache không thay thế bước kiểm tra admin. Các bảng phân nhóm chỉ lấy 20 hàng đầu; người dùng có thể xuất hiện trong nhiều nhóm nên không cộng các hàng để suy ra tổng.

### Khi deploy Vercel (chưa thực hiện)

Deploy cả api/analytics.mjs và server/ cùng FE. Đặt các biến sau trong Vercel backend environment:

- GA4_PROPERTY_ID.
- GOOGLE_SERVICE_ACCOUNT_JSON: toàn bộ JSON Service Account trong biến môi trường riêng, KHÔNG có tiền tố VITE_. Không upload file vào public/ hoặc commit Git.
- VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY, hoặc SUPABASE_URL và SUPABASE_ANON_KEY tương ứng cho backend.
- VITE_GA_MEASUREMENT_ID: public ID G-... để FE gửi dữ liệu website.

Service Account cần quyền Viewer trong đúng property, và Google Analytics Data API phải bật trong Google Cloud project. Không cấp role Owner Google Cloud chỉ để đọc Analytics. Chưa cần thay đổi SQL/database để đọc báo cáo GA4.

### Tracking website

Giữ VITE_GA_MEASUREMENT_ID cho luồng Web. Tracking local mặc định tắt; VITE_GA_ENABLED_IN_DEV=true chỉ dùng khi chủ động kiểm thử. Các page_view được gửi thủ công cho điều hướng React state với send_page_view=false. Sự kiện booking_created chỉ gửi sau khi server tạo đơn thành công; sign_up chỉ gửi khi phản hồi tạo tài khoản hợp lệ. Chuyển đổi phát sinh ở màn riêng tư được giữ trong bộ nhớ và gửi khi quay về màn được phép; mất khi tải lại trang. Chưa ghi nhận purchase vì không có bằng chứng thanh toán ở sự kiện bấm nút.

Không gửi email, điện thoại, ID Supabase, token, ghi chú đơn hay dữ liệu ngân hàng. Các màn riêng tư và admin tắt thu thập bằng cờ ga-disable. Chủ website kiểm tra chính sách/consent và Enhanced Measurement trong GA4 trước khi bật production; không bật thêm automatic pageviews theo history để tránh đếm trùng. Tài liệu: https://developers.google.com/analytics/devguides/collection/ga4/views

Kiểm tra: npm run typecheck, npm test, npm run lint, npm run build. Các bài test API dùng credentials RSA sinh trong bộ nhớ và transport giả, không gọi Google hay ghi dữ liệu thật.
