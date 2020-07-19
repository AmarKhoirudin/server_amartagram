const nodemailer = require("nodemailer");

exports.sendEmail = dataEmail => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        requireTLS: true,
        auth: {
          user: "amar.khoi26@gmail.com", // generated ethereal user
          pass: "rkiyloiyisrzlmpz", // generated ethereal password
        },
      });
    return (
        transporter.sendMail(dataEmail)
            .then(res => res.json())
            .then(info => console.log(info.message))
            .catch(err => res.status(422).json({error: err}))
    )
}