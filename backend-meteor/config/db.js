const mongo = require("mongoose");

const connect = async () => {
  console.log(process.env.MONGOURI);
  try {
    const con = await mongo.connect(
      "mongodb+srv://goswamisandeep7059_db_user:kbwflqDsRo58WiyV@cluster0.ziji6ai.mongodb.net"
    );
    console.log(`MongoDB connected:`);
  } catch (err) {
    console.log(err);
  }
};

module.exports = connect;
