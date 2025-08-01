const express = require('express');
const router = express.Router();
const db = require('firebase-admin').database();
const cartRef = db.ref("MobileNangCao/Cart");
const foodsRef = db.ref("MobileNangCao/Foods");

// Lấy thông tin giỏ hàng theo id người dùng
router.get('/:userId', (req, res) => {
  const userId = req.params.userId;

  cartRef.child(userId).once('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      res.json({ userId, ...data });
    } else {
      res.status(404).send("Không tìm thấy thông tin giỏ hàng");
    }
  }, error => {
    res.status(500).send(error);
  });
});

// Thêm món ăn vào giỏ hàng theo userId và foodId
router.post('/:userId/MenuFood/:foodId', async (req, res) => {
  const { userId, foodId } = req.params;
  const { quantity } = req.body;

  try {
    // Lấy thông tin món ăn từ bảng foods
    const foodSnap = await foodsRef.child(foodId).once('value');
    if (!foodSnap.exists()) {
      return res.status(404).send("Món ăn không tồn tại");
    }

    const foodData = foodSnap.val();
    const price = foodData.price;

    const userCartRef = cartRef.child(userId);
    const userSnap = await userCartRef.once('value');
    const cartData = userSnap.val() || {};

    const existingItem = cartData.MenuFood?.[foodId];
    const newQuantity = existingItem ? (existingItem.quantity || 0) + quantity : quantity;

    // Tính total mới:
    let newTotal = 0;

    // Lặp lại các món cũ và cộng tổng
    const allItems = cartData.MenuFood || {};
    for (const key in allItems) {
      if (key === foodId) {
        newTotal += price * newQuantity; // món đang thêm
      } else {
        const snap = await foodsRef.child(key).once('value');
        const itemPrice = snap.val()?.price || 0;
        newTotal += itemPrice * (allItems[key].quantity || 0);
      }
    }

    // Nếu món đang thêm là món mới hoàn toàn
    if (!existingItem) {
      newTotal += price * quantity;
    }

    // Cập nhật vào giỏ hàng
    await userCartRef.update({
      [`MenuFood/${foodId}`]: {
        id: foodId,
        quantity: newQuantity
      },
      total: newTotal
    });

    res.send("Thêm món ăn và cập nhật tổng tiền thành công (chỉ lưu id + quantity)");
  } catch (err) {
    res.status(500).send("Lỗi khi thêm món ăn: " + err.message);
  }
});


// Sửa số lượng món ăn trong giỏ hàng theo userId và foodId
router.put('/:userId/MenuFood/:foodId', async (req, res) => {
  const { userId, foodId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || typeof quantity !== 'number') {
    return res.status(400).send("Thiếu hoặc sai kiểu dữ liệu 'quantity'");
  }

  if (quantity < 0) return res.status(400).send("Số lượng không thể âm");
  if (quantity > 10) return res.status(400).send("Số lượng không được vượt quá 10");

  try {
    const userCartRef = cartRef.child(userId);
    const foodRef = userCartRef.child('MenuFood').child(foodId);

    const foodSnap = await foodRef.once('value');
    if (!foodSnap.exists()) {
      return res.status(404).send("Món ăn không tồn tại trong giỏ hàng");
    }

    const foodData = foodSnap.val();

    if (quantity === 0) {
      // Nếu quantity = 0 → Xóa món
      await foodRef.remove();
    } else {
      // Cập nhật số lượng mới mà giữ lại các dữ liệu cũ
      await foodRef.update({ ...foodData, quantity });
    }

    // Tính lại tổng
    const allItemsSnap = await userCartRef.child('MenuFood').once('value');
    const allItems = allItemsSnap.val() || {};

    let newTotal = 0;
    for (const key in allItems) {
      const item = allItems[key];
      newTotal += (item.price || 0) * (item.quantity || 0);
    }

    await userCartRef.update({ total: newTotal });

    res.send(quantity === 0
      ? "Đã xoá món ăn (số lượng = 0) và cập nhật tổng tiền"
      : "Cập nhật số lượng và tổng tiền thành công");

  } catch (err) {
    res.status(500).send("Lỗi khi cập nhật món ăn: " + err.message);
  }
});


// Xoá thông tin giỏ hàng
router.delete('/:userId', (req, res) => {
  const userId = req.params.userId;

  cartRef.child(userId).remove()
    .then(() => res.send("Xoá thông tin giỏ hàng thành công"))
    .catch(err => res.status(500).send(err));
});

// Xoá một món ăn trong giỏ hàng theo id người dùng và id món ăn
router.delete('/:userId/MenuFood/:foodId', async (req, res) => {
  const { userId, foodId } = req.params;

  try {
    const userCartRef = cartRef.child(userId);
    const foodRef = userCartRef.child('MenuFood').child(foodId);

    // Lấy dữ liệu món ăn trước khi xoá
    const foodSnap = await foodRef.once('value');

    if (!foodSnap.exists()) {
      return res.status(404).send("Món ăn không tồn tại trong giỏ hàng");
    }

    const foodData = foodSnap.val();
    const itemTotal = foodData.price * foodData.quantity;

    // Lấy current total
    const userSnap = await userCartRef.once('value');
    const currentTotal = userSnap.val()?.total || 0;
    const updatedTotal = currentTotal - itemTotal;

    // Xoá món ăn và cập nhật total
    await userCartRef.update({
      [`MenuFood/${foodId}`]: null,
      total: updatedTotal >= 0 ? updatedTotal : 0 // đảm bảo không âm
    });

    res.send("Xoá món ăn và cập nhật tổng tiền thành công");
  } catch (err) {
    res.status(500).send("Lỗi khi xoá món ăn: " + err.message);
  }
});

module.exports = router;
