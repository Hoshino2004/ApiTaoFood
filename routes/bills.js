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
      res.json(data);
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
      res.json(data);
    } else {
      res.status(404).send("Không tìm thấy thông tin hóa đơn");
    }
  }, error => {
    res.status(500).send(error);
  });
});

// Lọc hóa đơn theo userId và statusID
router.get('/:userId/status/:statusID', async (req, res) => {
  const { userId, statusID } = req.params;

  try {
    const billsSnap = await billsRef.child(userId).once('value');
    const bills = billsSnap.val();

    if (!bills) {
      return res.status(404).send("Không tìm thấy hóa đơn");
    }

    const filteredBills = {};

    Object.entries(bills).forEach(([billId, billData]) => {
      if (String(billData.statusID) === statusID) {
        filteredBills[billId] = billData;
      }
    });

    if (Object.keys(filteredBills).length === 0) {
      return res.status(404).send("Không có hóa đơn nào với trạng thái này");
    }

    res.json(filteredBills);
  } catch (err) {
    res.status(500).send("Lỗi khi lọc hóa đơn: " + err.message);
  }
});

// Lọc tất cả hóa đơn theo statusID (không theo userId)
router.get('/status/:statusID', async (req, res) => {
  const { statusID } = req.params;

  try {
    const allBillsSnap = await billsRef.once('value');
    const allBills = allBillsSnap.val();

    if (!allBills) {
      return res.status(404).send("Không có hóa đơn nào trong hệ thống");
    }

    const filteredResults = {};

    // Lặp qua từng user và từng bill
    Object.entries(allBills).forEach(([userId, bills]) => {
      Object.entries(bills).forEach(([billId, billData]) => {
        if (String(billData.statusID) === statusID) {
          if (!filteredResults[userId]) {
            filteredResults[userId] = {};
          }
          filteredResults[userId][billId] = billData;
        }
      });
    });

    if (Object.keys(filteredResults).length === 0) {
      return res.status(404).send("Không có hóa đơn nào với trạng thái này");
    }

    res.json(filteredResults);
  } catch (err) {
    res.status(500).send("Lỗi khi lọc tất cả hóa đơn: " + err.message);
  }
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
      billID: billId,
      total: cartData.total || 0,
      MenuFood: cartData.MenuFood
    };

    // Ghi vào bảng bills
    await billsRef.child(userId).child(billId).set(billData);

    // Xóa giỏ hàng sau khi tạo hóa đơn thành công
    await cartRef.child(userId).remove();

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

    const currentStatus = billSnap.val().statusID;

    // Nếu statusID hiện tại là 0 hoặc 1 thì không cho cập nhật
    if (currentStatus === 0) {
      return res.status(403).send("Không thể cập nhật hóa đơn đã hủy (statusID = 0)");
    }

    if (currentStatus === 1) {
      return res.status(400).send("Không thể cập nhật hóa đơn đã giao (statusID = 1)");
    }

    await billRef.update({ statusID });

    res.send("Cập nhật trạng thái hóa đơn thành công");
  } catch (err) {
    res.status(500).send("Lỗi khi cập nhật trạng thái: " + err.message);
  }
});


module.exports = router;

