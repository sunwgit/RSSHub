module.exports = function (router) {
    router.get('/:fid/:typeid?', require('./index'));
};
