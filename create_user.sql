-- Create User --
USE `sec3_gr10_database`;
CREATE USER IF NOT EXISTS 'itcs223'@'localhost' IDENTIFIED BY 'itCS223**';
GRANT ALL PRIVILEGES ON `sec3_gr10_database`.* TO 'itcs223'@'localhost';
FLUSH PRIVILEGES;

-- Validate User Exist --
SELECT user FROM mysql.user WHERE user = 'itcs223';

-- Validate Privileges --
SHOW GRANTS FOR 'itcs223'@'localhost';
