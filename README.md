# Cantin Nova 1.0

App được dựng mới hoàn toàn về giao diện/frontend từ cấu trúc và schema dữ liệu của Cantin AI Next v4.13.0.

## Tương thích dữ liệu
Giữ đúng schema Supabase:
- products
- ingredients
- customers
- debts
- sales
- stockReceipts
- audits
- transactions
- snapshots
- aliases
- nhiều cửa hàng

Giữ RPC:
- cantin_read_store_public()
- cantin_write_store_public(p_data jsonb)

## Các màn hình
- Tổng quan
- Bán hàng
- Công nợ + backup/upload file nợ
- Kho: Kiểm kho + Nhập kho
- Mặt hàng
- Khác: Nguyên liệu, AI, Dữ liệu, Nhật ký

## Cloudflare Pages
- Framework preset: None
- Build command: để trống
- Build output directory: public
- Root directory: để trống

Backend giữ engine/action tương thích v4.13 để đọc dữ liệu cũ, nhưng frontend được viết lại.
