# 💎 NovaPay — Hệ Thống Ví Điện Tử 

> **Nền tảng ví điện tử hiệu năng cao xây dựng theo kiến trúc Microservices, hỗ trợ quản lý số dư, chuyển tiền P2P tức thì, liên kết ngân hàng và bảo mật đa lớp.**

* **Backend:** Java 17 | Spring Boot 3.x | Spring Cloud (Eureka, Gateway) | Spring Security
* **Frontend:** React 18 | Vite | Tailwind CSS
* **Database & Broker:** PostgreSQL 17 | RabbitMQ
* **DevOps:** Docker | Docker Compose | Nginx

---

## I. Giới Thiệu Tổng Quan

**NovaPay** là giải pháp ví điện tử mô phỏng hệ sinh thái tài chính phân tán hiện đại, giải quyết các bài toán cốt lõi:
* **Khả năng mở rộng (Scalability):** Tách biệt các domain nghiệp vụ độc lập theo mô hình *Database-per-Service*.
* **Bảo mật đa tầng:** Xác thực người dùng qua JWT, mã PIN 6 số cho giao dịch và Step-Up OTP 120s đối với các giao dịch giá trị cao.
* **Xử lý bất đồng bộ:** Tích hợp Message Broker (RabbitMQ) để xử lý gửi email và thông báo mà không làm nghẽn luồng xử lý giao dịch chính.

## II. Kiến Trúc Hệ Thống & Luồng Hoạt Động (Architecture & Flow)

Hệ thống được thiết kế theo mô hình Microservices kết hợp Event-Driven Architecture, áp dụng nguyên tắc Database-per-Service để đảm bảo tính độc lập dữ liệu giữa các nghiệp vụ.
<img width="1928" height="1142" alt="kien truc ht" src="https://github.com/user-attachments/assets/8b485068-b0ef-40a7-8ad4-3d96bb0ebd5f" />

## III. Công Nghệ Sử Dụng (Tech Stack)

Hệ thống được xây dựng trên nền tảng các công nghệ hiện đại, phân tách rõ ràng theo từng tầng kiến trúc:

### 1. Backend & Microservices
* **Ngôn ngữ:** Java 17 (LTS)
* **Framework cốt lõi:** Spring Boot 3.x
* **Hệ sinh thái Cloud:** Spring Cloud 2023
  * **Eureka Server:** Quản lý đăng ký và phát hiện dịch vụ (Service Discovery & Registry).
  * **Spring Cloud Gateway:** Cổng API tập trung, lọc xác thực và định tuyến phản ứng (Reactive Routing).
  * **OpenFeign:** Giao tiếp HTTP REST đồng bộ giữa các microservices.
* **Bảo mật (Security):** Spring Security 6, JWT (JSON Web Token), mã hóa mật khẩu & mã PIN với BCrypt.
* **ORM & Data Access:** Spring Data JPA, Hibernate.
* **Giao tiếp Realtime:** Spring WebSocket, giao thức STOMP, SockJS.

### 2. Frontend Client
* **Thư viện chính:** React 18 (SPA)
* **Công cụ đóng gói (Build Tool):** Vite 
* **Giao diện & Styling:** Tailwind CSS, Lucide Icons 
* **Quản lý trạng thái (State Management):** Zustand
* **Kết nối API:** Axios 
* **Biểu đồ dữ liệu:** Chart.js, React-Chartjs-2

### 3. Database & Message Broker
* **Cơ sở dữ liệu:** PostgreSQL 17
  * Áp dụng kiến trúc **Database-per-Service** (5 database riêng biệt: `identity_db`, `wallet_db`, `transaction_db`, `audit_db`, `notification_db`).
  * Sử dụng cơ chế khóa **Pessimistic Locking (`SELECT FOR UPDATE`)** để đảm bảo tính toàn vẹn số dư ví khi giao dịch.
* **Message Broker:** RabbitMQ 3.13 (giao thức AMQP)
  * Xử lý gửi mã OTP và email thông báo giao dịch bất đồng bộ.
  * Tách rời tải hệ thống, tránh nghẽn luồng xử lý chính.

### 4. DevOps & Triển Khai
* **Container hóa:** Docker, Dockerfile multi-stage build.
* **Điều phối dịch vụ:** Docker Compose.
* **Web Server:** Nginx Alpine.

## IV. Tính Năng Chính & Điểm Nhấn Kỹ Thuật (Key Features & Highlights)

### 1. Nghiệp Vụ Người Dùng 
* **Xác thực & Định danh (Auth & KYC):**
  * Đăng ký, đăng nhập tài khoản an toàn qua JWT & Refresh Token rotation.
  * Thiết lập và quản lý **mã PIN giao dịch 6 chữ số** (mã hóa chuẩn BCrypt).
  * Tính năng quên mã PIN: Xác thực thông qua mã OTP bảo mật gửi tự động về email.
* **Quản lý Số Dư & Tài Khoản Ngân Hàng:**
  * Theo dõi số dư khả dụng theo thời gian thực (hỗ trợ ẩn/hiện số dư nhạy cảm).
  * Liên kết tài khoản ngân hàng chính chủ 
* **Nghiệp vụ Thanh Toán & Chuyển Tiền:**
  * **Nạp tiền (Topup):** Nạp tiền từ ngân hàng liên kết vào ví tức thì.
  * **Chuyển tiền nội bộ (P2P):** Chuyển tiền qua số điện thoại hoặc email giữa các ví NovaPay.
  * **Chuyển tiền liên ngân hàng (NAPAS 24/7):** Chuyển tiền trực tiếp đến số tài khoản ngân hàng thụ hưởng.
  * **Rút tiền (Withdraw):** Rút tiền từ ví về tài khoản ngân hàng liên kết chính chủ.
  * **Thanh toán dịch vụ tiện ích:** Hỗ trợ thanh toán hóa đơn Điện, Nước, Internet, Nạp Data 4G.
* **Lịch Sử Giao Dịch & Biến Động Số Dư:**
  * Tra cứu toàn bộ lịch sử nạp, rút, chuyển, nhận tiền kèm bộ lọc thời gian và trạng thái chi tiết.

### 2. Nghiệp Vụ Quản Trị Viên 
* **Bảng điều khiển tổng quan (Dashboard):** Thống kê tổng số lượng người dùng, tổng tiền lưu thông trong hệ thống, doanh thu phí dịch vụ và biểu đồ dòng tiền trực quan.
* **Quản trị người dùng & Ví:** Khóa/Mở khóa tài khoản người dùng, xem trạng thái định danh KYC.
* **Cấu hình tham số hệ thống động (Dynamic System Config):**
  * Admin có thể điều chỉnh biểu phí (phí rút tiền, tỷ lệ phí chuyển tiền, hoa hồng tiện ích), hạn mức giao dịch trong ngày, và ngưỡng yêu cầu OTP trực tiếp trên giao diện.
  * Chế độ bảo trì hệ thống (Maintenance Mode) bật/tắt tức thời.
* **Kiểm toán hoạt động hệ thống (Audit Logs):** Ghi nhận chi tiết từng hành động quan trọng trong hệ thống để giám sát bảo mật và điều tra sự cố.

### 3. Điểm Nhấn Kỹ Thuật 

#### A. Bảo mật đa tầng & Xác thực Step-Up OTP (Multi-Factor Security)
* Giao dịch thông thường chỉ yêu cầu **Mã PIN 6 số**.
* Đối với các giao dịch có giá trị lớn vượt ngưỡng rủi ro (mặc định từ 2.000.000 VNĐ), hệ thống tự động kích hoạt lớp bảo vệ thứ 3: **Mã OTP đếm ngược 120 giây** gửi trực tiếp về email của người dùng. Giao dịch chỉ hoàn tất khi nhập đúng cả mã PIN và mã OTP hợp lệ.

#### B. Chống chi tiêu kép & Xung đột dữ liệu 
* Trong hệ thống ví điện tử, nếu 2 giao dịch cùng lúc cố gắng trừ tiền từ 1 tài khoản, rất dễ xảy ra lỗi race-condition dẫn tới âm tiền.
* NovaPay áp dụng cơ chế **Pessimistic Locking (`SELECT ... FOR UPDATE`)** trên bảng `wallets` trong cơ sở dữ liệu PostgreSQL. Mọi giao dịch chạm vào ví đều phải giữ khóa bản ghi cho đến khi hoàn thành `COMMIT`, kết hợp ràng buộc cứng tại tầng database: `CHECK (balance >= 0)`.

#### C. Chống xử lý trùng lặp giao dịch (Idempotency Key)
* Mỗi yêu cầu giao dịch tạo ra đều mang một khóa duy nhất (`idempotency_key`).
* Nếu người dùng vô tình bấm nút 2 lần do mạng lag, hoặc request bị gửi lại (retry), hệ thống sẽ kiểm tra bảng `idempotency_keys` để đảm bảo giao dịch **chỉ được thực thi đúng 1 lần duy nhất**, tránh trừ tiền trùng lặp.

#### D. Kiến trúc hướng sự kiện bất đồng bộ (Event-Driven with RabbitMQ)
* Tác vụ gửi email mã OTP và email thông báo mất từ 1 - 3 giây do độ trễ mạng của SMTP server.
* Hệ thống sử dụng **RabbitMQ** để xử lý bất đồng bộ (Asynchronous): `transaction-service` chỉ cần đẩy event vào queue và trả kết quả thành công cho người dùng trong chưa đầy **50ms**. `notification-service` sẽ tiêu thụ message ở background để gửi email, đảm bảo trải nghiệm người dùng mượt mà nhất.

#### E. Mô hình Database-per-Service
* Mỗi service sở hữu một schema/database hoàn toàn độc lập (`identity_db`, `wallet_db`, `transaction_db`, `audit_db`, `notification_db`).
* Không có hiện tượng query chéo database (Cross-database join), đảm bảo tính cô lập dữ liệu và sẵn sàng tách ra deploy trên các cụm server vật lý riêng biệt khi hệ thống mở rộng.

#### V. Cấu Trúc Thư Mục Dự Án (Project Structure)

Dự án được tổ chức tách biệt rõ ràng giữa Backend (các Microservices), Frontend (Giao diện người dùng) và các tệp cấu hình triển khai Docker:

```plaintext
mini-ewallet-microservices/
├── backend/                               # Mã nguồn toàn bộ các Microservices
│   ├── api-gateway/                       # Cổng định tuyến API Gateway, lọc JWT tập trung (Port: 8080)
│   ├── discovery-server/                  # Eureka Server quản lý đăng ký & phát hiện dịch vụ (Port: 8761)
│   ├── identity-service/                  # Quản lý tài khoản, đăng nhập, mã PIN 6 số, định danh KYC (Port: 8081)
│   ├── wallet-service/                    # Quản lý số dư, khóa số dư, liên kết ngân hàng (Port: 8082)
│   ├── transaction-service/               # Chuyển tiền P2P, Napas 24/7, tiện ích & xác thực OTP 120s (Port: 8083)
│   ├── audit-service/                     # Ghi nhận Audit Log hệ thống & cấu hình tham số động (Port: 8084)
│   ├── notification-service/              # Lắng nghe RabbitMQ, gửi email mã OTP & thông báo (Port: 8085)
│   └── database/                          # 5 database độc lập
│       
├── frontend/                              # Ứng dụng Web Single Page Application (SPA)
│   ├── public/                            # Tài nguyên tĩnh, favicon & logo thương hiệu NovaPay
│   ├── src/
│   │   ├── api/                           # Cấu hình Axios Client, Interceptors tự động gắn Token JWT
│   │   ├── components/                    # Các thành phần giao diện dùng chung (Navbar, Modal mã PIN, Modal OTP 120s)
│   │   ├── pages/                         # Các trang chức năng (Dashboard, Nạp/Rút tiền, Chuyển tiền, Admin Portal)
│   │   ├── store/                         # Quản lý trạng thái toàn cục ứng dụng với Zustand
│   │   ├── App.jsx                        # Quản lý định tuyến (Routing) và bảo vệ route theo quyền hạn (Role)
│   │   └── main.jsx                       # Điểm khởi chạy chính của React
│   └── Dockerfile                         # Cấu hình đóng gói Frontend qua Nginx Alpine multi-stage
├── docker-compose.yml                     # Tệp điều phối khởi chạy đồng loạt 9 container dịch vụ
├── .env.example                           # Mẫu cấu hình các biến môi trường (Database, RabbitMQ, Mail)
└── README.md                              # Tài liệu hướng dẫn dự án
```

## VI. Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### 1. Yêu cầu môi trường (Prerequisites)
Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
* [Git](https://git-scm.com/) (để clone mã nguồn)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (phiên bản hỗ trợ Docker Compose v2 trở lên)
* [PostgreSQL 17](https://www.postgresql.org/) (chạy trên máy host tại cổng `5432`)

---

### 2. Các bước triển khai chi tiết

#### Bước 2.1: Clone mã nguồn về máy
```bash
git clone https://github.com/tb1204/mini-ewallet-microservices.git
cd mini-ewallet-microservices
```

#### Bước 2.2: Khởi tạo Cơ Sở Dữ Liệu & Dữ liệu mẫu (Seed Data)
Hệ thống cần 5 database độc lập cho từng microservice. Toàn bộ các script đã được chuẩn bị sẵn trong thư mục `backend/database/`.

* **Trên Windows PowerShell:**
```powershell
$env:PGPASSWORD="postgresql"
psql -U postgres -h localhost -f backend/database/00_init_databases.sql
psql -U postgres -h localhost -d identity_db -f backend/database/01_identity_db.sql
psql -U postgres -h localhost -d wallet_db -f backend/database/02_wallet_db.sql
psql -U postgres -h localhost -d transaction_db -f backend/database/03_transaction_db.sql
psql -U postgres -h localhost -d audit_db -f backend/database/04_audit_db.sql
psql -U postgres -h localhost -d notification_db -f backend/database/05_notification_db.sql
```

* **Trên Linux / macOS (Terminal):**
```bash
export PGPASSWORD="postgresql"
psql -U postgres -h localhost -f backend/database/00_init_databases.sql
psql -U postgres -h localhost -d identity_db -f backend/database/01_identity_db.sql
psql -U postgres -h localhost -d wallet_db -f backend/database/02_wallet_db.sql
psql -U postgres -h localhost -d transaction_db -f backend/database/03_transaction_db.sql
psql -U postgres -h localhost -d audit_db -f backend/database/04_audit_db.sql
psql -U postgres -h localhost -d notification_db -f backend/database/05_notification_db.sql
```
*(Lưu ý: Thay `postgresql` bằng mật khẩu tài khoản postgres của máy bạn nếu có thay đổi).*

#### Bước 2.3: Thiết lập biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
# Trên Windows PowerShell:
Copy-Item .env.example .env

# Trên Linux / macOS:
cp .env.example .env
```
*(Nếu cần gửi email OTP thực tế, bạn có thể điền thông tin tài khoản Gmail App Password vào các biến `SPRING_MAIL_USERNAME` và `SPRING_MAIL_PASSWORD` trong file `.env`).*

#### Bước 2.4: Khởi chạy toàn bộ hệ thống bằng Docker Compose
Chạy 1 câu lệnh duy nhất để build và kích hoạt đồng loạt 9 container:
```bash
docker compose up -d --build
```

Kiểm tra trạng thái các container đang chạy:
```bash
docker compose ps
```
Khi thấy cả 9 container (`frontend`, `api-gateway`, `identity-service`, `wallet-service`, `transaction-service`, `audit-service`, `notification-service`, `discovery-server`, `rabbitmq`) đều ở trạng thái `Up`, hệ thống đã sẵn sàng hoạt động!

---

### 3. Danh sách đường dẫn truy cập dịch vụ

| Dịch vụ | Địa chỉ truy cập (URL) | Mô tả chi tiết |
| :--- | :--- | :--- |
| **Giao diện Web NovaPay** | [http://localhost:3000](http://localhost:3000) | Giao diện ví người dùng & Cổng quản trị Admin |
| **API Gateway** | [http://localhost:8080](http://localhost:8080) | Cổng đón tiếp API tập trung của toàn hệ thống |
| **Eureka Discovery Dashboard** | [http://localhost:8761](http://localhost:8761) | Bảng theo dõi trạng thái nhịp tim các Microservices |
| **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) | Quản lý hàng đợi tin nhắn (Tài khoản: `guest` / `guest`) |

---

### 4. Tài khoản kiểm thử có sẵn (Demo Credentials)

Sau khi chạy xong các script database ở Bước 2.2, bạn có thể đăng nhập ngay bằng các tài khoản sau mà không cần tạo mới:

| Vai trò | Email / Tên đăng nhập | Mật khẩu | Mã PIN giao dịch | Số dư ban đầu |
| :--- | :--- | :--- | :---: | :---: |
| **Quản trị viên (Admin)** | `admin@novapay.com` (hoặc `admin`) | `admin123` | `123456` | 500.000.000 VNĐ |
| **Người dùng A (Người gửi)** | `user@novapay.com` (hoặc `nguyenvana`) | `user123` | `123456` | 25.450.000 VNĐ |
| **Người dùng B (Người nhận)** | `tranthib@novapay.com` (hoặc `tranthib`) | `user123` | `123456` | 12.300.000 VNĐ |

## VII. Một số giao diện 
#### Giao diện người dùng
<img width="1582" height="916" alt="1a" src="https://github.com/user-attachments/assets/4918ee1f-214c-4a7f-bcb1-f9492ea10c7f" />
<img width="1586" height="919" alt="2a" src="https://github.com/user-attachments/assets/b339bd6d-ed85-41f8-bc3c-abf4293a2fc7" />
<img width="1564" height="916" alt="3a" src="https://github.com/user-attachments/assets/e8fd5f58-ce08-4efb-bd7b-cf8ce1d30beb" />
<img width="1538" height="916" alt="4a" src="https://github.com/user-attachments/assets/69ae5a1f-c5fc-4271-9a55-9a2261f845e8" />
<img width="1544" height="917" alt="5a" src="https://github.com/user-attachments/assets/16da91d4-2f46-4389-b7ec-006cbc99f7a2" />

#### Giao diện quản lý
<img width="1900" height="903" alt="6a" src="https://github.com/user-attachments/assets/4fccdb1f-e269-4189-9e0f-23aa1346115f" />
<img width="1882" height="898" alt="7a" src="https://github.com/user-attachments/assets/cfa8589a-0691-48df-8a6a-a59f487d4678" />
<img width="712" height="759" alt="8a" src="https://github.com/user-attachments/assets/3ea4dac4-9b6a-4702-8344-82a722ebe621" />


---

## VIII. Hướng Phát Triển Trong Tương Lai (Future Improvements)

1. **Tích hợp cổng thanh toán thực tế (Payment Gateway Integration):**
   * Kết nối cổng thanh toán Napas VietQR, VNPay hoặc MoMo Payment Gateway để nạp/rút tiền qua tài khoản ngân hàng thực tế.
2. **Giám sát & Đo kiểm phân tán (Observability & Distributed Tracing):**
   * Tích hợp **Prometheus** và **Grafana** để thu thập metrics thời gian thực (CPU, Ram, JVM, API Latency).
   * Triển khai **OpenTelemetry / Zipkin** để truy vết luồng request (Distributed Tracing) xuyên suốt qua các Microservices.
3. **Mô hình Saga điều phối hoàn tiền (Orchestrated Saga Pattern):**
   * Nâng cấp cơ chế bù trừ giao dịch (Compensating Transactions) tự động hoàn tiền khi có sự cố mạng giữa các service.
4. **Bộ nhớ đệm phân tán (Distributed Cache with Redis):**
   * Ứng dụng Redis Cache để tăng tốc truy vấn số dư ví và lưu trữ mã OTP tạm thời với cơ chế tự động hết hạn (TTL).

---

## Thông Tin Tác Giả & Bản Quyền (Author & License)

* **Tác giả:** Trần Công Bằng ([@tb1204](https://github.com/tb1204))
* **Mục tiêu dự án:** Dự án Portfolio cá nhân thể hiện tư duy thiết kế kiến trúc hệ thống Microservices & Fintech Security.
* **Mã nguồn:** [https://github.com/tb1204/mini-ewallet-microservices](https://github.com/tb1204/mini-ewallet-microservices)
