// dependencies
import test from 'ava';
import * as plugins from './mock-plugins';

// target
import Itako from '../src';

// specs
test('if define transform.options, should use as a initial token options', (t) => {
  const itako = new Itako;
  itako.setOption('transform.options.volume', 1);

  const words = 'hi';
  const tokens = itako.transform(words);

  t.true(tokens.length === 1);
  t.true(tokens[0].type === 'text');
  t.true(tokens[0].value === 'hi');
  t.true(tokens[0].options.volume === 1);
});

test('should initialize the options using 3rd argument of the constructor', (t) => {
  const options = new Itako().setOption('transform.options.volume', 1).getOptions();
  const itako = new Itako([], [], options);

  const words = 'hi';
  const tokens = itako.transform(words);

  t.true(tokens.length === 1);
  t.true(tokens[0].type === 'text');
  t.true(tokens[0].value === 'hi');
  t.true(tokens[0].options.volume === 1);
});

test('if specify 2nd argument, should use as a initial token options', (t) => {
  const itako = new Itako;
  itako.setOption('transform.options.volume', 1);

  const words = 'hi';
  const tokens = itako.transform(words, { volume: 2 });

  t.true(tokens.length === 1);
  t.true(tokens[0].type === 'text');
  t.true(tokens[0].value === 'hi');
  t.true(tokens[0].options.volume === 2);
});

test('if define a transfomer, it should be dependent on the return value of the method of transfomer', (t) => {
  const itako = new Itako([], [plugins.cloneTransformer]);
  const words = 'hi';
  const tokens = itako.transform(words);

  t.true(tokens.length === 1);
  t.true(tokens[0].type === 'text');
  t.true(tokens[0].value === 'hi');
  t.true(tokens[0].meta.transformer.name === 'clone');
});

test('if transformers.clone.disable is true, should ignore the clone transformer', (t) => {
  const itako = new Itako([], [plugins.cloneTransformer]);
  itako.setOption('transformers.clone.disable', true);

  const words = 'hi';
  const tokens = itako.transform(words);

  t.true(tokens.length === 1);
  t.true(tokens[0].type === 'text');
  t.true(tokens[0].value === 'hi');
  t.true(tokens[0].meta.transformer === undefined);
});

test('if transformers.clone.options is define, it should be used as an option to the clone transformer', (t) => {
  const itako = new Itako([], [plugins.cloneTransformer]);
  itako.setOption('transformers.clone.options', { noop: true });

  const words = 'hi';
  const tokens = itako.transform(words);

  t.true(tokens.length === 1);
  t.true(tokens[0].type === 'text');
  t.true(tokens[0].value === 'hi');
  t.true(tokens[0].meta.transformer === undefined);
});

test('if the transformer returns an array rather than token, the tokens should keep the 1d', (t) => {
  const itako = new Itako([], [plugins.cloneTransformer, plugins.chunkTransformer]);
  const words = 'hi';
  const tokens = itako.transform(words);

  t.true(tokens.length === 2);
  t.true(tokens[0].type === 'text');
  t.true(tokens[0].value === 'h');
  t.true(tokens[0].meta.transformer.name === 'chunk');

  t.true(tokens[1].type === 'text');
  t.true(tokens[1].value === 'i');
  t.true(tokens[1].meta.transformer.name === 'chunk');
});

test('if the transformer returns another tokens, should return it as regular result', (t) => {
  const itako = new Itako([], [plugins.allReplaceTransformer]);
  const words = 'hi';
  const tokens = itako.transform(words);

  t.true(tokens.length === 1);
  t.true(tokens[0].type === 'text');
  t.true(tokens[0].value === 'this is it');
  t.true(tokens[0].meta.transformer.name === 'all');
});
