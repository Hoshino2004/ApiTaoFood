const express = require('express');
const router = express.Router();
const db = require('firebase-admin').database();
const usersRef = db.ref("MobileNangCao/Users");

// Lấy tất cả users
router.get('/', (req, res) => {
  usersRef.once('value', snapshot => {
    res.json(snapshot.val());
  }, err => res.status(500).send(err));
});

// Thêm user mới (ID tự set thủ công)
router.post('/', (req, res) => {
  const user = req.body;

  if (!user.id) {
    return res.status(400).send("Thiếu trường 'id'");
  }

  usersRef.child(user.id).set(user)
    .then(() => res.status(201).json(user))
    .catch(err => res.status(500).send(err));
});

// Sửa thông tin user (có thể sửa 1 phần)
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const data = req.body;

  usersRef.child(id).update(data)
    .then(() => res.send('Cập nhật user thành công'))
    .catch(err => res.status(500).send(err));
});

// Xoá user
router.delete('/:id', (req, res) => {
  const id = req.params.id;

  usersRef.child(id).remove()
    .then(() => res.send('Xoá user thành công'))
    .catch(err => res.status(500).send(err));
});

// Lấy chi tiết user theo ID
router.get('/:id', (req, res) => {
  const id = req.params.id;

  usersRef.child(id).once('value', snapshot => {
    const user = snapshot.val();
    if (user) {
      res.json({ id, ...user });
    } else {
      res.status(404).send("Không tìm thấy người dùng");
    }
  }, err => res.status(500).send(err));
});


module.exports = router;
