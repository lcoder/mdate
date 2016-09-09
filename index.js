/**
 * Created by maotingfeng on 16/8/3.
 */
(function( factory ){
    var md = typeof define == "function" ;
    if( typeof module === 'object' && typeof module.exports === 'object' ){
        module.exports = factory( require( 'jquery' ) ) ;
    }else if( md && define.amd ){
        define( ['require','jquery'] , function( require , $ ){ factory( $ ) ; } ) ;
    }else if( md && define.cmd ) {
        define( 'mdate' , ['jquery'] , factory )
    }else{
        factory( window.jQuery ) ;
    }
})(function( $ ){
    $.extend( $.fn , {
        /* mdate 插件 */
        mdate : function( config ){
            var $body = $('body') ,
                $window = $(window) ,
                tmpl = '<div class="mdate_ui"><div class="wrapper cle"><div class="date_area fl"><div class="date_title"><div class="date_title_inner"><a href="javascript:void(0);"title="前一个月"class="prev_month"><i class="bg_mdate bg_prev_month"></i></a><a href="javascript:void(0);"title="后一个月"class="next_month"><i class="bg_mdate bg_next_month"></i></a><p><span class="myear"></span>年<span class="mmonth"></span>月</p></div></div><div class="calendar"><table><thead><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr></thead><tbody></tbody></table></div></div><div class="time_area fl"><a href="javascript:void(0);"title="往上"class="prev_time"><i class="bg_mdate bg_prev_time"></i></a><a href="javascript:void(0);"title="往下"class="next_time"><i class="bg_mdate bg_next_time"></i></a><ul></ul></div></div></div>' ,
                settings = { format: 'yyyy-MM-dd' , beforeShow: $.noop , max: null , onPick: $.noop } ;
            $.extend( settings , config ) ;
            var justDate = settings.format.toLowerCase() == 'yyyy-mm-dd' ;
            function mdateInit( ele ){
                /* this _$input,_$date,_uuid 表单input 可以用jq的data api获取到mdate对象 */
                /* 改进:1、input值手动修改,日期框时间对应改变 2、事件机制可以优化 3、现实隐藏可根据class来实现 */
                $.extend( this , { _$input: $(ele) } ) ;
                this.bindEvent() ;
            }
            $.extend( mdateInit.prototype , {
                bindEvent: function(){
                    var that = this ;
                    that.appendToBody() ;
                    var $input = this._$input ,
                        $date = this._$date ;
                    $input.on( 'click.mdate' , function( ev ){
                        settings.beforeShow.call( that ) ;
                        that.showDate() ;
                        //ev.stopPropagation() ;
                    } ) ;
                    $date.on("click.mdate", '.prev_month' ,function(){
                        diffMonth( -1 ) ;
                    }).on("click.mdate", '.next_month' ,function(){
                        diffMonth( 1 ) ;
                    }).on("click.mdate", '.md' ,function(ev){
                        var $this = $(this) ,
                            date = $this.text() ;
                        if( $this.hasClass('disable') ){ return false; }
                        that._now.setDate( date ) ;
                        var now = that._now ,
                            year = now.getFullYear() ,
                            month = padNumber( now.getMonth() + 1 , 2 ) ,
                            dates = padNumber( now.getDate() , 2 ) ,
                            txt = settings.format.toLowerCase() ;
                        txt = txt.replace(/yyyy/, year ).replace(/mm/, month ).replace(/dd/, dates ) ;
                        var pick_date = settings.onPick.call( that , txt ) ;
                        pick_date === false ? '' : that._$input.val( txt ) ;
                        $this.closest('tbody').find('td').removeClass('on').end().end().addClass('on');
                        that.hideDate() ;
                    }) ;
                    function diffMonth( increment ){
                        var now = that._now ;
                        if( now ){
                            now.setMonth( now.getMonth() + increment ) ;
                            that.updateDate( now )
                        }else{
                            warn('_now未定义') ;
                        }
                    }
                    $window.on('resize.mdate',function(){
                        that.resizeOffset();
                    });
                    $body.off( 'click.mdate' ).on( 'click.mdate' , function( ev ){
                        var $target = $( ev.target ) ,
                            $mdate = $target.closest( '.mdate_ui' ) ,
                            _id = $mdate.length > 0 ? $mdate[0].id : $target.data("mdate") ? $target.data("mdate")._uuid : '' ,
                            mdate = $target.data('mdate') ;
                        $(".mdate_ui").each(function( index , val ){
                            var id = val.id ;
                            if( _id != id ){ $(val).hide() ; }
                        }) ;
                    } ) ;
                } ,
                hideDate: function(){
                    this._$date.hide() ;
                } ,
                showDate: function(){
                    this._$date.show() ;
                } ,
                appendToBody: function(){
                    if( this._uuid ){
                        warn('date已经生成在body中') ;
                        return ;
                    }
                    var $date = $( tmpl ) ,
                        uuid = UUID() ;
                    $.extend( this , { _$date: $date , _uuid: uuid } ) ;
                    $body.append( $date.hide().attr({'id':uuid}) ) ;
                    this._$input.data( 'mdate' , this ) ;
                    this.updateDate() ;
                    this.resizeOffset() ;
                } ,
                updateDate: function( date ){
                    var culDate = date ? getDateFromStr( date ) : getDefaultDate( this._$input ) ;
                    if( !!!culDate ){ return ; }
                    var year = culDate.getFullYear() ,
                        month = culDate.getMonth() + 1 ;
                    var $date = this._$date ,
                        $hold_title = $date.find('.date_title_inner p') ,
                        $hold_dates = $date.find('.calendar tbody') ,
                        $hold_times = $date.find('.time_area') ;
                    $hold_title.find( '.myear').text( year ) ;
                    $hold_title.find( '.mmonth').text( month ) ;
                    $hold_dates.html( getCalendar( culDate ) ) ;
                    $.extend( this , { _now: culDate } ) ;
                    justDate ? $hold_times.hide() : $hold_times.html( getADayInterval()).show() ;
                } ,
                resizeOffset: function(){
                    var $input = this._$input ,
                        $date = this._$date ,
                        box_dis = { width: $input.outerWidth() , height: $input.outerHeight() } ,
                        offset = $input.offset() ,
                        width = box_dis.width - 2 <= 230 ? 230 : box_dis.width - 2 ,
                        pn = { top: offset.top + box_dis.height , left: offset.left , width: width } ;
                    if( $date ){
                        $date.css({
                            top: pn.top ,
                            left: pn.left ,
                            width: pn.width
                        }) ;
                    }else{
                        warn( '没有找到$date元素' ) ;
                    }
                }
            } ) ;
            /* 一些辅助函数 */
            /* 生成00:00 00:30 01:30 之类的时间段 */
            function getADayInterval(){
                var tmpl = '<li>mm:ss</li>' ,
                    interval = ['00','30'] ,
                    times = '' ,
                    t1 = '' ,
                    t2 = '' ;
                for(var i = 0; i < 24; i++){
                    t1 = tmpl.replace(/mm/, padNumber( i , 2 ) ) ;
                    for( var j = 0 ; j < 2 ; j++ ){
                        t2 =  t1.replace(/ss/, interval[ j % 2 ] ) ;
                        times += t2 ;
                    }
                }
                return '<ul>' + times + '</ul>' ;
            }
            /* 生成日期的html */
            function getCalendar( culDate ){
                var year = culDate.getFullYear() ,
                    month = culDate.getMonth() + 1 ,
                    dates = culDate.getDate() ,
                    day = culDate.getDay() ,
                    max = settings.max ,
                    isCheckMax = !!max ,
                    dayOfMonthBegin = new Date( year , month - 1 , 1).getDay() ,
                    maxday = new Date( year , month , 0).getDate() ,
                    rows = Math.ceil( ( dayOfMonthBegin + maxday ) / 7 ) ,
                    classOn = '' ,
                    html = '' ;
                var increase = 1 ;
                for( var i = 0 ; i < rows ; i++ ){
                    html += '<tr>' ;
                    for( var j = 0; j < 7 ; j++ ){
                        classOn = ( dates == increase ) ? ' on' : '' ;
                        if( isCheckMax ){
                            var _tmpl = new Date( year , month - 1 , increase ) ;
                            classOn += _tmpl - max > 0 ? ' disable' : '' ;
                        }
                        if( ( i == 0 && j >= dayOfMonthBegin ) || ( i > 0 && increase <= maxday ) ){
                            html += '<td class="md' + classOn + '">' + increase + '</td>' ;
                            increase++ ;
                        }else{
                            html += '<td></td>' ;
                        }
                    }
                    html += '</tr>' ;
                }
                return html ;
            }
            /* 输入错误 */
            function warn( txt ){
                if( window.console && window.console.warn ){
                    window.console.warn( 'mdate插件:' + txt ) ;
                }
            }
            /* 返回日期对象 */
            function getDefaultDate( $input ){
                var date = new Date() ;
                if( $input ){
                    var txt = $.trim( $input.val() ) ,
                        inputValue = getDateFromStr( txt ) ,
                        dataValue = inputValue ? inputValue : getDateFromStr( $.trim( $input.data('date') ) ) ;
                    return dataValue ? dataValue : date ;
                }else{
                    return date ;
                }
            }
            /* 字符串转日期 */
            function getDateFromStr( txt ){
                if( txt instanceof Date){ return txt; }
                var isDate = checkDate( txt ) ,
                    date = null ;
                if( isDate ){
                    txt = txt.replace( /-/g , '/' ) ;
                    date = new Date( txt ) ;
                    if( isDateObj( date ) ){
                        return date ;
                    }else{
                        warn( '"' + txt + '"构造日期失败' ) ;
                        return null ;
                    }
                }else{
                    warn( '"'+ txt + '"日期格式不正确' ) ;
                    return null ;
                }
            }
            /* 判断是否是有效的日期对象 */
            function isDateObj (o) {
                return {}.toString.call(o) === "[object Date]" && o.toString() !== 'Invalid Date' && !isNaN(o);
            }
            /* 校验日期格式 */
            function checkDate( date ){
                /* 年月日 格式yyyy-MM-dd或yyyy-M-d -/.分割 */
                var dateReg = /^(?:(?!0000)[0-9]{4}([-/.]?)(?:(?:0?[1-9]|1[0-2])\1(?:0?[1-9]|1[0-9]|2[0-8])|(?:0?[13-9]|1[0-2])\1(?:29|30)|(?:0?[13578]|1[02])\1(?:31))|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)([-/.]?)0?2\2(?:29))$/;
                /* 年月日 格式yyyy-MM-dd HH:mm:ss -/.分割 */
                var dateTimeReg = /^(?:(?!0000)[0-9]{4}([-/.]?)(?:(?:0?[1-9]|1[0-2])\1(?:0?[1-9]|1[0-9]|2[0-8])|(?:0?[13-9]|1[0-2])\1(?:29|30)|(?:0?[13578]|1[02])\1(?:31))|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)([-/.]?)0?2\2(?:29))\s+([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
                if( date.indexOf(':') < 0 ){
                    return dateReg.test( date ) ;
                }else{
                    return dateTimeReg.test( date ) ;
                }
            }
            /* uuid生成器 */
            function UUID(){
                var d = new Date().getTime();
                var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = (d + Math.random()*16)%16 | 0;
                    d = Math.floor(d/16);
                    return (c=='x' ? r : (r&0x7|0x8)).toString(16);
                });
                return uuid;
            }
            /* 字符自动补全 */
            function padNumber(num, fill) {
                //改自：http://segmentfault.com/q/1010000002607221
                var len = ('' + num).length;
                return (Array(
                    fill > len ? fill - len + 1 || 0 : 0
                ).join(0) + num);
            }
            this.each(function(){
                new mdateInit( this ) ;
            });
        }
    } ) ;
});