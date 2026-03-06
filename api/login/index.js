const jwt = require("jsonwebtoken");

module.exports = async function (context, req) {

const { username, password } = req.body;

if (username === "admin" && password === "1234") {

const token = jwt.sign(
{ user: username },
"secretkey",
{ expiresIn: "1h" }
);

context.res = {
status: 200,
body: {
success: true,
token: token
}
};

} else {

context.res = {
status: 401,
body: {
success: false,
message: "Invalid credentials"
}
};

}

};