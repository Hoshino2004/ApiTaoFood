const express = require('express');
const router = express.Router();
const db = require('firebase-admin').database();
const foodsRef = db.ref("MobileNangCao/Foods");

// Lấy danh sách món ăn
router.get('/', (req, res) => {
  foodsRef.once('value', snapshot => {
    res.json(snapshot.val());
  }, error => {
    res.status(500).send(error);
  });
});

// Thêm món ăn mới
router.post('/', (req, res) => {
  const newFood = req.body;
  const newRef = foodsRef.push();
  newRef.set(newFood)
    .then(() => res.status(201).json({ key: newRef.key, ...newFood }))
    .catch(err => res.status(500).send(err));
});

// Sửa món ăn (chỉ sửa phần cần)
router.put('/:key', (req, res) => {
  const key = req.params.key;
  const data = req.body;
  foodsRef.child(key).update(data)
    .then(() => res.send('Cập nhật thành công'))
    .catch(err => res.status(500).send(err));
});

// Xoá món ăn
router.delete('/:key', (req, res) => {
  const key = req.params.key;
  foodsRef.child(key).remove()
    .then(() => res.send('Xoá thành công'))
    .catch(err => res.status(500).send(err));
});

module.exports = router;
