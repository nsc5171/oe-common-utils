'use strict';

const utils = require('../../utils');
const exceljs = require('exceljs');

const serializers = {
    xlsx: ['toExcelObject', 'toObject']
}

module.exports = function uploadDownloadMixinNSC(Model, opts) {

    Model.initExcel = function initExcel(workbook, options, next) {
        let self = this;
        let worksheet = workbook.addWorksheet(this.definition.name);
        worksheet.columns = Object.entries(self.definition.properties || {}).reduce((fin, [k, v]) => {
            if (!k.startsWith('_')) {
                fin.push({ header: v.description || k, key: k, width: 30 })
            }
            return fin;
        }, []);
        process.nextTick(() => next(null, workbook));
    }

    Model.prototype.toExcelObject = function toExcelObject() {
        return Object.entries(this.toObject()).reduce((fin, [k, v]) => {
            if (!k.startsWith('_')) {
                fin[k] = v;
            }
            return fin;
        }, {});
    }

    Model.remoteMethod('downloadData', {
        accepts: [
            { arg: 'filter', type: 'object' },
            utils.options_arg_defn
        ],
        http: { verb: 'GET' },
        returns: [
            { root: true, type: 'file' },
            { arg: 'Content-Type', type: 'string', http: { target: 'header' } },
            { arg: 'Content-Disposition', type: 'string', http: { target: 'header' } }
        ]
    });

    Model.downloadData = function downloadData(filter, options, next) {
        let self = this;
        let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        let contentDisposition = `attachment; filename="${this.definition.name}.xlsx"`
        if (typeof filter !== 'object') filter = {};
        let workbook = new exceljs.Workbook();
        self.initExcel(workbook, options, err => {
            if (err) return next(err);
            self.find(filter, options, (err, insts) => {
                if (err) return next(err);
                insts.forEach(i => {
                    workbook.worksheets[0].addRow(i.toExcelObject());
                });
                workbook.xlsx.writeBuffer().then(buf => {
                    next(null, buf, contentType, contentDisposition)
                });
            })
        })
    }

}