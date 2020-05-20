/**
 * @typedef {OktaAuth.SimpleStorage} SimpleStorage
 */
jest.mock('../../lib/storageBuilder');

var browserStorage  = require('../../lib/browser/browserStorage');
var storageBuilder  = require('../../lib/storageBuilder');

describe('browserStorage', () => {
  let originalLocalStorage;
  let originalSessionStorage;
  let originalLocation;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalSessionStorage = window.sessionStorage;
    originalLocation = window.location;
  });

  afterEach(() => {
    /** @type {any} */(window).localStorage = originalLocalStorage;
    /** @type {any} */(window).sessionStorage = originalSessionStorage;
    window.location = originalLocation;
  });

  it('can return localStorage', () => {
    expect(window.localStorage).toBeDefined();
    expect(browserStorage.getLocalStorage()).toBe(window.localStorage);
  });

  it('can return sessionStorage', () => {
    expect(window.sessionStorage).toBeDefined();
    expect(browserStorage.getSessionStorage()).toBe(window.sessionStorage);
  });

  describe('browserHasLocalStorage', () => {
    it('returns true if storage exists and passes test', () => {
      expect(browserStorage.browserHasLocalStorage()).toBe(true);
    });
    it('returns false if localStorage does not exist', () => {
      delete /** @type {any} */(window).localStorage;
      expect(browserStorage.browserHasLocalStorage()).toBe(false);
    });
    it('returns false if testStorage() returns false', () => {
      jest.spyOn(browserStorage, 'testStorage').mockReturnValue(false);
      expect(browserStorage.browserHasLocalStorage()).toBe(false);
    });
  });

  describe('browserHasSessionStorage', () => {
    it('returns true if storage exists and passes test', () => {
      expect(browserStorage.browserHasSessionStorage()).toBe(true);
    });
    it('returns false if sessionStorage does not exist', () => {
      delete /** @type {any} */(window).sessionStorage;
      expect(browserStorage.browserHasSessionStorage()).toBe(false);
    });
    it('returns false if testStorage() returns false', () => {
      jest.spyOn(browserStorage, 'testStorage').mockReturnValue(false);
      expect(browserStorage.browserHasSessionStorage()).toBe(false);
    });
  });

  describe('testStorage', () => {
    it('returns true if no exception is thrown', () => {
      const fakeStorage = {
        removeItem: jest.fn(),
        setItem: jest.fn()
      }
      expect(browserStorage.testStorage(fakeStorage)).toBe(true);
      expect(fakeStorage.setItem).toHaveBeenCalledWith('okta-test-storage', 'okta-test-storage');
      expect(fakeStorage.removeItem).toHaveBeenCalledWith('okta-test-storage');
    });
    it('returns false if an exception is thrown on removeItem', () => {
      const fakeStorage = {
        removeItem: jest.fn().mockImplementation(() => {
          throw new Error('removeItem fails');
        }),
        setItem: jest.fn()
      }
      expect(browserStorage.testStorage(fakeStorage)).toBe(false);
    });
    it('returns false if an exception is thrown on setItem', () => {
      const fakeStorage = {
        removeItem: jest.fn(),
        setItem: jest.fn().mockImplementation(() => {
          throw new Error('setItem fails');
        }),
      }
      expect(browserStorage.testStorage(fakeStorage)).toBe(false);
    });
  });

  describe('getPKCEStorage', () => {
    it('Uses localStorage by default', () => {
      browserStorage.getPKCEStorage();
      expect(storageBuilder).toHaveBeenCalledWith(window.localStorage, 'okta-pkce-storage');
    });
    it('Uses sessionStorage if localStorage is not available', () => {
      delete /** @type {any} */(window).localStorage;
      browserStorage.getPKCEStorage();
      expect(storageBuilder).toHaveBeenCalledWith(window.sessionStorage, 'okta-pkce-storage');
    });
    it('Uses cookie storage if localStorage and sessionStorage are not available', () => {
      delete /** @type {any} */(window).localStorage;
      delete /** @type {any} */(window).sessionStorage;
      const fakeStorage = { getItem: jest.fn(), setItem: jest.fn() };
      jest.spyOn(browserStorage, 'getCookieStorage').mockReturnValue(fakeStorage);
      const opts = { secure: true };
      browserStorage.getPKCEStorage(opts);
      expect(storageBuilder).toHaveBeenCalledWith(fakeStorage, 'okta-pkce-storage');
      expect(browserStorage.getCookieStorage).toHaveBeenCalledWith(opts);
    });
  });

  describe('getHttpCache', () => {
    it('Uses localStorage by default', () => {
      browserStorage.getHttpCache();
      expect(storageBuilder).toHaveBeenCalledWith(window.localStorage, 'okta-cache-storage');
    });
    it('Uses sessionStorage if localStorage is not available', () => {
      delete /** @type {any} */(window).localStorage;
      browserStorage.getHttpCache();
      expect(storageBuilder).toHaveBeenCalledWith(window.sessionStorage, 'okta-cache-storage');
    });
    it('Uses cookie storage if localStorage and sessionStorage are not available', () => {
      delete /** @type {any} */(window).localStorage;
      delete /** @type {any} */(window).sessionStorage;
      const fakeStorage = { fakeStorage: true };
      // @ts-ignore
      jest.spyOn(browserStorage, 'getCookieStorage').mockReturnValue(fakeStorage);
      const opts = { secure: true };
      browserStorage.getHttpCache(opts);
      expect(storageBuilder).toHaveBeenCalledWith(fakeStorage, 'okta-cache-storage');
      expect(browserStorage.getCookieStorage).toHaveBeenCalledWith(opts);
    });
  });

  describe('getCookieStorage', () => {
    it('requires an options object', () => {
      const fn = function() {
        browserStorage.getCookieStorage();
      };
      expect(fn).toThrowError('Cannot read property \'secure\' of undefined');
    });

    it('requires a "secure" option', () => {
      const fn = function() {
        browserStorage.getCookieStorage({});
      };
      expect(fn).toThrowError('getCookieStorage: "secure" and "sameSite" options must be provided');
    });

    it('requires a "sameSite" option', () => {
      const fn = function() {
        browserStorage.getCookieStorage({ secure: true });
      };
      expect(fn).toThrowError('getCookieStorage: "secure" and "sameSite" options must be provided');
    });

    it('Can pass false for "secure" and "sameSite"', () => {
      const fn = function() {
        browserStorage.getCookieStorage({ secure: false, sameSite: false });
      };
      expect(fn).not.toThrow();
    });

    it('getItem: will call storage.get', () => {
      const retVal = JSON.stringify({ fakeCookie: true });
      jest.spyOn(browserStorage.storage, 'get').mockReturnValue(retVal);
      const storage = browserStorage.getCookieStorage({ secure: true, sameSite: 'strict' });
      const key = 'fake-key';
      expect(storage.getItem(key)).toBe(retVal);
      expect(browserStorage.storage.get).toHaveBeenCalledWith(key);
    });

    it('setItem: will call storage.set, passing secure and sameSite options', () => {
      jest.spyOn(browserStorage.storage, 'set').mockReturnValue(null);
      const storage = browserStorage.getCookieStorage({ secure: false, sameSite: 'strictly fakey' });
      const key = 'fake-key';
      const val = { fakeValue: true };
      storage.setItem(key, val);
      expect(browserStorage.storage.set).toHaveBeenCalledWith(key, val, '2200-01-01T00:00:00.000Z', {
        secure: false,
        sameSite: 'strictly fakey'
      });
    })
  });

  describe('getInMemoryStorage', () => {
    it('can set and retrieve a value from memory', () => {
      const storage = browserStorage.getInMemoryStorage();
      const key = 'fake-key';
      const val = { fakeValue: true };
      storage.setItem(key, val);
      expect(storage.getItem(key)).toBe(val);
    })
  })
});