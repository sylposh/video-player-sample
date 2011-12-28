/*
Copyright 2011 Google

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Provide a namespace for this class
 */
goog.provide('gva.bootstrap');

/**
 * Import dependencies
 */
goog.require('goog.dom');

goog.require('gva.controller.ApplicationController');

/**
 * @constructor
 */
gva.bootstrap = (function() {

    var _initialized = false;

    /*
     * Public API
     */
    return {

        /**
         * Initializes the site and starts up necessary controllers
         */
        initialize: function() {

            // Show old browser screen if necessary.
            if (goog.userAgent.IE && goog.userAgent.VERSION < 8) {
              document.getElementById('install-screen').style.display = 'block';
              return false;
            }

            if (!_initialized) {

                // Start up the main application controller
                gva.controller.ApplicationController.initialize();

                _initialized = true;
            }
        }
    };

})();

/**
 * Export the initialize method so we can call it after our scripts have been
 * compiled
 */
goog.exportSymbol('gva.bootstrap.initialize', gva.bootstrap.initialize);
