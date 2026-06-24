import requests

body= {
  "email": "admin@campnav.local",
  "password": "ChangeMe123!"
}
res=requests.post("https://campnav.onrender.com/api/auth/login",json=body)

print(res.json)