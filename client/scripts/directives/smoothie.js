/**
 * @ngdoc directive
 * @name ng.directive:smoothie
 * @description
 * SmoothieCharts directive
 */
angular.module('snifferApp')
.directive('smoothie', [
function() {
  'use strict';

  return {
    restrict: 'E',
    scope: {
      eventName:  '@listenTo',
      height:     '@height',
      width:      '@width'
    },
    replace: false,
    template: '<canvas id="{{eventName}}_chart" height="{{height}}" width="{{width}}"></canvas>',
    link: function (scope, element, attrs) {
      scope.smoothie = new SmoothieChart({
        millisPerPixel: attrs.speed || 20,
        interpolation: attrs.interpolation || 'bezier'
      });
      scope.time = new TimeSeries();

      scope.smoothie.streamTo(document.getElementById(scope.eventName+'_chart'), 1000);
      scope.smoothie.addTimeSeries(scope.time, {
        strokeStyle: attrs.strokeStyle || '#00ff00',
        fillStyle: attrs.fillStyle || 'rgba(0, 255, 0, 0.4)',
        lineWidth: attrs.lineWidth || 2
      });

      //Update when charts data changes
      scope.$watch(attrs.listenTo, function(newValue, oldValue) {
        if (newValue === oldValue) { return; } // AKA first run
        scope.time.append(new Date().getTime(), newValue);
      });
    }
  };
}]);
