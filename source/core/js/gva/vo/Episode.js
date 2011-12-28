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
goog.provide('gva.vo.Episode');

/**
 * Import dependencies
 */

/**
 * Creates a new Episode instance
 * @param {object} episode The episode data used to populate this vo.
 * @constructor
 */
gva.vo.Episode = function(episode) {
  this.id = episode['id'];
  this.title = episode['title'];
  this.description = episode['description'];
  this.image_url = episode['image_url'];
  this.runtime = episode['runtime'];
  this.airdate = episode['airdate'];
  this.video_flash = episode['video_flash'];
  this.video_html = episode['video_html'];
  this.show_id = episode['show_id'];
  this.show_title = episode['show_title'];
  this.watched = episode['watched'];
  this.isNew = episode['isNew'];
  this.slug = episode['slug'];
};
