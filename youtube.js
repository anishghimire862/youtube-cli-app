const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const program = require('commander');
const inquirer = require('inquirer');


program
  .version('0.0.1')
  .option('-s, --search [name of video to be searched]', 'list of videos')
  .parse(process.argv)

let questions = [
  {
    type: 'input',
    name: 'query',
    message: 'name of the video to be searched'
  }
];

let copyQuestions = [
  {
    type: 'input',
    name: 'number',
    message: 'number of the video to echo link'
  }
]

let repeatCommand = [
  {
    type: 'input',
    name: 'command',
    message: 'type / to search another video or q to exit'
  }
]

function searchVideo(searchQuery) {
  const url = 'https://www.youtube.com/results?search_query=' + searchQuery;
  puppeteer
    .launch()
    .then(browser => browser.newPage())
    .then(page => {
      return page.goto(url).then(function() {
        return page.content();
      });
    })
    .then(html => {
      const $ = cheerio.load(html);
      const data = [];
      $('ytd-video-renderer').each(function() {
        let title = $(this).find('#video-title').attr('title');
        let href = $(this).find('.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail').attr('href');
        let channelName = $(this).find('.style-scope.ytd-channel-name.complex-string').text();
        let views = $(this).find('#metadata-line span:first-child').text();
        let publishedOn = $(this).find('#metadata-line span:nth-child(2)').text();
        data.push({title: title, href: href, channelName: channelName, views: views, publishedOn: publishedOn})
      });

      console.log(data);

      inquirer.prompt(copyQuestions).then(function(answers) {
        const { exec } = require('child_process');
        let videoUrl = 'https://www.youtube.com' + data[answers.number-1].href 
        exec('mpv '+ videoUrl, (err, stdout, stderr) => {
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);   
        });
        console.log('The video will start soon on MPV palyer ', data[answers.number-1].title)

        inquirer.prompt(repeatCommand).then(function(answer) {
          if(answer.command === '/') 
            getVideoTitle();
          else if (answer.command === 'q')
            process.exit(1)
          else 
            console.log('Command not found.')
        })

      })

    })
    .catch(console.error);
}

function getVideoTitle() {
  inquirer.prompt(questions).then(function(answers) {
    searchVideo(answers.query);
  })
}

getVideoTitle();