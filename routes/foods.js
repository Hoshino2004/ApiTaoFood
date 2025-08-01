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

// Thêm món ăn mới (ID tự set)
router.post('/', (req, res) => {
  const newFood = req.body;

  if (!newFood.id) {
    return res.status(400).send("Thiếu trường 'id'");
  }

  foodsRef.child(newFood.id).set(newFood)
    .then(() => res.status(201).json(newFood))
    .catch(err => res.status(500).send(err));
});

// Sửa món ăn (chỉ sửa phần cần)
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const data = req.body;

  foodsRef.child(id).update(data)
    .then(() => res.send('Cập nhật thành công'))
    .catch(err => res.status(500).send(err));
});

// Xoá món ăn
router.delete('/:id', (req, res) => {
  const id = req.params.id;

  foodsRef.child(id).remove()
    .then(() => res.send('Xoá thành công'))
    .catch(err => res.status(500).send(err));
});

// Lấy chi tiết món ăn theo ID
router.get('/:id', (req, res) => {
  const id = req.params.id;

  foodsRef.child(id).once('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      res.json({ id, ...data });
    } else {
      res.status(404).send("Không tìm thấy món ăn");
    }
  }, error => {
    res.status(500).send(error);
  });
});

module.exports = router;
