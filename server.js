const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { swaggerUi, swaggerSpec } = require('./swaggerConfig'); // Import Swagger configuration

const app = express();

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  credentials: true, // If you're sending cookies or authentication headers
}));


// Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.send('API is running');
});

const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const formStatsRoutes = require('./routes/formStatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/form-stats', formStatsRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(process.env.PORT, () => {
  mongoose.connect(process.env.MONGO_URL)
    .then(() => {
      console.log('listening on port ' + process.env.PORT);
    })
    .catch(err => console.log(err));
});
