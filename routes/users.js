var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
})
.('/login', (req, res, next) => {
  res.status(200).json({"Message" : "hi!"});
});

module.exports = router;
