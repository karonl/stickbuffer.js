'use strict'
const TestReadable = require('./test_readable');
const StickBuffer = require('./stick_buffer');

/**
 * 模拟网络只读流
 * 生成随机长度的 chunk 发送给监听器
 */
const fileReadable = new TestReadable();
const sb = new StickBuffer();
sb.setSocket(fileReadable);

sb.on('data', chunk => {
  let text = Buffer.from(chunk).toString();
  console.log(text);
})

console.time('spent');
fileReadable.on('readable', sb.emitReadable());
fileReadable.on('end', () => {
  console.timeEnd('spent')
})
