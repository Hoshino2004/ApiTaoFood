const express = require('express');
const router = express.Router();
const db = require('firebase-admin').database();
const unitRef = db.ref("MobileNangCao/Unit");

// 📥 Lấy tất cả đơn vị
router.get('/', (req, res) => {
  unitRef.once('value', snapshot => {
    res.json(snapshot.val());
  }, err => res.status(500).send(err));
});

// ➕ Thêm/cập nhật đơn vị theo ID
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const name = req.body.name;

  if (!name) return res.status(400).send("Thiếu trường 'name'");

  unitRef.child(id).set(name)
    .then(() => res.send("Cập nhật đơn vị thành công"))
    .catch(err => res.status(500).send(err));
});

// ❌ Xoá đơn vị
router.delete('/:id', (req, res) => {
  const id = req.params.id;

  unitRef.child(id).remove()
    .then(() => res.send("Xoá đơn vị thành công"))
    .catch(err => res.status(500).send(err));
});

module.exports = router;
