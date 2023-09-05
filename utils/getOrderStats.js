const getOrderStats = async () => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" }, // Group by the month of createdAt
        totalOrders: { $sum: 1 }, // Calculate total number of orders in each group
        totalRevenue: { $sum: "$totalPrice" }, // Calculate total revenue in each group
      },
    },
    {
      $sort: { _id: 1 }, // Sort by the month (1 for ascending, -1 for descending)
    },
  ]);

  // Add month names to the results for better readability
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const statsWithMonthNames = stats.map((stat) => ({
    month: months[stat._id - 1],
    totalOrders: stat.totalOrders,
    totalRevenue: stat.totalRevenue,
  }));

  return statsWithMonthNames;
};

module.exports = getOrderStats;
