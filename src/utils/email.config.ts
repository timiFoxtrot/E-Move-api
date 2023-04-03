import nodemailer from "nodemailer"

export const sendEmail = async (email:any, subject:any, text:any) => {
 try{
  const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      service: 'gmail',
      secure: false,
      auth: {
            user: process.env.USEREMAIL,
          pass: process.env.PASS,
      },
  })
    await transporter.sendMail({
        from: process.env.USEREMAIL,
        to: email,
        subject: subject,
        html: text,
    })
    console.log("Email sent Successfully");
 }catch(err){
  console.log(err);
 }
}