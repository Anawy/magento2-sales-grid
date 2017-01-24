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

        var defaultColumns = [
            'entity_id', 'increment_id', 'status', 'created_at', 'updated_at', 'base_grand_total', 'base_total_paid', 'customer_email'
        ];

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
                pageSize: 'results_per_page'
            },
            state: {
                pageSize: 20,
                totalRecords: null
            },
            mode: 'server',
            parseState: function(resp, queryParams, state, options) {
                // console.log(resp);
                return {
                    totalRecords: resp.total_count,
                    totalPages: resp.total_pages
                }
            },
            formatUrl: function(item) {
                return config.orderUrl.replace('#####', item.entity_id);
            },
            parseRecords: function(resp, options) {
                console.log(resp);
                var self = this,
                    newResp = [];

                _.each(resp.data, function(item) {
                    item.order_url = self.formatUrl(item);
                    newResp.push(item);
                });

                // return newResp;
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
                if (e.target.nodeName != 'INPUT') {
                    document.location.href = this.model.get('order_url');
                }
            }
        });

        var GridView = Backbone.View.extend({
            el: "#gridContainer",
            events: {
                "change #grid-fields input": "gridFieldsHandler",
                "change #grid-fields select": "perPageHandler",
                "click #showHide": "showHideOptions"
            },
            perPage: [10, 20, 50, 100, 200],
            activeColumns: defaultColumns,
            perPageHandler: function(evt){
                console.log('evt: ',$(evt.target).val());
            },
            gridFieldsHandler: function(evt){
                this.generateColumns($(evt.target).val());
                this.render();
            },
            initialize: function() {
                var self = this;

                $("#grid-fields").hide();

                this.collection.gridAttr.on('sync', function(colData) {
                    self.generateColumns();
                    self.loadForm();
                    self.render();
                });

                this.collection.gridAttr.fetch();
            },
            showHideOptions: function(){
                $("#grid-fields").toggle();
            },
            loadForm: function() {
                var GridFields = Backbone.Model.extend({
                    schema: {
                        PerPage: {
                            type: 'Select',
                            options: this.perPage
                        },
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

            },
            generateColumns: function(colName = ''){
                var self = this;
                if(!_.contains(this.activeColumns, colName)){
                    this.activeColumns.push(colName);
                }else{
                    this.activeColumns = _.without(this.activeColumns, colName);
                }
                
                this.columnArr = [{
                    name: '',
                    cell: Backgrid.Extension.SelectRowCell,
                    headerCell: Backgrid.Extension.SelectAllHeaderCell
                }];

                _.each(this.activeColumns, function(tmpVal){
                    var tmpObj = {
                        name: tmpVal,
                        label: tmpVal,
                        editable: false
                    };
                    switch(tmpVal){
                        case "entity_id":
                            tmpObj['cell'] = Backgrid.IntegerCell.extend({orderSeparator: ''});
                        break;
                        case "increment_id":
                            tmpObj['cell'] = Backgrid.IntegerCell.extend({orderSeparator: ''});
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

                var grid = new MyGrid({
                    row: ClickableRow,
                    collection: this.collection.pagingCol
                });

                var serverSideFilter = new Backgrid.Extension.ServerSideFilter({
                    collection: this.collection.pagingCol,
                    name: "keyword",
                    placeholder: "ex: name, email or increment id"
                });

                // grid.sort('entity_id', 'descending');

                $('#grid-wrapper').html(grid.render().el);
                $('#grid-paginator').html(paginator.render().el);

                $("#grid-wrapper").before(serverSideFilter.render().el);

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