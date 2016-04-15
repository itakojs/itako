// dependencies
import Promise from 'bluebird';
import Token from 'itako-token';
import _flattenDeep from 'lodash.flattendeep';
import _get from 'lodash.get';
import _set from 'lodash.set';

// private
const TRANSFORMERS = Symbol();
const READERS = Symbol();
const OPTS = Symbol();

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
    this[TRANSFORMERS] = transformers;
    this[READERS] = readers;
    this[OPTS] = { ...options };
  }

  /**
  * @public
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
  * @public
  * @method setOption
  * @param {string|array} path - a option path
  * @param {any} value - a option value
  * @returns {this} this - the self instance
  * @see https://lodash.com/docs#set
  */
  setOption(path, value) {
    this.validatePath(path);
    _set(this[OPTS], path, value);
    return this;
  }

  /**
  * @public
  * @method getOption
  * @param {string|array} path - a option path
  * @param {any} defaultValue - a return value unless path is defined
  * @returns {any} option - the option value or defaultValue
  * @see https://lodash.com/docs#get
  */
  getOption(path, defaultValue) {
    this.validatePath(path);
    return _get(this[OPTS], path, defaultValue);
  }

  /**
  * @public
  * @method getOptions
  * @returns {object} options - the all options
  */
  getOptions() {
    return { ...this[OPTS] };
  }

  /**
  * to process the source with transform method of transformers
  *
  * @public
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

    return this[TRANSFORMERS].reduce(
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
  * @public
  * @method read
  * @param {string} source - a original text
  * @param {object} [options={}] - change the default options of the transform/read method
  * @returns {promise<object>} readEnd - return the tokens after the end of speak
  */
  read(source, options = {}) {
    const transformOptions = Object.assign(
      {},
      _get(this[OPTS], 'transform', {}),
      _get(options, 'transform', {}),
    );
    const readOptions = Object.assign(
      {},
      _get(this[OPTS], 'read', {}),
      _get(options, 'read', {}),
    );

    const tokens = this.transform(source, transformOptions);
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
  * @public
  * @method read
  * @param {string} tokens - a transformd tokens
  * @returns {promise<undefined>} readEnd - fulfill after the end of speak
  */
  readSerial(tokens) {
    return tokens.reduce(
      (promise, currentToken) => promise.then(() => {
        const readerFound = (token) => token && typeof token.then !== 'undefined';
        const promiseOrToken = this[READERS].reduce(
          (token, reader) => {
            if (readerFound(token)) {
              return token;
            }

            const name = reader.name || 'anonymous';
            const { disable, options: opts } = this.getOption(['readers', name], {});
            if (disable) {
              return token;
            }
            const result = reader.read(token, opts);
            if (readerFound(result)) {
              token.setMeta('reader', reader);
            }
            return result;
          },
          currentToken,
        );

        // if the promise isn't returned by a plugin read method, throw an exception
        if (readerFound(promiseOrToken) === false) {
          const { type, value } = promiseOrToken;
          return Promise.reject(new Error(`unexpected token "${type}:${value}"`));
        }

        return promiseOrToken;
      }),
      Promise.resolve(null),
    );
  }
}
