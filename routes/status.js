const express = require('express');
const router = express.Router();
const db = require('firebase-admin').database();
const statusRef = db.ref("MobileNangCao/Status");

// 📥 Lấy danh sách Status
router.get('/', (req, res) => {
  statusRef.once('value', snapshot => {
    res.json(snapshot.val());
  }, error => {
    res.status(500).send(error);
  });
});

// ➕ Cập nhật hoặc thêm 1 trạng thái
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const name = req.body.name;

  if (!name) {
    return res.status(400).send("Thiếu trường 'name'");
  }

  statusRef.child(id).set(name)
    .then(() => res.send("Cập nhật trạng thái thành công"))
    .catch(err => res.status(500).send(err));
});

// ❌ Xoá 1 trạng thái
router.delete('/:id', (req, res) => {
  const id = req.params.id;

  statusRef.child(id).remove()
    .then(() => res.send("Xoá trạng thái thành công"))
    .catch(err => res.status(500).send(err));
});

module.exports = router;
