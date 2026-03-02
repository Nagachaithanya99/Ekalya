import Enrollment from "../models/Enrollment.js";

export const adminEnrollmentPaymentsTable = async (req, res) => {
  try {
    const rows = await Enrollment.aggregate([
      // user join
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // course join
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },

      // payment join (latest payment for that user+course)
      {
        $lookup: {
          from: "payments",
          let: { uid: "$userId", cid: "$courseId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$uid"] },
                    { $eq: ["$courseId", "$$cid"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "payment",
        },
      },
      { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },

      // final fields
      {
        $project: {
          enrolledAt: "$createdAt",
          studentName: "$user.name",
          studentEmail: "$user.email",
          courseTitle: "$course.title",
          coursePrice: "$course.price",

          paymentProvider: "$payment.provider",
          paymentAmount: "$payment.amount",
          paymentCurrency: "$payment.currency",
          paymentStatus: "$payment.status",
          paymentId: "$payment.paymentId",
          orderId: "$payment.orderId",
          paidAt: "$payment.createdAt",
        },
      },

      { $sort: { enrolledAt: -1 } },
    ]);

    return res.json(rows);
  } catch (err) {
    console.error("adminEnrollmentPaymentsTable error:", err);
    return res.status(500).json({ message: "Failed to load payments table" });
  }
};
