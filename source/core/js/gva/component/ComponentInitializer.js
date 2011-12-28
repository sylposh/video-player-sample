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
goog.provide('gva.component.ComponentInitializer');

/**
 * Import dependencies
 */
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.dataset');
goog.require('goog.dom.query');
/**
 * Closure doesn't allow for pure dependency injection, so we
 * need to make reference to the available components
 */
goog.require('gva.component.Channel');
goog.require('gva.component.EpisodeGrid');
goog.require('gva.component.Html5Player');
goog.require('gva.component.SearchForm');
goog.require('gva.component.SearchGrid');
goog.require('gva.component.SectionMenu');
goog.require('gva.component.ShowDetails');
goog.require('gva.component.ShowGrid');
goog.require('gva.component.Subscriptions');
goog.require('gva.component.VideoPlayer');


/**
 * @constructor
 */
gva.component.ComponentInitializer = (function() {

    /**
     * The key for the data attribute used to identify component contexts.
     * @const
     * @type {string}
     */
    var IDENTIFIER_KEY = 'component_id';

    /**
     * Simple GUID implementation which increments when used.
     * @type {string}
     */
    var GUID = Math.floor(Math.random() * 0xFFFFFF);

    /**
     * A list of all initialized components.
     * @type Array.<gva.controller.AbstractComponent>
     * @private
     */
    var _initializedComponents = [];

    /**
     * Lookups for initialized components.
     */
    var _componentIndex = {

            /**
             * Components lists indexed by their type
             */
            byType: {},

            /**
             * Component instances indexed by their IDs
             */
            byID: {}
    };

    /**
     * Public API
     */
    return {

        /**
         * Traverses the DOM and initializes all found components.
         */
        registerComponents: function() {

            // Get all DOM elements with a component attribute.
            var $components = goog.dom.query('[data-component]');
            var type;

            // Initialize each DOM element with a component type.
            goog.array.forEach($components, function(element, index) {

                // Retreive the component type.
                type = goog.dom.dataset.get(element, 'component');

                // Attempt to initialize the component.
                gva.component.ComponentInitializer.initializeComponent(type, element);
            });
        },

        /**
         * Initializes a component of a certain type on a given context.
         * @param {string} type The class name of the component to initialize.
         * @param {Element} $context The DOM element which will serve as the component's context.
         * @return {gva.controller.AbstractComponent} The initialized component instance.
         */
        initializeComponent: function(type, $context) {

            // If the component has an ID, it's already been initialized.
            var hasID = goog.dom.dataset.has($context, IDENTIFIER_KEY);
            var component;

            if (hasID) {

                // Component is already initialized.
                var givenID = goog.dom.dataset.get($context, IDENTIFIER_KEY);

                // Just return the initialized component.
                component = _componentIndex.byID[givenID];

            } else {

                // Retrieve the function definition for the component.
                var ComponentDefinition = goog.getObjectByName(type);

                if (typeof ComponentDefinition === 'function') {

                    // Create an instance of the component class.
                    component = new ComponentDefinition();

                    // Get next GUID.
                    GUID++;

                    // Tag the DOM element with it's component ID.
                    goog.dom.dataset.set($context, IDENTIFIER_KEY, GUID);

                    // Index the component so we can retrieve it easily.
                    _componentIndex.byID[GUID] = component;

                    // Keep track of all instances of this type of component.
                    _componentIndex.byType[type] = _componentIndex.byType[type] || [];
                    _componentIndex.byType[type].push(component);

                    // Initialize the component.
                    component.initialize($context);

                    // Creates some indexed references to the component.
                    _initializedComponents.push(component);

                } else {
                    console.warn('Component definition "' + type + '" not found or is not a Function');
                }
            }

            return component;
        },

        /**
         * Retrieves a component instance by ID.
         * @param {string} id The ID of the component to retrieve.
         * @return {gva.controller.AbstractComponent} The component instance.
         */
        getComponentByID: function(id) {
            return _componentIndex.byID[id];
        },

        /**
         * Retrieves a component instance based on it's DOM element (context).
         * @param {Element} $element The DOM element (context) of the component.
         * @return {gva.controller.AbstractComponent} The component instance.
         */
        getComponentByElement: function($element) {
            var id = goog.dom.dataset.get($element, IDENTIFIER_KEY);
            return gva.component.ComponentInitializer.getComponentByID(id);
        },

        /**
         * Retrieves a component instance based on a DOM query.
         * @param {string} query A DOM query, for example "#container > .item".
         * @return {gva.controller.AbstractComponent} The component instance.
         */
        getComponentByQuery: function(query) {
            var element = goog.dom.query(query)[0];
            return gva.component.ComponentInitializer.getComponentByElement(element);
        }

    };

})();
