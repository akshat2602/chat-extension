var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var http = require("http");
var cors = require("cors")
var socketio = require("socket.io");
var app = express();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var {addUser, removeUser, getUser, getUsersInRoom} = require("./socket/users");

// Create the http server
const server = require("http").createServer(app);

// Create sockets
const io = socketio(server, {cors:{origin:"*"}});

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  // Set locals, only providing error
  // in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

io.on("connect", (socket) => {
  socket.on("join", ({name, room}, callback) => {
    const {error, user} = addUser({ id: socket.id, name, room});

    if (error) return callback(error);

    socket.join(user.room);
    socket.emit("welcomeMessage", {
      user: "admin", text: `Welcome to the Room, ${user.name}`,
    });
    socket.broadcast
        .to(user.room)
        .emit("welcomeMessage", {
              user: "admin", text: `${user.name} has joined the room!`});

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id)
    if (user){
      io.to(user.room)
          .emit("message", {
            user: user.name, text: message
          });
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user){
      io.to(user.room)
          .emit("message", {user: "admin", text: `${user.name} has the left the room!`})
    }
  });

  console.log("Socket Connected");
});

module.exports = { app: app, server: server };
