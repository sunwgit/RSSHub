const got = require('@/utils/got');
const cheerio = require('cheerio');
const date = require('@/utils/date');
const iconvLite = require('iconv-lite');

module.exports = async (ctx) => {
    const base = `http://www.1000qm.vip/forum.php?mod=forumdisplay&fid=${ctx.params.fid}&filter=typeid&typeid=${ctx.params.typeid}`;
    const data = await got.get(base, {
        responseType: 'buffer',
    });

    const $ = cheerio.load(iconvLite.decode(Buffer.from(data.rawBody), 'gbk'));

    const list = $('#threadlisttableid tbody tr')
        .filter((_) => _ > 1 && _ < 7)
        .map((_, item) => {
            item = $(item);
            return {
                title: $('th a.s.xst', item).text(),
                link: $('th a.s.xst', item).attr('href'),
                pubDate: date($('td.by em', item).text(), 8),
                author: $('td.by cite', item).eq(0).text(),
            };
        })
        .get();
    const items = await Promise.all(
        list.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                    headers: {
                        Referer: base,
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
                    },
                    responseType: 'buffer',
                });
                const $1 = cheerio.load(iconvLite.decode(Buffer.from(detailResponse.rawBody), 'gbk'));

                item.description = $1('.t_f')
                    .eq(0)
                    .html()
                    .replace(/<div.*?div>/g, '');
                return item;
            })
        )
    );
    ctx.state.data = {
        title: `阡陌居-${$('#pt .z a').last().text()}`,
        link: base,
        description: '阡陌居论坛',
        item: items,
    };
};
