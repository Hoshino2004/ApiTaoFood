const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tousehao-default-rtdb.firebaseio.com/"
});

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Import routes
const foodsRoutes = require('./routes/foods');
const categoriesRoutes = require('./routes/categories');
const usersRoutes = require('./routes/users');
const unitRoutes = require('./routes/unit');
const cartRoutes = require('./routes/cart');
const billsRoutes = require('./routes/bills');

app.use('/foods', foodsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/users', usersRoutes);
app.use('/unit', unitRoutes);
app.use('/cart', cartRoutes);
app.use('/bills', billsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
