// dependencies
import test from 'ava';
import { throws } from 'assert-exception';

// target
import Itako from '../src';

// specs
test('setOption should return the self', (t) => {
  const itako = new Itako;
  t.true(itako.setOption('foo') === itako);
});

test('if the path is invalid, it should throw an exception', (t) => {
  const itako = new Itako;
  const expectedMessage = 'path is must be string or array';

  // set
  t.true(throws(() => {itako.setOption();}).message === expectedMessage);
  t.true(throws(() => {itako.setOption(1);}).message === expectedMessage);
  t.true(throws(() => {itako.setOption(null);}).message === expectedMessage);
  t.true(throws(() => {itako.setOption({});}).message === expectedMessage);
  t.true(throws(() => {itako.setOption(() => {});}).message === expectedMessage);

  t.true(throws(() => {itako.setOption('');}).message === undefined);
  t.true(throws(() => {itako.setOption([]);}).message === undefined);

  // get
  t.true(throws(() => {itako.getOption();}).message === expectedMessage);
  t.true(throws(() => {itako.getOption(1);}).message === expectedMessage);
  t.true(throws(() => {itako.getOption(null);}).message === expectedMessage);
  t.true(throws(() => {itako.getOption({});}).message === expectedMessage);
  t.true(throws(() => {itako.getOption(() => {});}).message === expectedMessage);

  t.true(throws(() => {itako.getOption('');}).message === undefined);
  t.true(throws(() => {itako.getOption([]);}).message === undefined);
});

test('getOptions should return all options as a new object', (t) => {
  const itako = new Itako().setOption('foo', 'bar');
  t.true(itako.getOptions().foo === 'bar');
  t.true(itako.getOptions() !== itako.getOptions());
});

test('itako.opts should can be performed writing, reading', (t) => {
  const itako = new Itako;
  const path = 'plugin.enable';

  itako.setOption(path, true);
  t.true(itako.getOption(path) === true);

  t.true(itako.getOption('nothing', false) === false);
});
