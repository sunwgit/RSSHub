const got = require('@/utils/got');
const cheerio = require('cheerio');
const date = require('@/utils/date');
const iconvLite = require('iconv-lite');

module.exports = async (ctx) => {
    const bbsid = ctx.params.bbsid;
    const category = ctx.params.category || 'lastpost';
    let count = ctx.params.count || 10;
    count = count > 20 ? 20 : count;
    const rootUrl = `https://bbs.mala.cn/forum.php?mod=forumdisplay&fid=${bbsid}&filter=${category}&orderby=${category}`;
    const data = await got({
        method: 'get',
        url: rootUrl,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
        },
        responseType: 'buffer',
    });

    const $ = cheerio.load(iconvLite.decode(Buffer.from(data.rawBody), 'gbk'));

    const list = $(`table[summary=forum_${bbsid}] th a.s.xst`)
        .filter((index) => index <= count)
        .map((index, item) => {
            item = $(item);
            return {
                title: item.text(),
                link: item.attr('href'),
            };
        })
        .get();

    const items = (
        await Promise.all(
            list.map((item) =>
                ctx.cache.tryGet(item.link, async () => {
                    const detailResponse = await got({
                        method: 'get',
                        url: item.link,
                        headers: {
                            Referer: rootUrl,
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
                        },
                        responseType: 'buffer',
                    });
                    const $1 = cheerio.load(iconvLite.decode(Buffer.from(detailResponse.rawBody), 'gbk'));

                    const authors = $1('#ct .bdlist .favatar .pi');
                    const floors = $1('#ct .bdlist .pi strong');
                    const comments = $1('#ct .bdlist .pcb .t_fsz').map((_, com) => {
                        const tf = $('.t_f', com);
                        if (_ === 0 && /立即加入/.test($(tf).text())) {
                            $('a', 'div', tf).remove();
                            $('div ignore_js_op', 'div', tf).last().remove();
                        }
                        $('.aimg_tip', tf).remove();
                        const pattl = $('.pattl', com);
                        pattl.appendTo(tf);
                        $('.tip', tf).remove();
                        return tf;
                    });

                    item.pubDate = date($1('em', '#ct .bdlist .authi').text(), 8);
                    item.author = authors.eq(0).text().trim();
                    item.description = '';

                    const appendMsg = comments.length > 1 ? '<strong>网友评论如下: </strong><br><br>' : '';
                    comments.each((index, reply) => {
                        let username = authors.eq(index).text().trim();
                        username = username ? username : '未知网友';
                        const author = index === 0 ? '' : `<strong> ${$(floors.eq(index)).text()}` + username + ': </strong>';
                        item.description +=
                            author +
                            $(reply)
                                .html()
                                .replace(/{:.+?:}|src=".*?(?=\s+file)/g, '')
                                .replace(/file=/g, 'src=')
                                .replace(/\s*(?:<br>)+/g, '<br>') +
                            `<br><br>${index === 0 ? appendMsg : ''}`;
                    });
                    return item;
                })
            )
        )
    ).filter((item) => item.description);

    ctx.state.data = {
        title: `麻辣社区-${$('a', '#pt').last().text()}`,
        link: rootUrl,
        item: items,
    };
};
