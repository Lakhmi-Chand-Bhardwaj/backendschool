const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4509;

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define the Enquiry schema
const EnquirySchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  phone: String,
  course: String,
});

const Enquiry = mongoose.model('Enquiry', EnquirySchema);

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',  
  auth: {
    user: process.env.EMAIL_USER,   
    pass: process.env.EMAIL_PASS,  
  },
});

// Function to send the email
const sendEmailNotification = (enquiry) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,    
    to: process.env.NOTIFY_EMAIL,    
    subject: 'New Enquiry Admission', 
    html: `
      <h3>New Enquiry Details:</h3>
      <p><strong>First Name:</strong> ${enquiry.firstname}</p>
      <p><strong>Last Name:</strong> ${enquiry.lastname}</p>
      <p><strong>Email:</strong> ${enquiry.email}</p>
      <p><strong>Phone:</strong> ${enquiry.phone}</p>
      <p><strong>Course:</strong> ${enquiry.course}</p>
    `, 
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log('Error sending email:', err);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

// Submit Enquiry route
app.post('/api/submit', async (req, res) => {
  const { firstname, lastname, email, phone, course } = req.body;

  try {
    // Create a new enquiry and save it to the database
    const newEnquiry = new Enquiry({ firstname, lastname, email, phone, course });
    await newEnquiry.save();

    // Send email notification
    sendEmailNotification(newEnquiry);

    res.status(201).json({ message: 'Enquiry submitted successfully!' });
  } catch (error) {
    console.error('Error submitting the form:', error);
    res.status(500).json({ message: 'Error submitting the form. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
