"use strict";

define(['logManager',
    'js/PropertyGrid/PropertyGridPart'], function (logManager,
                                                   PropertyGridPart) {

    var PropertyGrid;

    PropertyGrid = function () {
        var self = this;

        this.$el = $('<div/>', { "class" : "property-list" });

        this._propertyList = {};

        this._widgetList = {};
        this._initDefaultWidgets();

        this._isReadOnly = false;

        this.__onChange = null;
        this.__onFinishChange = null;

        this._gui = new PropertyGridPart({"el": this.$el});
        this._gui.onChange(function (args) {
            self._logger.warning("onChange: " + JSON.stringify(args));
            if (self.__onChange) {
                self.__onChange.call(self, args);
            }
        });

        this._gui.onFinishChange(function (args) {
            self._logger.warning("onFinishChange: " + JSON.stringify(args));
            if (self.__onFinishChange) {
                self.__onFinishChange.call(self, args);
            }
        });

        this._logger = logManager.create("PropertyGrid");
        this._logger.debug("Created");
    };

    PropertyGrid.prototype._initDefaultWidgets = function () {
        //this._widgetList["default"] = new TextWidget();
    };

    PropertyGrid.prototype.registerWidgetForType = function (type, widget) {
        this._gui.registerWidgetForType(type, widget);
    };

    PropertyGrid.prototype._render = function () {
        var i;

        this._folders = {};
        this._widgets = {};

        this._gui.clear();

        for (i in this._propertyList) {
            if (this._propertyList.hasOwnProperty(i)) {
                this._propertyList[i].id = i;
                this._addPropertyItem(i.split("."), "", this._propertyList[i], this._gui);
            }
        }
    };

    PropertyGrid.prototype._addPropertyItem = function (arrID, prefix, propDesc, guiObj) {
        var parentFolderKey,
            parentFolderName;

        if (arrID.length > 1) {
            parentFolderName = arrID[0];
            parentFolderKey = prefix !== "" ? prefix + parentFolderName : parentFolderName;
            this._folders[parentFolderKey] = this._folders[parentFolderKey] || guiObj.addFolder(parentFolderName);
            arrID.splice(0, 1);
            this._addPropertyItem(arrID, parentFolderKey + ".", propDesc, this._folders[parentFolderKey]);
        } else {
            this._widgets[propDesc.id] = guiObj.add(propDesc);
        }
    };

    /****************** PUBLIC FUNCTIONS ***********************************/

    PropertyGrid.prototype.setPropertyList = function (pList) {
        this._propertyList = pList || {};
        this._render();
        this.setReadOnly(this._isReadOnly);
    };

    PropertyGrid.prototype.onChange = function (fnc) {
        this.__onChange = fnc;
    };

    PropertyGrid.prototype.onFinishChange = function (fnc) {
        this.__onFinishChange = fnc;
    };

    PropertyGrid.prototype.destroy = function () {
        this._gui.clear();
    };

    PropertyGrid.prototype.setReadOnly = function (isReadOnly) {
        this._isReadOnly = isReadOnly;
        this._gui.setReadOnly(isReadOnly);
    };

    return PropertyGrid;
});
