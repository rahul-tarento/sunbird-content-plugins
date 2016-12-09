/**
 * 
 * plugin to get assessments (Questions) from learning platform
 * @class assessmentBrowser
 * @extends EkstepEditor.basePlugin
 * @author Kartheek Palla <kartheekp@ilimi.in>
 * @fires assessment:addassessment to stage
 * @listens org.ekstep.assessmentbrowser:show
 */

EkstepEditor.basePlugin.extend({
    /**
     * This expains the type of the plugin 
     * @member {String} type
     * @memberof assessment
     */
    type: "assessmentbrowser",
    /**
     * Preview URL is used to append src to iframe
     * @member {string} previewURL
     * @memberof assessment
     */
    previewURL: 'preview/preview.html?webview=true',
    /**
     *   @memberof callback {Funtion} callback
     *   @memberof assessmentBrowser
     */
    callback: function() {},
    /**
     *   registers events
     *   @memberof assessmentBrowser
     *
     */
    initialize: function() {
        EkstepEditorAPI.addEventListener(this.manifest.id + ":show", this.loadHtml, this);
    },
    /**        
     *   load html template to show the popup
     *   @param event {Object} event
     *   @param callback {Function} callback to be fired when data is available.
     *   @memberof assessmentBrowser
     */
    loadHtml: function(event, callback) {
        var instance = this;
        this.callback = callback;
        this.loadResource('editor/assessmentbrowser.html', 'html', function(err, response) {
            instance.showAssessmentBrowser(err, response);
        });
    },
    /**    
    *   invokes popup service to show the popup window
    *   @param err {Object} err when loading template async
    *   @param data {String} template HTML 
    *   @memberof assessmentBrowser
    */
    showAssessmentBrowser: function(err, data) {
        var instance = this,
            popupConfig;

        popupConfig = {
            template: data,            
            data: { instance: instance }           
        };

        EkstepEditorAPI.getService('popup').open(popupConfig, instance.controllerCallback);
    },

    /**
    *   angular controller for popup service as callback
    *   @param ctrl {Object} popupController object
    *   @param scope {Object} popupController scope object
    *   @param $uibModalInstance {Object} ui-bootstrap modal instance
    *   @param resolvedData {Object} data passed to uib config
    *   @memberof assetBrowser
    */

    controllerCallback: function(ctrl, scope, data) {
        EkstepEditorAPI.jQuery('.modal').addClass('item-activity');
        var itemIframe = EkstepEditor.jQuery('#itemIframe')[0],
            config = { "showStartPage": false, "showEndPage": false },
            instance = data.instance;

        ctrl.isFiltersShown = true;
        ctrl.isMyQuestions = false;
        ctrl.languagecode = 'en';
        ctrl.activePreviewItem = '';
        ctrl.assessment = {};
        ctrl.activity = {
            'title': '',
            'qlevel': '',
            'type': '',
            'language': 'English',
            'gradeLevel': ''
        };
        ctrl.activityOptions = {
            title: "",
            shuffle: false,
            showImmediateFeedback: true,
            myQuestions: false
        };

        EkstepEditorAPI.getService('assessmentService').getLanguages(function(err, resp) {
            if (!err && resp.statusText == "OK") {
                var assessmentlanguages = {};
                _.forEach(resp.data.result.languages, function(lang) {
                    assessmentlanguages[lang.code] = lang.name;
                });
                ctrl.assessment.language = _.values(assessmentlanguages);
                EkstepEditorAPI.getAngularScope().safeApply();
            }
        });

        EkstepEditorAPI.getService('assessmentService').getDefinations(function(err, resp) {
            if (!err && resp.statusText == "OK") {
                _.forEach(resp.data.result.definition_node.properties, function(prop) {
                    switch (prop.propertyName) {
                        case "qlevel":
                            ctrl.assessment.qlevel = prop.range;
                            break;
                        case "gradeLevel":
                            ctrl.assessment.gradeLevel = prop.range;
                            break;
                        case "type":
                            ctrl.assessment.type = prop.range;
                            break;
                    }
                });
                EkstepEditorAPI.jQuery('.ui.dropdown').dropdown({useLabels: false});
            }
        });

        ctrl.searchQuestions = function() {
            var activity = ctrl.activity;
            ctrl.isItemAvailable = true;
            ctrl.itemsLoading = true;
            var data = {
                request: {
                    filters: {
                        objectType: ["AssessmentItem"],
                        status: [],
                    },

                    sort_by: { "name": "desc" },
                    limit: 200
                }
            };
            if (ctrl.activityOptions.myQuestions) {
                ctrl.isMyQuestions = true;
                data.request.filters.owner = "";
            } else {
                ctrl.isMyQuestions = false;
            }
            _.forEach(activity, function(value, key) {
                if (value) {
                    switch (key) {
                        case "question_title":
                            data.request.query = value;
                            break;
                        case "gradeLevel":
                            if (value.length) {
                                data.request.filters.gradeLevel = value;
                            }
                            break;
                        case "language":
                            data.request.filters.language = [value];
                            break;
                        case "qlevel":
                            data.request.filters.qlevel = value;
                            break;
                        case "type":
                            if (value.length) {
                                data.request.filters.type = value;
                            }
                            break;
                    }
                }
            });
            EkstepEditorAPI.getService('assessmentService').getQuestions(data, function(err, resp) {
                if (!err && resp.statusText == "OK") {
                    ctrl.itemsLoading = false;
                    var item;
                    ctrl.items = [];
                    if (!resp.data.result.count || resp.data.result.count <= 0) {
                        ctrl.isItemAvailable = false;
                    } else {
                        _.forEach(resp.data.result.items, function(value) {
                            item = {};
                            item.question = value;
                            if (_.findIndex(ctrl.cart.items, function(i) {
                                    return i.question.identifier === value.identifier
                                }) === -1) {
                                item.isSelected = false;
                            } else {
                                item.isSelected = true;
                            }
                            ctrl.items.push(item);
                        });
                        ctrl.previewItem(ctrl.items[0]);
                    }
                    ctrl.totalItems = ctrl.items.length;
                    EkstepEditorAPI.getAngularScope().safeApply();
                }else{
                   ctrl.itemsLoading = false; 
                }
            });
        };
        ctrl.searchQuestions();
        ctrl.cart = {
            "items": [],
            "getItemIndex": function(item) {
                return _.findIndex(ctrl.items, function(i) {
                    return i.question.identifier === item.question.identifier
                });
            },
            "add": function(item) {
                this.items.push(item);
                var itemIndex = this.getItemIndex(item);
                ctrl.items[itemIndex].isSelected = true;
                ctrl.previewItem(item, true);
                EkstepEditorAPI.getAngularScope().safeApply();
            },
            "remove": function(item) {
                _.remove(this.items, function(cartItem) {
                    return item.question.identifier == cartItem.question.identifier;
                });
                var itemIndex = this.getItemIndex(item);
                if (itemIndex != -1) ctrl.items[itemIndex].isSelected = false;
                ctrl.activityOptions.total_items = this.items.length;
                EkstepEditorAPI.getAngularScope().safeApply();
            }
        };

        ctrl.addActivityOptions = function() {
            ctrl.isFiltersShown = false;
            ctrl.activityOptions.total_items = ctrl.cart.items.length;
            ctrl.activityOptions.max_score = ctrl.activityOptions.total_items;
            ctrl.activityOptions.range = _.times(ctrl.activityOptions.total_items).splice(1);
            ctrl.activityOptions.range.push(ctrl.activityOptions.total_items);
            EkstepEditorAPI.jQuery('.displayCount .text').html(ctrl.activityOptions.total_items);
            EkstepEditorAPI.getAngularScope().safeApply();
        };

        ctrl.previewLoad = function() {
            if (itemIframe.src == "")
                itemIframe.src = instance.previewURL;
            itemIframe.addEventListener('load', function() {
                itemIframe.contentWindow.setContentData(null, ctrl.itemPreviewContent, config);
            });
        };
        ctrl.previewLoad();
        ctrl.previewItem = function(item) {
            EkstepEditorAPI.getService('assessmentService').getItem(item.question.identifier, function(err, resp) {
                if (!err && resp.statusText == "OK") {
                    item = resp.data.result.assessment_item ? resp.data.result.assessment_item : item;
                    ctrl.itemPreviewLoading = true;
                    ctrl.itemPreviewDisplay = "";
                    ctrl.activePreviewItem = item.identifier;
                    var templateRef = item.template_id ? item.template_id : item.template;
                    if (templateRef) {
                        EkstepEditorAPI.getService('assessmentService').getTemplate(templateRef, function(err, response) {
                            if (!err && response.statusText == "OK") {
                                var x2js = new X2JS({ attributePrefix: 'none', enableToStringFunc: false });
                                var templateJson = x2js.xml_str2json(response.data.result.content.body);
                                ctrl.itemPreviewContent = assessmentBrowserUtil.getQuestionPreviwContent(templateJson, item);
                                ctrl.itemPreviewDisplay = !_.isUndefined(ctrl.itemPreviewContent.error) ? ctrl.itemPreviewContent.error : '';
                                ctrl.itemPreviewLoading = false;
                                itemIframe.contentWindow.location.reload();
                                EkstepEditorAPI.getAngularScope().safeApply();
                            } else {
                                ctrl.itemPreviewContent = { "error": 'Preview could not be shown.' };
                                ctrl.itemPreviewDisplay = ctrl.itemPreviewContent.error;
                                ctrl.itemPreviewLoading = false;
                                EkstepEditorAPI.getAngularScope().safeApply();
                            }
                        });
                    } else {
                        ctrl.itemPreviewContent = { "error": 'Item does not have a template selected.' };
                        ctrl.itemPreviewDisplay = ctrl.itemPreviewContent.error;
                        ctrl.itemPreviewLoading = false;
                        EkstepEditorAPI.getAngularScope().safeApply();
                    }
                }
            });

        };

        ctrl.addItemActivity = function() {
            console.log('items ', ctrl.cart.items);
            if (!_.isUndefined(instance.callback)) {
                instance.callback(ctrl.cart.items);
                ctrl.cancel();
            }
        }

        ctrl.cancel = function() {
            EkstepEditorAPI.jQuery('.ui.modal').modal('hide');
        };
    }

});
//# sourceURL=assessmentbrowserplugin.js