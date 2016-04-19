// dependencies
import Promise from 'bluebird';
import Token from 'itako-token';
import _flattenDeep from 'lodash.flattendeep';
import _get from 'lodash.get';
import _set from 'lodash.set';

// @class Reader
export default class Itako {
  static createToken(...args) {
    return new Token(...args);
  }

  /**
  * @param {readers[]} [readers=[]] - a token read functions
  * @param {transformers[]} [transformers=[]] - a token transform functions
  * @param {object} [options={}] - a customize behavior
  */
  constructor(readers = [], transformers = [], options = {}) {
    this.transformers = transformers;
    this.readers = readers;
    this.options = { ...options };
  }

  /**
  * @method validatePath
  * @param {any} path - a validate target
  * @throws {TypeError} will throw error unless path is string and array
  * @returns {undefined}
  */
  validatePath(path) {
    const isValid = (typeof path === 'string' || path instanceof Array);
    if (isValid === false) {
      throw new TypeError('path is must be string or array');
    }
  }

  /**
  * @method setOption
  * @param {string|array} path - a option path
  * @param {any} value - a option value
  * @returns {this} this - the self instance
  * @see https://lodash.com/docs#set
  */
  setOption(path, value) {
    this.validatePath(path);
    _set(this.options, path, value);
    return this;
  }

  /**
  * @method getOption
  * @param {string|array} path - a option path
  * @param {any} defaultValue - a return value unless path is defined
  * @returns {any} option - the option value or defaultValue
  * @see https://lodash.com/docs#get
  */
  getOption(path, defaultValue) {
    this.validatePath(path);
    return _get(this.options, path, defaultValue);
  }

  /**
  * @method getOptions
  * @returns {object} options - the all options
  */
  getOptions() {
    return { ...this.options };
  }

  /**
  * to process the source with transform method of transformers
  *
  * @method transform
  * @param {string} source - a original text
  * @param {object} [options={}] - a token default options
  * @returns {object} transformdResult - the transformd tokens and options
  */
  transform(source, options = {}) {
    const initialOptions = Object.assign(
      {},
      this.getOption('transform.options', {}),
      options,
    );

    return this.transformers.reduce(
      (tokens, transformr) => {
        const name = transformr.name || 'anonymous';
        const { disable, options: opts } = this.getOption(['transformers', name], {});
        if (disable) {
          return tokens;
        }

        return _flattenDeep(transformr.transform(tokens, opts));
      },
      [this.constructor.createToken('text', source, initialOptions)],
    );
  }

  /**
  * the source after the transform in transformers, read in readers (higher level api)
  *
  * @method read
  * @param {string} source - a original text
  * @param {object} [transformOptions={}] - change the default options of the transform/read method
  * @returns {promise<object>} readEnd - return the tokens after the end of speak
  */
  read(source, transformOptions = {}) {
    const opts = Object.assign(
      {},
      _get(this.options, 'transform', {}),
      transformOptions,
    );

    const tokens = this.transform(source, opts);
    const readOptions = _get(this.options, 'read', {});
    if (readOptions.serial) {
      if (this.current === undefined) {
        this.current = Promise.resolve();
      }

      const readEnd = this.current.finally(() =>
        this.readSerial(tokens)
      )
      .then(() => tokens);

      this.current = readEnd;

      return readEnd;
    }

    return this.readSerial(tokens).then(() => tokens);
  }

  /**
  * run the read method of each plugin
  * it stops processing when the promise was returned
  * if doesn't return a promise, it throw the exception
  *
  * @method read
  * @param {string} tokens - a transformd tokens
  * @returns {promise<undefined>} readEnd - fulfill after the end of speak
  */
  readSerial(tokens) {
    return tokens.reduce(
      (promise, currentToken) => promise.then(() => {
        const token = this.readToken(currentToken);

        // if the promise isn't returned by a plugin read method, throw an exception
        if (this.isPromise(token) === false) {
          const { type, value } = token;
          return Promise.reject(new Error(`unexpected token "${type}:${value}"`));
        }

        return token;
      }),
      Promise.resolve(null),
    );
  }

  /**
  * @method isPromise
  * @param {token|promise} tokenOrPromise - a itako-token instance / return value of reader.read
  * @returns {boolean} found - true if argument the Promise
  */
  isPromise(tokenOrPromise) {
    return tokenOrPromise && typeof tokenOrPromise.then !== 'undefined';
  }

  /**
  * @method readToken
  * @param {token} tokenInstance - read aloud in reader.read
  * @returns {token|promise} tokenOrPromise - a itako-token instance / return value of reader.read
  */
  readToken(tokenInstance) {
    return this.readers.reduce(
      (token, reader) => {
        if (this.isPromise(token)) {
          return token;
        }

        const name = reader.name || 'anonymous';
        const { disable, options: opts } = this.getOption(['readers', name], {});
        if (disable) {
          return token;
        }
        const result = reader.read(token, opts);
        if (this.isPromise(result)) {
          token.setMeta('reader', reader);
        }
        return result;
      },
      tokenInstance,
    );
  }
}
