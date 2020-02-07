'use strict'
const { Readable } = require('stream');
const fs = require('fs');

function intToBuffer(num) {
  console.log('body length',num);
  let str = parseInt(num, 10).toString(16);
  let count = 4 - str.length;
  for (let i = 0; i < count; i++) {
    str = '0' + str;
  }
  return Buffer.from(str, 'hex');
}

const json = {
  message: '发送内容测试：当流将数据块传送给消费者后触发。 当调用 readable.pipe()， readable.resume() 或绑定监听器到 \'data\' 事件时，流会转换到流动模式。 当调用 readable.read() 且有数据块返回时，也会触发 \'data\' 事件。（Node.js）。',
  numberList: ['340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000', '340507199801000000',]
}
const jsonstr = JSON.stringify(json);
let buf1 = Buffer.from([0xdf]); // 标志位 DF
let buf3 = Buffer.from(jsonstr, 'utf8'); // 负载内容 7B 22 6D 65 73 73 61 67....
let buf2 = intToBuffer(buf3.length); // 长度 03 0A

const buff = Buffer.concat([buf1, buf2, buf3], buf1.length + buf2.length + buf3.length);
/**
 * buff内容与格式:
 * DF 
 * 03 0A 
 * 7B 22 6D 65 73 73 61 67 65 22 3A 22 E5....
 *
 * */ 

const fw = fs.createWriteStream('./send_binary.txt');

module.exports = class TestReadable extends Readable {
  constructor(opt) {
    super(opt);
    this.allowsize = 0;
    this.index = 0;
    this.len = buff.length;
  }

  _read(size) {
    // setTimeout(() => {
    let arr = [];
    size = Math.floor(Math.random() * 100) + 1;

    for (let i = 0; i < size; i++) {
      arr.push(buff[this.index]);

      this.index++;
      if (this.index >= this.len) this.index = 0;
    }
    let buf = Buffer.from(arr);
    fw.write(buf);
    this.push(buf);
    this.allowsize += buf.length;

    if (this.allowsize >= 60 * 1024 * 1024) {
      this.push(null);
      console.log(this.allowsize / 1000 +'KB')
    }
    // }, 1000)

  }
}