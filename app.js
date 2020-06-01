(function(){

  'use strict'; //browser does complain about bad coding

  //let stops = require("./lines/buslines.js");
  //import  getBusline  from "/lines/buslines";


  angular.module('BEP-Timer', [])
  .controller('ReportsController', ReportsController)
  .service('ReportTimeService', ReportTimeService);

  ReportsController.$inject = ['ReportTimeService'];
  function ReportsController(ReportTimeService){
    let reportList = this;
    const options = { year: '2-digit', month: '2-digit', day: '2-digit' };

    reportList.ZNr = '';
    reportList.today = new Date().toLocaleDateString('de-DE', options);

    reportList.tomorrow = new Date();
    reportList.tomorrow.setDate(reportList.tomorrow.getDate() + 1);
    reportList.tomorrow = reportList.tomorrow.toLocaleDateString('de-DE', options);

    reportList.d_a_tomorrow = new Date();
    reportList.d_a_tomorrow.setDate(reportList.d_a_tomorrow.getDate() + 2);
    reportList.d_a_tomorrow = reportList.d_a_tomorrow.toLocaleDateString('de-DE', options);


    reportList.addToList = function(znr){
      //console.log(type + " clicked add to List");
      //console.log(lineFrame[0]);
      ReportTimeService.addReportItem(znr);
      reportList.ZNr = '';
    };

    reportList.items = ReportTimeService.getReportItems();

    reportList.getCSV = function(){
      //console.log(fileName + " fileName parameter");
      let f = ReportTimeService.getDateTime() + '_BEP-Report.csv';
      let newchar = '-';
      f = f.split(':').join(newchar);
      console.log(f);

      ReportTimeService.downloadCSV({filename: f});
    };

    reportList.editZNr = function(itemID, znr){
      ReportTimeService.editZNr(itemID, znr);
      reportList.ZNr = '';
    };

    reportList.setVT = function(itemID, vt){
      ReportTimeService.setVT(itemID, vt);
    };

    reportList.removeItem = function(itemID){
      console.log(itemID + " item ID in reportList");

      ReportTimeService.remove(itemID);
    };

    reportList.setStart = function(itemID){
      ReportTimeService.setStart(itemID, new Date());
    };

    reportList.setEnd = function(itemID){
      ReportTimeService.setEnd(itemID, new Date());
    };


  }



  function ReportTimeService(){
    let service = this;
    let reportItems = [];

    service.addReportItem = function(znr){
      //console.log(reportItems.length + " length of items before");
      //let relativeTime = 0;
      let id = 1;
      let created = new Date();
      let vt = '';
      let start = '';
      let i_start = '';
      let end = '';
      let i_end = '';
      let difference_sec = 0;
      let show_st = 1;
      let show_en = 0;
      let show_sp = 0;
      if(reportItems.length > 0){
        // in seconds
        //relativeTime = Math.floor(time/1000) - Math.floor(reportItems[reportItems.length - 1].timestamp / 1000);
        id = reportItems[reportItems.length - 1].id + 1;
      }
      //console.log(relativeTime + " relativeTime");
      //console.log(time + " time");
      let date_created = created.toLocaleDateString();
      let timeclock_created = created.toLocaleTimeString();

      reportItems.push({id: id, znr: znr, vt: vt, start: start, end: end, show_st: show_st, show_en: show_en, show_sp: show_sp,
        created: created, date_created: date_created, timeclock_created: timeclock_created, 
        istart: i_start, iend: i_end, difference_sec: difference_sec});
      //console.log(reportItems.length + " length of items after");
      //console.log(reportItems);

    };

    service.getReportItems = function(){
      //console.log(reportItems);
      return reportItems;
    };

    service.getDateTime = function(){
      let firstItem = this.getReportItems()[0];
      let ymd = firstItem.created.getFullYear() + "-" + (1+ firstItem.created.getMonth()).toLocaleString(undefined, {minimumIntegerDigits: 2}) + "-" + firstItem.created.getDate().toLocaleString(undefined, {minimumIntegerDigits: 2});
      return (ymd + '_' + firstItem.timeclock_created);
    };

    service.downloadCSV = function(args) {
      let data, filename, link;
      let tempReport = Object.create(reportItems);
      tempReport.push({id: '', znr: '', vt: '', start: '', end: '', created: '', date_created: '', timeclock_created: '', istart: '', iend: '', difference_sec: ''});

      let csv = convertArrayOfObjectsToCSV({
          data: tempReport
      });

      //console.log(csv + " is generated");

      if (csv == null) return;

      filename = args.filename || 'export.csv';

      if (!csv.match(/^data:text\/csv/i)) {
          csv = 'data:text/csv;charset=utf-8,' + csv;
      }
      data = encodeURI(csv);

      link = document.createElement('a');
      link.setAttribute('href', data);
      link.setAttribute('download', filename);
      link.click();
    };

    service.remove = function(id){
      let index = reportItems.findIndex(x => x.id== id);
      let item = reportItems[index];
      console.log(item);
      reportItems.splice(index, 1);
    };

    service.editZNr = function(id, znr){
      let index = reportItems.findIndex(x => x.id== id);
      reportItems[index].znr = znr;
    };

    service.setVT = function(id, vt){
      let index = reportItems.findIndex(x => x.id== id);
      reportItems[index].vt = vt;
    };

    service.setStart = function(id, time){
      let index = reportItems.findIndex(x => x.id== id);
      reportItems[index].start = time.toLocaleTimeString();
      reportItems[index].istart = time;
      reportItems[index].show_st = 0;
      reportItems[index].show_en = 1;
      reportItems[index].show_sp = 1;
    };

    service.setEnd = function(id, time){
      let index = reportItems.findIndex(x => x.id== id);
      reportItems[index].end = time.toLocaleTimeString();
      reportItems[index].iend = time;
      //console.log(time/1000 - reportItems[index].istart/1000);
      reportItems[index].difference_sec = Math.floor(time/1000) - Math.floor(reportItems[index].istart/1000);
      reportItems[index].show_en = 0;
      reportItems[index].show_sp = 0;
    };
  }

  function convertArrayOfObjectsToCSV(args) {
    let result, ctr, keys, columnDelimiter, lineDelimiter, data;
    data = args.data || null;
    if (data == null || !data.length) {return null;}

    columnDelimiter = args.columnDelimiter || ';';
    lineDelimiter = args.lineDelimiter || '\n';

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;
    data.forEach(function(item) {
      ctr = 0;
      keys.forEach(function(key) {
        if (ctr > 0) result += columnDelimiter;

        result += item[key];
        ctr++;
      });

      result += lineDelimiter;
    });
    return result;
  }

})();
