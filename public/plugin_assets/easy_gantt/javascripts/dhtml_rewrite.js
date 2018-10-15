window.ysy = window.ysy || {};
ysy.view = ysy.view || {};
ysy.view.applyGanttRewritePatch = function () {
  ysy.view.initNonworkingDays = function () {
    var work_helper = gantt._working_time_helper;
    work_helper.defHours = ysy.settings.hoursPerDay;
    var i;
    // Now we specify working days
    var nonWorking = ysy.settings.nonWorkingWeekDays;
    for (i = 0; i < nonWorking.length; i++) {
      work_helper.set_time({day: nonWorking[i] % 7, hours: false});
    }
    // Now we specify holidays
    var holidays = ysy.settings.holidays;
    if (holidays) {
      for (i = 0; i < holidays.length; i++) {
        work_helper.set_time({date: moment(holidays[i]), hours: false});
      }
    }
    work_helper._cache={};
  };
  gantt._working_time_helper = {
    defHours: 8,
    timeformat: "YYYY-MM-DD",
    days: {0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true},
    dates: {},
    weeks: {},
    months: {},
    _cache: {},
    timezone: moment().startOf("day").valueOf() % (1000 * 60 * 60 * 24),
    oneDaySeconds: 1000 * 60 * 60 * 24,
    oneHourSeconds: 1000 * 60 * 60,
    //formatDate: function (date) {
    //    if (date._isAMomentObject) {
    //        return date.format(this.timeformat);
    //    }
    //    return moment(date).format(this.timeformat);
    //},
    toMoment: function (date) {
      if (date._isAMomentObject) {
        return date;
      }
      return moment(date);
    },
    set_time: function (settings) {
      var hours = settings.hours !== undefined ? settings.hours : true;
      if (settings.day !== undefined) {
        this.days[settings.day] = hours;
      } else if (settings.date !== undefined) {
        this.dates[+settings.date] = hours;
      }

    },
    is_weekend: function (date) {
      date = this.toMoment(date);
      return !this.days[date.day()];
    },
    is_working_day: function (date) {
      date = this.toMoment(date);
      if (!this.days[date.day()]) {
        return false;//week day
      }
      var val = this.get_working_hours(date);
      return val > 0;
    },
    get_working_hours: function (date) {
      //return 8;
      //console.log("get_working_hours: "+date.toString());
      //var t = this._timestamp({date: date});
      date = this.toMoment(date);
      var t = +date;
      var hours = true;
      //date = moment(date);
      if (this.dates[t] !== undefined) {
        hours = this.dates[t];//custom day
      } else if (this.days[date.day()] !== undefined) {
        hours = this.days[date.day()];//week day
      }
      if (hours === true) {
        return this.defHours;
      } else if (hours) {
        return hours;
      }
      return 0;
    },
    is_working_unit: function (date, unit, order) {
      if (!gantt.config.work_time)
        return true;
      return this.is_working_day(date);
    },
    save_working_unit: function (first_date, end_date, unit) {
      var weekID = first_date.isoWeek();
      var workDays = this.get_work_units_between(first_date, end_date, "day");
      var workHours = this.get_work_units_between(first_date, end_date, "hour");
      this.weeks[weekID] = {days: workDays, hours: workHours};
    },
    _work_times_between: function (from, to) {
      var spanID = from.valueOf() + "_" + to.valueOf();
      if (this._cache[spanID]) {
        this._cache[spanID].cached = true;
        return this._cache[spanID];
      }
      if (from.isBefore(to)) {
        var ret = this._work_times_forward(from, to);
      } else {
        ret = this._work_times_backward(from, to);
      }
      this._cache[spanID] = ret;
      return ret;
    },
    _work_times_forward: function (from, to) {
      var sumHours = 0;
      var sumDays = 0;

      if ((+from % this.oneDaySeconds) !== this.timezone) {
        var mover = moment(from).startOf("day");
        var first = true;
      } else {
        mover = from;
      }
      var count = 0;
      while (mover.isBefore(to)) {
        if ((count++) > 3000) {
          ysy.log.error("while full D");
          break;
        }
        var hours = this.get_working_hours(mover);
        if (hours > 0) {
          if (first) {
            var rest = 1 - (from - mover) / this.oneDaySeconds;
            sumDays += rest;
            sumHours += hours * rest;
          } else {
            sumDays++;
            sumHours += hours;
          }
        }
        first = false;
        mover.add(1, "days");
      }
      if (hours > 0 && mover.isAfter(to)) {
        rest = (mover - to) / this.oneDaySeconds;
        sumDays -= rest;
        sumHours -= hours * rest;
      }
      return {days: sumDays, hours: sumHours};
    },
    _work_times_backward: function (from, to) {
      var sumHours = 0;
      var sumDays = 0;
      if ((+from % this.oneDaySeconds) !== this.timezone) {
        var mover = moment(from).startOf("day");
        var first = true;
        mover.add(1, "day");
      } else {
        mover = from;
      }
      var count = 0;
      while (mover.isAfter(to)) {
        mover.subtract(1, "days");
        if ((count++) > 3000) {
          ysy.log.error("while full D");
          break;
        }
        var hours = this.get_working_hours(mover);
        if (hours > 0) {
          if (first) {
            var rest = (from - mover) / this.oneDaySeconds;
            sumDays += rest;
            sumHours += hours * rest;
          } else {
            sumDays++;
            sumHours += hours;
          }
        }
        first = false;
      }
      if (hours > 0 && mover.isBefore(to)) {
        var rest2 = (to - mover) / this.oneDaySeconds;
        sumDays -= rest2;
        sumHours -= hours * rest2;
      }
      //ysy.log.debug(mover.format() + " hours=" + hours + " rest=" + rest + " rest2=" + rest2);
      return {days: -1 * sumDays, hours: -1 * sumHours};
    },
    get_work_units_between: function (from, to, unit) {
      if (!unit) {
        ysy.log.error("missing unit");
        return 0;
      }
      var safeFrom = moment(from);
      var safeTo = to;
      if (to._isEndDate) {
        safeTo = moment(to).add(1, "days");
      }
      if (from._isEndDate) {
        safeFrom = safeFrom.add(1, "days");
      }
      var workSums = this._work_times_between(safeFrom, safeTo);
      ysy.log.debug("get_work_units_between: " + from.format("DD.MM.YYYY") + "(" + from._isEndDate + ") " + to.format("DD.MM.YYYY") + "(" + to._isEndDate + ") " + unit + " " + (workSums.cached ? "(cached)" : ""), "date_helper");
      if (unit === "day") {
        return workSums.days;
      } else if (unit === "all") {
        return workSums;
      } else {
        return workSums.hours;
      }
    },
    is_work_units_between: function (from, to, unit) {
      if (!unit) {
        return false;
      }
      return this.get_work_units_between(from, to, unit) > 0;
    },
    add_worktime: function (from, duration, unit, toIsEndDate) {
      var hours;
      ysy.log.debug("add_worktime: " + from.toString() + " " + duration + " " + unit, "date_helper");
      if (!unit) {
        return false;
      } else {
        unit = unit + "s";
      }
      var added = 0;
      var safeFrom = moment(from);
      if (from._isEndDate) {
        safeFrom.add(1, "days");
      }
      if ((+from % this.oneDaySeconds) !== this.timezone) {
        var mover = moment(safeFrom).startOf("day");
        var first = true;
      } else {
        mover = safeFrom;
      }
      //if (!gantt.config.work_time||unit==="weeks") {
      if (gantt.config.work_time && (unit == "days" || unit == "hours")) {
        var count = 0;
        if (duration >= 0) {
          while (added < duration) {
            if (count++ > 3000) {
              ysy.log.error("while full B");
              break;
            }
            hours = this.get_working_hours(mover);
            if (hours > 0) {
              var rest = 1;
              if (first) {
                rest = 1 - (safeFrom - mover) / this.oneDaySeconds;
              }
              if (unit === "hours") {
                added += rest * hours;
              } else {
                added += rest;
              }
            }
            first = false;
            mover.add(1, "days");
          }
          if (hours && added > duration) {
            mover.subtract((added - duration) * (unit === "hours" ? 3600 : 3600 * 24), "seconds");
          }
        } else {
          while (added < -duration) {
            if (count++ > 3000) {
              ysy.log.error("while full C");
              break;
            }
            mover.add(-1, "days");
            hours = this.get_working_hours(mover);
            if (hours > 0) {
              rest = 1;
              if (first) {
                rest = (safeFrom - mover) / this.oneDaySeconds;
              }
              if (unit === "hours") {
                added += rest * hours;
              } else {
                added += rest;
              }
            }
            first = false;
          }
          if (hours && added > -duration) {
            mover.add((added + duration) * (unit === "hours" ? 3600 : 3600 * 24), "seconds");
          }
        }
      } else {
        mover.add(duration, unit);
      }
      if (toIsEndDate || !from._isEndDate && toIsEndDate === undefined) {
        mover.add(-1, "days");
        mover._isEndDate = true;
      }
      if (from._isAMomentObject) {
        return mover;
      }
      return mover.toDate();
    },
    round_date: function (date, direction) {
      ysy.log.debug("round_date: " + date.toString(), "date_helper");
      if (date._isAMomentObject) {
        var momentDate = date;
      } else {
        momentDate = moment(date);
      }
      momentDate.add(12, "hours").startOf("day");
      var count = 0;
      if (gantt.config.work_time) {
        if (direction === 'past') {
          while (!this.is_working_day(momentDate) && (count++) < 1000) {
            momentDate.subtract(1, "days");
          }
        } else {
          while (!this.is_working_day(momentDate) && (count++) < 1000) {
            momentDate.add(1, "days");
          }
        }
      }
      if (!date._isAMomentObject) {
        date.setTime(momentDate.valueOf());
      }

      //end.add(12,"hours").startOf("day");

    },
    get_closest_worktime: function (settings) {
      ysy.log.debug("get_closest_worktime: " + settings.date.toString(), "date_helper");
      if (this.is_working_day(settings.date))
        return settings.date;

      var unit = settings.unit;

      var curr = gantt.date[unit + '_start'](settings.date);

      var maximum_loop = 3000, //be extra sure we won't fall into infinite loop, 3k seems big enough
          count = 0,
          goFuture = settings.dir === 'any' || settings.dir === 'future',
          goPast = settings.dir === 'any' || settings.dir === 'past',
          found = false;

      if (goFuture) {
        var future_target = moment(curr);
      }
      if (goPast) {
        var past_target = moment(curr);
      }
      //will seek closest working hour in future or in past, one step in both direction per iteration
      while (found) {
        if (goFuture) {
          future_target.add(1, "days");
          if (this.is_working_day(future_target)) {
            return future_target.toDate();
          }
        }
        if (goPast) {
          past_target.add(-1, "days");
          if (this.is_working_day(past_target)) {
            return past_target.toDate();
          }
        }
        count++;
        if (count > maximum_loop) {
          dhtmlx.assert(false, "Invalid working time check");
          return false;
        }
      }
      return curr;
    }


  };
//#######################################################################
  gantt.date = {
    now: function () {
      return moment();
    },
    Date: function (date, isEndDate) {
      if (!date) {
        //return moment();
        return new Date();
      }
      if (date._isAMomentObject/*||!isNaN(date)*/) {
        var ndate = moment(date);
        if (isEndDate === undefined) {
          isEndDate = date._isEndDate;
        }
      } else {
        //ysy.log.warning("date created as new Date(), not as moment()");
        ndate = moment(date).toDate();
      }
      ndate._isEndDate = isEndDate;
      return ndate;
    },
    toMoment: function (date) {
      if (!date) {
        ysy.log.error("No date to convert to Moment");
        return;
      }
      if (date._isAMomentObject) {
        return date;
      }
      return moment(date);
    },
    fromMoment: function (date, momentDate) {
      if (date._isAMomentObject) {
        return date;
      }
      date.setTime(momentDate.valueOf());
      return date;
    },
    init: function () {
      return;
      var s = gantt.locale.date.month_short;
      var t = gantt.locale.date.month_short_hash = {};
      for (var i = 0; i < s.length; i++)
        t[s[i]] = i;

      var s = gantt.locale.date.month_full;
      var t = gantt.locale.date.month_full_hash = {};
      for (var i = 0; i < s.length; i++)
        t[s[i]] = i;
    },
    _startOf: function (date, unit) {
      var momentDate = this.toMoment(date);
      momentDate.startOf(unit);
      return this.fromMoment(date, momentDate);
    },
    date_part: function (date) {
      return this._startOf(date, "day");
    },
    time_part: function (date) {
      alert("Forbidden function");
      return (date.valueOf() / 1000 - date.getTimezoneOffset() * 60) % 86400;
    },
    week_start: function (date) {
      return this._startOf(date, "isoweek");
    },
    month_start: function (date) {
      return this._startOf(date, "month");
    },
    year_start: function (date) {
      return this._startOf(date, "year");
    },
    day_start: function (date) {
      return this._startOf(date, "day");
    },
    hour_start: function (date) {
      alert("Forbidden function");
      if (date.getMinutes())
        date.setMinutes(0);
      this.minute_start(date);

      return date;
    },
    minute_start: function (date) {
      alert("Forbidden function");
      if (date.getSeconds())
        date.setSeconds(0);
      if (date.getMilliseconds())
        date.setMilliseconds(0);
      return date;
    },
    /*_add_days: function (date, inc) {
     var ndate = new Date(date.valueOf());

     ndate.setDate(ndate.getDate() + inc);
     if (inc >= 0 && (!date.getHours() && ndate.getHours()) && //shift to yesterday on dst
     (ndate.getDate() < date.getDate() || ndate.getMonth() < date.getMonth() || ndate.getFullYear() < date.getFullYear()))
     ndate.setTime(ndate.getTime() + 60 * 60 * 1000 * (24 - ndate.getHours()));
     return ndate;
     },*/
    add: function (date, inc, mode) {
      var momentDate = this.toMoment(date);
      momentDate.add(inc, mode + "s");
      return momentDate.toDate();
    },
    to_fixed: function (num) {
      if (num < 10)
        return "0" + num;
      return num;
    },
    copy: function (date) {
      var momentDate = moment(date);
      if (date._isAMomentObject) {
        return momentDate;
      }
      return momentDate.toDate();
      //return new Date(date.valueOf());
    },
    date_to_str: function (format, utc) {
      ysy.log.debug("date_to_str " + format, "date_format");
      format = format.replace(/%[a-zA-Z]/g, function (a) {
        switch (a) {
          case "%d":
            return "\"+gantt.date.to_fixed(date.getDate())+\"";
          case "%m":
            return "\"+gantt.date.to_fixed((date.getMonth()+1))+\"";
          case "%j":
            return "\"+date.getDate()+\"";
          case "%n":
            return "\"+(date.getMonth()+1)+\"";
          case "%y":
            return "\"+gantt.date.to_fixed(date.getFullYear()%100)+\"";
          case "%Y":
            return "\"+date.getFullYear()+\"";
          case "%D":
            return "\"+gantt.locale.date.day_short[date.getDay()]+\"";
          case "%l":
            return "\"+gantt.locale.date.day_full[date.getDay()]+\"";
          case "%M":
            return "\"+gantt.locale.date.month_short[date.getMonth()]+\"";
          case "%F":
            return "\"+gantt.locale.date.month_full[date.getMonth()]+\"";
          case "%h":
            return "\"+gantt.date.to_fixed((date.getHours()+11)%12+1)+\"";
          case "%g":
            return "\"+((date.getHours()+11)%12+1)+\"";
          case "%G":
            return "\"+date.getHours()+\"";
          case "%H":
            return "\"+gantt.date.to_fixed(date.getHours())+\"";
          case "%i":
            return "\"+gantt.date.to_fixed(date.getMinutes())+\"";
          case "%a":
            return "\"+(date.getHours()>11?\"pm\":\"am\")+\"";
          case "%A":
            return "\"+(date.getHours()>11?\"PM\":\"AM\")+\"";
          case "%s":
            return "\"+gantt.date.to_fixed(date.getSeconds())+\"";
          case "%W":
            return "\"+gantt.date.to_fixed(gantt.date.getISOWeek(date))+\"";
          default:
            return a;
        }
      });
      if (utc)
        format = format.replace(/date\.get/g, "date.getUTC");
      return new Function("date", "return \"" + format + "\";");
    },
    str_to_date: function (format, utc) {
      ysy.log.debug("str_to_date " + format, "date_format");
      var splt = "var temp=date.match(/[a-zA-Z]+|[0-9]+/g);";
      var mask = format.match(/%[a-zA-Z]/g);
      for (var i = 0; i < mask.length; i++) {
        switch (mask[i]) {
          case "%j":
          case "%d":
            splt += "set[2]=temp[" + i + "]||1;";
            break;
          case "%n":
          case "%m":
            splt += "set[1]=(temp[" + i + "]||1)-1;";
            break;
          case "%y":
            splt += "set[0]=temp[" + i + "]*1+(temp[" + i + "]>50?1900:2000);";
            break;
          case "%g":
          case "%G":
          case "%h":
          case "%H":
            splt += "set[3]=temp[" + i + "]||0;";
            break;
          case "%i":
            splt += "set[4]=temp[" + i + "]||0;";
            break;
          case "%Y":
            splt += "set[0]=temp[" + i + "]||0;";
            break;
          case "%a":
          case "%A":
            splt += "set[3]=set[3]%12+((temp[" + i + "]||'').toLowerCase()=='am'?0:12);";
            break;
          case "%s":
            splt += "set[5]=temp[" + i + "]||0;";
            break;
          case "%M":
            splt += "set[1]=gantt.locale.date.month_short_hash[temp[" + i + "]]||0;";
            break;
          case "%F":
            splt += "set[1]=gantt.locale.date.month_full_hash[temp[" + i + "]]||0;";
            break;
          default:
            break;
        }
      }
      var code = "set[0],set[1],set[2],set[3],set[4],set[5]";
      if (utc)
        code = " Date.UTC(" + code + ")";
      return new Function("date", "var set=[0,0,1,0,0,0]; " + splt + " return new Date(" + code + ");");
    },
    getISOWeek: function (ndate) {
      if (!ndate)
        return false;
      var mom = this.toMoment(ndate);
      return mom.isoWeek();
    },
    getUTCISOWeek: function (ndate) {
      return this.getISOWeek(ndate);
    },
    convert_to_utc: function (date) {
      var mom = this.toMoment(date);
      mom.utc();
      return this.fromMoment(date, mom);

      //return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    },
    parseDate: function (date, format) {
      if (typeof (date) == "string") {
        ysy.log.debug("parseDate() " + date + " " + format, "date_format");
        if (dhtmlx.defined(format)) {
          if (typeof (format) == "string")
            format = dhtmlx.defined(gantt.templates[format]) ? gantt.templates[format] : gantt.date.str_to_date(format);
          else
            format = gantt.templates.xml_date;
        }
        if (date)
          date = format(date);
        else
          date = null;
      }
      return this.toMoment(date);
    }
  };
  ysy.view.initNonworkingDays();
};
