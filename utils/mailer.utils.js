const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const createEmailBody = (linkId, ipAddress, ticketNo, projectName) => {
  const currentDateTime = moment().format("DD-MM-YYYY HH:mm");
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <div style="text-align: center;">
        <a href="https://xsoldata.com/" target="_blank">
          <img src="cid:headerImage" alt="Header Image" style="width: 100%; max-width: 600px;"/>
        </a>
      </div>
      <div style="padding: 20px; text-align: center;">
        <table style="margin: 0 auto; max-width: 600px; text-align: left;">
          <tr>
            <td style="padding: 10px;">
              <p style="color: black;"><span style="font-weight: bold; color: black;">Project ID :</span> ${projectName}</p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">Link ID :</span> ${linkId}</p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">IP Address 1 :</span> ${ipAddress}</p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">Ticket No:</span> ${ticketNo}</p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">Date :</span> ${currentDateTime}</p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">Problem Code :</span> LINK DOWN</p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">Ticket Status :</span> Pending</p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">Created by :</span> BIGCRM<sup>®</sup></p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">Description :</span> Auto Ticketing system@</p>
              <p style="color: black;"><span style="font-weight: bold; color: black;">Service Update :</span></p>
            </td>
          </tr>
        </table>
      </div>
      <div style="text-align: center;">
        <a href="https://xsoldata.com/" target="_blank">
          <img src="cid:footerImage" alt="Footer Image" style="width: 100%; max-width: 600px;"/>
        </a>
      </div>
    </div>
  `;
};

const sendEmail = (to, subject, linkId, ipAddress, ticketNo, projectName) => {
  return new Promise((resolve, reject) => {
    const htmlContent = createEmailBody(
      linkId,
      ipAddress,
      ticketNo,
      projectName
    );
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: "header.png",
          path: path.join(__dirname, "..", "images", "header.png"),
          cid: "headerImage",
        },
        {
          filename: "footer.png",
          path: path.join(__dirname, "..", "images", "footer.png"),
          cid: "footerImage",
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info);
      }
    });
  });
};

module.exports = sendEmail;