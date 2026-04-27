### ICT-Rentals
---
## Notes
- This project is part of ITCS223_Introduction to Web Development
- .env was included to aid our graders, and it won't be included in real production
## How to Run
>### 1. (Optional Create User) Run create_user.sql -> Enter root password
```bash
mysql -u root -p < create_user.sql
```
> Ensure the right user is in the .env file
### 2. Run mysql file to create the database
```bash
mysql -u root -p < sec_gr10_database.sql
# or log in using our provided user 
mysql -u itcs223 -pitCS223** < sec_gr10_database.sql
```
### 3. Open 2 Terminal
#### Terminal 1: Frontend
##### 3.1.1) Install dependencies
```bash
cd sec3_gr10_fe_src
npm install
```
##### 3.1.2) Run
```bash
npm start
```
#### Terminal 2: Backend
##### 3.2.1) Install dependencies
```bash
cd sec3_gr10_ws_src
npm install
```
##### 3.2.2) Run
```bash
npm start
```
### 4. Login with credentials
#### Student
* **Username:** `aaaa`
* **Password:** `aaaa`
#### Admin
* **Username:** `aaaa`
* **Password:** `aaaa`
