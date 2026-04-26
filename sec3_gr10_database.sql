-- Equipment Rental System - Database Implementation

DROP DATABASE IF EXISTS equipment_rental_db;
CREATE DATABASE equipment_rental_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE equipment_rental_db;


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
    category     VARCHAR(50)    NOT NULL,
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
-- c
INSERT INTO Administrators (username, password, role, first_name, last_name, email, phone) VALUES
('Supersomchai123','admin1', 'superadmin', 'Somchai', 'Wannasuk', 'somchai.w@ict.ac.th', '0812345601'),
('Nattsudsuay','admin2', 'superadmin', 'Nattaporn', 'Charoensuk', 'nattaporn.c@ict.ac.th', '0812345602'),
('PMongkol', 'admin3', 'admin', 'Preeya', 'Mongkol', 'preeya.m@ict.ac.th', '0812345603'),
('Kritict', 'admin4', 'admin', 'Krit', 'Srisawat', 'krit.s@ict.ac.th', '0812345604'),
('WanidaPhothong', 'admin5', 'admin', 'Wanida', 'Phothong', 'wanida.p@ict.ac.th', '0812345605'),
('Thanakorn555', 'admin6', 'admin', 'Thanakorn', 'Ruangrit', 'thanakorn.r@ict.ac.th', '0812345606'),
('Siri', 'admin7', 'admin', 'Siriporn', 'Kanchana', 'siriporn.k@ict.ac.th', '0812345607'),
('Attt', 'admin8', 'admin', 'Anuwat', 'Teerakit', 'anuwat.t@ict.ac.th', '0812345608'),
('PS456', 'admin9', 'admin', 'Patcharee', 'Suwanno', 'patcharee.s@ict.ac.th', '0812345609'),
('ChanatWork', 'admin10', 'admin', 'Chanat', 'Pongsak', 'chanat.p@ict.ac.th', '0812345610');

-- ---- Students (10 rows) ----
INSERT INTO Students (student_id, password, first_name, last_name, email, phone) VALUES
('6501234001', 'student1', 'Arisa',    'Tanaka',     'arisa.t@student.ict.ac.th',    '0891110001'),
('6501234002', 'student2', 'Bordin',   'Chaiya',     'bordin.c@student.ict.ac.th',   '0891110002'),
('6501234003', 'student3', 'Chanon',   'Pimpa',      'chanon.p@student.ict.ac.th',   '0891110003'),
('6501234004', 'student4', 'Darin',    'Saetang',    'darin.s@student.ict.ac.th',    '0891110004'),
('6501234005', 'student5', 'Ekachai',  'Wongkham',   'ekachai.w@student.ict.ac.th',  '0891110005'),
('6501234006', 'student6', 'Fah',      'Ploysri',    'fah.p@student.ict.ac.th',      '0891110006'),
('6501234007', 'student7', 'Gamon',    'Srisuwan',   'gamon.s@student.ict.ac.th',    '0891110007'),
('6501234008', 'student8', 'Hathai',   'Nakorn',     'hathai.n@student.ict.ac.th',   '0891110008'),
('6501234009', 'student9', 'Ittipong', 'Kasem',      'ittipong.k@student.ict.ac.th', '0891110009'),
('6501234010', 'student10', 'Jirapat',  'Phakdee',    'jirapat.p@student.ict.ac.th',  '0891110010');

-- ---- Equipments_Models (10 rows) ----
INSERT INTO Equipments_Models (name, brand, category, img_url, details, specs, admin_id) VALUES
('MacBook Pro 14-inch',          'Apple',     'Laptop',       '/images/macbook_pro_14.jpg',   'Professional laptop for development and design.', '14-inch Liquid Retina XDR, M3 Pro, 18GB RAM, 512GB SSD', 1),
('Dell Projector P2418D',        'Dell',      'Projector',    '/images/dell_p2418d.jpg',      'Full HD business projector suitable for classrooms.', '3200 lumens, HDMI, VGA, 1920x1080', 1),
('Canon EOS 90D DSLR',           'Canon',     'Camera',       '/images/canon_eos_90d.jpg',    'Professional DSLR camera for photography events.', '32.5MP APS-C, 4K video, dual pixel autofocus', 2),
('iPad Pro 12.9-inch',           'Apple',     'Tablet',       '/images/ipad_pro_12.jpg',      'Tablet for student presentations and media.', '12.9-inch Liquid Retina, M2, 256GB, Wi-Fi', 2),
('Rode NT-USB Microphone',       'Rode',      'Audio',        '/images/rode_nt_usb.jpg',      'USB condenser microphone for recording and streaming.', 'Cardioid condenser, 16-bit/48kHz, USB-A', 3),
('Anker 10-Port USB Hub',        'Anker',     'Power Strip',  '/images/anker_usb_hub.jpg',    'Multi-port USB hub for shared workspace use.', '10x USB-A, 60W charging, data sync', 3),
('Sony WH-1000XM5 Headphones',   'Sony',      'Audio',        '/images/sony_wh1000xm5.jpg',  'Noise-cancelling wireless headphones.', '30hr battery, Bluetooth 5.2, ANC', 4),
('Wacom Intuos Pro Tablet',      'Wacom',     'Input Device', '/images/wacom_intuos.jpg',     'Graphic drawing tablet for design courses.', 'Medium size, 8192 pressure levels, Bluetooth', 4),
('Raspberry Pi 4 Model B 8GB',   'Raspberry', 'SBC',          '/images/rpi4_8gb.jpg',         'Single-board computer for IoT and lab projects.', 'Quad-core 1.8GHz, 8GB RAM, 2x HDMI, USB 3.0', 5),
('TP-Link TL-SG1016D Switch',    'TP-Link',   'Network',      '/images/tplink_sg1016d.jpg',   '16-port unmanaged Gigabit network switch.', '16x RJ-45, 1Gbps, plug-and-play, rackmount', 5);

-- ---- Equipments_Items (10 rows, 1–2 items per model) ----
INSERT INTO Equipments_Items (serial_number, status, admin_id, model_id) VALUES
('13/01', 'Available',   1, 1),   -- MacBook Pro #1
('13/02', 'Borrowed',    1, 1),   -- MacBook Pro #2
('14/01', 'Available',   2, 2),   -- Projector #1
('15/01', 'Borrowed',    2, 3),   -- Canon Camera #1
('16/01', 'Available',   3, 4),   -- iPad Pro #1
('17/01', 'Maintenance', 3, 5),   -- Rode Mic #1
('18/01', 'Available',   4, 6),   -- Anker USB Hub #1
('19/01', 'Available',   4, 7),   -- Sony Headphones #1
('20/01', 'Borrowed',    5, 8),   -- Wacom Tablet #1
('21/01', 'Available',   5, 9);   -- Raspberry Pi #1

-- ---- Rental_Transactions (10 rows) ----
INSERT INTO Rental_Transactions
  (borrow_date, due_date, event_name, reason, where_event, outside_location, admin_id, student_id)
VALUES
('2026-01-10 09:00:00', '2026-01-12 17:00:00', 'ICT Open House 2026',        'Need laptops for live demo booths.',                   'ICT',     NULL,                      1, '6501234001'),
('2026-01-15 10:00:00', '2026-01-16 17:00:00', 'Photography Workshop',       'Capturing workshop sessions for the faculty report.',  'ICT',     NULL,                      2, '6501234002'),
('2026-01-20 08:30:00', '2026-01-22 18:00:00', 'Engineering Expo @ KMITL',   'Product prototype video documentation.',               'Outside', 'KMITL Main Hall',         1, '6501234003'),
('2026-02-01 09:00:00', '2026-02-03 17:00:00', 'Design Sprint Hackathon',    'Digital sketching during the 48-hour hackathon.',      'ICT',     NULL,                      3, '6501234004'),
('2026-02-10 10:00:00', '2026-02-11 17:00:00', 'Guest Lecture - AI Trends',  'Projector needed for the auditorium presentation.',    'ICT',     NULL,                      2, '6501234005'),
('2026-02-14 13:00:00', '2026-02-15 20:00:00', 'Valentine STEM Fair',        'Tablet kiosks for interactive activity stations.',    'Outside', 'Siam Paragon Event Hall', 4, '6501234006'),
('2026-02-20 08:00:00', '2026-02-21 17:00:00', 'IoT Lab Session',            'Pi boards for student network topology labs.',         'ICT',     NULL,                      5, '6501234007'),
('2026-03-01 09:00:00', '2026-03-02 18:00:00', 'Senior Project Presentation','Microphone for clear audio during presentations.',     'ICT',     NULL,                      1, '6501234008'),
('2026-03-05 10:00:00', '2026-03-06 17:00:00', 'Campus Radio Podcast',       'Headphones and mic needed for podcast recording.',     'Outside', 'ICT Radio Room B2',       3, '6501234009'),
('2026-03-15 09:00:00', '2026-03-17 17:00:00', 'Commencement Ceremony',      'Network switch for event registration terminals.',    'Outside', 'University Main Auditorium', 2, '6501234010');

-- ---- Rental_Items (10 rows) ----
INSERT INTO Rental_Items
  (status, return_date, return_condition, penalty_fee, transaction_id, item_id)
VALUES
('Returned',  '2026-01-12 16:30:00', 'perfect',          0,    1, 1),
('Returned',  '2026-01-16 15:45:00', 'perfect',          0,    2, 4),
('Returned',  '2026-01-22 17:50:00', 'need maintenance', 200,  3, 4),
('Returned',  '2026-02-03 17:00:00', 'perfect',          0,    4, 9),
('Returned',  '2026-02-11 16:00:00', 'perfect',          0,    5, 3),
('Returned',  '2026-02-16 10:00:00', 'perfect',          0,    6, 5),
('Borrowed',  NULL,                  NULL,               0,    7, 10),
('Returned',  '2026-03-02 17:30:00', 'perfect',          0,    8, 6),
('Overdue',   NULL,                  NULL,               500,  9, 8),
('Borrowed',  NULL,                  NULL,               0,   10, 7);

-- ---- Admin_Activity_Logs (10 rows) ----
INSERT INTO Admin_Activity_Logs
  (action_type, action_details, action_time, admin_id, target_item_id, target_transaction_id)
VALUES
('Login',        'Admin logged in from 192.168.1.10',           '2026-01-10 08:50:00', 1, NULL, NULL),
('Add Model',    'Added model: MacBook Pro 14-inch (model_id=1)','2026-01-10 09:00:00', 1, NULL, NULL),
('Add Item',     'Added item serial 13/01 for MacBook Pro',      '2026-01-10 09:05:00', 1, 1,    NULL),
('Add Item',     'Added item serial 13/02 for MacBook Pro',      '2026-01-10 09:06:00', 1, 2,    NULL),
('Approve Loan', 'Approved transaction_id=1 for student 6501234001', '2026-01-10 09:10:00', 1, NULL, 1),
('Login',        'Admin logged in from 192.168.1.22',           '2026-01-15 09:55:00', 2, NULL, NULL),
('Approve Loan', 'Approved transaction_id=2 for student 6501234002', '2026-01-15 10:05:00', 2, NULL, 2),
('Edit Item',    'Changed item 17/01 status to Maintenance',    '2026-02-05 11:00:00', 3, 6,    NULL),
('Delete Item',  'Removed deprecated USB hub item_id=7',        '2026-02-18 14:30:00', 4, 7,    NULL),
('Logout',       'Admin session ended',                         '2026-03-15 18:00:00', 5, NULL, NULL);


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