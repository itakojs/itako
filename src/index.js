// dependencies
import AsyncEmitter from 'carrack';
import Token from 'itako-token';
import _flattenDeep from 'lodash.flattendeep';
import _get from 'lodash.get';
import _set from 'lodash.set';

// @class Reader
export default class Itako extends AsyncEmitter {
  static createToken(...args) {
    return new Token(...args);
  }

  /**
  * @param {readers[]} [readers=[]] - a token read functions
  * @param {transformers[]} [transformers=[]] - a token transform functions
  * @param {object} [options={}] - a customize behavior
  */
  constructor(readers = [], transformers = [], options = {}) {
    super();
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
  * @method setOptions
  * @param {object} options - a override options
  * @returns {this} this - the self instance
  */
  setOptions(options = {}) {
    this.options = Object.assign({}, this.options, options);
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
  * execute read method of readers (higher level api)
  *
  * @method read
  * @param {string|object[]} source - a original text or transfromed tokens
  * @param {object} [transformOptions={}] - change the default options of the transform/read method
  * @returns {promise<object>} readEnd - return the tokens after the end of speak
  */
  read(source, transformOptions = {}) {
    const opts = Object.assign(
      {},
      _get(this.options, 'transform', {}),
      transformOptions,
    );

    const tokens = source instanceof Array ? source : this.transform(source, opts);
    const readOptions = _get(this.options, 'read', {});
    if (readOptions.preload) {
      this.preload(tokens);
    }
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
  * execute preload method of reader for read (in parallel)
  *
  * @method preload
  * @param {object[]} tokens - a transfromed tokens
  * @returns {undefined}
  */
  preload(tokens) {
    tokens.forEach(token => {
      for (let i = 0; i < this.readers.length; i++) {
        const reader = this.readers[i];
        const name = reader.name || 'anonymous';
        const { disable, options } = this.getOption(['readers', name], {});
        if (disable) {
          continue;
        }
        if (typeof reader.preload !== 'function') {
          continue;
        }
        if (reader.preload(token, options)) {
          token.setMeta('preloader', reader);
          this.emit('preload', token);
          break;
        }
      }
    });
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
    return this.emitParallel('before-read', tokens)
    .then(() => tokens.reduce(
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
      )
    )
    .then(() => this.emitParallel('after-read', tokens));
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
        const { disable, options } = this.getOption(['readers', name], {});
        if (disable) {
          return token;
        }
        const result = reader.read(token, options);
        if (this.isPromise(result)) {
          token.setMeta('reader', reader);
          this.emit('read', token);
        }
        return result;
      },
      tokenInstance,
    );
  }
}
