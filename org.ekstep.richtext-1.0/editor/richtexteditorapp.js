'use strict';

angular.module('richtexteditorapp', [])
    .controller('richtexteditorcontroller', ['$scope', '$injector', 'instance', function($scope, $injector, instance) {
        var ctrl = this;
        ctrl.text = '';
        $scope.$on('ngDialog.opened', function (e, $dialog) {
            ctrl.selectedText = false;
            CKEDITOR.basePath = ecEditor.resolvePluginResource(instance.manifest.id, instance.manifest.ver, "editor/libs/");
            CKEDITOR.replace( 'editor1', {
                customConfig: CKEDITOR.basePath + "config.js",
                skin: 'moono-lisa,'+CKEDITOR.basePath + "skins/moono-lisa/",
                contentsCss: CKEDITOR.basePath + "contents.css",
            });
            var textObj = ecEditor.getCurrentObject();
            if(e.currentScope.ngDialogData && e.currentScope.ngDialogData.textSelected && textObj) {
                ctrl.selectedText = true;
                CKEDITOR.instances.editor1.setData(textObj.config.text);
            }
        });
        ctrl.addText = function() {
            var textObj = ecEditor.getCurrentObject();
            if(textObj && ctrl.selectedText){
                textObj.config.text = CKEDITOR.instances.editor1.getData();
                textObj.attributes.__text = textObj.config.text;
                ecEditor.jQuery("#richtext-wrapper div#"+textObj.id).html(textObj.config.text);
                var currentObject = org.ekstep.contenteditor.api.getCurrentObject();
                 currentObject.editorObj.width = $('#' + textObj.id).width();
                 currentObject.editorObj.height = $('#' + textObj.id).height();
                ecEditor.render();
            }else{
                ecEditor.dispatchEvent('org.ekstep.richtext:create', {
                    "__text":  CKEDITOR.instances.editor1.getData(),
                    "type": "rect",
                    "x": 10,
                    "y": 20,
                    "fill": "rgba(0, 0, 0, 0)",
                    "stroke": "rgba(255, 255, 255, 0)",
                    "strokeWidth": 1,
                    "opacity": 1
                });
            }
            $scope.closeThisDialog();
        }
    }]);