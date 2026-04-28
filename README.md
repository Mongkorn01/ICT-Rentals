# ICT-Rentals
---
## Notes
- This project is part of ITCS223_Introduction to Web Development
- .env was included to aid our graders, and it won't be included in real production
## How to Run

### 1. Run mysql file to create the database (Using MySQL Workbench/PowerShell)
#### 1.1) PowerShell Method
##### 1.1.1) Open PowerShell (Window)
##### 1.1.2) Navigate to MySQL folder
```bash
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
# or
cd "C:\Program Files\MySQL\MySQL Server 9.4\bin"
```
##### 1.1.2) Login as root
```bash
.\mysql -u root
```
##### 1.1.3) Run the database file using absolute path (Be sure the path is using backslash (/))
```bash
source C:</path-to>/sec3_gr10_database.sql;
```
#### 1.2) MySQL Workbench Method
##### 1.2.1) Open MySQL Workbench
##### 1.2.2) Create a connection
##### 1.2.3) File > Open SQL Script > Choose sec3_gr10_database.sql
##### 1.2.4) Execute
>### 2. (Optional Create User) Run create_user.sql -> Enter root password
> Ensure the right user is in the .env file with the right accesss
```bash
.\mysql -u root
source C:</path-to>/create_user.sql;
```

### 3. Open 2 Terminal
#### 3.1) Terminal 1: Frontend
##### 3.1.1) Install dependencies
```bash
cd sec3_gr10_fe_src
npm install
```
##### 3.1.2) Run
```bash
npm start
```
#### 3.2) Terminal 2: Backend
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
