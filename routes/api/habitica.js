let habitica = require('../../controllers/habitica');
let express = require('express');
let router = express.Router();

// Get a user's tasks
// "habits", "dailys", "todos", "rewards", "completedTodos"
router.get('/', function (req, res) {
    const apiKey = req.header("Bearer");
    habitica.getAll(apiKey)
        .then((data) => {
            res.status(400).json(data);
        }).catch((err) => {
            res.status(500).json(err);
        });
    // res.send('Hello World!');
});

//
router.get('/:id', function (req, res) {
    console.log(req.params.id);
    res.send(JSON.stringify(req.body));
});

module.exports = router;