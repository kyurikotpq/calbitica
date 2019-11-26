const router = require('express').Router();
const authCheck = require('../../middleware/auth-check');
const sync = require('../../controllers/sync');

const gcal = require('../../controllers/gcal');

router.get('/', authCheck.isLoggedin, (req, res) => {
    res.render('home');
});

router.get('/dashboard', authCheck.mustLogin, (req, res) => {
    console.log("===============")
    console.log(req.session.user)

    gcal.calList().then((list) => {
        // console.log(list);
        res.send(list);
    }).catch((rej) => {
        console.log('whoops, gcal didnt go thru')
        res.send(rej);
    });
    
    // sync.loginSync(req.user)
    //     .then((res) => {
    //         res.render('dashboard', { user: req.user });
    //     })
});

router.get('/calList', (req, res) => {
    // gcal.calList().then((list) => {
    //     console.log(list);
    //     res(list);
    // }).catch((rej) => {

    // });
})

module.exports = router;