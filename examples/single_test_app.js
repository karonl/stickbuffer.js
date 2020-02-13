'use strict'
const TestReadable = require('../lib/test_readable');
const StickBuffer = require('../lib/stick_buffer');
/**
 * 模拟网络只读流
 * 生成随机长度的 chunk 发送给监听器
 * 注：StickBuffer 把数据缓冲留在了系统层，避免读取过多字节在 JS 层
 * 而无法迅速处理，在处理完当前数据后再向系统数据流读取字节数据。
 */
let outflag = false;
const fileReadable = new TestReadable(); // Test Bytes Readable Generator
const sb = new StickBuffer();
sb.setSocket(fileReadable);

sb.on('data', chunk => {
  if (!outflag) {
    let text = Buffer.from(chunk).toString();
    console.log('demo:',text);
    outflag = true;
  }
});

console.time('consume spent');
fileReadable.on('readable', sb.emitReadable());
fileReadable.on('end', () => {
  console.timeEnd('consume spent')
});
