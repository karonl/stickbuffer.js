'use strict'
const EventEmitter = require('events').EventEmitter
module.exports = class StickBuffer extends EventEmitter {

  constructor() {
    super()
    this._socket
    this._flag = Buffer.from([0xdf])
    this._headLength = 2
    this._bodyLength
    this._finHead
    this._readPosition
    this._needByte = 0
    this._headerBuff
    this._bodyBuff
  }

  setSocket(socket) {
    this._socket = socket
    this._headerBuff = Buffer.allocUnsafe(this._headLength)
  }

  _bufferToInt(buffer) {
    return buffer.readUInt16BE()
  }

  _pushHead(source) {
    source.copy(this._headerBuff, this._readPosition, 0, source.length)
    this._readPosition += source.length
    this._needByte -= source.length
  }

  _pushBody(source) {
    source.copy(this._bodyBuff, this._readPosition, 0, source.length)
    this._readPosition += source.length
    this._needByte -= source.length
  }

  _pushHeadFull(source) {
    source.copy(this._headerBuff, this._readPosition, 0, this._needByte)
    this._finHead = true
    let len = this._bufferToInt(this._headerBuff)
    log('len', len)
    if (len > 65535) throw new Error('The body has exceeded the range that 2 bytes can represent.')
    this._bodyBuff = Buffer.allocUnsafe(len)
    this._bodyLength = len
    this._needByte = len
    this._readPosition = 0
  }

  _pushBodyFull(source) {
    source.copy(this._bodyBuff, this._readPosition, 0, this._needByte)
    this._needByte = this._bodyLength = 0
    log('package result:', this._bodyBuff)
    this.emit('data', this._bodyBuff)
  }

  emitReadable() {
    return () => {
      let byte
      log('============readable==============')
      while (null !== (byte = this._socket.read(1))) {
        if (this._needByte === 1) {
          log('enough:', 'get'+byte.length + '/need' + this._needByte, 'total'+(this._finHead?this._bodyLength:this._headLength), byte)
          if (this._finHead) this._pushBodyFull(byte)
          else this._pushHeadFull(byte)
        } else if (this._needByte > 1) {
          log('short:', 'get'+byte.length + '/need' + this._needByte, 'total'+(this._finHead?this._bodyLength:this._headLength), byte)
          if (this._finHead) this._pushBody(byte)
          else this._pushHead(byte)
          this._handlerStream()
        } else if (byte.equals(this._flag)) {
          log('begin', byte)
          this._finHead = false
          this._readPosition = 0
          this._needByte = this._headLength
          this._handlerStream()
        } else {
          console.log('discard!!', byte)
        }
      }
    }
  }

  _handlerStream() {
    let bytes = this._socket.read(this._needByte)
    if (bytes) {
      log('enough:', 'get'+bytes.length + '/need' + this._needByte, 'total'+(this._finHead?this._bodyLength:this._headLength), bytes)
      if (this._finHead) this._pushBodyFull(bytes)
      else this._pushHeadFull(bytes)
    } else {
      bytes = this._socket.read()
      if (bytes) {
        if (bytes.length < this._needByte) {
          log('short:', 'get'+bytes.length + '/need' + this._needByte, 'total'+(this._finHead?this._bodyLength:this._headLength), bytes)
          if (this._finHead) this._pushBody(bytes)
          else this._pushHead(bytes)
        } else {
          log('over:', 'get'+bytes.length + '/need' + this._needByte, 'total'+(this._finHead?this._bodyLength:this._headLength), bytes)
          let buff = Buffer.allocUnsafe(bytes.length - this._needByte)
          bytes.copy(buff, 0, this._needByte, bytes.length)
          if (this._finHead) this._pushBodyFull(bytes)
          else this._pushHeadFull(bytes)
          log('unshift:',buff.length,buff)
          this._socket.pause()
          this._socket.unshift(buff)
          if (this._socket.isPaused()) this._socket.resume()
        }
      }
    }
  }
}

function log(...params) {
  // console.log(...params)
}