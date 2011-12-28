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
goog.provide('gva.controller.AbstractController');

/**
 * Creates a new AbstractController instance
 * @constructor
 */
gva.controller.AbstractController = function() {
    this.$context = null;
    this.enabled = false;
    this.initialized = false;
};

/**
 * Initializes the controller with a given context
 * @param {Element} $context The context or view for this controller.
 */
gva.controller.AbstractController.prototype.initialize = function($context) {
    if (!this.initialized) {
        this.initialized = true;
        this.$context = $context;
    }
};

/**
 * Marks the controller as active and starts up any sub processes
 */
gva.controller.AbstractController.prototype.enable = function() {
    this.enabled = true;
};

/**
 * Marks the controller as inactive and pauses / stops any sub processes
 */
gva.controller.AbstractController.prototype.disable = function() {
    this.enabled = false;
};
