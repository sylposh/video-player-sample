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
goog.provide('gva.controller.ControllerInitializer');

goog.require('gva.controller.BackgroundController');
/**
 * Closure doesn't allow for pure dependency injection, so we
 * need to make reference to the available controllers
 */
goog.require('gva.controller.ChannelController');
goog.require('gva.controller.EpisodeController');
goog.require('gva.controller.FooterController');
goog.require('gva.controller.HeaderController');
goog.require('gva.controller.SearchController');
goog.require('gva.controller.ShowController');
goog.require('gva.controller.SubscriptionsController');

/**
 * @constructor
 */
gva.controller.ControllerInitializer = (function() {

    /**
     * A list of all initialized controllers.
     * @type Array.<gva.controller.AbstractController>
     * @private
     */
    var _initializedControllers = [];

    /**
     * Public API
     */
    return {

        /**
         * Initializes a controller of a certain type on a given context.
         * @param {string} type The class name of the controller to initialize.
         * @param {Element} $context The DOM element which will serve as the controller's context or view.
         * @return {gva.controller.AbstractController} The initialized controller instance.
         */
        initializeController: function(type, $context) {

            // Retrieve the function definition for the controller
            var ControllerDefinition = goog.getObjectByName(type);

            try {
                var controller = new ControllerDefinition();
            } catch (error) {
                throw new Error('Could not initialize controller: ' + type + ' Error: ' + error);
            }

            controller.initialize($context);

            _initializedControllers.push(controller);

            return controller;
        }

    };

})();
