import Mailgen from "mailgen";
import nodemailer from "nodemailer";
// import { Product } from "../models/apps/ecommerce/product.models.js";

/**
 *
 * @param {{email: string; subject: string; mailgenContent: Mailgen.Content; }} options
 */
const sendEmail = async (options) => {
  // Initialize mailgen instance with default theme and brand configuration
  //   console.log("The mail before starting ", options);

  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "CNC AUDIT",
      link: "https://codencreative.com/",
    },
  });

  //   console.log("The mail generator is ", mailGenerator);
  // For more info on how mailgen content work visit https://github.com/eladnava/mailgen#readme
  // Generate the plaintext version of the e-mail (for clients that do not support HTML)
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  // Generate an HTML email with the provided contents
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  // Create a nodemailer transporter instance which is responsible to send a mail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });
  //   const transporter = nodemailer.createTransport({
  //     host: "live.smtp.mailtrap.io",
  //     port: 587,
  //     auth: {
  //       user: "api",
  //       pass: "b1a8aaeaf4690a6021f71aea9d3e19a8",
  //     },
  //   });
  //   console.log("The mail transporter is ", transporter);

  const mail = {
    from: { name: "CNC AUDIT", address: process.env.MAILTRAP_SMTP_USER }, // We can name this anything. The mail will go to your Mailtrap inbox
    to: options.email, // receiver's mail
    subject: options.subject, // mail subject
    text: emailTextual, // mailgen content textual variant
    html: emailHtml, // mailgen content html variant
  };

  //   console.log("The mail mail is ", mail);

  try {
    // console.log("The mail before sending to transporter is ", mail);

    await transporter.sendMail(mail);
    console.log("The mail before after to transporter is ");
  } catch (error) {
    // As sending email is not strongly coupled to the business logic it is not worth to raise an error when email sending fails
    // So it's better to fail silently rather than breaking the app
    console.log(
      "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
    );
    console.log("Error: ", error);
  }
};

// const sendPlainTextEmail = async (options) => {

//   let mailGenerator = new Mailgen({
//     theme: 'default', // You can choose 'default' or 'salted' themes or create a custom one
//     product: {
//         name: 'Your Company',
//         link: 'https://yourcompany.com',
//         // Optional product logo
//         logo: 'https://yourcompany.com/logo.png'
//     }
// });

//   // Create a nodemailer transporter instance
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     secure: true,
//     port: 465,
//     auth: {
//       user: process.env.MAILTRAP_SMTP_USER,
//       pass: process.env.MAILTRAP_SMTP_PASS,
//     },
//   });

//   // Construct the email object with only plain text content
//   const mail = {
//     from: { name: "CNC AUDIT", address: process.env.MAILTRAP_SMTP_USER },
//     to: options.email,
//     subject: options.subject,
//     text: options.mailgenContent, // Send only plain text content
//   };

//   try {
//     // Send the email
//     await transporter.sendMail(mail);
//     //   console.log("Plain text email sent successfully");
//   } catch (error) {
//     console.log(
//       "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
//     );
//     console.log("Error: ", error);
//   }
// };

const sendPlainTextEmail = async (options) => {
  // Configure Mailgen
  let mailGenerator = new Mailgen({
    theme: "default", // You can choose 'default' or 'salted' themes or create a custom one
    product: {
      name: "Your Company",
      link: "https://aspecialapp.com",
      // Optional product logo
      logo: "https://yourcompany.com/logo.png",
    },
  });

  // Email content
  let email = {
    body: {
      name: options.username, // Using the username provided in options
      intro:
        "You have received this email because a password reset request OR Staff Login for your account was received.",
      action: {
        instructions: `Please use the following temporary password to login and change it after your first login: ${options.temporaryPassword}`,
        button: {
          color: "#22BC66", // Optional action button color
          text: "Login Now",
          link: "https://yourcompany.com/login",
        },
      },
      outro:
        "If you did not request a password reset, please ignore this email or contact support if you have questions.",
    },
  };

  // Generate the plaintext email content
  let emailText = mailGenerator.generatePlaintext(email);

  // Create a nodemailer transporter instance
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  // Construct the email object with only plain text content
  const mail = {
    from: { name: "CNC AUDIT", address: process.env.MAILTRAP_SMTP_USER },
    to: options.email,
    subject: options.subject,
    text: emailText, // Send only plain text content generated by Mailgen
  };

  try {
    // Send the email
    await transporter.sendMail(mail);
    //   console.log("Plain text email sent successfully");
  } catch (error) {
    console.log(
      "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
    );
    console.log("Error: ", error);
  }
};

/**
 *
 * @param {string} phoneNumber
 * @param {string} verificationUrl
 * @returns {Mailgen.Content}
 * @description It designs the email verification mail
 */
const emailVerificationMailgenContent = (phoneNumber, verificationUrl) => {
  return {
    body: {
      name: phoneNumber,
      intro: "Welcome to our app! We're very excited to have you on board.",
      action: {
        instructions:
          "To verify your email please click on the following button:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

/**
 *
 * @param {string} phoneNumber
 * @param {string} verificationUrl
 * @returns {Mailgen.Content}
 * @description It designs the forgot password mail
 */
const forgotPasswordMailgenContent = (phoneNumber, passwordResetUrl) => {
  return {
    body: {
      name: phoneNumber,
      intro: "We got a request to reset the password of our account",
      action: {
        instructions:
          "To reset your password click on the following button or link:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendPlainTextEmail,
};
