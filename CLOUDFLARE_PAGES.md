# Cloudflare Pages — Cantin POS

Repo này dùng cấu trúc Cloudflare Pages Functions có sẵn:

- Frontend: `public/`
- Backend: `functions/api/[[path]].js`
- Framework preset: `None`
- Build command: để trống
- Build output directory: `public`
- Production branch: `main`

## Tự động deploy từ GitHub

Cách khuyến nghị là dùng Cloudflare Pages Git integration.

1. Trong Cloudflare Dashboard mở **Workers & Pages**.
2. Chọn Pages project đang nối với repo `donguyenhien1315/Cantin` hoặc tạo Pages project mới bằng **Connect to Git**.
3. Chọn repository `Cantin`.
4. Cấu hình build theo các giá trị phía trên.
5. Trong **Settings → Builds → Branch control**:
   - Production branch: `main`
   - Preview branches: bật cho các branch khác.

Khi Git integration đã bật:

- Push lên `main` sẽ tự động cập nhật bản production.
- Push lên `cantin-pos-kiot-inspired` sẽ tạo preview deployment nếu preview branches đang bật.
- Pull Request từ branch này vào `main` có thể nhận preview URL và trạng thái deploy ngay trong GitHub.

## Quy trình phát hành

1. Làm thay đổi trên branch `cantin-pos-kiot-inspired`.
2. GitHub Actions chạy kiểm tra tĩnh và cú pháp JavaScript.
3. Cloudflare Pages tạo preview từ branch/PR.
4. Kiểm tra bản preview.
5. Merge PR vào `main` để Cloudflare tự deploy production.

Không đưa Cloudflare API token vào mã nguồn. Nếu sau này chuyển sang Wrangler/GitHub Actions deploy trực tiếp, token phải được lưu trong GitHub Actions Secrets.
