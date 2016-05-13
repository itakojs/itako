import Itako from '../src';
import Token from 'itako-token';
import Promise from 'bluebird';

export const cloneTransformer = {
  name: 'clone',
  transform(tokens, options = {}) {
    if (options.noop) {
      return tokens;
    }
    return tokens.map((token) => token.clone({ transformer: this }));
  },
};
export const chunkTransformer = {
  name: 'chunk',
  transform(tokens) {
    return tokens.map((token) => {
      if (token.type !== 'text') {
        return token;
      }

      return [].slice.call(token.value).map((chunk) =>
        Itako.createToken('text', chunk, token.options, { transformer: this })
      );
    });
  },
};
export const allReplaceTransformer = {
  name: 'all',
  transform() {
    return [new Token('text', 'this is it', {}, { transformer: this })];
  },
};

export const noopReader = {
  name: 'noop',
  read(token, options = {}) {
    if (options.noop) {
      return token;
    }

    return Promise.resolve();
  },
};
export const delayReader = {
  name: 'delay',
  delay: 100,
  read() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  },
};

export const preloadReader = {
  name: 'preload',
  delay: 100,
  preload(token) {
    token.setMeta('preloadBegin', Date.now());
    token.setMeta('preload', new Promise(resolve => setTimeout(resolve, this.delay))
    .then(() => {
      token.setMeta('preloadEnd', Date.now());
      return token;
    }));

    return true;
  },
  read(token) {
    return token.meta.preload;
  },
};
