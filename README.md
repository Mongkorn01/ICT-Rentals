# ICT-Rentals
---
## Notes
- This project is part of ITCS223_Introduction to Web Development
- .env was included to aid our graders, and it won't be included in real production
## How to Run

### 1. Run mysql file to create the database -> Enter root password
```bash
mysql -u root -p < sec_gr10_database.sql
```
>### 2. (Optional Create User) Run create_user.sql -> Enter root password
> Ensure the right user is in the .env file with the right accesss
```bash
mysql -u root -p < create_user.sql
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
* **Username:** `6501234001`
* **Password:** `student1`
#### Admin
* **Username (Email):** `somchai.w@ict.ac.th`
* **Password:** `admin1`
