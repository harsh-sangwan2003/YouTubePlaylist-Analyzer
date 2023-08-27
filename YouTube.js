const fs = require('fs');
const puppeteer = require('puppeteer');
const pdfkit = require('pdfkit');

const url = 'https://www.youtube.com/playlist?list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj'
let page;

(async () => {

    try {

        let browserOpen = await puppeteer.launch({

            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        })

        let newTab = await browserOpen.pages();
        page = newTab[0];

        await page.goto(url);

        await page.waitForSelector(".style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28");

        let playlistName = await page.evaluate((selector) => {

            return document.querySelector(selector).innerText;

        }, ".style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28");


        let info = await page.evaluate(getData, ".byline-item.style-scope.ytd-playlist-byline-renderer");

        let totalVideos = info.noOfVideos.split(" ")[0];

        console.log(playlistName, info.noOfVideos, info.noOfViews);
        console.log("Total Videos: ", totalVideos);

        let currentVideos = await getCVideosLength();
        console.log(currentVideos);

        while (totalVideos - currentVideos >= 20) {

            await scrollToBottom();
            currentVideos = await getCVideosLength();

        }

        let finalList = await getStats();

        let pdfDoc = new pdfkit;
        pdfDoc.pipe(fs.createWriteStream("Playlist.pdf"));
        pdfDoc.text(JSON.stringify(finalList));
        pdfDoc.end();

    } catch (err) {
        console.log(err);
    }
})();

async function getStats() {

    let list = await page.evaluate(getNameAndDuration, "#container #video-title", "#container span[aria-label]");
    return list;
}

function getNameAndDuration(titleSelector, durationSelector) {

    let titleEle = document.querySelectorAll(titleSelector);
    let durationEle = document.querySelectorAll(durationSelector);

    let currentList = [];

    for (let i = 0; i < durationEle.length; i++) {

        let title = titleEle[i].innerText;
        let duration = durationEle[i].innerText;

        currentList.push({ title, duration });
    }

    return currentList;
}

async function scrollToBottom() {

    await page.evaluate(goToBottom);
    function goToBottom() {

        window.scrollBy(0, window.innerHeight);
    }
}

async function getCVideosLength() {

    let length = await page.evaluate(getLength, ".style-scope.ytd-playlist-video-list-renderer");
    return length;
}

function getLength(durationSelector) {

    let durationEle = document.querySelectorAll(durationSelector);
    return durationEle.length;
}

function getData(selector) {

    let allElements = document.querySelectorAll(selector);
    let noOfVideos = allElements[0].innerText;
    let noOfViews = allElements[1].innerText;

    return {

        noOfVideos,
        noOfViews
    }
}