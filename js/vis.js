/* Global Vis object
	 Set up global application namespace using object literals.
*/
var Vis = Vis   || {};
Vis.DEFAULTS 		|| (Vis.DEFAULTS = {});
Vis.Routers     || (Vis.Routers = {});
Vis.Templates 	|| (Vis.Templates = {});
Vis.Models 			|| (Vis.Models = {});
Vis.Collections || (Vis.Collections = {});
Vis.Views 			|| (Vis.Views = {});
/*  Default/config values
    Stores all application configuration.
*/
Vis.DEFAULTS = _.extend(Vis.DEFAULTS, {
  DATASETS_URL: {
    CHILDREN: "data/children.json",
    HOUSEHOLDS: "data/households.json"
  }
});
// Application router
Vis.Routers.App = Backbone.Router.extend({
  routes: {
    "*path": "load",
  },
  load: function (params) {
    Backbone.trigger("load:data", params);
  }
});
/* Loading "tidy" data */
Vis.Collections.App = Backbone.Collection.extend({
  initialize: function(options) {
    Backbone.on("load:data", function(params) { this.load(); }, this);
  },

  load: function() {
    var that = this;

    queue()
      .defer(
        function(url, callback) {
          d3.json(url, function(error, result) {
            callback(error, result);
          })
        },
        Vis.DEFAULTS.DATASETS_URL.CHILDREN)
      .defer(
        function(url, callback) {
          d3.json(url, function(error, result) {
            callback(error, result);
          })
        },
        Vis.DEFAULTS.DATASETS_URL.HOUSEHOLDS)
      .await(_ready);

    // on success
    function _ready(error, children, households) {
      // coerce data
      debugger;
    }
  }
});
// Application model: save app. states
Vis.Models.App = Backbone.Model.extend({
  defaults: {
  },
  initialize: function () {
    this.listenTo(Vis.Collections.app, "loaded", function(data) {
      this.bundle(data);
    });
  },

  redraw: function() {
    this.syncCrossfilters();
    Backbone.trigger("redraw");
  },

  //filters / setters
  filterByAge: function(params) {
    this.childrenByAge.filter(params);
    this.refresh();
  },

  // getters
  getHouseholdsByHead: function() {
    return this.householdsByHead.top(Infinity);
  },

  getHouseholdsByChildren: function() {
    var that = this;
    return d3.nest()
      .key(function(d) { return d.value; })
      .rollup(function(leaves) { return leaves.length; })
      .entries(that.childrenByHousehold.top(Infinity));
  },

  // create crossfilters + associated dimensions and groups
  bundle: function(data) {
    var that = this;

    // dataset "children"
    // household (one) -> child (many)
    var children = crossfilter(data.children);
    // dimensions
    this.childrenGender = children.dimension(function(d) { return d.gender; });
    this.childrenAge = children.dimension(function(d) { return d.age; });
    this.childrenHousehold = children.dimension(function(d) { return d.hh; });
    // groups
    this.childrenByHousehold = this.childrenHousehold.group();
    this.childrenByAge = this.childrenAge.group();
    this.childrenByGender = this.childrenGender.group();

    // dataset "households"
    // household (one) -> head, poverty, disability, ... (one)
    var households = crossfilter(data.households);
    // dimensions
    this.household = households.dimension(function(d) { return d.hh; });
    this.householdHead = households.dimension(function(d) { return d.head; });
    this.houseHoldPoverty = households.dimension(function(d) { return d.poverty; });
    this.householdDisability = households.dimension(function(d) { return d.hasDis; });
    // groups
    this.householdsByHead = this.householdHead.group();
    this.householdsByPoverty = this.houseHoldPoverty.group();
    this.householdsByDisability = this.householdDisability.group();

    // dataset "incomes"
    // this.sourcesIncome = crossfilter(data.sourcesIncome);

    // dataset "expenditures"
    // this.expenditures = crossfilter(data.expenditures);

    // dataset "coping" (coping mechanisms)
    // this.coping = crossfilter(data.coping);
  },


})
// Global namespace's method used to bootstrap the application from html
$(function () {
  'use strict';
  Vis.initialize = function () {
    Vis.Collections.app = new Vis.Collections.App();
    // Vis.Routers.app = new Vis.Routers.App();
    new Vis.Routers.App();
    Backbone.history.start();
  };
});
