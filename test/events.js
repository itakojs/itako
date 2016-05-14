// dependencies
import test from 'ava';
import sinon from 'sinon';
import * as plugins from './mock-plugins';

// target
import Itako from '../src';

// specs
test('should be emit an `read` event at the time of reading start', async (t) => {
  const itako = new Itako([plugins.noopReader]);

  const words = 'hi';
  const events = sinon.spy();
  itako.on('read', events);
  itako.on('read', (token) => {
    t.true(token.type === 'text');
    t.true(token.value === words);
    t.true(token.meta.reader === plugins.noopReader);
  });

  await itako.read(words);
  t.true(events.callCount === 1);
});

test('should be emit an `preload` event at the time of preloading start', async (t) => {
  const itako = new Itako([plugins.preloadReader]).setOptions({
    read: {
      preload: true,
    },
  });

  const words = 'hi';
  const events = sinon.spy((token) => {
    t.true(token.type === 'text');
    t.true(token.value === words);
    t.true(token.meta.reader === undefined);
    t.true(token.meta.preloader === plugins.preloadReader);
  });
  itako.on('preload', events);

  await itako.read(words);
  t.true(events.callCount === 1);
});

test('should be emit an `before-read` event before reading (and wait for Promise)', async (t) => {
  const itako = new Itako([plugins.noopReader]);

  const words = 'hi';
  const events = sinon.spy((tokens) => new Promise(resolve => {
    t.true(tokens[0].type === 'text');
    t.true(tokens[0].value === words);
    t.true(tokens[0].meta.reader === undefined);

    setTimeout(() => {
      tokens[0].setMeta('timeout', true);
      resolve();
    }, 100);
  }));
  itako.on('before-read', events);

  const [token] = await itako.read(words);
  t.true(events.callCount === 1);
  t.true(token.meta.timeout);
});

test('should be emit an `after-read` event after reading (and wait for Promise)', async (t) => {
  const itako = new Itako([plugins.noopReader]);

  const words = 'hi';
  const events = sinon.spy((tokens) => new Promise(resolve => {
    t.true(tokens[0].type === 'text');
    t.true(tokens[0].value === words);
    t.true(tokens[0].meta.reader === plugins.noopReader);

    setTimeout(() => {
      tokens[0].setMeta('timeout', true);
      resolve();
    }, 100);
  }));
  itako.on('after-read', events);

  const [token] = await itako.read(words);
  t.true(events.callCount === 1);
  t.true(token.meta.timeout);
});
