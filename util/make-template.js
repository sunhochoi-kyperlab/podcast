/**
 * Created by krinmayu on 2017-03-22. version 1.0
 */

var nodeGit = require('nodegit');
var repository = nodeGit.Repository;
var simpleGit = require('simple-git');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var sub = require('./sub.js').main;

var fileName = 'package.json';
var url = 'https://github.com/OBIGOGIT/obigo-sdk-ojsf-starter-kit.git';
var workQuestion =
{
  type: 'rawlist',
  name: 'work',
  message: 'what do you want to do?',
  choices: ['Modify', 'Maintain', 'Auto']
};
var categoryQuestion = [{
  type: 'rawlist',
  name: 'key',
  message: 'what is your target?',
  choices: ['name', 'version']
},
  {
    type: 'input',
    name: 'modify',
    message: 'enter!!!!'
  }];
function createRelease() {
  repository.init('./release', 0).then(function () {
    console.log('Release init');
    process.chdir('./release');
    simpleGit().addRemote('origin', url, function () {
      console.log('Release remote complete')
      simpleGit().pull('origin', 'final', createMaster)
    })
  })
}
function createMaster() {
  process.chdir('..');
  nodeGit.Repository.init('./master', 0).then(function () {
    console.log('Master init');
    process.chdir('./master');
    simpleGit().addRemote('origin', url, function () {
      console.log('Master remote complete');
      simpleGit().pull('origin', 'master', overwrite)
    })
  })
}
function overwrite() {
  process.chdir('..');
  fs.readdir('release', function modifyrRelese(err, list) {
    var i;
    var length = list.length;
    for (i = 0; i < length; i++) {
      if (list[i] === '.git') {
        continue
      }
      else {
        fs.remove('./release/' + list[i])
      }
    }
    modifyMaster();
  })
}
function modifyMaster() {
  fs.remove('./master/.git', function () {
    fs.copy('master', 'release', function () {
      fs.remove('master', function () {
        console.log('modify complete');
        selectWork();
      })
    })
  })
}
function selectWork() {
  inquirer.prompt(workQuestion).then(function (answers) {
    if (answers.work === 'Modify' || answers.work === 'Auto') {
      selectCategory(answers.work);
    }
    else {
      sub();
    }
  })
}
function selectCategory(work) {
  if (work === 'Modify') {
    inquirer.prompt(categoryQuestion).then(function (answers) {
      process.chdir('release');
      fs.readFile(fileName, 'utf8', function (err, data) {
        searchKey(data, answers);
      })
    })
  }
  else {
    var answers = {
      key: 'version'
    };
    process.chdir('release');
    fs.readFile(fileName, 'utf8', function (err, data) {
      searchKey(data, answers)
    })
  }

}
function searchKey(data, answers) {
  var regex = '(' + answers.key + ')(\\W+)(\\S+)(")',
    reg = new RegExp(regex, 'gi');
  var result = data.replace(reg, function (match, p1, p2, p3, p4) {
    if (answers.hasOwnProperty('modify')) {
      p3 = answers.modify;
      var file = p1.concat(p2, p3, p4);
      return file;
    }
    else {
      console.log(p3)
      var version = p3;
      p3 = version;
      var file = p1.concat(p2, p3, p4);
      return file;
    }
  })
  fs.writeFile(fileName, result, sub)
}
//createRelease();
selectWork();
