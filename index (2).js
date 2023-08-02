const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');


const sendMessage = async (data) => {
    const apiToken = '6400209512:AAGXms_5y1E8pd1FdUhcV57lYihof1qvD_s';
    const chatId = '@pritomTest';

    try {
        const url = `https://api.telegram.org/bot${apiToken}/sendMessage`;
        let messageText = `
*${data.tokenName}* | ${data.symbol}

\` ${data.contractAddress} \`

MC: *${data.MC}*
LP: *${data.LP}*

Link: [Contract](${data.Contract}) | [Chart](${data.Chart}) | [Owner](${data.Owner}) | [Buy](${data.Buy})
Honeypot: *${data.honeypot}*
Max buy: *${data.maxBuy}*
Buy / Sell / Transfer Tax: *${data.BuySellTransferTax}*
Contract Age: *${data.ContractAge}*
Whales: *${data.Whales}*
Freshes: *${data.Freshes}*
KYCs: *${data.KYCs}*
Total Holders: *${data.totalHolders}*
Top holders are holding: *${data.topHoldersAreHolding}*
        `;
        messageText = messageText.replace(/\./g, '\\.').replace(/\|/g, '\\|')

        const params = {
            chat_id: chatId,
            text: messageText,
            parse_mode: 'MarkdownV2', // Use Markdown formatting
        };

        const response = await axios.post(url, params);
        if (response.status === 200) console.log('Message sent successfully!');
        else console.log('Failed to send the message. Status code:', response.status);

    } catch (error) {
        console.log(error);
        console.error('Error sending the message:', error.message);
    }
};

async function scrapeWebsite(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const divsWithClass = $('div.tgme_widget_message_wrap.js-widget_message_wrap');
        const lastDiv = divsWithClass.last();
        const mainHTML = lastDiv.find('.tgme_widget_message_text.js-message_text').html()


        const contractAddress = mainHTML.match(/<code>(.*?)<\/code>/);
        const honeypot = mainHTML.match(/Honeypot:.<b>(.*?)<\/b>/);
        const maxBuy = mainHTML.match(/Max.buy:.<b>(.*?)<\/b>/);
        const MC = mainHTML.match(/MC:.<b>(.*?)<\/b>/);
        const LP = mainHTML.match(/LP:.<b>(.*?)<\/b>/);
        const topHoldersAreHolding = mainHTML.match(/Top holders are holding:.<b>(.*?)<\/b>/);
        const totalHolders = mainHTML.match(/Total Holders:.<b>(.*?)<\/b>/);
        const KYCs = mainHTML.match(/KYCs:.<b>(.*?)<\/b>/);
        const Freshes = mainHTML.match(/Freshes:.<b>(.*?)<\/b>/);
        const Whales = mainHTML.match(/Whales:.<b>(.*?)<\/b>/);
        const ContractAge = mainHTML.match(/Contract Age:.<b>(.*?)<\/b>/);
        const BuySellTransferTax = mainHTML.match(/Buy.\/.Sell.\/.Transfer Tax:.<b>(.*?)<\/b>.*?<b>(.*?)<\/b>.*?<b>(.*?)<\/b>/);
        const tokenName = mainHTML.match(/<b>(.*?)<\/b>/)
        const symbol = mainHTML.match(/<b>.*?<\/b>....(.*?)<br>/)

        const data = {
            contractAddress: contractAddress ? contractAddress[1] : null,
            honeypot: honeypot ? honeypot[1] : null,
            maxBuy: maxBuy ? maxBuy[1] : null,
            MC: MC ? MC[1] : null,
            LP: LP ? LP[1] : null,
            topHoldersAreHolding: topHoldersAreHolding ? topHoldersAreHolding[1] + "%" : null,
            totalHolders: totalHolders ? totalHolders[1] : null,
            KYCs: KYCs ? KYCs[1] : null,
            Freshes: Freshes ? Freshes[1] : null,
            Whales: Whales ? Whales[1] : null,
            ContractAge: ContractAge ? ContractAge[1] : null,
            BuySellTransferTax: BuySellTransferTax ? BuySellTransferTax[1] + " | " + BuySellTransferTax[2] + " | " + BuySellTransferTax[3] : null,
            tokenName: tokenName ? tokenName[1] : null,
            symbol: symbol ? symbol[1] : null,
        }

        const links = lastDiv.find('a');
        links.map((index, link) => {
            if (!["Contract", "Chart", "Owner", "Buy"].includes($(link).text())) return
            const linkName = $(link).text();
            const linkURL = $(link).attr('href');
            data[linkName] = linkURL;
        })

        return data        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
let lastAddress = null;
async function main() {
    const url = 'https://t.me/s/AlphaLaunch0xPepeBot'; 
    const data = await scrapeWebsite(url);
    if (data.contractAddress === lastAddress) return
    lastAddress = data.contractAddress
    console.log(lastAddress)
    await sendMessage(data)
}


cron.schedule('* * * * *', () => {
    main();
});