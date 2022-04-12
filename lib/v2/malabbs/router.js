module.exports = function (router) {
    router.get('/:bbsid/:category*', require('./index'));
};
