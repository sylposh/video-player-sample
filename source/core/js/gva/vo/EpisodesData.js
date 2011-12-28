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
goog.provide('gva.vo.EpisodesData');

/**
 * Import dependencies
 */
goog.require('gva.vo.Episode');

/**
 * Creates a new ShowsData instance
 * @param {object} json The JSON data used to populate this vo.
 * @constructor
 */
gva.vo.EpisodesData = function(json) {

  /**
   * @type {Array.<gva.vo.Episode>}
   */
  this.episodes = [];

  var list = json['episodes'];
  for (var i = 0, n = list.length; i < n; i++) {
    this.episodes[i] = new gva.vo.Episode(list[i]);
  }
};
