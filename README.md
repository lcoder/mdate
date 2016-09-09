# mdate
基于jquery的日期插件

![mdate_demo](http://oco9w3mgp.bkt.clouddn.com/blog_images/mdate_demo.jpeg)

使用方法

```javascript
$("#date").mdate({
            max: new Date() ,				// 可选的最大日期
            onPick: function( value ){} 	// 选中日期的回调,value为选中的值
  			beforeShow: function(){}		// 弹出日期控件之前的回调
        }) ;
```