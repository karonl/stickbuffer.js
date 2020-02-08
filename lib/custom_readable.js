'use strict'
const { Readable } = require('stream');

/**
 * buff内容与格式:
 * DF 
 * 00 04 
 * 01 02 03 04
 *
 * */

module.exports = class TestReadable extends Readable {
  constructor(opt) {
    super(opt);
    this.arr;
  }

  setBuffer(buff) {
    this.arr = Buffer.from(buff);
    this.push(this.arr);
  }

  end() {
    this.arr = null;
    this.push(this.arr);
  }

  _read() {}
}