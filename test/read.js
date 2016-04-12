// dependencies
import 'babel-polyfill';
import test from 'ava';
import { rejects } from 'assert-exception';
import * as plugins from './mock-plugins';

// target
import Itako from '../src';

// specs
test("if there is a character that hasn't been read by the plugin, should throw an exception", async (t) => {
  const itako = new Itako;
  const words = 'hi';

  t.true(
    (await rejects(itako.read(words)))
    .message === `unexpected token "text:${words}"`
  );
});

test('if the plugin with the read method, should return the arguments at the end', async (t) => {
  const itako = new Itako([], [plugins.noopReader]);
  const words = 'hi';

  const tokens = await itako.read(words);
  t.true(tokens[0].meta.reader.name === 'noop');
  t.true(tokens[0].value === words);
});

test('if readers.noop.disable is true, should ignore the noop reader', async (t) => {
  const itako = new Itako([], [plugins.noopReader]).setOption('readers.noop.disable', true);

  const words = 'hi';
  t.true(
    (await rejects(itako.read(words)))
    .message === `unexpected token "text:${words}"`
  );
});

test('if readers.clone.options is define, it should be used as an option to the clone reader', async (t) => {
  const itako = new Itako([plugins.cloneTransformer]).setOption('readers.clone.options', { noop: true });

  const words = 'hi';
  t.true(
    (await rejects(itako.read(words)))
    .message === `unexpected token "text:${words}"`
  );
});

test('it should return the itako that read the token as a result', async (t) => {
  const itako = new Itako([], [plugins.noopReader]);
  const words = 'hi';

  const tokens = await itako.read(words);
  t.true(tokens[0].meta.reader.name === 'noop');
  t.true(tokens[0].value === words);
});

test('if specify options.read.serial isnt true, should be read parallely', async (t) => {
  const itako = new Itako([], [plugins.delayReader]);

  const results = [];
  itako.read().then(() => results.push(Date.now()));
  itako.read().then(() => results.push(Date.now()));
  itako.read().then(() => results.push(Date.now()));

  const tokens = await itako.read();
  t.true(tokens[0].meta.reader.name === 'delay');

  t.true(results[1] - results[0] < plugins.delayReader.delay);
  t.true(results[2] - results[1] < plugins.delayReader.delay);
});

test('if specify options.read.serial is true, should be read serially', async (t) => {
  const itako = new Itako([], [plugins.delayReader]).setOption('read.serial', true);

  const results = [];
  itako.read().then(() => results.push(Date.now()));
  itako.read().then(() => results.push(Date.now()));
  itako.read().then(() => results.push(Date.now()));

  const tokens = await itako.read();
  t.true(tokens[0].meta.reader.name === 'delay');

  t.true(results[1] - results[0] >= plugins.delayReader.delay);
  t.true(results[2] - results[1] >= plugins.delayReader.delay);
});
