'use strict'
const { Readable } = require('stream');
const StickBuffer = require('./stick_buffer');

const json = {
  cn: '发送内容测试：测试中文',
  en: 'Test message: test english',
  jp: 'テスト内容：日本語テスト',
  emoji: '👌',
  numberList: ['340507199801000000', '340507199801000000', '340507199801000000',]
}
const jsonstr = JSON.stringify(json);
const buff = StickBuffer.toBuffer(jsonstr);
/**
 * buff内容与格式:
 * DF 
 * 03 0A 
 * 7B 22 6D 65 73 73 61 67 65 22 3A 22 E5....
 *
 * */
module.exports = class TestReadable extends Readable {
  constructor(opt) {
    super(opt);
    this.allowsize = 0;
    this.index = 0;
    this.each_package = 0;
    this.len = buff.length;
    this.flag = true;
  }

  _read(size) {
    if (this.flag) { console.time('send spent'); this.flag = false; }

    let buf;
    do {
      size = Math.floor(Math.random() * 100) + 1;
      let arr = [];
      for (let i = 0; i < size; i++) {
        arr.push(buff[this.index]);
        this.index++;
        if (this.index >= this.len) {
          this.index = 0;
          this.each_package++;
        }
      }

      buf = Buffer.from(arr);
      this.allowsize += buf.length;
      
    } while (buf && this.push(buf));

    if (this.allowsize >= 100 * 1024 * 1024) {
      this.push(null);
      console.log('complete package:', this.each_package + '');
      console.log('send bytes:', (this.allowsize / 1024 / 1024).toFixed(2) + 'MB');
      console.timeEnd('send spent');
    }
  }
}