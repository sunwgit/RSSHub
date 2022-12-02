const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    const rootUrl = 'https://github.com/Geekhyt/weekly';

    const response = await got({
        method: 'get',
        url: rootUrl,
    });

    const $ = cheerio.load(response.data);

    let items = $('.markdown-body ul li a')
        .toArray()
        .map((item) => {
            item = $(item);
            return {
                title: item.text(),
                link: item.attr('href'),
            };
        });

    items = await Promise.all(
        items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                });

                const content = cheerio.load(detailResponse.data);

                // content('h3, footer').remove();

                item.description = content('.edit-comment-hide').html();
                item.pubDate = parseDate(content('relative-time').first().attr('datetime'));

                return item;
            })
        )
    );

    ctx.state.data = {
        title: $('title').text(),
        link: rootUrl,
        item: items,
    };
};
