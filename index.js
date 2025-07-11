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

// 🧩 Import routes
const foodsRoutes = require('./routes/foods');
const categoriesRoutes = require('./routes/categories');
const statusRoutes = require('./routes/status');
const usersRoutes = require('./routes/users');
const unitRoutes = require('./routes/unit');

app.use('/foods', foodsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/status', statusRoutes);
app.use('/users', usersRoutes);
app.use('/unit', unitRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
