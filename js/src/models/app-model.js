// Application model: save app. states
Vis.Models.App = Backbone.Model.extend({
  defaults: {
  },

  initialize: function () {
    Backbone.on("data:loaded", function(data) { this.bundle(data); }, this);
  },

  sync: function() {
    var that = this;
    this.intersectKeys();
    this.childrenHousehold.filter(function(d) {
      return that.intersectedKeys.indexOf(d) > -1;
    });
    this.householdHousehold.filter(function(d) {
      return that.intersectedKeys.indexOf(d) > -1;
    });
  },

  unsync: function() {
    this.childrenHousehold.filter(null);
    this.householdHousehold.filter(null);
  },

  intersectKeys: function() {
    this.intersectedKeys = _.intersection(
      this.getChildrenKeys(),
      this.getHouseholdsKeys()
    );
  },

  // "children" dataset
  getChildrenKeys: function() {
    var that = this;
    this.childrenKeys = new Array();
    this.childrenByHousehold.top(Infinity)
      .forEach(function(d) {
        if (d.value != 0) that.childrenKeys.push(d.key);
      });
    return this.childrenKeys;
  },

  filterByAge: function(args) {
    this.unsync();
    this.childrenAge.filter(args);
    this.sync();
  },


  // "households" dataset
  getHouseholdsKeys: function() {
    return this.householdHousehold.top(Infinity)
      .map(function(d) { return d.hh; });
  },

  filterByHead: function(args) {
    this.unsync();
    this.householdHead.filter(args);
    this.sync();
  },

  // filter: function() {
  //   this.unsync();
  //   // this.childrenByAge.filter(args);
  //   this.setChildrenKeys();
  //   this.sync();
  // },

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
    this.householdHousehold = households.dimension(function(d) { return d.hh; });
    this.householdHead = households.dimension(function(d) { return d.head; });
    this.houseHoldPoverty = households.dimension(function(d) { return d.poverty; });
    this.householdDisability = households.dimension(function(d) { return d.hasDis; });
    // groups
    this.householdsByHead = this.householdHead.group();
    this.householdsByPoverty = this.houseHoldPoverty.group();
    this.householdsByDisability = this.householdDisability.group();

    // this.filterByAge([1, 5]);
    debugger;

    // dataset "incomes"
    // this.sourcesIncome = crossfilter(data.sourcesIncome);

    // dataset "expenditures"
    // this.expenditures = crossfilter(data.expenditures);

    // dataset "coping" (coping mechanisms)
    // this.coping = crossfilter(data.coping);
  }
})
