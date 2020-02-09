'use strict'
module.exports = class FlexibleMemory {

  constructor() {
    this.len = 1024 // 1KB
    this._tmpBodyBuff = Buffer.allocUnsafe(this.len)
  }

  setSize(size) {
    if(size > this.len) {
      this.len = Math.ceil(size / 512) * 512
      this._tmpBodyBuff = Buffer.allocUnsafe(this.len)
    }
  }

  get() {
    return this._tmpBodyBuff
  }

}