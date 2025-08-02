const express = require('express');
const router = express.Router();
const db = require('firebase-admin').database();
const statusRef = db.ref("MobileNangCao/Status");

// Lấy tất cả trạng thái
router.get('/', (req, res) => {
  statusRef.once('value', snapshot => {
    res.json(snapshot.val());
  }, err => res.status(500).send(err));
});

// Lấy trạng thái theo ID
router.get('/:id', (req, res) => {
    const id = req.params.id;
  statusRef.child(id).once('value', snapshot => {
    res.json(snapshot.val());
  }, err => res.status(500).send(err));
});

module.exports = router;