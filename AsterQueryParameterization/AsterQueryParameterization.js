var socketio_port = 33333;


require.config({
        paths: {
            socketio: 'http://localhost:'+socketio_port+'/socket.io/socket.io'
        }
});

define( ["jquery", "text!./style.css","qlik", "socketio"], function ( $, cssContent, qlik, io ) {
	'use strict';
	$( "<style>" ).html( cssContent ).appendTo( "head" );
	return {
        initialProperties : {
            version: 1.0,
            qHyperCubeDef : {
                qDimensions : [],
                qMeasures : [],
                qInitialDataFetch : [{
                    qWidth : 1,
                    qHeight : 500
                }]
            }
        },
		definition: {
			type: "items",
			component: "accordion",
			items: {
                dimensions : {
                    uses : "dimensions",
                    min : 1,
                    max: 1
                },
				sorting: {
					uses: "sorting"
				},
				settings: {
					uses: "settings"
				}
			}
		},
		snapshot: {
			canTakeSnapshot: false
		},
        resize: function() {
        },
		paint: function ( $element,layout ) {

             var _this = this;
             var qData = layout.qHyperCube.qDataPages[0];
             var qMatrix = qData.qMatrix;
             var qDimInfo = this.backendApi.getDimensionInfos();
             var qDimName = qDimInfo[0].qFallbackTitle
             //console.log(qDimName);

             var app = qlik.currApp();
             var thisAppId = app.id;

             var reloadTaskName = 'Reload Breaking Bad'
             var socket = io.connect('http://localhost:'+socketio_port);
             var socketstatus;
             if (socket) {
                socketstatus = 'Connected'
             } else {
                socketstatus = 'Not Connected'
             }

            socket.on( 'connect', function(err) {
                console.log('connected to socket.io')
                if (err) {
                    console.log(err);
                } else {
                }

            });

             var paramValues = {};
             var OptionVal1="";
             var OptionVal2="";
             var InputVal1="";
             var InputVal2="";

             // var divHtml = $("#" + divName);
             // console.info(divHtml);
             var html = "<div align='center'><div align='center' class='parambody'>"+qDimName+"<br>";
                 html += "<select name=select1 id='select1'><option>ChooseOne</option>";

             qMatrix.forEach( function(d){
                html +="<option>"+d[0].qText+"</option>"
                console.log(d[0].qText)
             });
                 html += "</select><br><br>";
                 html += "# of Minutes Window<br>";
                 //divHtml.innerHTML += this.Layout.Text2.text+"<br>";
                 html += "<input  id='input1' class='inputclass' name='input1' value='' size='4' value='20'><br>";
                 html +="<button id='submit' class='myButton'>Submit</button></div>";
                 html +="<div id='notifybar' style='background-color:white;' align='center' class='notifyclass'></div></div>";

                 //paramValues = {};
                 $element.html(html); 
                 $element.attr('class','queryparam');                //setProps(divHtml, this);
                 //this.Element.appendChild(divHtml);
                 //this.divCreated = true;

                 OptionVal1=$('#select1').val();
                 OptionVal2=$('#select2').val();
                 InputVal1=$('#input1').val();
                 InputVal2=$('#input2').val();

                $('#select1').change(function(){
                        console.log('select 1 changed')
                        app.variable.setContent("vEventTypeExt",$('#select1').val());
                        //qvDoc.SetVariable("vOptionVal1", $('#select1').val());
                        console.log($('#select1').val())
                });

                // $('#select2').change(function(){
                //         console.log('select 2 changed')
                //         console.log($('#select2').val())
                //         app.variable.setContent("vOptionVal2", $('#select2').val());
                // });

                $('#input1').change(function(){
                    console.log('input2 changed')
                    console.log($('#input1').val())
                    app.variable.setContent("vMinutesExt", $('#input1').val());
                });

                // $('#input2').change(function(){
                //     console.log('input2 changed')
                //     console.log($('#input2').val())
                //     app.variable.setContent("vInputVal2", $('#input2').val());
                // });

                $('#submit').click(function(){
                    var tvshow;
                    if($('#select1').val() ==='ChooseOne') { tvshow='BreakingBad' } else { tvshow = $('#select1').val()}
                    var minuteswindow;
                    if($('#input1').val() ==='') { minuteswindow=20 } else { minuteswindow = $('#input1').val()}
                    socket.emit('reload app',{'taskname': reloadTaskName, 'tvshow':tvshow, 'minutes': minuteswindow})
                    console.log('clicked')
                });

                //console.log('new user part: '+ThisUser)
                socket.emit('new appuser', {'nick' : 'aster', 'appid': thisAppId});

                console.log('app id: '+thisAppId);
                //socket.join(ThisAppId);
                socket.on('reload status', function(data, callback){
                    console.log('got reload status')
                    console.log(data)
                    var lastmsg;
                    
                    if (data ==='Task Reload Succeeded') {
                        if (lastmsg ==='Task Reload Succeeded') {} else {
                        //$('#notifybar').empty();
                        $('#notifybar').html('Task Reload Succeeded');
                        $('#notifybar').delay(3000).fadeOut();
                        // $('#notifybar').css('background-color','#ADEBAD');
                        // $('#notifybar').css('opacity','0.5');
                        // $('#notifybar').css('padding-top','4px');
                        // $('#notifybar').css('-webkit-border-radius', '5px');
                        // $('#notifybar').css('-moz-border-radius', '5px');
                        // $('#notifybar').css('border-radius', '5px');
                        // $('#notifybar').css('width', '85%');
                        // $('#notifybar').css('font-weight', 'bold');
                        // $('#notifybar').css('font-size', '80%');
                        lastmsg==='Task Reload Succeeded'
                    }

                    } else {
                        $('#notifybar').html(data);
                        $('#notifybar').fadeIn();
                    }   
                });

        
                socket.on( 'error', function(data) {
                        console.log('error on socket.io');
                        console.log(data);
                        $('#notifybar').empty();
                        $('#notifybar').append(data).style('bgcolor','red').fadeIn();
                        $('#notifybar').delay(3000).fadeOut();
                        $('#notifybar').empty();
                        $('#notifybar').append(data).fadeIn();
                });

                socket.on( 'disconnect', function(data) {
                        console.log('disconnected from socket.io');
                        console.log(data);
                        $('#notifybar').empty();
                        $('#notifybar').append('disconnected from socket.io').style('bgcolor','#FF9999').fadeIn();
                        $('#notifybar').delay(3000).fadeOut();
                        $('#notifybar').empty();
                        $('#notifybar').append(data).fadeIn();
                });

                socket.on( 'Reconnected', function(data) {
                        console.log('Reconnected to socket.io');
                        console.log(data);
                        $('#notifybar').empty();
                        $('#notifybar').append('Reconnected to socket.io').style('bgcolor','#85E085').fadeIn();
                        $('#notifybar').delay(3000).fadeOut();
                        $('#notifybar').empty();
                        $('#notifybar').append(data).fadeIn();
                });

		}
	};
} );
