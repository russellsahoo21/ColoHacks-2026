import emailjs from '@emailjs/nodejs';

export const sendVerificationEmail = async (email, otpCode) => {
  // Calculate expiry time (current time + 15 minutes)
  const expiryTime = new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  try {
    const templateParams = {
      email: email,             // Matches {{email}} in your 'To Email' field
      passcode: otpCode,       // Matches {{passcode}} in your template body
      time: expiryTime,        // Matches {{time}}
      company_name: "WardWatch" // Matches {{company_name}} (if you add it)
    };

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log("OTP Sent Successfully to:", email);
    return { success: true };
  } catch (err) {
    console.error("EmailJS Error:", err);
    return { success: false, error: err };
  }
};