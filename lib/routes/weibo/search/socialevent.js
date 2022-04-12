const got = require('@/utils/got');

module.exports = async (ctx) => {
    const {
        data: { data },
    } = await got({
        method: 'get',
        url: 'https://m.weibo.cn/api/container/getIndex?containerid=231648_-_3&title=微博热搜&extparam=seat=1&mi_cid=100103&lcate=1001&dgr=0&filter_type=realtimehot&pos=0_0&c_type=30&cate=10103&display_time=1647404865&pre_seqid=452151783&luicode=10000011&lfid=231583&page_type=08',
        headers: {
            Referer: 'https://s.weibo.com/top/summary?cate=socialevent',
            'MWeibo-Pwa': 1,
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        },
    });

    ctx.state.data = {
        title: '微博要闻榜',
        link: 'https://s.weibo.com/top/summary?cate=socialevent',
        description: '实时新闻，每分钟更新一次',
        item: data.cards[0].card_group
            .filter((item) => !/人民日报/.test(item.desc))
            .map((item) => {
                const title = item.title_sub;
                const link = item.scheme;
                const description = item.desc;
                return {
                    title,
                    description,
                    link,
                };
            }),
    };
};
