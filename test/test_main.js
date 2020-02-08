const assert = require('assert');
const TestReadable = require('../lib/custom_readable');
const StickBuffer = require('../lib/stick_buffer');

const wait = time => new Promise(resolve => setTimeout(resolve, time));

const fEnd = fileReadable => new Promise(resolve => {
  fileReadable.on('end', resolve);
  fileReadable.end();
});

describe('#emitReadable()', function () {

  it('Should complete each package When common packets.', async function () {

    const fileReadable = new TestReadable();
    const sb = new StickBuffer();
    sb.setSocket(fileReadable);
    let mbody = '';
    sb.on('data', chunk => {
      mbody += chunk.toString('hex')
    })

    fileReadable.on('readable', sb.emitReadable());
    
    /**
     *   first package: 111111
     *   second package: 2222222
     *   third package: 33333
     */
    fileReadable.setBuffer([0xdf, 0x00, 0x03, 0x01, 0x02, 0x03]);
    fileReadable.setBuffer([0xdf, 0x00, 0x04, 0x01, 0x02, 0x03, 0x04]);
    fileReadable.setBuffer([0xdf, 0x00, 0x02, 0x01, 0x02]);
    await fEnd(fileReadable);
    assert.equal(mbody, '010203010203040102');
  });

  it('Should complete each package When multiple sticky packets.', async function () {

    const fileReadable = new TestReadable();
    const sb = new StickBuffer();
    sb.setSocket(fileReadable);
    let mbody = '';
    sb.on('data', chunk => {
      mbody += chunk.toString('hex')
    })

    fileReadable.on('readable', sb.emitReadable());
    
    /**
     *   first package: 111112
     *   second package: 22222
     *   third package: 233333
     */
    fileReadable.setBuffer([0xdf, 0x00, 0x03, 0x01, 0x02, 0x03, 0xdf]);
    fileReadable.setBuffer([0x00, 0x04, 0x01, 0x02, 0x03]);
    fileReadable.setBuffer([0x04, 0xdf, 0x00, 0x02, 0x01, 0x02]);
    await fEnd(fileReadable);
    assert.equal(mbody, '010203010203040102');
  });

  it('Should complete each package When the network is slow.', async function () {

    const fileReadable = new TestReadable();
    const sb = new StickBuffer();
    sb.setSocket(fileReadable);

    sb.on('data', chunk => {
      assert.equal(chunk.toString('hex'), '01020304');
    })

    fileReadable.on('readable', sb.emitReadable());

    fileReadable.setBuffer([0xdf, 0x00, 0x04, 0x01]);
    await wait(10); fileReadable.setBuffer([0x02, 0x03, 0x04, 0xdf, 0x00, 0x04, 0x01, 0x02, 0x03, 0x04]);
    await wait(10); fileReadable.setBuffer([0xdf]);
    await wait(10); fileReadable.setBuffer([0x00, 0x04, 0x01, 0x02, 0x03, 0x04, 0xdf, 0x00, 0x04, 0x01, 0x02, 0x03, 0x04]);
    await fEnd(fileReadable);
  });

  it('Should complete each package When send 1w short packages(50KB).', async function () {

    const fileReadable = new TestReadable();
    const sb = new StickBuffer();
    sb.setSocket(fileReadable);
    let mbody = 0;
    sb.on('data', chunk => {
      mbody += chunk.length;
    })

    fileReadable.on('readable', sb.emitReadable());

    for (let i = 0; i < 10000; i++) {
      fileReadable.setBuffer([0xdf, 0x00, 0x02, 0x01, 0x02]);
    }

    await fEnd(fileReadable);
    assert.equal(mbody, 20000);
  });

});