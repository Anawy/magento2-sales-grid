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
    // console.log('backboneForms: ',backboneForms);
    var MageGrid = {};
    MageGrid.init = function(config) {

        var GridAttributeModel = Backbone.Model.extend({
            urlRoot: config.gridAttribService
        });

        var GridAttributeCol = Backbone.PageableCollection.extend({
            model: GridAttributeModel,
            url: config.gridAttribService
        });

        var gridAttr = new GridAttributeCol();

        var loadForm = function() {
            var GridFields = Backbone.Model.extend({
                schema: {
                    Grid: {
                        type: 'Checkboxes',
                        options: gridAttr.toJSON()
                    }
                }
            });
            var gFields = new GridFields();
            var form = new Backbone.Form({
                model: gFields
            }).render();
            $('#grid-fields').append(form.el);

            $('[name="Grid"] input').on('change', function(tmpElm){
                var tmpVal = $(tmpElm.target).val();
                console.log('change ',tmpVal);
            });
        };

        gridAttr.on('sync', function(colData) {
            loadForm();
        });

        gridAttr.fetch();


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

        var processGrid = {
            columns: [{
                name: '',
                cell: Backgrid.Extension.SelectRowCell,
                headerCell: Backgrid.Extension.SelectAllHeaderCell
            }, {
                name: 'entity_id',
                label: 'Order ID',
                editable: false,
                cell: Backgrid.IntegerCell.extend({
                    orderSeparator: ''
                })
            }, {
                name: 'increment_id',
                label: 'Increment ID',
                editable: false,
                cell: Backgrid.IntegerCell.extend({
                    orderSeparator: ''
                })
            }, {
                name: 'status',
                label: 'Status',
                editable: false,
                cell: 'string'
            }, {
                name: 'created_at',
                label: 'Created At',
                editable: false,
                cell: timeDateFormat
            }, {
                name: 'updated_at',
                label: 'Updated At',
                editable: false,
                cell: timeDateFormat
            }, {
                name: 'base_grand_total',
                label: 'Base Grand Total',
                editable: false,
                cell: 'string'
            }, {
                name: 'base_total_paid',
                label: 'Base Total Paid',
                editable: false,
                cell: 'string'
            }, {
                name: 'customer_email',
                label: 'Customer Email',
                editable: false,
                cell: 'string'
            }]
        };

        var MyGrid = Backgrid.Grid.extend(processGrid);

        var MyItem = Backbone.Model.extend({
            defaults: {
                checked: false,
                title: 'Untitled'
            }
        });



        var queryObj = {
            totalPages: null,
            totalRecords: null,
            currentPage: 'page',
            pageSize: 'results_per_page'
        };

        var MyItems = Backbone.PageableCollection.extend({
            url: config.gridService,

            queryParams: queryObj,

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

        var coll = new MyItems({
            model: new MyItem()
        });
        var paginator = new Backgrid.Extension.Paginator({
            collection: coll,
            windowSize: 10
        });
        var grid = new MyGrid({
            row: ClickableRow,
            collection: coll
        });


        var serverSideFilter = new Backgrid.Extension.ServerSideFilter({
            collection: coll,
            name: "keyword",
            placeholder: "ex: name, email or increment id"
        });

        // grid.sort('entity_id', 'descending');

        $('#grid-wrapper').html(grid.render().el);
        $('#grid-paginator').html(paginator.render().el);

        $("#grid-wrapper").before(serverSideFilter.render().el);

        coll.fetch();

    };

    return MageGrid;

});