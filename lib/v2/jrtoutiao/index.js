const got = require('@/utils/got');

module.exports = async (ctx) => {
    // const base = `https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc`;
    const base = `https://i.snssdk.com/hot-event/hot-board/?origin=hot_board`;
    const res = await got.get(base);
    const data = res.data.data;
    const items = Array.from(data)
        .filter((item, _) => _ > 0)
        .map((item) => ({
            title: item.Title,
            link: item.Url,
            pubDate: '',
            author: '',
        }));
    ctx.state.data = {
        title: '头条热榜',
        link: base,
        description: '头条热榜',
        item: items,
    };
};
