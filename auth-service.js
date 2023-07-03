var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

var userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      "mongodb+srv://SooyeonKim:wozhIp-xybsyp-3quwdo@senecaweb.gudslwj.mongodb.net/test"
    );

    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;

          let newUser = new User(userData);

          newUser.save((err) => {
            if (err && err.code === 11000) {
              reject("User Name already taken");
            } else if (err && err.code !== 11000) {
              reject("There was an error creating the user: " + err);
            } else {
              resolve();
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.find({ userName: userData.userName })
      .exec()
      .then((users) => {
        if (users.length == 0) {
          reject("Unable to find user: " + userData.userName);
        } else {
          bcrypt
            .compare(userData.password, users[0].password)
            .then((result) => {
              if (result == true) {
                users[0].loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });

                User.updateOne(
                  { userName: users[0].userName },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                  .exec()
                  .then(() => {
                    resolve(users[0]);
                  })
                  .catch((err) => {
                    reject("There was an error verifying the user: " + err);
                  });
              } else {
                reject("Incorrect Password for user: " + userData.userName);
              }
            });
        }
      });
  });
};
