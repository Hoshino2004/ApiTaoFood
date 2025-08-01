const express = require('express');
const router = express.Router();
const db = require('firebase-admin').database();
const billsRef = db.ref("MobileNangCao/Bills");
const cartRef = db.ref("MobileNangCao/Cart");
const { v4: uuidv4 } = require('uuid'); // npm install uuid nếu chưa cài

// Lấy thông tin hóa đơn
router.get('/', (req, res) => {
  billsRef.once('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      res.json(data);
    } else {
      res.status(404).send("Không tìm thấy thông tin hóa đơn");
    }
  }, error => {
    res.status(500).send(error);
  });
});

// Lấy thông tin hóa đơn theo id người dùng
router.get('/:userId', (req, res) => {
  const userId = req.params.userId;

  billsRef.child(userId).once('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      res.json({ userId, ...data });
    } else {
      res.status(404).send("Không tìm thấy thông tin hóa đơn");
    }
  }, error => {
    res.status(500).send(error);
  });
});

// Lấy thông tin chi tiết hóa đơn theo id người dùng
router.get('/:userId/:billId', (req, res) => {
  const { userId, billId } = req.params;

  billsRef.child(userId).child(billId).once('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      res.json({ userId, billId, ...data });
    } else {
      res.status(404).send("Không tìm thấy thông tin hóa đơn");
    }
  }, error => {
    res.status(500).send(error);
  });
});

// Tạo hóa đơn mới cho người dùng
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Lấy giỏ hàng từ cart
    const cartSnap = await cartRef.child(userId).once('value');
    const cartData = cartSnap.val();

    if (!cartData || !cartData.MenuFood) {
      return res.status(400).send("Giỏ hàng trống, không thể tạo hóa đơn");
    }

    // Tạo billId ngẫu nhiên
    const billId = uuidv4();

    // Chuẩn bị dữ liệu bill
    const billData = {
      createdAt: new Date().toISOString(), // hoặc dùng timestamp nếu thích
      statusID: 2,                         // trạng thái mặc định
      userID: userId,
      total: cartData.total || 0,
      MenuFood: cartData.MenuFood
    };

    // Ghi vào bảng bills
    await billsRef.child(userId).child(billId).set(billData);

    res.send({
      message: "Tạo hóa đơn thành công",
      billId: billId
    });
  } catch (err) {
    res.status(500).send("Lỗi khi tạo hóa đơn: " + err.message);
  }
});

// Cập nhật trạng thái hóa đơn
router.put('/:userId/:billId/status', async (req, res) => {
  const { userId, billId } = req.params;
  const { statusID } = req.body;

  if (typeof statusID !== 'number') {
    return res.status(400).send("Trường 'statusID' phải là số");
  }

  try {
    const billRef = billsRef.child(userId).child(billId);

    const billSnap = await billRef.once('value');
    if (!billSnap.exists()) {
      return res.status(404).send("Hóa đơn không tồn tại");
    }

    await billRef.update({ statusID });

    res.send("Cập nhật trạng thái hóa đơn thành công");
  } catch (err) {
    res.status(500).send("Lỗi khi cập nhật trạng thái: " + err.message);
  }
});

module.exports = router;

