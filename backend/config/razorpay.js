import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.log("❌ Razorpay keys missing:", {
    keyId: process.env.RAZORPAY_KEY_ID ? "OK" : "MISSING",
    keySecret: process.env.RAZORPAY_KEY_SECRET ? "OK" : "MISSING",
  });
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
