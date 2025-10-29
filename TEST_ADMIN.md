# Test Admin Authentication

## Problema: "Admin access required"

Dacă primești eroarea "Admin access required" când încerci să faci upload, problema este probabil că **cookie-ul de sesiune nu este trimis cu request-ul**.

## Soluție: Trimite credentials cu request-ul

### 1. Cu cURL (Terminal)

```bash
# Pasul 1: Login și salvează cookie-urile
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sergiu.tigan@devhub.tech","password":"YOUR_PASSWORD_HERE"}' \
  -c cookies.txt \
  -v

# Pasul 2: Upload folosind cookie-urile salvate
curl -X POST http://localhost:3000/api/meal-options/upload \
  -b cookies.txt \
  -F "file=@path/to/your/file.xlsx" \
  -v
```

### 2. Cu Postman

1. **Login:**
   - POST `http://localhost:3000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "sergiu.tigan@devhub.tech",
       "password": "YOUR_PASSWORD_HERE"
     }
     ```
   - Cookie-ul va fi salvat automat de Postman

2. **Upload:**
   - POST `http://localhost:3000/api/meal-options/upload`
   - Body: form-data
   - Key: `file`, Type: File, Value: selectează fișierul Excel
   - Cookie-ul din login va fi trimis automat

### 3. Cu Fetch (JavaScript/Frontend)

```javascript
// Pasul 1: Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include', // IMPORTANT! Trimite și primește cookies
  body: JSON.stringify({
    email: 'sergiu.tigan@devhub.tech',
    password: 'YOUR_PASSWORD_HERE'
  })
});

// Pasul 2: Upload
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('http://localhost:3000/api/meal-options/upload', {
  method: 'POST',
  credentials: 'include', // IMPORTANT! Trimite cookie-ul de sesiune
  body: formData
});
```

### 4. Cu Angular HttpClient

```typescript
// În service
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {}

// Login
login(email: string, password: string) {
  return this.http.post('http://localhost:3000/api/auth/login',
    { email, password },
    { withCredentials: true } // IMPORTANT!
  );
}

// Upload
uploadMealOptions(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post('http://localhost:3000/api/meal-options/upload',
    formData,
    { withCredentials: true } // IMPORTANT!
  );
}
```

### 5. Cu Axios

```javascript
// Configurare globală
axios.defaults.withCredentials = true;

// Login
await axios.post('http://localhost:3000/api/auth/login', {
  email: 'sergiu.tigan@devhub.tech',
  password: 'YOUR_PASSWORD_HERE'
});

// Upload
const formData = new FormData();
formData.append('file', file);

await axios.post('http://localhost:3000/api/meal-options/upload', formData);
```

## Verificare Autentificare

Verifică că ești autentificat și ai drepturi de admin:

```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

Ar trebui să primești:
```json
{
  "user": {
    "id": 1,
    "email": "sergiu.tigan@devhub.tech",
    "is_admin": true,
    "employee_name": null
  }
}
```

## Debug

Serverul acum afișează log-uri de debugging:
- ✓ La login: email, is_admin status, session ID
- 🔐 La verificarea admin: detalii despre sesiune

Verifică console-ul serverului pentru aceste mesaje.

## Problema comună: CORS + Credentials

Dacă folosești un frontend (Angular, React, etc.), asigură-te că:

1. **Backend (deja configurat):**
   ```javascript
   // CORS permite credentials
   cors({ credentials: true })
   ```

2. **Frontend trebuie să trimită credentials:**
   ```javascript
   // Fetch
   fetch(url, { credentials: 'include' })

   // Axios
   axios.defaults.withCredentials = true

   // Angular HttpClient
   this.http.post(url, data, { withCredentials: true })
   ```

## Test rapid

```bash
# Test complet
cd /Users/sergiu/Projects/food-search-api

# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sergiu.tigan@devhub.tech","password":"YOUR_PASSWORD_HERE"}' \
  -c cookies.txt

# 2. Verifică autentificarea
curl http://localhost:3000/api/auth/me -b cookies.txt

# 3. Test endpoint admin (primești lista de săptămâni)
curl http://localhost:3000/api/admin/weeks -b cookies.txt
```

Dacă toate funcționează, vei vedea datele și nu vei primi erori de autentificare!
