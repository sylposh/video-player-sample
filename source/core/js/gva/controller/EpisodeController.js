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
goog.provide('gva.controller.EpisodeController');

/**
 * Import dependencies
 */
goog.require('gva.controller.AbstractController');

/**
 * @constructor
 * @extends {gva.controller.AbstractController}
 */
gva.controller.EpisodeController = function() {

    // Call super constructor
    gva.controller.AbstractController.call(this);
};

/**
 * Extend gva.controller.AbstractController
 */
goog.inherits(gva.controller.EpisodeController, gva.controller.AbstractController);

/**
 * @inheritDoc
 */
gva.controller.EpisodeController.prototype.initialize = function($context) {
    this.constructor.superClass_.initialize.call(this, $context);
};

/**
 * @inheritDoc
 */
gva.controller.EpisodeController.prototype.enable = function() {
    // Call method on super class
    this.constructor.superClass_.enable.call(this);
};

/**
 * @inheritDoc
 */
gva.controller.EpisodeController.prototype.disable = function() {
    // Call method on super class
    this.constructor.superClass_.disable.call(this);
};

/**
 * Tells the controller to handle deep linking beyond the top level section depth
 * @param {Array.<string>} segments A list of URL fragments beyond the root level.
 */
gva.controller.EpisodeController.prototype.navigate = function(segments) {
};

/**
 * Export the fully qualified class name of this controller for dependency injection
 */
goog.exportSymbol('gva.controller.EpisodeController', gva.controller.EpisodeController);
