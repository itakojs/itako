// dependencies
import { describe } from 'ava-spec';
import { throws } from 'assert-exception';
import * as plugins from './mock-plugins';

// target
import Itako from '../src';

// specs
describe('set/get options', it => {
  it('getOptions should return all options as a new object', t => {
    const itako = new Itako().setOption('foo', 'bar');
    t.true(itako.getOptions().foo === 'bar');
    t.true(itako.getOptions() !== itako.getOptions());
  });

  it('itako.opts should can be performed writing, reading', t => {
    const itako = new Itako;
    const path = 'plugin.enable';

    itako.setOption(path, true);
    t.true(itako.getOption(path) === true);

    t.true(itako.getOption('nothing', false) === false);
  });

  it('if the path is invalid, it should throw an exception', t => {
    const itako = new Itako;
    const expectedMessage = 'path is must be string or array';

    // set
    t.true(throws(() => { itako.setOption(); }).message === expectedMessage);
    t.true(throws(() => { itako.setOption(1); }).message === expectedMessage);
    t.true(throws(() => { itako.setOption(null); }).message === expectedMessage);
    t.true(throws(() => { itako.setOption({}); }).message === expectedMessage);
    t.true(throws(() => { itako.setOption(() => {}); }).message === expectedMessage);

    t.true(throws(() => { itako.setOption(''); }).message === undefined);
    t.true(throws(() => { itako.setOption([]); }).message === undefined);

    // get
    t.true(throws(() => { itako.getOption(); }).message === expectedMessage);
    t.true(throws(() => { itako.getOption(1); }).message === expectedMessage);
    t.true(throws(() => { itako.getOption(null); }).message === expectedMessage);
    t.true(throws(() => { itako.getOption({}); }).message === expectedMessage);
    t.true(throws(() => { itako.getOption(() => {}); }).message === expectedMessage);

    t.true(throws(() => { itako.getOption(''); }).message === undefined);
    t.true(throws(() => { itako.getOption([]); }).message === undefined);
  });

  it('setOption/setOptions should return the self', t => {
    const itako = new Itako;
    t.true(itako.setOption('foo') === itako);
    t.true(itako.setOptions({}) === itako);
  });

  it('setOptions should assign the settings only key of argument', t => {
    const itako = new Itako([], [], { foo: 'bar', baz: 'beep' });
    t.deepEqual(
      itako.setOptions({ foo: 'baz' }).getOptions(),
      {
        foo: 'baz',
        baz: 'beep',
      },
    );
  });

  it('if specify a 2nd argument of itako.read, it should be used as an option of the transform', async t => {
    const itako = new Itako([plugins.noopReader]);
    const tokens = await itako.read('hoge', { volume: 1 });

    t.true(tokens[0].options.volume === 1);
  });
});
