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
goog.provide('gva.vo.Show');

/**
 * Import dependencies
 */

/**
 * Creates a new Show instance
 * @param {object} show The show data used to populate this vo.
 * @constructor
 */
gva.vo.Show = function(show) {
  this.id = show['id'];
  this.title = show['title'];
  this.description = show['description'];
  this.image_url = show['image_url'];
  this.latestvideodate = show['latestvideodate'];
  this.videocount = show['videocount'];
  this.subscribed = show['subscribed'];
  this.slug = show['slug'];
};
