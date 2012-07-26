/* Slide Control for Slides with Numeric Ids - ver 1.2  */

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the S5 Client for Zoomooz Isometric Example
 *
 * The Initial Developer of the Original Code is
 * Richard A. Milewski (richard at milewski dot org)
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */


/* Configuration Variables */

var serverURL="http://slides.netfools.com/";	/* Where to find the SlideSync Server              */ 
	
var DEBUG = true;

/* End Configuration Variables */ 
 

function pad(n, len) {	    
    var s = n.toString();
    if (s.length < len) {
        s = ('0000000000' + s).slice(-len);
    }
    return s;
}


function array_search (needle, haystack, argStrict) {

	var strict = !!argStrict;
	var key = '';
	for (key in haystack) {
		if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
			return key;
        }
     }
     return false;
} 


(function ($) {
		// Vertical Alignment Plugin for jQuery
		$.fn.vAlign = function() {
			return this.each(function(i){
			
				var headspace = 0;  // the height of everything above the selected element
				$.each($(this).prevAll("*"), function(i) {
					headspace = headspace + $(this).outerHeight(true);
				});
								
				var overlap = Math.min(0,parseInt($(this).parent().css('margin-bottom'),10)); 
						// Allow for slides that have negative bottom margin to cause overlap
				
				var ah = $(this).outerHeight(); // The height of the selected element

				var ph = $(this).parent().height(); // The space we have to work with.
				var bh = (ph - ah - headspace + overlap) / 2; 
				// mylogger.log(ph + "|" + ah + "|" + headspace + "|"  + overlap + "|" + bh); 
				if (bh > 0) {
					// $(this).css('border-top', 'solid ' + bh + "px transparent");
					$(this).css('margin-top', bh); 
				}
			});
		};
	})(jQuery);



$(document).ready(function() {

	var currentSlide = 0;
	var master  = false;
	var masterkey = "NoKeyYet";
	var monitorID;
	var prevstatus = "";
	var server = serverURL+"s5.php";
	var sseServer  = serverURL+"s5sse.php";   //This may not work yet
	var useSSE = false;
	var loopTime = 1500; // XHR Loop Time when not using SSE
	var selector;
	var keysBlocked = false;
	var tempSlide = 0;
	var zoomsize = 0.9;
	
  new ProgrammingWidget("#demo", "demo").activate();
	$('.slide').hide();  // Hide the slides until we get them numbered and scaled.
	
	
	var agent=navigator.userAgent.toLowerCase();
	var is_iphone = (agent.indexOf('iphone')!=-1);
	var is_ipod   = (agent.indexOf('ipod')!=-1);
	var is_ipad   = (agent.indexOf('ipad')!=-1);
	var is_iOS = (is_iphone || is_ipod || is_ipad);  // Yes, this is_Ugly.   ...need to add Fennec and get a mobile strategy.
	

    // by default, set mylogger to do nothing
    var mylogger = {};
    mylogger.log = function(msg) {
        return false;
    };

    // if DEBUG is true and Firebug console is available, use it for logging
    if (window.DEBUG && typeof(console) !== 'undefined') {
        mylogger = console;
	}




    // Look for autoset divs and create slides for them if they exist
    $('.autoset').each(function(index) {
		var thePath = $(this).data("source") + "/" + $(this).data("prefix");
		var theType = $(this).data("type");
		var theCount = $(this).data("count");

		var i = 1;
		var imgTag;
		var theDiv;
		
		while (i <= theCount) {
			var theSlideNumber = pad(i,2);		
			imgTag = "<img src='"+thePath+theSlideNumber+theType+"'>";
			theDiv = "<div class='slide autoslide'>"+imgTag+"</div>";
			$(this).append(theDiv);
			i++;
		} 
    });
    
    
    
    
    // Number the slides
    var lastSlide;
    
	$('.slide').each(function(index) {  /* set a unique numeric id for each slide */
		$(this).attr('id',(index));
		
		switch (index % 4) {			/* Odd numbered slides are shifted left or right */	
			case 1:
				$(this).addClass("left");
				break;
			case 3:
				$(this).addClass("right");
				break;
			default:
			break;
		}
	
		lastSlide = index;              /* and remember the id of the last one */
	});	

	$("#"+lastSlide).zoomTo({targetsize:0.5, duration:10});
	$('.slide').fadeIn(2000, function() {
		/* Vertically center all the vCenter divs. */ 
		$('.slideBody, .slidebody, .SlideBody, .vCenter, .vcenter').vAlign();  
		$("#0").zoomTo({targetsize:zoomsize, duration:2000});
	});

	
	function hash(url) {               /* We split off the protocol so visitors using http:// and https:// */
		var myurl = url.split("://");  /* get the same results from the synch server */
		return hex_md5(myurl[1]);
		}
		
	var urlhash = hash(location.href);


	/* 
	**       ***********  Code for following slides  ***************
	*/


	// Presentation Control Functions
	
	function slideClick(slideID) {  //slideID is an integer here not the jQuery ID selector.
		mylogger.log ("slideClick(): " + currentSlide + " : " + slideID);
		var slidetime = Math.max(800,(600 * Math.abs(slideID-currentSlide)));
		currentSlide = slideID;
		$("#"+slideID).zoomTo({targetsize: zoomsize, duration:slidetime});		
			if (master) {
				mylogger.log("Control: "+slideID);
				$.getJSON(server, {url: urlhash, control: masterkey, action: 'zoom', status: "#"+slideID}, 
				function(json) { if (json.sync != "ok") { alert("JSON update failed \n " + json.error);}}
			);
		}
	}	
		
	
	function bodyClick(evt) {
		$("#0").zoomTo({targetsize: zoomsize, duration: 2000});
		currentSlide = 0;
				
		if (master) {mylogger.log("Control: body");
				$.getJSON(server, {url: urlhash, control: masterkey, action: 'zoom', status: "body"}, 
				function(json) { if (json.sync != "ok") { alert("JSON update failed (container) \n" + json.error);}}
			);
		}
	}
	
	
	
	// Presentation Control Event Handlers (non-iPhone)
	
	$(".slide").click(function(evt) { 
		evt.stopPropagation();
		var slideID = this.id;
		mylogger.log("Slide.click: "+slideID);
		slideClick(slideID); 
	} );
	
	
	$("body").click(function(evt) { 
		evt.stopPropagation();
		mylogger.log("Body.click");
		slideClick(0);	
	} );
	
	
	//Slide Theme Change Events
		
	function setTheme(theme) {
		$("#container").removeClass().addClass(theme);
		slideClick(currentSlide);
		if (master) {mylogger.log("Control Theme: "+theme);
			$.getJSON(server, {url: urlhash, control: masterkey, action: 'theme', status: theme}, 
				function(json) { 
					if (json.sync != "ok") {
						 alert("JSON update failed \n " + json.error);
					}
				}
			);
		}
	}	
	
	
	
	
	

	


	
    /* If there is an active control session give readers the option to opt-out of following */
   
    
			
	function eventFollower(json) {		
		switch (json.action){
			case "zoom":
				if (json.result != prevstatus) {
					prevstatus = json.result;
					switch(json.result) {
						case  "body" :
						    bodyClick();
						break;
						
						default: //everything else (slide ids for now)
							mylogger.log("Event Follower: "+json.result);
							var slideID=parseInt(json.result.toString().replace("#",""),10);
						    slideClick(slideID);
						break;
					}
				}
				break;
				
			case "theme": // changing the slide theme
				$("#container").removeClass().addClass(json.result);
				break;
				
			case "request":  //
				 if (json.error != "URL not in cache") { alert("Request failed: "+json.error); }
				break;

	
			default: 
				var message = ("Sync: "+json.action+"\n"+json.sync+"\nResult: "+json.result);
				$.prompt(message, {opacity: 0.6, buttons: {}} );
			break;
		}
	}
	
	
function checkServer() {
		    $.getJSON(server, {url: urlhash}, function(json){eventFollower(json);});
	}	
		

var onMessageHandler = function (event) {  //Used when following via SSE
	    var json = $.parseJSON(event.data);
	    eventFollower(json);
	    };
	
	
    function follow(v,m,f) { 
		if (v) {
			prevstatus = "none"; // Force the first update to be applied
			if (useSSE) {	
				var eventSrc = new EventSource(sseServer+'?url='+urlhash);
				eventSrc.addEventListener('message', onMessageHandler); 
			} else {
				var eventLoop = window.setInterval(checkServer,loopTime);
				
			}
		}
		keysBlocked=false;  
    }
    
    var message = "<p>This slide presentation is currently being controlled by one or "+
				"more presenters. Do you want to follow along?</p>"+
				"<p>Answering 'No' will give you exclusive local control of the "+ 
				"presentation on your own machine.</p>"+ 
				"<p> Reload the page to change your mind and see this question again.</p>"; 
					
    $.getJSON(server, {url: urlhash},
		function(json) { if (json.sync == "ok") {
			if (is_iOS === true) {  // on iOS we just follow by default
				follow(true,null,null);
			} else {               // for everything else we put up a $.prompt dialog
				keysBlocked = true;
				$.prompt(message, {opacity: 0, buttons: {Yes: true, No: false }, callback: follow } );
		}
	}});
	
	
	
	
	/* 
	**       ***********  Code for sending slide show status to the server ***************
	*/
	

 
   /* Take Master Control  */
   

 
	 function mastercontrol(v,m,f) {
		master = v;	
		mylogger.log("Master Control TempSlide: "+tempSlide); 
		$("#"+tempSlide).zoomTo({targetsize: zoomsize, duration: 1});	
		$.getJSON(server, {url: urlhash, control: masterkey, action: 'zoom', status: tempSlide}, 
			function(json) { 
				if (json.sync != "ok") { 
					alert("Master Control update failed \n " + json.error);
				}
			}
		);
		return false;
	 }


	function takeControl() {
		    tempSlide=currentSlide;
		    mylogger.log("Temp: "+tempSlide+" Current: "+currentSlide);
			$('body').zoomTo({targetsize:1.0, duration:1});
			if (!master) {
				message  = "You may take control of this presentation <br>"+
				           "Control is non-exclusive. Others may do so also.";		
				$.prompt(message, {opacity: 0.6, buttons: {'Take Control': true, 'Cancel': false}, callback: mastercontrol } );
		
			} else {
				message  = "You currently have control of this presentation <br>"+
				           "You may relinquish control. ";			
				$.prompt(message, {opacity: 0.6, buttons: {'Relinquish Control': false, 'Keep Control': true}, callback: mastercontrol } );
			}
			return false;
		}

	 
	
	
	
	 
	  
	
	
	
	 /* iPhone Control Event Handlers */
	 /* I know no way to make a keyboard appear in iOS without an input box. ...so we kludge here */
	
	if (is_iOS === true) {  
	 
		$(".slide").doubletap(
		    /** doubletap-dblclick callback - Togle master control ..because the $.prompt is ugly on iOS*/
		    function(event){
				tempSlide = currentSlide;
				if (master) { 
					mastercontrol(false,null,null);
					alert("Master Control Off");
				}else{
					mastercontrol(true,null,null);
					alert("Master Control On");
				}
		       
		    },
		    /** touch-click callback (touch) - Can't put code here, it duplicates slide clicks.*/
		    function(event){				// ..even from non-iphone clients.( ?? )
		    }, 
			500  /** doubletap-dblclick delay (default is 500 ms) */
		);
	}
	
	
	/* Keystroke Handler */
	
		$(window).keydown(function(event) { 
		if (!keysBlocked) {	
		  mylogger.log("keydown: " + event.which );
		  switch(event.which) {
		  
			case 27: /* Escape */
				takeControl();
				break;	    
			
			case 37: /*  Left Arrow  */
				if (currentSlide > 0) { slideClick(--currentSlide);	}
				break;
				
			case 38: /*  Up Arrow  */
				slideClick(0);
			break;	
				
				
			case 39: /*  Right Arrow  */
				if (currentSlide < lastSlide) {	slideClick(++currentSlide); }
				break;
				
			case 40: /*  Down Arrow  */
				slideClick(lastSlide); 
				break;
		
			case 49:
				setTheme("theme01");
				break;
			
			case 50:
				setTheme("theme02");		
				break;
				
			case 51:
				setTheme("theme03");		
				break;
				
			case 52:
				setTheme("theme04");
				break;
			
			case 53:
				setTheme("theme05");
				break;
			
			case 54:
				setTheme("theme06");
				break;
				
			case 55:
				setTheme("theme07");		
				break;
				
			case 56:
				setTheme("theme08");		
				break;
				
			case 57:
				setTheme("theme09");		
				break;
				
			case 48:
				setTheme("theme10");
				break;
					
			default:
				return true;
		   }  
	   }
	   event.preventDefault();
	   event.stopPropagation();
	   return false;
	});	
	
	
	
});


