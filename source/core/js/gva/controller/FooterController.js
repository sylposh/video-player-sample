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
goog.provide('gva.controller.FooterController');

/**
 * Import dependencies
 */
goog.require('goog.dom');
goog.require('gva.component.SectionMenu');
goog.require('gva.controller.AbstractController');

/**
 * @constructor
 * @extends {gva.controller.AbstractController}
 */
gva.controller.FooterController = function() {

    /**
     * @type {gva.component.SectionMenu}
     */
    this._sectionMenu = null;

    // Call super constructor.
    gva.controller.AbstractController.call(this);
};

/**
 * Extend gva.controller.AbstractController.
 */
goog.inherits(gva.controller.FooterController, gva.controller.AbstractController);

/**
 * @inheritDoc
 */
gva.controller.FooterController.prototype.initialize = function($context) {

    // Retrieve the section menu component instance.
    this._sectionMenu = gva.component.ComponentInitializer.getComponentByQuery('#section-menu');

    this.constructor.superClass_.initialize.call(this, $context);
};

/**
 * @inheritDoc
 */
gva.controller.FooterController.prototype.enable = function() {
    // Call method on super class.
    this.constructor.superClass_.enable.call(this);
};

/**
 * @inheritDoc
 */
gva.controller.FooterController.prototype.disable = function() {
    // Call method on super class.
    this.constructor.superClass_.disable.call(this);
};

/**
 * Refreshes the component when the application state has changed.
 */
gva.controller.FooterController.prototype.refresh = function() {
    // Highlight the appropriate link in the section menu
    var segments = gva.controller.ApplicationController.getPathSegments();
    this._sectionMenu.setActive(segments[0]);
};

/**
 * Export the fully qualified class name of this controller for dependency injection.
 */
goog.exportSymbol('gva.controller.FooterController', gva.controller.FooterController);
