// index.js
require('dotenv').config();

const line = require('@line/bot-sdk');
const express = require('express');
const app = express();

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

// 日付をフォーマットする関数
function formatDate(date) {
    const year = date.getFullYear();
    const month = (`0${(date.getMonth() + 1)}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}

// 今日から1週間分の日付を生成する関数
function getDateOptions() {
    const options = [];
    const today = new Date();
    for (let i = 0; i <= 6; i++) { // 0〜6で7日分
        const date = new Date();
        date.setDate(today.getDate() + i);
        options.push(formatDate(date));
    }
    return options;
}

// 日付選択用のカルーセルメッセージを生成する関数
function createDateCarousel() {
    const dateOptions = getDateOptions();

    const carouselColumns = dateOptions.map(date => ({
        title: date,
        text: 'この日付を選択してください',
        actions: [
            {
                type: 'postback',
                label: date,
                data: `date=${date}`
            }
        ]
    }));

    return {
        type: 'template',
        altText: '予約可能な日付を選択してください',
        template: {
            type: 'carousel',
            columns: carouselColumns,
            imageAspectRatio: 'rectangle',
            imageSize: 'cover'
        }
    };
}

app.use(express.json());

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // メッセージ以外のイベントは無視
        return Promise.resolve(null);
    }

    const userMessage = event.message.text;

    if (userMessage.includes('予約')) { // 「予約」に関連するメッセージ
        const replyMessage = createDateCarousel();
        return client.replyMessage(event.replyToken, replyMessage);
    }

    // 他のメッセージへの対応
    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ご予約の際は「予約」とお知らせください。'
    });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
