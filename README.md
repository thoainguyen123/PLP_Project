# PLP — Project Legal Prototype

Prototype quản lý pháp lý dự án theo giao diện NovaGroup.

## Chạy giao diện

Mở `login.html` hoặc `index.html` bằng Edge/Chrome. Đăng nhập, quên mật khẩu và đặt lại mật khẩu là luồng minh họa.

## Luồng M&A hiện tại

- Menu có **Tiếp nhận yêu cầu** và **Danh mục yêu cầu**.
- Tiếp nhận gồm **Chờ tiếp nhận** (mặc định), **Đã tiếp nhận**, **Đã từ chối**.
- Mở yêu cầu để xem thông tin và file; đồng ý/từ chối phải nhập lý do.
- Yêu cầu được đồng ý có 3 tab: **Phân loại hồ sơ**, **Đánh giá thẩm định**, **Trả kết quả cho IND**.
- Phân loại từng tài liệu theo nhóm/hạng mục và bấm **Lưu**.
- Có quản lý người dùng, chi tiết người dùng, khóa/mở khóa và import CSV.

Dữ liệu minh họa lưu trong localStorage/IndexedDB trên trình duyệt. API đồng bộ IND và phân quyền tài khoản chưa được kết nối thật.

## Dữ liệu trong repository công khai

Bản công khai giữ mã nguồn và bộ hồ sơ IND giả lập. Không chứa PDF pháp lý nội bộ, nội dung OCR từ PDF thật, danh mục nguồn SharePoint/NovaInsight, tài liệu BRD nội bộ hay token/API key. Cây lưu trữ dùng dự án minh họa; thư viện nghiên cứu và nguồn chatbot ban đầu để trống.

## Chạy máy chủ AI cục bộ (tùy chọn)

Cần Python và các gói trong `requirements-plp.txt`:

```powershell
python -m pip install -r requirements-plp.txt
python plp_server.py
```

Mở http://127.0.0.1:8765/ . Provider AI cấu hình riêng tại `%LOCALAPPDATA%/NovaGroupPLP/provider.json`, không lưu trong repository:

```json
{"base_url":"https://your-provider.example/v1","api_key":"YOUR_API_KEY","model":"YOUR_MODEL"}
```

Kiểm tra tên trường cấu hình mà gateway sử dụng trước khi kết nối provider. Repository không kèm thông tin xác thực hoặc dữ liệu tra cứu nội bộ.

## Đóng gói

```powershell
python package_prototype.py
```

Tạo bản HTML độc lập và ZIP từ các file có trong thư mục. Không bổ sung tài liệu thật hoặc khóa truy cập vào bản công khai.
