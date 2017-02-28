'use strict';
angular.module('activityBrowserApp', [])
    .controller('activityBrowserCtrl', ['$scope', '$injector', 'instance', function($scope, $injector, instance) {
        var ctrl = this,
            angScope = EkstepEditorAPI.getAngularScope();

        ctrl.errorLoadingActivities = false;
        ctrl.activitiesList = [];
        ctrl.noActivities = false;
        ctrl.loading = false;
        ctrl.defaultActivityImage = EkstepEditorAPI.getPluginRepo() + "/org.ekstep.activitybrowser-1.0/assets/default-activity.png";
        ctrl.activityOptions = {
            searchQuery: "",
            conceptsPlaceHolder: '(0) Concepts',
            concepts: {},
            categories: {}

        };
        ctrl.categories = {
            "core": "core",
            "learning": "learning",
            "literacy": "literacy",
            "math": "math",
            "science": "science",
            "time": "time",
            "wordnet": "wordnet",
            "game": "game",
            "mcq": "mcq",
            "mtf": "mtf",
            "ftb": "ftb"
        };


        ctrl.getActivities = function() {
            ctrl.loading = true;
            ctrl.errorLoadingActivities = false;
            ctrl.noActivities = false;
            ctrl.activitiesList = [];
            $scope.$safeApply();
            var data = {
                "request": {
                    "query": ctrl.activityOptions.searchQuery,
                    "filters": {
                        "objectType": ["Content"],
                        "contentType": ["plugin"],
                        "status": ["live"],
                        "concepts": ctrl.activityOptions.concepts,
                        "category": ctrl.activityOptions.categories
                    },
                    "sort_by": { "lastUpdatedOn": "desc" },
                    "limit": 200
                }
            };
            EkstepEditorAPI.getService('searchService').search(data, function(err, resp) {
                ctrl.loading = false;
                $scope.$safeApply();
                if (err) {
                    ctrl.errorLoadingActivities = true;
                    return
                }
                if (resp.data.result.count <= 0) {
                    ctrl.noActivities = true;
                    return;
                }
                ctrl.activitiesList = resp.data.result.content;
                applyDimmerToCard();
            })
        }
        ctrl.addPlugin = function(activity) {
            EkstepEditorAPI.loadPlugin(activity.code, activity.semanticVersion);
            $scope.closeThisDialog();
        }
        ctrl.getActivities();
        EkstepEditorAPI.dispatchEvent('org.ekstep.conceptselector:init', {
            element: 'activityConceptSelector',
            selectedConcepts: [], // All composite keys except mediaType
            callback: function(data) {
                ctrl.activityOptions.conceptsPlaceHolder = '(' + data.length + ') concepts selected';
                ctrl.activityOptions.concepts = _.map(data, function(concept) {
                    return concept.id;
                });
                $scope.$safeApply();
                ctrl.getActivities();
            }
        });

        function applyDimmerToCard() {
            setTimeout(function() {
                EkstepEditorAPI.jQuery("#activity-cards .image").dimmer({
                    on: 'hover'
                });
            }, 500);
        }
        setTimeout(function () {
            EkstepEditorAPI.jQuery('.ui.dropdown.lableCls').dropdown({ useLabels: false, forceSelection: false});    
        },1000);
        

    }]);