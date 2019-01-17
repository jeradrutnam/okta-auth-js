/*!
 * Copyright (c) 2018-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */
/* eslint-disable complexity */
/* eslint-disable max-statements */

require('../vendor/polyfills');

var util              = require('../util');
var builderUtil       = require('../builderUtil');
var tx                = require('../tx');
var storage           = require('./serverStorage');
var config            = require('../config');

function OktaAuthBuilder(args) {
  var sdk = this;

  var url = builderUtil.validateConfig(args);
  this.options = {
    url: util.removeTrailingSlash(url),
    redirectUri: args.redirectUri,
    request: args.request,
    headers: args.headers
  };

  this.userAgent = 'okta-auth-js-' + config.SDK_VERSION;

  sdk.tx = {
    status: util.bind(tx.transactionStatus, null, sdk),
    resume: util.bind(tx.resumeTransaction, null, sdk),
    exists: util.bind(tx.transactionExists, null, sdk)
  };

  sdk.tx.exists._get = function(name) {
    return storage.get(name);
  };
}

var proto = OktaAuthBuilder.prototype;

// { username, password, (relayState), (context) }
proto.signIn = function (opts) {
  return tx.postToTransaction(this, '/api/v1/authn', opts);
};

// { username, (relayState) }
proto.forgotPassword = function (opts) {
  return tx.postToTransaction(this, '/api/v1/authn/recovery/password', opts);
};

// { username, (relayState) }
proto.unlockAccount = function (opts) {
  return tx.postToTransaction(this, '/api/v1/authn/recovery/unlock', opts);
};

// { recoveryToken }
proto.verifyRecoveryToken = function (opts) {
  return tx.postToTransaction(this, '/api/v1/authn/recovery/token', opts);
};

module.exports = builderUtil.buildOktaAuth(OktaAuthBuilder, false);