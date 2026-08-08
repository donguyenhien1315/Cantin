# Cantin Nova 2.0

Ứng dụng quản lý căn tin: bán hàng, công nợ, kho, thu/chi, nhà cung cấp, đối soát ca và báo cáo.

## Nâng cấp chính v2.0

- Dashboard gọn: doanh số, thu, chi, công nợ, nợ nhà cung cấp, giá trị tồn kho.
- Bán hàng: giảm giá theo tiền/%; thanh toán hỗn hợp tiền mặt + chuyển khoản + ghi nợ; xem chi tiết và xóa đơn hoàn kho.
- Công nợ khách: chọn khoản nợ khi thanh toán; tự phân bổ nếu không chọn; ghi nhận thu nợ vào dòng tiền.
- Nhà cung cấp: danh sách NCC, nợ NCC và trả nợ NCC.
- Nhập kho: giá nhập, tổng tiền, số đã trả/còn nợ, phương thức thanh toán; cập nhật giá vốn bình quân.
- Thu/Chi: ghi thu/chi thủ công; các khoản tự động liên kết chứng từ gốc để tránh ghi trùng.
- Đối soát ca/két tiền: tiền đầu ca, tiền hệ thống, tiền thực tế và chênh lệch.
- Công nợ: lọc A–Z/Z–A, đã trả/còn nợ/tất cả, khoảng ngày; sửa chi tiết khoản nợ và lịch sử trả nợ.
- Trả nợ nhanh: tự điền tổng nợ; nhập `10` hoặc `10k` được hiểu là `10.000`.
- Giữ tương thích dữ liệu cũ; schema mới được bổ sung theo hướng tương thích ngược.

## Cấu trúc

- `public/` — frontend tĩnh
- `functions/api/[[path]].js` — API/backend engine
- `tests/static.mjs` — kiểm tra tĩnh

## Cloudflare Pages

- Framework preset: `None`
- Build command: để trống
- Build output directory: `public`
- Root directory: để trống

## Supabase

Ứng dụng tiếp tục dùng RPC:

- `cantin_read_store_public()`
- `cantin_write_store_public(p_data jsonb)`

Dữ liệu cũ được chuẩn hóa khi đọc để bổ sung các collection/config mới mà không cần xóa dữ liệu hiện có.

## Đưa lên GitHub

Giải nén ZIP, sau đó upload toàn bộ **nội dung bên trong thư mục** lên root repository để các thư mục `public`, `functions`, `tests` và file `README.md` nằm ngay cấp đầu tiên.


## Cập nhật giao diện công nợ
- Thanh điều hướng dưới rút còn 6 mục: Tổng quan, Bán hàng, Công nợ, Kho, Thu chi, Khác.
- Bỏ màn hình Hiệu quả kinh doanh và chỉ giữ trọng tâm Thu / Chi.
- Mặt hàng chuyển vào mục Khác.
- Công nợ có lọc A-Z/Z-A, Tất cả/Còn nợ/Đã trả và khoảng ngày.
- Có thể sửa ngày, số tiền, ghi chú của khoản nợ thủ công; khoản nợ từ đơn bán hàng cho sửa ngày/ghi chú nhưng khóa số tiền để không lệch đơn.
- Có thể sửa hoặc xóa từng lần trả nợ; sổ Thu / Chi được đồng bộ lại theo lịch sử trả nợ.
