require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FB_TYPE,
    project_id: process.env.FB_PROJECT_ID,
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: process.env.FB_AUTH_URI,
    token_uri: process.env.FB_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER,
    client_x509_cert_url: process.env.FB_CLIENT_CERT
  }),
  databaseURL: process.env.FB_DATABASE_URL
});


const db = admin.database();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const foodsRef = db.ref("MobileNangCao/Foods");

// 📌 LẤY danh sách món ăn
app.get('/foods', async (req, res) => {
  foodsRef.once('value', snapshot => {
    res.json(snapshot.val());
  }, error => {
    res.status(500).send(error);
  });
});

// 📌 THÊM món ăn mới
app.post('/foods', async (req, res) => {
  const newFood = req.body;
  const newRef = foodsRef.push();
  newRef.set(newFood)
    .then(() => res.status(201).json({ key: newRef.key, ...newFood }))
    .catch(err => res.status(500).send(err));
});

// 📌 CẬP NHẬT 1 phần (dùng update thay vì set)
app.put('/foods/:key', async (req, res) => {
  const key = req.params.key;
  const updatedData = req.body; // chỉ gồm field cần sửa, ví dụ { price: 45000 }

  const ref = foodsRef.child(key);
  ref.update(updatedData)
    .then(() => res.send("Cập nhật thành công"))
    .catch(err => res.status(500).send(err));
});

// 📌 XOÁ món ăn (theo Firebase key)
app.delete('/foods/:key', async (req, res) => {
  const key = req.params.key;
  const ref = foodsRef.child(key);
  ref.remove()
    .then(() => res.send("Xoá thành công"))
    .catch(err => res.status(500).send(err));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

