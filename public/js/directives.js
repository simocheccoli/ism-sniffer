'use strict';

/* Directives */

angular.module('snifferApp.directives', []).
    directive('appVersion', ['version', function(version) {
        //return function(scope, elm, attrs) {
        return function(scope, elm) {
            elm.text(version);
        };
      }]).
      directive('scrollGlue', [function(){
        return {
            priority: 1,
            require: ['?ngModel'],
            restrict: 'A',
            link: function(scope, $el, attrs, ctrls){
                var el = $el[0],
                    ngModel = ctrls[0];

                function scrollToBottom(){
                    el.scrollTop = el.scrollHeight;
                }

                function shouldActivateAutoScroll(){
                    // + 1 catches off by one errors in chrome
                    return el.scrollTop + el.clientHeight + 1 >= el.scrollHeight;
                }

                scope.$watch(function(){
                    if(ngModel.$viewValue){
                        scrollToBottom();
                    }
                });

                $el.bind('scroll', function(){
                    scope.$apply(ngModel.$setViewValue.bind(ngModel, shouldActivateAutoScroll()));
                });
            }
        };
    }]).
    directive('smoothie', [function(){
        return {
            restrict: 'E',
            scope: {
                eventName: '@listenTo',
                height: '@height',
                width: '@width'
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