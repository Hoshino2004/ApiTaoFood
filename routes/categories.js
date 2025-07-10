const express = require('express');
const router = express.Router();
const db = require('firebase-admin').database();
const categoriesRef = db.ref("MobileNangCao/Categories");

// Lấy danh sách categories
router.get('/', (req, res) => {
  categoriesRef.once('value', snapshot => {
    res.json(snapshot.val());
  }, error => {
    res.status(500).send(error);
  });
});

// Thêm hoặc cập nhật 1 category theo id
router.put('/:id', (req, res) => {
  const id = req.params.id; // ví dụ: 0, 1, 2
  const name = req.body.name; // ví dụ: "Món mới"
  
  if (!name) {
    return res.status(400).send("Thiếu trường 'name'");
  }

  categoriesRef.child(id).set(name)
    .then(() => res.send("Cập nhật category thành công"))
    .catch(err => res.status(500).send(err));
});

// Xoá category theo id
router.delete('/:id', (req, res) => {
  const id = req.params.id;

  categoriesRef.child(id).remove()
    .then(() => res.send("Xoá category thành công"))
    .catch(err => res.status(500).send(err));
});

module.exports = router;
