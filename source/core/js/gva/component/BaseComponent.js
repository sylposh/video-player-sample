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
goog.provide('gva.component.BaseComponent');

goog.require('goog.events.EventTarget');

/**
 * Creates a new BaseComponent instance
 * @constructor
 */
gva.component.BaseComponent = function() {
    this.$context = null;
    this.initialized = false;
};
goog.inherits(gva.component.BaseComponent, goog.events.EventTarget);

/**
 * Initializes the component with a given context
 * @param {Element} $context The context or view for this component.
 */
gva.component.BaseComponent.prototype.initialize = function($context) {
    if (!this.initialized) {
        this.initialized = true;
        this.$context = $context;
    }
};
