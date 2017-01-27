define([
    "jquery",
    "underscore",
    "backbone",
    'backgrid',
    'backboneForms',
    'backbone.paginator',
    'backgrid-paginator',
    'moment',
    'backgridFilter',
    'backgridSelectAll',
    'backgridMomentCell'

], function(
    $,
    _,
    backbone,
    backgrid,
    backboneForms
) {

    var MageGrid = {};


    MageGrid.init = function(config) {

        var timeDateFormat = Backgrid.Extension.MomentCell.extend({
            modelInUTC: true,
            modelFormat: "YYYY/M/D HH:mm:ss.SSS",
            displayFormat: "MM-DD-YYYY hh:mm",
            displayInUTC: false
        });

        var HtmlCell = Backgrid.HtmlCell = Backgrid.Cell.extend({
            className: "html-cell",
            initialize: function() {
                Backgrid.Cell.prototype.initialize.apply(this, arguments);
            },
            render: function() {
                this.$el.empty();
                var rawValue = this.model.get(this.column.get("name"));
                var formattedValue = this.formatter.fromRaw(rawValue, this.model);
                this.$el.append(formattedValue);
                this.delegateEvents();
                return this;
            }
        });


        var GridAttributeModel = Backbone.Model.extend({
            urlRoot: config.gridAttribService
        });

        var GridAttributeCol = Backbone.PageableCollection.extend({
            model: GridAttributeModel,
            url: config.gridAttribService
        });

        var PageModel = Backbone.Model.extend({
            defaults: {
                checked: false,
                title: 'Untitled'
            }
        });

        var PagingCol = Backbone.PageableCollection.extend({
            url: config.gridService,
            queryParams: {
                totalPages: null,
                totalRecords: null,
                currentPage: 'page',
                pageSize: 'results_per_page',
                searchColumns: false
            },
            state: {
                pageSize: config.defaultPerPage,
                totalRecords: null
            },
            mode: 'server',
            parseState: function(resp, queryParams, state, options) {
                return {
                    totalRecords: resp.total_count,
                    totalPages: resp.total_pages
                }
            },
            formatUrl: function(item) {
                return config.orderUrl.replace('#####', item.entity_id);
            },
            parseRecords: function(resp, options) {
                var self = this,
                    newResp = [];

                _.each(resp.data, function(item) {
                    item.order_url = self.formatUrl(item);
                    newResp.push(item);
                });

                return newResp;
            }
        });

        var ClickableRow = Backgrid.Row.extend({
            highlightColor: "lightYellow",
            events: {
                mouseover: "mouseOver",
                mouseout: "mouseOut",
                click: "clickRow"
            },
            mouseOver: function() {
                this.el.style.backgroundColor = this.highlightColor;
            },
            mouseOut: function() {
                this.el.style.backgroundColor = "white";
            },
            clickRow: function(e) {
                if (e.target.nodeName != 'INPUT' || e.target.nodeName != 'SELECT') {
                    document.location.href = this.model.get('order_url');
                }
            }
        });

        var GridView = Backbone.View.extend({
            el: "#gridContainer",
            events: {
                "change #grid-fields [name=\"GridFields\"] input": "gridFieldsHandler",
                "change #grid-fields input[name=\"SearchVisibleColumns\"]": "searchVisibleHandler",
                "change #grid-fields select": "perPageHandler",
                "click #showHide": "showHideOptions"
            },
            perPage: config.perPage,
            activeColumns: config.defaultColumns,
            perPageHandler: function(evt) {
                this.collection.pagingCol.setPageSize(Number($(evt.target).val()));
            },
            searchVisibleHandler: function(evt) {
                if($(evt.target).is(':checked')){
                    console.log('col: ',this.collection.pagingCol);
                    this.collection.pagingCol.queryParams.searchColumns = this.activeColumns.toString();
                    this.collection.pagingCol.fetch({
                        reset: true
                    });
                }else{
                    this.collection.pagingCol.queryParams.searchColumns = false;
                    this.collection.pagingCol.fetch({
                        reset: true
                    });
                }
            },
            gridFieldsHandler: function(evt) {
                this.generateColumns($(evt.target).val());

                this.collection.pagingCol.fetch({
                    reset: true
                });

                this.addRemoveColumns();
            },
            initialize: function() {
                var self = this;

                $("#grid-fields").hide();

                this.collection.gridAttr.on('sync', function(colData) {
                    self.generateColumns();
                    self.loadForm();
                    self.render();
                    self.setDefaultForm();
                });

                this.collection.gridAttr.fetch();
            },
            massActionOptions: function() {
                var tmpArr = [];

                _.each(config.massActions, function(tmpObj) {
                    tmpArr.push([tmpObj.label, tmpObj.val]);
                });

                return tmpArr;
            },
            setDefaultForm: function() {
                _.each(config.defaultColumns, function(tmpColumn) {
                    $('[name="GridFields"][value="' + tmpColumn + '"]').prop('checked', true);
                });
                $('[name="PerPage"]').val(config.defaultPerPage);
            },
            showHideOptions: function() {
                $("#grid-fields").toggle();
            },
            ucwords: function(str) {
                return (str + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
                    return $1.toUpperCase();
                });
            },
            loadForm: function() {
                var GridFields = Backbone.Model.extend({
                    schema: {
                        PerPage: {
                            type: 'Select',
                            options: this.perPage
                        },
                        SearchVisibleColumns: 'Checkbox',
                        GridFields: {
                            type: 'Checkboxes',
                            options: this.collection.gridAttr.toJSON()
                        }
                    }
                });
                var gFields = new GridFields();

                var form = new Backbone.Form({
                    model: gFields
                }).render();

                $('#grid-fields').append(form.el);

                var ActionFields = Backbone.Model.extend({
                    schema: {
                        MassActions: {
                            type: 'Select',
                            options: config.massActions
                        }
                    }
                });

                var aFields = new ActionFields();

                var form = new Backbone.Form({
                    model: aFields,
                    submitButton: 'Submit Actions'
                }).render();
                $('#grid-actions').append(form.el);

            },
            addRemoveColumns: function() {
                var self = this;

                this.grid.columns.reset();

                _.each(this.columnArr, function(tmpVal) {
                    self.grid.insertColumn(tmpVal);
                });
            },
            generateColumns: function(colName = '') {
                var self = this;
                if (!_.contains(this.activeColumns, colName)) {
                    this.activeColumns.push(colName);
                } else {
                    this.activeColumns = _.without(this.activeColumns, colName);
                }

                this.columnArr = [{
                    name: '',
                    cell: Backgrid.Extension.SelectRowCell,
                    headerCell: Backgrid.Extension.SelectAllHeaderCell
                }];

                _.each(this.activeColumns, function(tmpVal) {
                    var tmpObj = {
                        name: tmpVal,
                        label: self.ucwords(tmpVal.replace(/_/g, " ")),
                        editable: false
                    };
                    switch (tmpVal) {
                        case "entity_id":
                            tmpObj['cell'] = Backgrid.IntegerCell.extend({
                                orderSeparator: ''
                            });
                            break;
                        case "increment_id":
                            tmpObj['cell'] = Backgrid.IntegerCell.extend({
                                orderSeparator: ''
                            });
                            break;
                        case "created_at":
                            tmpObj['cell'] = timeDateFormat;
                            break;
                        case "updated_at":
                            tmpObj['cell'] = timeDateFormat;
                            break;
                        default:
                            tmpObj['cell'] = 'string';
                            break;
                    }

                    self.columnArr.push(tmpObj);
                });

                this.columnArr.push({
                    name: "action",
                    label: "Action",
                    cell: Backgrid.SelectCell.extend({
                        optionValues: this.massActionOptions()
                    })
                });
            },
            render: function() {

                $('#grid-wrapper').html("");
                $('#grid-paginator').html("");
                $('.form-search').remove();

                var MyGrid = Backgrid.Grid.extend({
                    columns: this.columnArr
                });

                var paginator = new Backgrid.Extension.Paginator({
                    collection: this.collection.pagingCol,
                    windowSize: 10
                });

                this.grid = new MyGrid({
                    row: ClickableRow,
                    collection: this.collection.pagingCol
                });

                var serverSideFilter = new Backgrid.Extension.ServerSideFilter({
                    collection: this.collection.pagingCol,
                    name: "keyword",
                    placeholder: "ex: name, email or increment id"
                });

                var serverSideProductFilter = new Backgrid.Extension.ServerSideFilter({
                    collection: this.collection.pagingCol,
                    name: "productSearch",
                    placeholder: "ex: sku or product name"
                });

                // grid.sort('entity_id', 'descending');

                $('#grid-wrapper').html(this.grid.render().el);
                $('#grid-paginator').html(paginator.render().el);

                $("#searchTitle").after(serverSideFilter.render().el);
                $("#searchTitle").after(serverSideProductFilter.render().el);

                this.collection.pagingCol.fetch();
            }

        });


        var gridAttr = new GridAttributeCol();

        var pagingCol = new PagingCol({
            model: new PageModel()
        });

        new GridView({
            collection: {
                gridAttr: gridAttr,
                pagingCol: pagingCol
            }
        });


    };

    return MageGrid;

});