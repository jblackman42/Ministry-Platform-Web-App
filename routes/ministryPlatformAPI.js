const express = require('express');
const router = express.Router();
const axios = require('axios');
const {MP, getAccessToken} = require('../models/MP.js');

const OTP = new Map();

const verifyOTP = (OTPCode) => {
  const expirationDate = OTP.get(OTPCode);

  return expirationDate && new Date() < new Date(expirationDate)
}

router.get('/reset-password/user', async (req, res) => {
  const { email } = req.query;

  if (!email) return res.status(400).send({error: 'Missing Parameter: email'}).end();
  
  try {
    const user = await MP.findOne({ Email_Address: email });

    if (user === null) return res.send(null)
    const { PCA_User_ID, Email_Address, Phone_Number } = user;
    const emailParts = Email_Address.split("@");
    const namePart = emailParts[0];
    const domainPart = emailParts[1];
    const censoredUser = {
      User_ID: PCA_User_ID,
      Email_Address: namePart.slice(0, 3) + "***@" + domainPart,
      Phone_Number: "***-***-" + Phone_Number.slice(-4)
    }
    res.send(censoredUser);
  } catch (error) {
    console.log(error)
    return res.status(500).send(error).end();
  }
})

router.get('/reset-password/get-code', async (req, res) => {
  const { User_ID, Method } = req.query;

  if (!User_ID || !Method) return res.status(400).send({error: 'Missing Parameter: User_ID or Method'}).end();
  
  const expirationMinutes = 10;
  try {
    const user = await MP.findByID(User_ID);

    const newOTPCode = MP.generateTimeBasedCode();
    const OTPExpirationDate = new Date(new Date().getTime() + (expirationMinutes * 60 * 1000))
    OTP.set(newOTPCode, OTPExpirationDate);
    // const text = await MP.sendText(user.Phone_Number, `Here's your code: ${MP.generateTimeBasedCode()}`);
    console.log(newOTPCode)
    const text = 'yeet'
    res.send(text);
  } catch (error) {
    res.status(500).send(error).end();
  }
})

router.post('/reset-password/verify-code', async (req, res) => {
  const { OTPCode } = req.body;

  if (!OTPCode) return res.status(400).send({error: 'Missing Data: OTPCode'}).end();

  res.send(verifyOTP(OTPCode));
})

router.post('/reset-password/set-password', async (req, res) => {
  const { User_ID, Password, OTPCode } = req.body;

  if (!User_ID || !Password || !OTPCode) return res.status(400).send({error: 'Missing Data: User_ID or Password'}).end();

  try {
    if (!verifyOTP(OTPCode)) return res.status(400).send({error: 'Invalid OTP Code'}).end();
    const newUser = await axios({
      method: 'put',
      url: 'https://my.pureheart.org/ministryplatformapi/tables/PCA_Users',
      data: [{
        PCA_User_ID: User_ID,
        Password: Password
      }],
      headers: {
        'Content-Type': 'Application/JSON',
        'Authorization': 'Bearer ' + await getAccessToken()
      }
    })
      .then(response => response.data)

    res.send(newUser)
  } catch (error) {
    console.log(error)
    res.status(500).send(error).end();
  }
})

module.exports = router;