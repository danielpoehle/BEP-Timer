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

    reportList.comment = '';
    reportList.line = '';
    reportList.direction = '';
    reportList.annotation = '';

    reportList.addToList = function(type){
      //console.log(type + " clicked add to List");
      //console.log(lineFrame[0]);
      ReportTimeService.addReportItem(type);
    };

    reportList.items = ReportTimeService.getReportItems();

    reportList.getCSV = function(){
      //console.log(fileName + " fileName parameter");
      let f = ReportTimeService.getDateTime() + '_Li' + this.line + '_' + this.direction + '.csv';
      let newchar = '-';
      f = f.split(':').join(newchar);
      console.log(f);

      ReportTimeService.downloadCSV({filename: f, annotation: this.annotation});
    };

    reportList.addComment = function(itemID, comment){
      ReportTimeService.addComment(itemID, comment);
      reportList.comment = '';
    };

    reportList.removeItem = function(itemID){
      console.log(itemID + " item ID in reportList");

      ReportTimeService.remove(itemID);
      ReportTimeService.correctRelativeTimes();
      reportList.numPass = parseInt(ReportTimeService.getPassengers());
    };

    reportList.filling = 0;

    reportList.changeFilling = function(value){
      this.filling += value;
      if (this.filling < 0) {this.filling = 0;}
    };

    reportList.addFilling = function(itemID, filling){
      ReportTimeService.addFilling(itemID, filling);
      reportList.numPass = parseInt(ReportTimeService.getPassengers());
      reportList.filling = 0;
    }

    reportList.numPass = parseInt(ReportTimeService.getPassengers());

  }



  function ReportTimeService(){
    let service = this;
    let reportItems = [];

    service.addReportItem = function(type){
      //console.log(reportItems.length + " length of items before");
      let relativeTime = 0;
      let id = 1;
      let time = new Date();
      let comment = '';
      let pass = 0;
      if(reportItems.length > 0){
        // in seconds
        relativeTime = Math.floor(time/1000) - Math.floor(reportItems[reportItems.length - 1].timestamp / 1000);
        id = reportItems[reportItems.length - 1].id + 1;
      }
      //console.log(relativeTime + " relativeTime");
      //console.log(time + " time");
      let date = time.toLocaleDateString();
      let timeclock = time.toLocaleTimeString();

      reportItems.push({id: id, type: type, timestamp: time, date: date, time: timeclock, relativeTime: relativeTime, comment: comment, passenger: pass});
      //console.log(reportItems.length + " length of items after");
      //console.log(reportItems);

    };

    service.getReportItems = function(){
      //console.log(reportItems);
      return reportItems;
    };

    service.getDateTime = function(){
      let firstItem = this.getReportItems()[0];
      let ymd = firstItem.timestamp.getFullYear() + "-" + (1+ firstItem.timestamp.getMonth()).toLocaleString(undefined, {minimumIntegerDigits: 2}) + "-" + firstItem.timestamp.getDate().toLocaleString(undefined, {minimumIntegerDigits: 2});
      return (ymd + '_' + firstItem.time);
    };

    service.downloadCSV = function(args) {
      let data, filename, link;
      let tempReport = Object.create(reportItems);
      tempReport.push({id: '', type: '', timestamp: '', date: '', time: '', relativeTime: '', comment: args.annotation, passenger: ''});

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

    service.addComment = function(id, text){
      let index = reportItems.findIndex(x => x.id== id);
      reportItems[index].comment = text;
    };

    service.addFilling = function(id, val){
      let index = reportItems.findIndex(x => x.id== id);
      reportItems[index].passenger = val;
    };

    service.getPassengers = function(){
      let sum = 0;
      for (let i = 0, len = reportItems.length; i < len; i++) {
        sum += parseInt(reportItems[i].passenger);
      }
      return sum;
    }

    service.correctRelativeTimes = function(){
      for (var i = 1; i < (reportItems.length); i++) {
        reportItems[i].relativeTime = Math.floor(reportItems[i].timestamp/1000) - Math.floor(reportItems[i-1].timestamp / 1000);
      }
    }

    //service.getBoughtItems = function(){
    //  return boughtItems;
    //};
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
