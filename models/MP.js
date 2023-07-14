const axios = require('axios');
const qs = require('qs');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const getAccessToken = async () => {
  const data = await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/oauth/connect/token',
      data: qs.stringify({
          grant_type: "client_credentials",
          scope: "http://www.thinkministry.com/dataplatform/scopes/all",
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET
      })
  })
      .then(response => response.data)
      .catch(err => {
        console.log(err.response.status)
        return {
          access_token: null,
          expires_in: null
        }
      })
  const {access_token, expires_in} = data;
  return access_token;
}

const MP = {
  findOne: async (searchParams) => {
    const filterArr = [];
    
    for (const key in searchParams) {
      if (searchParams.hasOwnProperty(key)) {
        const value = searchParams[key];
        const filter = `${key} = '${value}'`;
        filterArr.push(filter);
      }
    }
    
    const searchQuery = filterArr.join(' AND ');

    return await axios({
      method: 'get',
      url: 'https://my.pureheart.org/ministryplatformapi/tables/PCA_Users',
      headers: {
        'Content-Type': 'Application/JSON',
        'Authorization': 'Bearer ' + await getAccessToken()
      },
      params: {
        $filter: searchQuery
      }
    })
      .then(response => response.data[0] ?? null)
      .catch(err => console.log(err.response.status))
  },
  findByGUID: async (guid) => {
    if (guid.length != 36) {
      return null;
    }
    // console.log(guid)
    return await axios({
      method: 'get',
      url: 'https://my.pureheart.org/ministryplatformapi/tables/PCA_Users',
      headers: {
        'Content-Type': 'Application/JSON',
        'Authorization': 'Bearer ' + await getAccessToken()
      },
      params: {
        $filter: `_User_GUID='${guid}'`
      }
    })
      .then(response => response.data[0] ?? null)
      .catch(err => {
        // console.log(err.response.status)
        return null;
      })
  },
  findByID: async (id) => {
    if (!id) return null;
    return await axios({
      method: 'get',
      url: `https://my.pureheart.org/ministryplatformapi/tables/PCA_Users/${id}`,
      headers: {
        'Content-Type': 'Application/JSON',
        'Authorization': 'Bearer ' + await getAccessToken()
      }
    })
      .then(response => response.data[0] ?? null)
      .catch(err => {
        // console.log(err.response.status)
        return null;
      })
  },
  hashPassword: (input) => {
    let hash = CryptoJS.MD5(input);
    let base64 = CryptoJS.enc.Base64.stringify(hash);
    return base64;
  },
  compare: (inputPassword, storedPassword) => {
    const hash1 = MP.hashPassword(inputPassword);
    const hash2 = storedPassword;

    const buffer1 = Buffer.from(hash1, 'base64');
    const buffer2 = Buffer.from(hash2, 'base64');
    
    if (buffer1.length !== buffer2.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(buffer1, buffer2);
  },
  generateTimeBasedCode: () => {
    const date = new Date();
    const fullYear = date.getFullYear();
    const month = date.getMonth() + 1;  // getMonth returns 0-11, adding 1 to make it 1-12
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const rawCode = fullYear * month * day * hours * minutes * seconds;

    return String(rawCode).substring(0, 6);
  },
  sendText: async (toNumber, messageBody) => {
    try {
      const textData = {
        body: messageBody,
        messagingServiceSid: process.env.TWILIO_SERVICE_SID,
        to: toNumber
      }
      return await client.messages
        .create(textData)
        .then(message => message.sid)
    } catch (err) {
      console.log(err)
      return null
    }
  },
  sendEmail: async (toEmail, emailBody) => {

  }
}

module.exports = MP;