let habitica = require('../../controllers/habitica');
let express = require('express');
let router = express.Router();

// Get a user's tasks
// "habits", "dailys", "todos", "rewards", "completedTodos"
router.get('/', function (req, res) {
    habitica.getAll()
        .then((data) => {
            res.send(data);
        }).catch((err) => {
            res.send(err);
        });
    // res.send('Hello World!');
});

//
router.get('/:id', function (req, res) {
    console.log(req.params.id);
    res.send(JSON.stringify(req.body));
});

module.exports = router;