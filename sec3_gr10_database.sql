-- Equipment Rental System - Database Implementation

DROP DATABASE IF EXISTS sec3_gr10_database;
CREATE DATABASE sec3_gr10_database
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sec3_gr10_database;


-- TABLE: Administrators

CREATE TABLE Administrators (
    admin_id     INT            NOT NULL AUTO_INCREMENT,
    username	 VARCHAR(255)	NOT NULL,
    password     VARCHAR(255)   NOT NULL COMMENT 'Hashed password using bcrypt',
    role		 ENUM('superadmin', 'admin') NOT NULL DEFAULT 'admin',
    first_name   VARCHAR(100)   NOT NULL,
    last_name    VARCHAR(100)   NOT NULL,
    email        VARCHAR(100)   NOT NULL,
    phone        VARCHAR(15)    NOT NULL,
    CONSTRAINT pk_admin PRIMARY KEY (admin_id),
    CONSTRAINT uq_admin_email UNIQUE (email)
);


-- TABLE: Students

CREATE TABLE Students (
    student_id   VARCHAR(20)    NOT NULL COMMENT 'Actual university student ID',
    password     VARCHAR(255)   NOT NULL COMMENT 'Hashed password using bcrypt',
    first_name   VARCHAR(100)   NOT NULL,
    last_name    VARCHAR(100)   NOT NULL,
    email        VARCHAR(100)   NOT NULL,
    phone        VARCHAR(15),
    CONSTRAINT pk_student PRIMARY KEY (student_id),
    CONSTRAINT uq_student_email UNIQUE (email)
);


-- TABLE: Equipments_Models

CREATE TABLE Equipments_Models (
    model_id     INT            NOT NULL AUTO_INCREMENT,
    name         VARCHAR(200)   NOT NULL,
    brand        VARCHAR(100)   NOT NULL,
    category     ENUM(
                   'Computing',
                   'Production',
                   'Audio',
                   'Gaming',
                   'Connectivity',
                   'Power',
                   'Education'
                 ) NOT NULL,
    img_url      VARCHAR(255),
    details      TEXT,
    specs        TEXT,
    admin_id     INT            NOT NULL COMMENT 'Admin who added this model',
    CONSTRAINT pk_model PRIMARY KEY (model_id),
    CONSTRAINT fk_model_admin FOREIGN KEY (admin_id)
        REFERENCES Administrators(admin_id)
);


-- TABLE: Equipments_Items

CREATE TABLE Equipments_Items (
    item_id       INT           NOT NULL AUTO_INCREMENT,
    serial_number VARCHAR(20)   UNIQUE COMMENT 'Physical asset tag, e.g. 13/37',
    status        ENUM('Available','Borrowed','Maintenance') NOT NULL DEFAULT 'Available',
    admin_id      INT           NOT NULL COMMENT 'Admin who logged this item',
    model_id      INT           NOT NULL,
    CONSTRAINT pk_item PRIMARY KEY (item_id),
    CONSTRAINT fk_item_admin  FOREIGN KEY (admin_id)  REFERENCES Administrators(admin_id),
    CONSTRAINT fk_item_model  FOREIGN KEY (model_id)  REFERENCES Equipments_Models(model_id)
);


-- TABLE: Rental_Transactions

CREATE TABLE Rental_Transactions (
    transaction_id    INT           NOT NULL AUTO_INCREMENT,
    borrow_date       DATETIME      NOT NULL,
    due_date          DATETIME      NOT NULL,
    event_name        VARCHAR(255)  NOT NULL,
    reason            TEXT          NOT NULL,
    where_event       ENUM('ICT','Outside') NOT NULL,
    outside_location  VARCHAR(255),
    admin_id          INT           NOT NULL COMMENT 'Approving admin',
    student_id        VARCHAR(20)   NOT NULL COMMENT 'Initiating student',
    CONSTRAINT pk_transaction PRIMARY KEY (transaction_id),
    CONSTRAINT fk_trans_admin   FOREIGN KEY (admin_id)   REFERENCES Administrators(admin_id),
    CONSTRAINT fk_trans_student FOREIGN KEY (student_id) REFERENCES Students(student_id)
);


-- TABLE: Rental_Items

CREATE TABLE Rental_Items (
    rental_item_id   INT  NOT NULL AUTO_INCREMENT,
    status           ENUM('Borrowed','Overdue','Pending','Returned') NOT NULL DEFAULT 'Pending',
    return_date      DATETIME COMMENT 'NULL if still checked out',
    return_condition ENUM('perfect','need maintenance','lost'),
    penalty_fee      INT  DEFAULT 0,
    transaction_id   INT  NOT NULL,
    item_id          INT  NOT NULL,
    CONSTRAINT pk_rental_item PRIMARY KEY (rental_item_id),
    CONSTRAINT fk_ri_transaction FOREIGN KEY (transaction_id) REFERENCES Rental_Transactions(transaction_id),
    CONSTRAINT fk_ri_item        FOREIGN KEY (item_id)        REFERENCES Equipments_Items(item_id)
);


-- TABLE: Admin_Activity_Logs

CREATE TABLE Admin_Activity_Logs (
    log_id               INT  NOT NULL AUTO_INCREMENT,
    action_type          ENUM('Login','Logout','Add Model','Add Item','Edit Model',
                              'Edit Item','Delete Model','Delete Item','Approve Loan') NOT NULL,
    action_details       TEXT,
    action_time          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admin_id             INT  NOT NULL,
    target_item_id       INT,
    target_transaction_id INT,
    CONSTRAINT pk_log PRIMARY KEY (log_id),
    CONSTRAINT fk_log_admin       FOREIGN KEY (admin_id)              REFERENCES Administrators(admin_id),
    CONSTRAINT fk_log_item        FOREIGN KEY (target_item_id)        REFERENCES Equipments_Items(item_id),
    CONSTRAINT fk_log_transaction FOREIGN KEY (target_transaction_id) REFERENCES Rental_Transactions(transaction_id),
    INDEX idx_log_item        (target_item_id),
    INDEX idx_log_transaction (target_transaction_id)
);



-- SEED DATA


-- ---- Administrators (10 rows) ----
INSERT INTO Administrators (username, password, role, first_name, last_name, email, phone) VALUES
('Supersomchai123','$2b$10$g3BohHKgCT0a77LKCd8xMOPaNrUwfRQYFZHTFlxk6NTQvjZmcVNFe', 'superadmin', 'Somchai', 'Wannasuk', 'somchai.w@ict.ac.th', '0812345601'),
('Nattsudsuay',' $2b$10$5pN0lG4SVkdgami9c2NMKOtR6xzBCsYs3mjD3RVaCCMOCZc4tj8Jy', 'superadmin', 'Nattaporn', 'Charoensuk', 'nattaporn.c@ict.ac.th', '0812345602'),
('PMongkol', '$2b$10$lKMYlS3Itsv7eHfkHOJobuMKyeFn8WA2/riuV6avIYTk6iNUjGEFS', 'admin', 'Preeya', 'Mongkol', 'preeya.m@ict.ac.th', '0812345603'),
('Kritict', '$2b$10$6oi/l/4kcnzWR9wmqfxU8u7ApW.jmSANqD4jnu8SnJ/pveGHwz0su', 'admin', 'Krit', 'Srisawat', 'krit.s@ict.ac.th', '0812345604'),
('WanidaPhothong', '$2b$10$SWDi4tsecZFNlUB4wobuNuE4acd2/ZSOqvC0jdgeBbU3ePZNYWH3i', 'admin', 'Wanida', 'Phothong', 'wanida.p@ict.ac.th', '0812345605'),
('Thanakorn555', '$2b$10$.2icZGDBJReZ.0Iq9zRAz.0e/NruHWcqXzBMTvrJ7L0toHpEewF/K', 'admin', 'Thanakorn', 'Ruangrit', 'thanakorn.r@ict.ac.th', '0812345606'),
('Siri', '$2b$10$Zi49OxAmg/yN7UlGEOyYuuDaTYqB50oxe/bQUZBMvELZ1mYBHlpSq', 'admin', 'Siriporn', 'Kanchana', 'siriporn.k@ict.ac.th', '0812345607'),
('Attt', '$2b$10$j/KiTfG3jCJMU1Rm20WAG.bGbNnED1fO1d3A7iQ/3FcmxmXvb7asK', 'admin', 'Anuwat', 'Teerakit', 'anuwat.t@ict.ac.th', '0812345608'),
('PS456', '$2b$10$ywpIpjNb3Yfx/Z6MW014UOAAJJDXeQjtM0/bH0pnWxKVq8.VWO/pC', 'admin', 'Patcharee', 'Suwanno', 'patcharee.s@ict.ac.th', '0812345609'),
('ChanatWork', '$2b$10$ZPNuy99TL9Spa2A7FLnOFeP5gGXKi39r36d80dN834LqNlawyiTOW', 'admin', 'Chanat', 'Pongsak', 'chanat.p@ict.ac.th', '0812345610');

-- ---- Students (10 rows) ----
INSERT INTO Students (student_id, password, first_name, last_name, email, phone) VALUES
('6501234001', '$2b$10$w4YL1.xa51sPGfxwsOkta.hPK0cQvzrqQTPwDAch3fLtoaCAtYp..', 'Arisa',    'Tanaka',     'arisa.t@student.ict.ac.th',    '0891110001'),
('6501234002', '$2b$10$fEBFgvNYyPnnU8CmGTWQbuBmL0Rcs4cmBlS1.TdF.Pb7Tnnx3lpxq', 'Bordin',   'Chaiya',     'bordin.c@student.ict.ac.th',   '0891110002'),
('6501234003', '$2b$10$jWf357U0LuQDt2WATeu7yeaLWUz62rv8qxVPHa1tMhG6e98ZVzPxK', 'Chanon',   'Pimpa',      'chanon.p@student.ict.ac.th',   '0891110003'),
('6501234004', '$2b$10$lLBSARoJGup35Hsm64CusOEP.EqwTTvgOZ/B/FjNuCwFuJRXV2QnW', 'Darin',    'Saetang',    'darin.s@student.ict.ac.th',    '0891110004'),
('6501234005', '$2b$10$7fHTffU6w1yPFjH1NYF0p.jB3K9sjf4ZVqTnjd/gurUBYlVVDHJW6', 'Ekachai',  'Wongkham',   'ekachai.w@student.ict.ac.th',  '0891110005'),
('6501234006', '$2b$10$/igCUP.KTxOrxwY.WDk.ieO9XdZ8ihgLHWwXZwW5800d293y8Fgle', 'Fah',      'Ploysri',    'fah.p@student.ict.ac.th',      '0891110006'),
('6501234007', '$2b$10$w.HXw6ZbqDu8RS73xmRd5.qJ3EJ1XbDFXkdz3fnbHmy3Anqkb91R2', 'Gamon',    'Srisuwan',   'gamon.s@student.ict.ac.th',    '0891110007'),
('6501234008', '$2b$10$ZtNkZhGEAOvdTGni0OdVI.k3b9ayDYGMyTMICIdU6zqc9Mh9Mg5Gy', 'Hathai',   'Nakorn',     'hathai.n@student.ict.ac.th',   '0891110008'),
('6501234009', '$2b$10$QCJ.9P.uOjL4VM3FdEQ3BuM8CeNsJ1aMuyxFfFHiQfL6Xx7tQhfbu', 'Ittipong', 'Kasem',      'ittipong.k@student.ict.ac.th', '0891110009'),
('6501234010', '$2b$10$hdK2lDOXsSpr.s.jF8iTOe7TGBsge4DHva3rD71Eqys676P.J8afy', 'Jirapat',  'Phakdee',    'jirapat.p@student.ict.ac.th',  '0891110010');

-- ---- Equipments_Models (10 rows — one per approved equipment type) ----
-- Chosen 10: Laptop computers, iPad, iPhone, Digital camera, Projector,
--            Tripod, Microphone, Headphones, HDMI cables, Power banks
INSERT INTO Equipments_Models (name, brand, category, img_url, details, specs, admin_id) VALUES
('MacBook Pro 14-inch',        'Apple',  'Computing',    'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',   'Laptop computer for development, design, and presentations.',  '14-inch Liquid Retina XDR, M3 Pro, 18GB RAM, 512GB SSD', 1),
('iPad Pro 12.9-inch',         'Apple',  'Computing',    'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',      'iPad for student presentations and media.',                    '12.9-inch Liquid Retina, M2, 256GB, Wi-Fi',              1),
('iPhone 15 Pro',              'Apple',  'Computing',    'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',    'iPhone for mobile documentation and communication.',           '6.1-inch Super Retina XDR, A17 Pro, 256GB',              2),
('Canon EOS 90D DSLR',         'Canon',  'Production',   'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',    'Digital camera for photography and video events.',             '32.5MP APS-C, 4K video, dual pixel autofocus',           2),
('Dell Projector P2418D',      'Dell',   'Production',   'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',      'Full HD projector suitable for classrooms and events.',        '3200 lumens, HDMI, VGA, 1920x1080',                      3),
('Joby GorillaPod 5K Tripod',  'Joby',   'Production',   'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',  'Flexible tripod for cameras and smartphones.',                 'Max load 5kg, flexible legs, universal ball head',        3),
('Rode NT-USB Microphone',     'Rode',   'Audio',        'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',      'USB condenser microphone for recording and streaming.',        'Cardioid condenser, 16-bit/48kHz, USB-A',                4),
('Sony WH-1000XM5 Headphones', 'Sony',   'Audio',        'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',   'Noise-cancelling wireless headphones.',                        '30hr battery, Bluetooth 5.2, ANC',                       4),
('Ugreen HDMI Cable 2m',       'Ugreen', 'Connectivity', 'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',   'HDMI 2.1 cable for connecting displays and projectors.',       '2m, 8K@60Hz, 4K@120Hz, braided nylon',                   5),
('Anker PowerCore 20000mAh',   'Anker',  'Power',        'https://i.postimg.cc/1RdLw8Wq/Iphone13.png',  'High-capacity power bank for charging devices on the go.',    '20000mAh, 2x USB-A + 1x USB-C, 22.5W fast charge',       5);

-- ---- Equipments_Items (10 rows, 1–2 items per model) ----
INSERT INTO Equipments_Items (serial_number, status, admin_id, model_id) VALUES
('13/01', 'Available',   1, 1),   -- MacBook Pro #1
('13/02', 'Borrowed',    1, 1),   -- MacBook Pro #2
('14/01', 'Available',   2, 2),   -- iPad Pro #1
('15/01', 'Borrowed',    2, 3),   -- iPhone 15 Pro #1
('16/01', 'Available',   3, 4),   -- Canon Camera #1
('17/01', 'Maintenance', 3, 5),   -- Dell Projector #1
('18/01', 'Available',   4, 6),   -- Joby Tripod #1
('19/01', 'Available',   4, 7),   -- Rode Microphone #1
('20/01', 'Borrowed',    5, 8),   -- Sony Headphones #1
('21/01', 'Available',   5, 9);   -- Ugreen HDMI Cable #1

-- ---- Rental_Transactions (10 rows) ----
INSERT INTO Rental_Transactions
  (borrow_date, due_date, event_name, reason, where_event, outside_location, admin_id, student_id)
VALUES
('2026-01-10 09:00:00', '2026-01-12 17:00:00', 'ICT Open House 2026',        'Need laptops for live demo booths.',                   'ICT',     NULL,                         1, '6501234001'),
('2026-01-15 10:00:00', '2026-01-16 17:00:00', 'Photography Workshop',       'Capturing workshop sessions for the faculty report.',  'ICT',     NULL,                         2, '6501234002'),
('2026-01-20 08:30:00', '2026-01-22 18:00:00', 'Engineering Expo @ KMITL',   'Product prototype video documentation.',               'Outside', 'KMITL Main Hall',            1, '6501234003'),
('2026-02-01 09:00:00', '2026-02-03 17:00:00', 'Design Sprint Hackathon',    'iPad kiosks for interactive presentations.',           'ICT',     NULL,                         3, '6501234004'),
('2026-02-10 10:00:00', '2026-02-11 17:00:00', 'Guest Lecture - AI Trends',  'Projector needed for the auditorium presentation.',    'ICT',     NULL,                         2, '6501234005'),
('2026-02-14 13:00:00', '2026-02-15 20:00:00', 'Valentine STEM Fair',        'iPhone for mobile documentation at activity stations.','Outside', 'Siam Paragon Event Hall',    4, '6501234006'),
('2026-02-20 08:00:00', '2026-02-21 17:00:00', 'Media Production Lab',       'Tripod and camera for student video production lab.',  'ICT',     NULL,                         5, '6501234007'),
('2026-03-01 09:00:00', '2026-03-02 18:00:00', 'Senior Project Presentation','Microphone for clear audio during presentations.',     'ICT',     NULL,                         1, '6501234008'),
('2026-03-05 10:00:00', '2026-03-06 17:00:00', 'Campus Radio Podcast',       'Headphones and mic needed for podcast recording.',     'Outside', 'ICT Radio Room B2',          3, '6501234009'),
('2026-03-15 09:00:00', '2026-03-17 17:00:00', 'Commencement Ceremony',      'HDMI cables for connecting display terminals.',        'Outside', 'University Main Auditorium', 2, '6501234010');

-- ---- Rental_Items (10 rows) ----
INSERT INTO Rental_Items
  (status, return_date, return_condition, penalty_fee, transaction_id, item_id)
VALUES
('Returned',  '2026-01-12 16:30:00', 'perfect',          0,    1, 1),
('Returned',  '2026-01-16 15:45:00', 'perfect',          0,    2, 5),
('Returned',  '2026-01-22 17:50:00', 'need maintenance', 200,  3, 5),
('Returned',  '2026-02-03 17:00:00', 'perfect',          0,    4, 3),
('Returned',  '2026-02-11 16:00:00', 'perfect',          0,    5, 6),
('Returned',  '2026-02-16 10:00:00', 'perfect',          0,    6, 4),
('Borrowed',  NULL,                  NULL,               0,    7, 7),
('Returned',  '2026-03-02 17:30:00', 'perfect',          0,    8, 8),
('Overdue',   NULL,                  NULL,               500,  9, 9),
('Borrowed',  NULL,                  NULL,               0,   10, 10);

-- ---- Admin_Activity_Logs (10 rows) ----
INSERT INTO Admin_Activity_Logs
  (action_type, action_details, admin_id, target_item_id, target_transaction_id)
VALUES
('Login',        'Admin logged in from 192.168.1.10',                         1, NULL, NULL),
('Add Model',    'Added model: MacBook Pro 14-inch (model_id=1)',              1, NULL, NULL),
('Add Item',     'Added item serial 13/01 for MacBook Pro',                   1, 1,    NULL),
('Add Item',     'Added item serial 13/02 for MacBook Pro',                   1, 2,    NULL),
('Approve Loan', 'Approved transaction_id=1 for student 6501234001',          1, NULL, 1),
('Login',        'Admin logged in from 192.168.1.22',                         2, NULL, NULL),
('Approve Loan', 'Approved transaction_id=2 for student 6501234002',          2, NULL, 2),
('Edit Item',    'Changed item 17/01 (Dell Projector) status to Maintenance', 3, 6,    NULL),
('Delete Item',  'Removed deprecated item_id=7 (Joby Tripod)',                4, NULL, NULL),
('Logout',       'Admin session ended',                                        5, NULL, NULL);


-- ============================================================
-- VERIFY ROW COUNTS
-- ============================================================
SELECT 'Administrators'      AS tbl, COUNT(*) AS 'rows' FROM Administrators
UNION ALL
SELECT 'Students',                    COUNT(*) FROM Students
UNION ALL
SELECT 'Equipments_Models',           COUNT(*) FROM Equipments_Models
UNION ALL
SELECT 'Equipments_Items',            COUNT(*) FROM Equipments_Items
UNION ALL
SELECT 'Rental_Transactions',         COUNT(*) FROM Rental_Transactions
UNION ALL
SELECT 'Rental_Items',                COUNT(*) FROM Rental_Items
UNION ALL
SELECT 'Admin_Activity_Logs',         COUNT(*) FROM Admin_Activity_Logs;