USE `sec3_gr10_database`;
CREATE USER 'itcs223'@'localhost' IDENTIFIED BY 'itCS223**';
GRANT ALL PRIVILEGES ON `sec3_gr10_database`.* TO 'itcs223'@'localhost';
FLUSH PRIVILEGES;
