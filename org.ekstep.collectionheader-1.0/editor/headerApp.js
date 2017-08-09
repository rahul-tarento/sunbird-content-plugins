angular.module('org.ekstep.collectionheader:app', ["Scope.safeApply", "yaru22.angular-timeago"]).controller('headerController', ['$scope', function($scope) {

    var plugin = { id: "org.ekstep.collectionheader", ver: "1.0" };
    $scope.contentDetails.contentImage =  ecEditor.getConfig('headerLogo') || ecEditor.resolvePluginResource(plugin.id, plugin.ver, "editor/images/default.png");
    $scope.internetStatusObj = {
        'status': navigator.onLine,
        'text': 'No Internet Connection!'
    };
    $scope.disableSaveBtn = true;
    $scope.lastSaved;

    $scope.saveContent = function() {
        $scope.disableSaveBtn = true;
        ecEditor.dispatchEvent("org.ekstep.collectioneditorfunctions:save", {
            showNotification: true,
            callback: function(err, res) {
                if(res && res.data && res.data.responseCode == "OK") $scope.lastSaved = Date.now();
                $scope.$safeApply();
            }
        });
    };

    $scope.downloadContent = function() {
        ecEditor.dispatchEvent("download:content");
    };

    $scope.onNodeEvent = function(event, data) {
        $scope.disableSaveBtn = false;
        $scope.$safeApply();
    };

    $scope.telemetry = function(data) {
        org.ekstep.services.telemetryService.interact({ "type": 'click', "subtype": data.subtype, "target": data.target, "pluginid": plugin.id, "pluginver": plugin.ver, "objectid": ecEditor.getCurrentStage().id, "stage": ecEditor.getCurrentStage().id });
    };

    $scope.internetStatusFn = function(event) {
        $scope.$safeApply(function() {
            $scope.internetStatusObj.status = navigator.onLine;
        });
    };

    $scope.closeCollectionEdtr = function() {
        // Condition for portal. If editor opens in iframe
        if (window.self !== window.top) {
            if (!$scope.disableSaveBtn) {
                var cf = confirm("Changes that you made may not be saved.");
                if (cf == true) {
                    window.onbeforeunload = null;
                    window.parent.editor.izimodalRef.iziModal("close");
                }
            }
            else {
                window.parent.editor.izimodalRef.iziModal("close");
            }
        }
        else window.location.reload(); // Can remove this condition.
    };

    // Condition for portal. If editor opens in iframe
    if (window.self !== window.top) {
        $scope.reportIssueLink = ((window.parent.context && window.parent.context.reportIssueLink) ? window.parent.context.reportIssueLink : "");
    }
    else $scope.reportIssueLink = ((window.context && window.context.reportIssueLink) ? window.context.reportIssueLink : "");

    window.onbeforeunload = function(e) {
        if (!$scope.disableSaveBtn) return "You have unsaved changes";
        e.preventDefault();
    }

    window.addEventListener('online', $scope.internetStatusFn, false);
    window.addEventListener('offline', $scope.internetStatusFn, false);
    ecEditor.addEventListener("org.ekstep.collectioneditor:node:added", $scope.onNodeEvent, $scope);
    ecEditor.addEventListener("org.ekstep.collectioneditor:node:modified", $scope.onNodeEvent, $scope);
    ecEditor.addEventListener("org.ekstep.collectioneditor:node:removed", $scope.onNodeEvent, $scope);
    ecEditor.addEventListener("org.ekstep.collectioneditor:node:reorder", $scope.onNodeEvent, $scope);
}]);
