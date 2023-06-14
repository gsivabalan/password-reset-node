const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const dbURI = 'mongodb://localhost:27017/password-reset-app';
const mongoose = require('mongoose');
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const User = require('./models/User');


const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'siva@gmail.com',
    pass: 'sivA.123',
  },
});


app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

   
    const resetToken = uuidv4();
    user.resetToken = resetToken;
    await user.save();

    
    const resetLink = `http://localhost:9000/reset-password/${resetToken}`;
    const mailOptions = {
      to: email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetLink}`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Reset link sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    
    
    const user = await User.findOne({ resetToken });
    if (!user) {
      return res.status(404).json({ error: 'Invalid or expired reset token' });
    }

    
    
    user.password = newPassword;
    user.resetToken = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.listen(PORT, () => console.log(`Server running on localhost:${PORT}`));
